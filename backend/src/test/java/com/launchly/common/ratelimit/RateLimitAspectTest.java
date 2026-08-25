package com.launchly.common.ratelimit;

import com.launchly.common.exception.AppException;
import io.github.bucket4j.ConsumptionProbe;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.reflect.MethodSignature;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.lang.reflect.Method;
import java.time.Duration;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class RateLimitAspectTest {

    private RateLimitService rateLimitService;
    private RateLimitAspect rateLimitAspect;

    @BeforeEach
    void setUp() {
        rateLimitService = mock(RateLimitService.class);
        rateLimitAspect = new RateLimitAspect(rateLimitService);
    }

    @Test
    void enforceRateLimit_whenAllowed_shouldProceedAndSetHeaders() throws Throwable {
        MockHttpServletRequest request = new MockHttpServletRequest();
        MockHttpServletResponse response = new MockHttpServletResponse();
        RequestContextHolder.setRequestAttributes(new ServletRequestAttributes(request, response));

        ProceedingJoinPoint joinPoint = mock(ProceedingJoinPoint.class);
        MethodSignature signature = mock(MethodSignature.class);
        Method method = this.getClass().getDeclaredMethod("sampleMethod");
        when(signature.getMethod()).thenReturn(method);
        when(joinPoint.getSignature()).thenReturn(signature);
        when(joinPoint.proceed()).thenReturn("result");

        RateLimit rateLimit = mock(RateLimit.class);
        when(rateLimit.type()).thenReturn(RateLimitType.IP);
        when(rateLimit.capacity()).thenReturn(10L);
        when(rateLimit.duration()).thenReturn(1L);
        when(rateLimit.unit()).thenReturn(TimeUnit.MINUTES);
        when(rateLimit.keyPrefix()).thenReturn("test");
        when(rateLimit.messageKey()).thenReturn("rate_limit.error.too_many_requests");

        ConsumptionProbe probe = mock(ConsumptionProbe.class);
        when(probe.isConsumed()).thenReturn(true);
        when(probe.getRemainingTokens()).thenReturn(9L);
        when(probe.getNanosToWaitForRefill()).thenReturn(1000000000L);
        when(rateLimitService.tryConsume(anyString(), anyLong(), any(Duration.class), anyLong())).thenReturn(probe);

        Object result = rateLimitAspect.enforceRateLimit(joinPoint, rateLimit);

        assertThat(result).isEqualTo("result");
        assertThat(response.getHeader("X-RateLimit-Limit")).isEqualTo("10");
        assertThat(response.getHeader("X-RateLimit-Remaining")).isEqualTo("9");
    }

    @Test
    void enforceRateLimit_whenExceeded_shouldThrowAppException() throws Throwable {
        MockHttpServletRequest request = new MockHttpServletRequest();
        MockHttpServletResponse response = new MockHttpServletResponse();
        RequestContextHolder.setRequestAttributes(new ServletRequestAttributes(request, response));

        ProceedingJoinPoint joinPoint = mock(ProceedingJoinPoint.class);
        MethodSignature signature = mock(MethodSignature.class);
        Method method = this.getClass().getDeclaredMethod("sampleMethod");
        when(signature.getMethod()).thenReturn(method);
        when(joinPoint.getSignature()).thenReturn(signature);

        RateLimit rateLimit = mock(RateLimit.class);
        when(rateLimit.type()).thenReturn(RateLimitType.IP);
        when(rateLimit.capacity()).thenReturn(5L);
        when(rateLimit.duration()).thenReturn(1L);
        when(rateLimit.unit()).thenReturn(TimeUnit.MINUTES);
        when(rateLimit.keyPrefix()).thenReturn("test");
        when(rateLimit.messageKey()).thenReturn("rate_limit.error.too_many_requests");

        ConsumptionProbe probe = mock(ConsumptionProbe.class);
        when(probe.isConsumed()).thenReturn(false);
        when(probe.getRemainingTokens()).thenReturn(0L);
        when(probe.getNanosToWaitForRefill()).thenReturn(30_000_000_000L);
        when(rateLimitService.tryConsume(anyString(), anyLong(), any(Duration.class), anyLong())).thenReturn(probe);

        assertThatThrownBy(() -> rateLimitAspect.enforceRateLimit(joinPoint, rateLimit))
                .isInstanceOf(AppException.class)
                .satisfies(ex -> {
                    AppException appEx = (AppException) ex;
                    assertThat(appEx.getStatus()).isEqualTo(HttpStatus.TOO_MANY_REQUESTS);
                });

        assertThat(response.getHeader("Retry-After")).isEqualTo("30");
    }

    void sampleMethod() {}
}