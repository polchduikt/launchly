package com.launchly.common.constant;

import java.util.List;

public final class PublicEndpoints {
    private PublicEndpoints() {}
    
    public static final List<String> RATE_LIMIT_EXCLUDED = List.of(
            "/actuator/**",
            "/v3/api-docs/**",
            "/swagger-ui/**",
            "/swagger-ui.html",
            "/ws/**",
            "/api/v1/auth/**",
            "/api/v1/telegram/webhook/**",
            "/api/v1/billing/webhook",
            "/api/v1/integrations/google/callback",
            "/api/v1/integrations/hotmart/webhook/**",
            "/api/v1/support/appeal",
            "/api/i18n/**",
            "/api/v1/templates/share/**"
    );
}
