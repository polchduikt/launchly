package com.launchly.crm.repository;

import com.launchly.crm.entity.Lead;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface LeadRepository extends JpaRepository<Lead, Long> {

    List<Lead> findByBotIdOrderByCreatedAtDesc(Long botId);
}
