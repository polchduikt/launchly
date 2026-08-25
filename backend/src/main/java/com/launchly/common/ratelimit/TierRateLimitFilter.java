package com.launchly.common.ratelimit;

import com.launchly.common.security.CustomUserDetails;
import com.launchly.common.utils.MessageUtils;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.util.AntPathMatcher;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.util.List;
import java.util.concurrent.TimeUnit;

@Slf4j
@Component
@RequiredArgsConstructor
public class TierRateLimitFilter extends OncePerRequestFilter {

    private final RateLimitService rateLimitService;
    private final MessageUtils messageUtils;
    private final AntPathMatcher pathMatcher = new AntPathMatcher();

    private static final List<String> EXCLUDED_PATHS = List.of(
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

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        for (String pattern : EXCLUDED_PATHS) {
            if (pathMatcher.match(pattern, path)) {
                return true;
            }
        }
        return !path.startsWith("/api/v1/");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        long capacity;
        String rateKey;

        if (auth != null && auth.isAuthenticated() && auth.getPrincipal() instanceof CustomUserDetails userDetails) {
            capacity = resolveTierCapacity(auth);
            rateKey = "rate:tier:user:" + userDetails.getId();
        } else {
            capacity = 60;
            rateKey = "rate:tier:ip:" + extractClientIp(request);
        }

        Duration duration = Duration.ofMinutes(1);
        var probe = rateLimitService.tryConsume(rateKey, capacity, duration, 1);

        response.setHeader("X-RateLimit-Limit", String.valueOf(capacity));
        response.setHeader("X-RateLimit-Remaining", String.valueOf(probe.getRemainingTokens()));
        long resetEpochSeconds = (System.currentTimeMillis() + TimeUnit.NANOSECONDS.toMillis(probe.getNanosToWaitForRefill())) / 1000;
        response.setHeader("X-RateLimit-Reset", String.valueOf(resetEpochSeconds));

        if (!probe.isConsumed()) {
            long retryAfterSeconds = Math.max(1, TimeUnit.NANOSECONDS.toSeconds(probe.getNanosToWaitForRefill()));
            response.setHeader("Retry-After", String.valueOf(retryAfterSeconds));
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.setCharacterEncoding("UTF-8");

            String errorMessage = messageUtils.getMessageWithDefault(
                    "rate_limit.error.too_many_requests",
                    "Too many requests. Please try again in " + retryAfterSeconds + " seconds.",
                    retryAfterSeconds
            );

            String jsonResponse = String.format(
                    "{\"status\":429,\"error\":\"Too Many Requests\",\"message\":\"%s\",\"path\":\"%s\"}",
                    errorMessage.replace("\"", "\\\""),
                    request.getRequestURI()
            );

            response.getWriter().write(jsonResponse);
            return;
        }

        filterChain.doFilter(request, response);
    }

    private long resolveTierCapacity(Authentication auth) {
        for (GrantedAuthority authority : auth.getAuthorities()) {
            String role = authority.getAuthority();
            if ("ROLE_ADMIN".equals(role) || "ROLE_SUPER_ADMIN".equals(role)) {
                return 2400;
            }
            if ("ROLE_ENTERPRISE".equals(role)) {
                return 1200;
            }
            if ("ROLE_PRO".equals(role)) {
                return 600;
            }
        }
        return 120;
    }

    private String extractClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isBlank()) {
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}