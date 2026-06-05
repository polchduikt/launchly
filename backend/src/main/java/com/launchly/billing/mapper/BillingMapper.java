package com.launchly.billing.mapper;

import com.launchly.billing.entity.Plan;
import com.launchly.billing.entity.Subscription;
import com.launchly.billing.dto.response.PlanResponse;
import com.launchly.billing.dto.response.SubscriptionResponse;
import org.mapstruct.Mapper;
import java.util.List;

@Mapper(componentModel = "spring")
public interface BillingMapper {
    PlanResponse toPlanResponse(Plan plan);
    List<PlanResponse> toPlanResponseList(List<Plan> plans);
    SubscriptionResponse toSubscriptionResponse(Subscription subscription);
}
