package com.launchly.crm.repository;

import com.launchly.crm.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface OrderRepository extends JpaRepository<Order, Long> {

    List<Order> findByBotIdOrderByCreatedAtDesc(Long botId);
}
