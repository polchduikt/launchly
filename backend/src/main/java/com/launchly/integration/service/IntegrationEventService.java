package com.launchly.integration.service;

import com.launchly.crm.entity.Lead;
import com.launchly.crm.entity.Order;

public interface IntegrationEventService {

    void onOrderCreated(Order order);

    void onLeadCreated(Lead lead);
}
