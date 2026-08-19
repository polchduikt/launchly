package com.launchly.crm.dto.request;

import com.launchly.crm.entity.LeadStatus;
import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Request payload to update lead pipeline stage and notes")
public record LeadUpdateRequest(
        @Schema(description = "Lead status: NEW, CONTACTED, QUALIFIED, WON, LOST", example = "QUALIFIED")
        LeadStatus status,

        @Schema(description = "Lead notes")
        String notes
) {}

