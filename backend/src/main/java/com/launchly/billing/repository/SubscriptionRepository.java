package com.launchly.billing.repository;

import com.launchly.billing.entity.Subscription;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface SubscriptionRepository extends JpaRepository<Subscription, Long> {

    @EntityGraph(attributePaths = {"plan", "user"})
    Optional<Subscription> findByUserId(Long userId);

    @EntityGraph(attributePaths = {"plan", "user"})
    Optional<Subscription> findByStripeSubscriptionId(String stripeSubscriptionId);

    @EntityGraph(attributePaths = {"plan", "user"})
    Optional<Subscription> findByStripeCustomerId(String stripeCustomerId);

    @Override
    @EntityGraph(attributePaths = {"plan", "user"})
    Optional<Subscription> findById(Long id);
}
