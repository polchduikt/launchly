package com.launchly.crm.repository;

import com.launchly.crm.entity.Order;
import com.launchly.crm.entity.OrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface OrderRepository extends JpaRepository<Order, Long> {

    List<Order> findByBotIdAndStatus(Long botId, OrderStatus status);

    List<Order> findByBotIdOrderByCreatedAtDesc(Long botId);

    List<Order> findByBotUserIdAndBotId(Long botUserId, Long botId);

    boolean existsByBotUserIdAndBotId(Long botUserId, Long botId);
}
