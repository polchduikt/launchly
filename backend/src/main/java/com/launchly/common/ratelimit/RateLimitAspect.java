package com.launchly.common.ratelimit;

import com.launchly.common.exception.AppException;
import com.launchly.common.security.CustomUserDetails;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.lang.reflect.Method;
import java.time.Duration;
import java.util.concurrent.TimeUnit;

@Slf4j
@Aspect
@Component
@RequiredArgsConstructor
public class RateLimitAspect {

    private final RateLimitService rateLimitService;

    @Around("@annotation(rateLimit)")
    public Object enforceRateLimit(ProceedingJoinPoint joinPoint, RateLimit rateLimit) throws Throwable {
        ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (attributes == null) {
            return joinPoint.proceed();
        }

        HttpServletRequest request = attributes.getRequest();
        HttpServletResponse response = attributes.getResponse();

        String rateKey = buildKey(joinPoint, rateLimit, request);
        Duration duration = Duration.ofMillis(rateLimit.unit().toMillis(rateLimit.duration()));

        var probe = rateLimitService.tryConsume(rateKey, rateLimit.capacity(), duration, 1);

        if (response != null) {
            response.setHeader("X-RateLimit-Limit", String.valueOf(rateLimit.capacity()));
            response.setHeader("X-RateLimit-Remaining", String.valueOf(probe.getRemainingTokens()));
            long resetEpochSeconds = (System.currentTimeMillis() + TimeUnit.NANOSECONDS.toMillis(probe.getNanosToWaitForRefill())) / 1000;
            response.setHeader("X-RateLimit-Reset", String.valueOf(resetEpochSeconds));
        }

        if (!probe.isConsumed()) {
            long retryAfterSeconds = Math.max(1, TimeUnit.NANOSECONDS.toSeconds(probe.getNanosToWaitForRefill()));
            if (response != null) {
                response.setHeader("Retry-After", String.valueOf(retryAfterSeconds));
            }
            log.warn("Rate limit exceeded for key {} on endpoint {}. Retry after {}s",
                    rateKey, request.getRequestURI(), retryAfterSeconds);
            throw new AppException(HttpStatus.TOO_MANY_REQUESTS, rateLimit.messageKey(), retryAfterSeconds);
        }

        return joinPoint.proceed();
    }

    private String buildKey(ProceedingJoinPoint joinPoint, RateLimit rateLimit, HttpServletRequest request) {
        MethodSignature signature = (MethodSignature) joinPoint.getSignature();
        Method method = signature.getMethod();
        String prefix = StringUtils.hasText(rateLimit.keyPrefix())
                ? rateLimit.keyPrefix()
                : method.getDeclaringClass().getSimpleName() + "." + method.getName();

        String identifier;
        switch (rateLimit.type()) {
            case USER -> {
                Long userId = getCurrentUserId();
                identifier = userId != null ? "user:" + userId : "ip:" + extractClientIp(request);
            }
            case IP_OR_USER -> {
                Long userId = getCurrentUserId();
                identifier = userId != null ? "user:" + userId : "ip:" + extractClientIp(request);
            }
            case EMAIL -> {
                String email = request.getParameter("email");
                identifier = StringUtils.hasText(email) ? "email:" + email.toLowerCase() : "ip:" + extractClientIp(request);
            }
            case BOT_USER -> {
                String botId = request.getParameter("botId");
                identifier = StringUtils.hasText(botId) ? "bot:" + botId + ":ip:" + extractClientIp(request) : "ip:" + extractClientIp(request);
            }
            default -> identifier = "ip:" + extractClientIp(request);
        }

        return "rate:" + prefix + ":" + identifier;
    }

    private Long getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof CustomUserDetails userDetails) {
            return userDetails.getId();
        }
        return null;
    }

    private String extractClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (StringUtils.hasText(xForwardedFor)) {
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}