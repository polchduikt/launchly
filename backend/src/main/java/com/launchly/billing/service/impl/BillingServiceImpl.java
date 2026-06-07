package com.launchly.billing.service.impl;

import com.launchly.auth.entity.User;
import com.launchly.auth.repository.UserRepository;
import com.launchly.billing.dto.response.CheckoutResponse;
import com.launchly.billing.dto.response.PlanResponse;
import com.launchly.billing.dto.response.SubscriptionResponse;
import com.launchly.billing.entity.Plan;
import com.launchly.billing.entity.Subscription;
import com.launchly.billing.entity.SubscriptionStatus;
import com.launchly.billing.mapper.BillingMapper;
import com.launchly.billing.repository.PlanRepository;
import com.launchly.billing.repository.SubscriptionRepository;
import com.launchly.billing.service.BillingService;
import com.launchly.billing.service.PlanLimitService;
import com.launchly.common.exception.AppException;
import com.stripe.Stripe;
import com.stripe.model.Event;
import com.stripe.model.Invoice;
import com.stripe.model.checkout.Session;
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
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class BillingServiceImpl implements BillingService {

    private final SubscriptionRepository subscriptionRepository;
    private final PlanRepository planRepository;
    private final UserRepository userRepository;
    private final BillingMapper billingMapper;
    private final CacheManager cacheManager;
    private final PlanLimitService planLimitService;

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

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "User not found"));

        Plan freePlan = planRepository.findByName("FREE")
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
    public List<PlanResponse> getAvailablePlans() {
        return billingMapper.toPlanResponseList(
                planRepository.findAll().stream().filter(Plan::isActive).toList()
        );
    }

    @Override
    @Transactional
    @Cacheable(value = "subscription", key = "#userId")
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
    @Transactional
    public CheckoutResponse createCheckoutSession(Long planId, Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "User not found"));

        Plan plan = planLimitService.getPlan(planId);
        if ("FREE".equalsIgnoreCase(plan.getName())) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Cannot checkout to FREE plan via Stripe");
        }

        Subscription subscription = subscriptionRepository.findByUserId(userId)
                .orElseGet(() -> {
                    createFreeSubscription(userId);
                    return subscriptionRepository.findByUserId(userId)
                            .orElseThrow(() -> new AppException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to resolve subscription"));
                });

        try {
            String customerId = subscription.getStripeCustomerId();
            if (customerId == null || customerId.isEmpty()) {
                CustomerCreateParams customerParams = CustomerCreateParams.builder()
                        .setEmail(user.getEmail())
                        .setName(user.getName())
                        .build();
                Customer customer = Customer.create(customerParams);
                customerId = customer.getId();
                subscription.setStripeCustomerId(customerId);
                subscriptionRepository.save(subscription);
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
                                    .setPrice(plan.getStripePriceId())
                                    .setQuantity(1L)
                                    .build()
                    );

            Session session = Session.create(sessionBuilder.build());
            return new CheckoutResponse(session.getUrl());
        } catch (Exception e) {
            log.error("Stripe checkout error for userId={}: {}", userId, e.getMessage(), e);
            throw new AppException(HttpStatus.INTERNAL_SERVER_ERROR, "Stripe session creation failed");
        }
    }

    @Override
    @Transactional
    @org.springframework.cache.annotation.Caching(evict = {
        @CacheEvict(value = "subscription", key = "#userId"),
        @CacheEvict(value = "subscription", key = "'plan:' + #userId")
    })
    public SubscriptionResponse cancelSubscription(Long userId) {
        Subscription subscription = subscriptionRepository.findByUserId(userId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Subscription not found"));

        String stripeSubId = subscription.getStripeSubscriptionId();
        if (stripeSubId == null || stripeSubId.isEmpty()) {
            throw new AppException(HttpStatus.BAD_REQUEST, "No active Stripe subscription to cancel");
        }

        try {
            com.stripe.model.Subscription stripeSub = com.stripe.model.Subscription.retrieve(stripeSubId);
            Map<String, Object> params = new HashMap<>();
            params.put("cancel_at_period_end", true);
            stripeSub.update(params);

            subscription.setCancelAtPeriodEnd(true);
            subscription.setStatus(SubscriptionStatus.CANCELLED);
            subscription = subscriptionRepository.save(subscription);

            return billingMapper.toSubscriptionResponse(subscription);
        } catch (Exception e) {
            log.error("Stripe cancel error for subscriptionId={}: {}", stripeSubId, e.getMessage(), e);
            throw new AppException(HttpStatus.INTERNAL_SERVER_ERROR, "Stripe subscription cancellation failed");
        }
    }

    @Override
    @Transactional
    @org.springframework.cache.annotation.Caching(evict = {
        @CacheEvict(value = "subscription", key = "#userId"),
        @CacheEvict(value = "subscription", key = "'plan:' + #userId")
    })
    public SubscriptionResponse resumeSubscription(Long userId) {
        Subscription subscription = subscriptionRepository.findByUserId(userId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Subscription not found"));

        String stripeSubId = subscription.getStripeSubscriptionId();
        if (stripeSubId == null || stripeSubId.isEmpty()) {
            throw new AppException(HttpStatus.BAD_REQUEST, "No active Stripe subscription to resume");
        }

        try {
            com.stripe.model.Subscription stripeSub = com.stripe.model.Subscription.retrieve(stripeSubId);
            Map<String, Object> params = new HashMap<>();
            params.put("cancel_at_period_end", false);
            stripeSub.update(params);

            subscription.setCancelAtPeriodEnd(false);
            subscription.setStatus(SubscriptionStatus.ACTIVE);
            subscription = subscriptionRepository.save(subscription);

            return billingMapper.toSubscriptionResponse(subscription);
        } catch (Exception e) {
            log.error("Stripe resume error for subscriptionId={}: {}", stripeSubId, e.getMessage(), e);
            throw new AppException(HttpStatus.INTERNAL_SERVER_ERROR, "Stripe subscription resumption failed");
        }
    }

    @Override
    @Transactional
    public void handleStripeWebhook(String payload, String sigHeader) {
        Event event;
        try {
            event = Webhook.constructEvent(payload, sigHeader, webhookSecret);
        } catch (Exception e) {
            log.error("Stripe webhook verification failed: {}", e.getMessage());
            throw new AppException(HttpStatus.BAD_REQUEST, "Invalid signature");
        }

        log.info("Received Stripe webhook event: {}", event.getType());

        try {
            switch (event.getType()) {
                case "checkout.session.completed":
                    Session session = (Session) event.getDataObjectDeserializer().getObject().orElse(null);
                    if (session != null) {
                        handleCheckoutCompleted(session);
                    }
                    break;
                case "invoice.payment_succeeded":
                    Invoice invoice = (Invoice) event.getDataObjectDeserializer().getObject().orElse(null);
                    if (invoice != null && invoice.getSubscription() != null) {
                        handlePaymentSucceeded(invoice);
                    }
                    break;
                case "invoice.payment_failed":
                    Invoice failedInvoice = (Invoice) event.getDataObjectDeserializer().getObject().orElse(null);
                    if (failedInvoice != null && failedInvoice.getSubscription() != null) {
                        handlePaymentFailed(failedInvoice);
                    }
                    break;
                case "customer.subscription.deleted":
                    com.stripe.model.Subscription deletedSub = (com.stripe.model.Subscription) event.getDataObjectDeserializer().getObject().orElse(null);
                    if (deletedSub != null) {
                        handleSubscriptionDeleted(deletedSub);
                    }
                    break;
                case "customer.subscription.updated":
                    com.stripe.model.Subscription updatedSub = (com.stripe.model.Subscription) event.getDataObjectDeserializer().getObject().orElse(null);
                    if (updatedSub != null) {
                        handleSubscriptionUpdated(updatedSub);
                    }
                    break;
                default:
                    log.debug("Unhandled webhook event type: {}", event.getType());
            }
        } catch (Exception e) {
            log.error("Error processing Stripe webhook {}: {}", event.getType(), e.getMessage(), e);
            throw new AppException(HttpStatus.INTERNAL_SERVER_ERROR, "Webhook processing failed");
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
        subscription.setStatus(mapStripeStatus(stripeSub.getStatus()));
        subscription.setCurrentPeriodStart(mapEpoch(stripeSub.getCurrentPeriodStart()));
        subscription.setCurrentPeriodEnd(mapEpoch(stripeSub.getCurrentPeriodEnd()));
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
        subscription.setCurrentPeriodStart(mapEpoch(stripeSub.getCurrentPeriodStart()));
        subscription.setCurrentPeriodEnd(mapEpoch(stripeSub.getCurrentPeriodEnd()));
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

        Plan freePlan = planRepository.findByName("FREE")
                .orElseThrow(() -> new AppException(HttpStatus.INTERNAL_SERVER_ERROR, "Default FREE plan not found"));

        subscription.setPlan(freePlan);
        subscription.setStatus(SubscriptionStatus.ACTIVE);
        subscription.setStripeSubscriptionId(null);
        subscription.setCurrentPeriodStart(null);
        subscription.setCurrentPeriodEnd(null);
        subscription.setCancelAtPeriodEnd(false);

        subscriptionRepository.save(subscription);
        evictSubscriptionCache(subscription.getUser().getId());
        log.info("Subscription deleted in Stripe. Downgraded user {} to FREE plan", subscription.getUser().getId());
    }

    private void handleSubscriptionUpdated(com.stripe.model.Subscription stripeSub) {
        Subscription subscription = subscriptionRepository.findByStripeSubscriptionId(stripeSub.getId()).orElse(null);
        if (subscription == null) {
            log.warn("Subscription not found locally for Stripe ID: {}", stripeSub.getId());
            return;
        }

        subscription.setStatus(mapStripeStatus(stripeSub.getStatus()));
        subscription.setCurrentPeriodStart(mapEpoch(stripeSub.getCurrentPeriodStart()));
        subscription.setCurrentPeriodEnd(mapEpoch(stripeSub.getCurrentPeriodEnd()));
        subscription.setCancelAtPeriodEnd(stripeSub.getCancelAtPeriodEnd());

        subscriptionRepository.save(subscription);
        evictSubscriptionCache(subscription.getUser().getId());
        log.info("Subscription updated in Stripe for user {}", subscription.getUser().getId());
    }

    private LocalDateTime mapEpoch(Long epoch) {
        if (epoch == null) return null;
        return LocalDateTime.ofInstant(Instant.ofEpochSecond(epoch), ZoneId.systemDefault());
    }

    private SubscriptionStatus mapStripeStatus(String stripeStatus) {
        if (stripeStatus == null) return SubscriptionStatus.ACTIVE;
        return switch (stripeStatus) {
            case "active" -> SubscriptionStatus.ACTIVE;
            case "past_due" -> SubscriptionStatus.PAST_DUE;
            case "trialing" -> SubscriptionStatus.TRIALING;
            case "canceled", "unpaid" -> SubscriptionStatus.CANCELLED;
            default -> SubscriptionStatus.ACTIVE;
        };
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
}
