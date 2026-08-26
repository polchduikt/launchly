package com.launchly.crm.repository;

import com.launchly.crm.entity.Order;
import com.launchly.crm.entity.OrderStatus;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface OrderRepository extends JpaRepository<Order, Long> {

    @EntityGraph(attributePaths = {"botUser", "bot"})
    List<Order> findByBotIdAndStatus(Long botId, OrderStatus status);

    @EntityGraph(attributePaths = {"botUser", "bot"})
    List<Order> findByBotIdOrderByCreatedAtDesc(Long botId);

    @EntityGraph(attributePaths = {"botUser", "bot"})
    List<Order> findByBotUserIdAndBotId(Long botUserId, Long botId);

    @Override
    @EntityGraph(attributePaths = {"botUser", "bot"})
    Optional<Order> findById(Long id);

    boolean existsByBotUserIdAndBotId(Long botUserId, Long botId);
}
