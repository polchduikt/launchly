package com.launchly.crm.service;

import com.launchly.crm.dto.request.LeadUpdateRequest;
import com.launchly.crm.dto.request.OrderUpdateRequest;
import com.launchly.crm.dto.response.LeadResponse;
import com.launchly.crm.dto.response.OrderResponse;

import java.math.BigDecimal;
import java.util.List;

public interface CrmPipelineService {
    OrderResponse createOrder(Long botId, Long botUserId, String items, BigDecimal totalAmount, String currency);
    List<OrderResponse> getOrdersByBot(Long botId, Long userId);
    OrderResponse updateOrder(Long orderId, OrderUpdateRequest request, Long userId);

    LeadResponse createLead(Long botId, Long botUserId, String name, String email, String phone, String data);
    List<LeadResponse> getLeadsByBot(Long botId, Long userId);
    LeadResponse updateLead(Long leadId, LeadUpdateRequest request, Long userId);
}
