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
import java.util.concurrent.TimeUnit;

@Slf4j
@Component
@RequiredArgsConstructor
public class TierRateLimitFilter extends OncePerRequestFilter {

    private final RateLimitService rateLimitService;
    private final MessageUtils messageUtils;
    private final tools.jackson.databind.ObjectMapper objectMapper;
    private final AntPathMatcher pathMatcher = new AntPathMatcher();

    private static final long ADMIN_RATE_LIMIT = 120_000;
    private static final long ENTERPRISE_RATE_LIMIT = 60_000;
    private static final long PRO_RATE_LIMIT = 30_000;
    private static final long FREE_RATE_LIMIT = 12_000;
    private static final long ANONYMOUS_RATE_LIMIT = 60;
    private static final Duration WINDOW_DURATION = Duration.ofMinutes(1);
    private static final long DEFAULT_CONSUME_TOKENS = 1L;

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        for (String pattern : com.launchly.common.constant.PublicEndpoints.RATE_LIMIT_EXCLUDED) {
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
            capacity = ANONYMOUS_RATE_LIMIT;
            rateKey = "rate:tier:ip:" + extractClientIp(request);
        }

        var probe = rateLimitService.tryConsume(rateKey, capacity, WINDOW_DURATION, DEFAULT_CONSUME_TOKENS);

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

            java.util.Map<String, Object> body = java.util.Map.of(
                    "status", 429,
                    "error", "Too Many Requests",
                    "message", errorMessage,
                    "path", request.getRequestURI()
            );

            response.getWriter().write(objectMapper.writeValueAsString(body));
            return;
        }

        filterChain.doFilter(request, response);
    }

    private long resolveTierCapacity(Authentication auth) {
        for (GrantedAuthority authority : auth.getAuthorities()) {
            String role = authority.getAuthority();
            if ("ROLE_ADMIN".equals(role) || "ROLE_SUPER_ADMIN".equals(role)) {
                return ADMIN_RATE_LIMIT;
            }
            if ("ROLE_ENTERPRISE".equals(role)) {
                return ENTERPRISE_RATE_LIMIT;
            }
            if ("ROLE_PRO".equals(role)) {
                return PRO_RATE_LIMIT;
            }
        }
        return FREE_RATE_LIMIT;
    }

    private String extractClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isBlank()) {
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}