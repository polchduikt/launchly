package com.launchly.billing.service.impl;

import com.launchly.common.constant.CacheConstants;
import com.launchly.auth.entity.User;
import com.launchly.auth.service.UserQueryService;
import com.launchly.billing.dto.response.CheckoutResponse;
import com.launchly.billing.dto.response.PlanResponse;
import com.launchly.billing.dto.response.SubscriptionResponse;
import com.launchly.billing.constant.BillingConstants;
import com.launchly.billing.entity.Plan;
import com.launchly.billing.entity.Subscription;
import com.launchly.billing.entity.SubscriptionStatus;
import com.launchly.billing.mapper.BillingMapper;
import com.launchly.billing.repository.PlanRepository;
import com.launchly.billing.repository.SubscriptionRepository;
import com.launchly.billing.service.BillingService;
import com.launchly.billing.service.PlanLimitService;
import com.launchly.billing.util.StripeUtils;
import com.launchly.common.exception.AppException;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import com.stripe.Stripe;
import com.stripe.model.Event;
import com.stripe.model.Invoice;
import com.stripe.model.checkout.Session;
import com.stripe.model.EventDataObjectDeserializer;
import com.stripe.model.StripeObject;
import com.stripe.net.Webhook;
import com.stripe.param.checkout.SessionCreateParams;
import com.stripe.param.CustomerCreateParams;
import com.stripe.model.Customer;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.CacheManager;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.Duration;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class BillingServiceImpl implements BillingService {

    private static final Duration WEBHOOK_DEDUP_TTL = Duration.ofDays(3);

    private final SubscriptionRepository subscriptionRepository;
    private final PlanRepository planRepository;
    private final UserQueryService userQueryService;
    private final BillingMapper billingMapper;
    private final CacheManager cacheManager;
    private final PlanLimitService planLimitService;
    private final StringRedisTemplate stringRedisTemplate;
    private final TransactionTemplate transactionTemplate;

    @Value("${stripe.api.key:}")
    private String apiKey;

    @Value("${stripe.webhook.secret:}")
    private String webhookSecret;

    @Value("${stripe.success-url:http://localhost:5173/billing/success}")
    private String successUrl;

    @Value("${stripe.cancel-url:http://localhost:5173/billing/cancel}")
    private String cancelUrl;

    @PostConstruct
    public void init() {
        Stripe.apiKey = apiKey;
    }

    @Override
    @Transactional
    public void createFreeSubscription(Long userId) {
        if (subscriptionRepository.findByUserId(userId).isPresent()) {
            log.info("Subscription already exists for user {}", userId);
            return;
        }

        User user = userQueryService.getUserOrThrow(userId);

        Plan freePlan = planRepository.findByName(BillingConstants.PLAN_FREE)
                .orElseThrow(() -> new AppException(HttpStatus.INTERNAL_SERVER_ERROR, "Default FREE plan not found"));

        Subscription subscription = Subscription.builder()
                .status(SubscriptionStatus.ACTIVE)
                .plan(freePlan)
                .user(user)
                .cancelAtPeriodEnd(false)
                .build();

        subscriptionRepository.save(subscription);
        log.info("Created free subscription for user {}", userId);
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = CacheConstants.PLANS, key = "'all'")
    public List<PlanResponse> getAvailablePlans() {
        return billingMapper.toPlanResponseList(
                planRepository.findAll().stream().filter(Plan::isActive).toList()
        );
    }

    @Override
    @Transactional
    @Cacheable(value = CacheConstants.SUBSCRIPTION, key = "#userId")
    public SubscriptionResponse getSubscriptionByUser(Long userId) {
        Subscription subscription = subscriptionRepository.findByUserId(userId)
                .orElseGet(() -> {
                    createFreeSubscription(userId);
                    return subscriptionRepository.findByUserId(userId)
                            .orElseThrow(() -> new AppException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to resolve subscription"));
                });
        return billingMapper.toSubscriptionResponse(subscription);
    }

    @Override
    @CircuitBreaker(name = "stripe", fallbackMethod = "createCheckoutSessionFallback")
    @Retry(name = "stripe")
    public CheckoutResponse createCheckoutSession(Long planId, Long userId) {
        String[] checkoutInfo = transactionTemplate.execute(status -> {
            User user = userQueryService.getUserOrThrow(userId);

            Plan plan = planLimitService.getPlan(planId);
            if (BillingConstants.PLAN_FREE.equalsIgnoreCase(plan.getName())) {
                throw new AppException(HttpStatus.BAD_REQUEST, "billing.error.cannot_checkout_free");
            }

            Subscription subscription = subscriptionRepository.findByUserId(userId)
                    .orElseGet(() -> {
                        createFreeSubscription(userId);
                        return subscriptionRepository.findByUserId(userId)
                                .orElseThrow(() -> new AppException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to resolve subscription"));
                    });

            return new String[]{
                subscription.getStripeCustomerId(),
                user.getEmail(),
                user.getName(),
                plan.getStripePriceId()
            };
        });

        String customerId = checkoutInfo[0];
        String email = checkoutInfo[1];
        String name = checkoutInfo[2];
        String priceId = checkoutInfo[3];

        try {
            if (customerId == null || customerId.isEmpty()) {
                CustomerCreateParams customerParams = CustomerCreateParams.builder()
                        .setEmail(email)
                        .setName(name)
                        .build();
                Customer customer = Customer.create(customerParams);
                customerId = customer.getId();
                
                final String finalCustomerId = customerId;
                transactionTemplate.executeWithoutResult(status -> {
                    Subscription subscription = subscriptionRepository.findByUserId(userId).orElseThrow();
                    subscription.setStripeCustomerId(finalCustomerId);
                    subscriptionRepository.save(subscription);
                });
            }

            SessionCreateParams.Builder sessionBuilder = SessionCreateParams.builder()
                    .setCustomer(customerId)
                    .setSuccessUrl(successUrl + "?session_id={CHECKOUT_SESSION_ID}")
                    .setCancelUrl(cancelUrl)
                    .setMode(SessionCreateParams.Mode.SUBSCRIPTION)
                    .putMetadata("userId", String.valueOf(userId))
                    .putMetadata("planId", String.valueOf(planId))
                    .addLineItem(
                            SessionCreateParams.LineItem.builder()
                                    .setPrice(priceId)
                                    .setQuantity(1L)
                                    .build()
                    );

            Session session = Session.create(sessionBuilder.build());
            return new CheckoutResponse(session.getUrl());
        } catch (Exception e) {
            log.error("Stripe checkout error for userId={}: {}", userId, e.getMessage(), e);
            throw new AppException(HttpStatus.INTERNAL_SERVER_ERROR, "billing.error.session_creation_failed");
        }
    }

    @Override
    @org.springframework.cache.annotation.Caching(evict = {
        @CacheEvict(value = CacheConstants.SUBSCRIPTION, key = "#userId"),
        @CacheEvict(value = CacheConstants.SUBSCRIPTION, key = "'plan:' + #userId")
    })
    @CircuitBreaker(name = "stripe", fallbackMethod = "cancelSubscriptionFallback")
    @Retry(name = "stripe")
    public SubscriptionResponse cancelSubscription(Long userId) {
        Subscription subscription = subscriptionRepository.findByUserId(userId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Subscription not found"));

        String stripeSubId = subscription.getStripeSubscriptionId();
        if (stripeSubId == null || stripeSubId.isEmpty()) {
            throw new AppException(HttpStatus.BAD_REQUEST, "billing.error.no_active_subscription_cancel");
        }

        try {
            com.stripe.model.Subscription stripeSub = com.stripe.model.Subscription.retrieve(stripeSubId);
            Map<String, Object> params = new HashMap<>();
            params.put("cancel_at_period_end", true);
            stripeSub.update(params);

            Subscription updatedSubscription = transactionTemplate.execute(status -> {
                Subscription sub = subscriptionRepository.findByUserId(userId).orElseThrow();
                sub.setCancelAtPeriodEnd(true);
                sub.setStatus(SubscriptionStatus.CANCELLED);
                return subscriptionRepository.save(sub);
            });

            return billingMapper.toSubscriptionResponse(updatedSubscription);
        } catch (Exception e) {
            log.error("Stripe cancel error for subscriptionId={}: {}", stripeSubId, e.getMessage(), e);
            throw new AppException(HttpStatus.INTERNAL_SERVER_ERROR, "billing.error.cancel_failed");
        }
    }

    @Override
    @org.springframework.cache.annotation.Caching(evict = {
        @CacheEvict(value = CacheConstants.SUBSCRIPTION, key = "#userId"),
        @CacheEvict(value = CacheConstants.SUBSCRIPTION, key = "'plan:' + #userId")
    })
    @CircuitBreaker(name = "stripe", fallbackMethod = "resumeSubscriptionFallback")
    @Retry(name = "stripe")
    public SubscriptionResponse resumeSubscription(Long userId) {
        Subscription subscription = subscriptionRepository.findByUserId(userId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Subscription not found"));

        String stripeSubId = subscription.getStripeSubscriptionId();
        if (stripeSubId == null || stripeSubId.isEmpty()) {
            throw new AppException(HttpStatus.BAD_REQUEST, "billing.error.no_active_subscription_resume");
        }

        try {
            com.stripe.model.Subscription stripeSub = com.stripe.model.Subscription.retrieve(stripeSubId);
            Map<String, Object> params = new HashMap<>();
            params.put("cancel_at_period_end", false);
            stripeSub.update(params);

            Subscription updatedSubscription = transactionTemplate.execute(status -> {
                Subscription sub = subscriptionRepository.findByUserId(userId).orElseThrow();
                sub.setCancelAtPeriodEnd(false);
                sub.setStatus(SubscriptionStatus.ACTIVE);
                return subscriptionRepository.save(sub);
            });

            return billingMapper.toSubscriptionResponse(updatedSubscription);
        } catch (Exception e) {
            log.error("Stripe resume error for subscriptionId={}: {}", stripeSubId, e.getMessage(), e);
            throw new AppException(HttpStatus.INTERNAL_SERVER_ERROR, "billing.error.resume_failed");
        }
    }

    public CheckoutResponse createCheckoutSessionFallback(Long planId, Long userId, Throwable t) {
        if (t instanceof AppException appException) {
            throw appException;
        }
        log.warn("Stripe createCheckoutSession fallback triggered for userId={}: {}", userId, t.getMessage());
        throw new AppException(HttpStatus.SERVICE_UNAVAILABLE, "billing.error.stripe_unavailable");
    }

    public SubscriptionResponse cancelSubscriptionFallback(Long userId, Throwable t) {
        if (t instanceof AppException appException) {
            throw appException;
        }
        log.warn("Stripe cancelSubscription fallback triggered for userId={}: {}", userId, t.getMessage());
        throw new AppException(HttpStatus.SERVICE_UNAVAILABLE, "billing.error.stripe_unavailable");
    }

    public SubscriptionResponse resumeSubscriptionFallback(Long userId, Throwable t) {
        if (t instanceof AppException appException) {
            throw appException;
        }
        log.warn("Stripe resumeSubscription fallback triggered for userId={}: {}", userId, t.getMessage());
        throw new AppException(HttpStatus.SERVICE_UNAVAILABLE, "billing.error.stripe_unavailable");
    }

    @Override
    @Transactional
    public SubscriptionResponse confirmCheckoutSession(String sessionId, Long userId) {
        if (sessionId == null || sessionId.isEmpty()) {
            throw new AppException(HttpStatus.BAD_REQUEST, "billing.error.session_id_required");
        }


        try {
            Session session = Session.retrieve(sessionId);
            if ("paid".equalsIgnoreCase(session.getPaymentStatus()) || "complete".equalsIgnoreCase(session.getStatus())) {
                handleCheckoutCompleted(session);
            }
        } catch (Exception e) {
            log.error("Error retrieving Stripe Checkout Session {}: {}", sessionId, e.getMessage(), e);
            throw new AppException(HttpStatus.INTERNAL_SERVER_ERROR, "billing.error.session_retrieval_failed");
        }

        evictSubscriptionCache(userId);
        return getSubscriptionByUser(userId);
    }

    private StripeObject deserializeEventObject(Event event) {
        EventDataObjectDeserializer deserializer = event.getDataObjectDeserializer();
        if (deserializer.getObject().isPresent()) {
            return deserializer.getObject().get();
        }
        try {
            return deserializer.deserializeUnsafe();
        } catch (Exception e) {
            log.error("Failed to deserialize event object for event {}: {}", event.getId(), e.getMessage(), e);
            return null;
        }
    }

    @Override
    public void handleStripeWebhook(String payload, String sigHeader) {
        Event event;
        try {
            event = Webhook.constructEvent(payload, sigHeader, webhookSecret);
        } catch (Exception e) {
            log.error("Stripe webhook verification failed: {}", e.getMessage());
            throw new AppException(HttpStatus.BAD_REQUEST, "billing.error.invalid_signature");
        }

        log.info("Received Stripe webhook event: {}", event.getType());

        if (event.getId() != null) {
            String dedupKey = "stripe:event:" + event.getId();
            Boolean isNew = stringRedisTemplate.opsForValue().setIfAbsent(dedupKey, "1", WEBHOOK_DEDUP_TTL);
            if (Boolean.FALSE.equals(isNew)) {
                log.info("Duplicate Stripe webhook event ignored: {}", event.getId());
                return;
            }
        }

        try {
            StripeObject stripeObject = deserializeEventObject(event);
            if (stripeObject == null) {
                log.warn("Stripe object could not be deserialized for event: {}", event.getId());
                return;
            }

            switch (event.getType()) {
                case "checkout.session.completed":
                    if (stripeObject instanceof Session session) {
                        handleCheckoutCompleted(session);
                    }
                    break;
                case "invoice.payment_succeeded":
                    if (stripeObject instanceof Invoice invoice) {
                        if (invoice.getSubscription() != null) {
                            handlePaymentSucceeded(invoice);
                        }
                    }
                    break;
                case "invoice.payment_failed":
                    if (stripeObject instanceof Invoice failedInvoice) {
                        if (failedInvoice.getSubscription() != null) {
                            handlePaymentFailed(failedInvoice);
                        }
                    }
                    break;
                case "customer.subscription.deleted":
                    if (stripeObject instanceof com.stripe.model.Subscription deletedSub) {
                        handleSubscriptionDeleted(deletedSub);
                    }
                    break;
                case "customer.subscription.updated":
                    if (stripeObject instanceof com.stripe.model.Subscription updatedSub) {
                        handleSubscriptionUpdated(updatedSub);
                    }
                    break;
                default:
                    log.debug("Unhandled webhook event type: {}", event.getType());
            }
        } catch (Exception e) {
            log.error("Error processing Stripe webhook {}: {}", event.getType(), e.getMessage(), e);
            throw new AppException(HttpStatus.INTERNAL_SERVER_ERROR, "billing.error.webhook_failed");
        }
    }


    private void handleCheckoutCompleted(Session session) throws Exception {
        String userIdStr = session.getMetadata().get("userId");
        String planIdStr = session.getMetadata().get("planId");
        if (userIdStr == null || planIdStr == null) {
            log.warn("Missing metadata in Stripe Session: userId={}, planId={}", userIdStr, planIdStr);
            return;
        }
        Long userId = Long.valueOf(userIdStr);
        Long planId = Long.valueOf(planIdStr);
        Plan plan = planLimitService.getPlan(planId);
        Subscription subscription = subscriptionRepository.findByUserId(userId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Subscription not found"));

        String stripeSubId = session.getSubscription();
        com.stripe.model.Subscription stripeSub = com.stripe.model.Subscription.retrieve(stripeSubId);
        subscription.setPlan(plan);
        subscription.setStripeSubscriptionId(stripeSubId);
        subscription.setStripeCustomerId(session.getCustomer());
        subscription.setStatus(StripeUtils.mapStripeStatus(stripeSub.getStatus()));
        subscription.setCurrentPeriodStart(StripeUtils.mapEpoch(stripeSub.getCurrentPeriodStart()));
        subscription.setCurrentPeriodEnd(StripeUtils.mapEpoch(stripeSub.getCurrentPeriodEnd()));
        subscription.setCancelAtPeriodEnd(stripeSub.getCancelAtPeriodEnd());

        subscriptionRepository.save(subscription);
        evictSubscriptionCache(userId);
        log.info("Activated plan {} for user {}", plan.getName(), userId);
    }

    private void handlePaymentSucceeded(Invoice invoice) throws Exception {
        String stripeSubId = invoice.getSubscription();
        Subscription subscription = subscriptionRepository.findByStripeSubscriptionId(stripeSubId).orElse(null);
        if (subscription == null) {
            log.warn("Subscription not found locally for Stripe ID: {}", stripeSubId);
            return;
        }

        com.stripe.model.Subscription stripeSub = com.stripe.model.Subscription.retrieve(stripeSubId);
        subscription.setStatus(SubscriptionStatus.ACTIVE);
        subscription.setCurrentPeriodStart(StripeUtils.mapEpoch(stripeSub.getCurrentPeriodStart()));
        subscription.setCurrentPeriodEnd(StripeUtils.mapEpoch(stripeSub.getCurrentPeriodEnd()));
        subscriptionRepository.save(subscription);
        evictSubscriptionCache(subscription.getUser().getId());
        log.info("Payment succeeded. Renewed subscription for user {}", subscription.getUser().getId());
    }

    private void handlePaymentFailed(Invoice invoice) {
        String stripeSubId = invoice.getSubscription();
        Subscription subscription = subscriptionRepository.findByStripeSubscriptionId(stripeSubId).orElse(null);
        if (subscription == null) {
            log.warn("Subscription not found locally for Stripe ID: {}", stripeSubId);
            return;
        }

        subscription.setStatus(SubscriptionStatus.PAST_DUE);
        subscriptionRepository.save(subscription);
        evictSubscriptionCache(subscription.getUser().getId());
        log.warn("Payment failed. Subscription status marked PAST_DUE for user {}", subscription.getUser().getId());
    }

    private void handleSubscriptionDeleted(com.stripe.model.Subscription stripeSub) {
        Subscription subscription = subscriptionRepository.findByStripeSubscriptionId(stripeSub.getId()).orElse(null);
        if (subscription == null) {
            log.warn("Subscription not found locally for Stripe ID: {}", stripeSub.getId());
            return;
        }

        Plan freePlan = planRepository.findByName(BillingConstants.PLAN_FREE)
                .orElseThrow(() -> new AppException(HttpStatus.INTERNAL_SERVER_ERROR, "Default FREE plan not found"));

        subscription.setPlan(freePlan);
        subscription.setStatus(SubscriptionStatus.ACTIVE);
        subscription.setStripeSubscriptionId(null);
        subscription.setCurrentPeriodStart(null);
        subscription.setCurrentPeriodEnd(null);
        subscription.setCancelAtPeriodEnd(false);

        subscriptionRepository.save(subscription);
        evictSubscriptionCache(subscription.getUser().getId());
        log.info("Subscription deleted in Stripe. Downgraded user {} to {} plan", subscription.getUser().getId(), BillingConstants.PLAN_FREE);
    }

    private void handleSubscriptionUpdated(com.stripe.model.Subscription stripeSub) {
        Subscription subscription = subscriptionRepository.findByStripeSubscriptionId(stripeSub.getId()).orElse(null);
        if (subscription == null) {
            log.warn("Subscription not found locally for Stripe ID: {}", stripeSub.getId());
            return;
        }

        subscription.setStatus(StripeUtils.mapStripeStatus(stripeSub.getStatus()));
        subscription.setCurrentPeriodStart(StripeUtils.mapEpoch(stripeSub.getCurrentPeriodStart()));
        subscription.setCurrentPeriodEnd(StripeUtils.mapEpoch(stripeSub.getCurrentPeriodEnd()));
        subscription.setCancelAtPeriodEnd(stripeSub.getCancelAtPeriodEnd());

        subscriptionRepository.save(subscription);
        evictSubscriptionCache(subscription.getUser().getId());
        log.info("Subscription updated in Stripe for user {}", subscription.getUser().getId());
    }


    private void evictSubscriptionCache(Long userId) {
        if (userId != null) {
            org.springframework.cache.Cache cache = cacheManager.getCache("subscription");
            if (cache != null) {
                cache.evict(userId);
                cache.evict("plan:" + userId);
            }
        }
    }

    @Override
    @Transactional
    public void deleteSubscription(Long userId) {
        subscriptionRepository.findByUserId(userId).ifPresent(subscriptionRepository::delete);
    }
}
