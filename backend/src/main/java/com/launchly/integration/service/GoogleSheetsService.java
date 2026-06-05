package com.launchly.integration.service;

import com.launchly.integration.entity.Integration;
import java.util.List;

public interface GoogleSheetsService {

    String buildAuthorizationUrl(Long botId, Long userId);

    Long authenticate(String stateToken, String code);

    void appendRow(Integration integration, List<Object> values);

    void refreshTokenIfNeeded(Integration integration);
}
