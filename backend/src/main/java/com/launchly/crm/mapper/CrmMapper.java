package com.launchly.crm.mapper;

import com.launchly.crm.dto.response.LeadResponse;
import com.launchly.crm.dto.response.MessageResponse;
import com.launchly.crm.dto.response.OrderResponse;
import com.launchly.crm.entity.Lead;
import com.launchly.crm.entity.Message;
import com.launchly.crm.entity.Order;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import java.util.List;

@Mapper(componentModel = "spring")
public interface CrmMapper {

    @Mapping(target = "botUserName", expression = "java(order.getBotUser().getFirstName() + (order.getBotUser().getLastName() != null ? \" \" + order.getBotUser().getLastName() : \"\"))")
    @Mapping(target = "botUserUsername", source = "botUser.username")
    OrderResponse toOrderResponse(Order order);

    List<OrderResponse> toOrderResponseList(List<Order> orders);

    @Mapping(target = "botUserName", expression = "java(lead.getBotUser().getFirstName() + (lead.getBotUser().getLastName() != null ? \" \" + lead.getBotUser().getLastName() : \"\"))")
    @Mapping(target = "botUserUsername", source = "botUser.username")
    LeadResponse toLeadResponse(Lead lead);

    List<LeadResponse> toLeadResponseList(List<Lead> leads);

    @Mapping(target = "conversationId", source = "conversation.id")
    MessageResponse toMessageResponse(Message message);

    List<MessageResponse> toMessageResponseList(List<Message> messages);

}
