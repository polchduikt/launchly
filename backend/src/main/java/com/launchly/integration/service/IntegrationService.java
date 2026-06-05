package com.launchly.integration.service;

import com.launchly.integration.dto.request.IntegrationCreateRequest;
import com.launchly.integration.dto.response.IntegrationResponse;
import java.util.List;

public interface IntegrationService {

    List<IntegrationResponse> getIntegrations(Long userId);

    IntegrationResponse createIntegration(IntegrationCreateRequest request, Long userId);

    IntegrationResponse updateIntegration(Long id, IntegrationCreateRequest request, Long userId);

    void deleteIntegration(Long id, Long userId);

    IntegrationResponse toggleIntegration(Long id, Long userId);
}
