package com.launchly.common.idempotency;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.launchly.common.exception.AppException;
import com.launchly.common.security.CustomUserDetails;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.reflect.MethodSignature;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.lang.reflect.Method;
import java.time.Duration;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class IdempotencyAspectTest {

    @Mock
    private StringRedisTemplate stringRedisTemplate;

    @Mock
    private ValueOperations<String, String> valueOperations;

    @Mock
    private ProceedingJoinPoint joinPoint;

    @Mock
    private MethodSignature methodSignature;

    @Mock
    private HttpServletRequest request;

    @Mock
    private HttpServletResponse response;

    @Mock
    private Idempotent idempotent;

    private ObjectMapper objectMapper;
    private IdempotencyAspect idempotencyAspect;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        idempotencyAspect = new IdempotencyAspect(stringRedisTemplate, objectMapper);
        RequestContextHolder.setRequestAttributes(new ServletRequestAttributes(request, response));
        lenient().when(idempotent.headerName()).thenReturn("Idempotency-Key");
        lenient().when(idempotent.ttlSeconds()).thenReturn(86400L);
    }

    @Test
    void whenNoHeader_proceedsNormally() throws Throwable {
        when(request.getHeader("Idempotency-Key")).thenReturn(null);
        when(joinPoint.proceed()).thenReturn("ok");

        Object result = idempotencyAspect.handleIdempotency(joinPoint, idempotent);

        assertThat(result).isEqualTo("ok");
        verify(joinPoint).proceed();
        verifyNoInteractions(stringRedisTemplate);
    }

    @Test
    void whenKeyTooLong_throwsBadRequest() {
        String longKey = "a".repeat(256);
        when(request.getHeader("Idempotency-Key")).thenReturn(longKey);

        assertThatThrownBy(() -> idempotencyAspect.handleIdempotency(joinPoint, idempotent))
                .isInstanceOf(AppException.class)
                .satisfies(e -> {
                    AppException ex = (AppException) e;
                    assertThat(ex.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST);
                    assertThat(ex.getMessage()).isEqualTo("idempotency.error.invalid_key");
                });
    }

    @Test
    void whenFirstRequest_acquiresLockAndSavesResponse() throws Throwable {
        when(request.getHeader("Idempotency-Key")).thenReturn("test-key-123");
        when(request.getRemoteAddr()).thenReturn("127.0.0.1");
        when(stringRedisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.setIfAbsent(anyString(), eq("PROCESSING"), any(Duration.class))).thenReturn(true);

        ResponseEntity<Map<String, String>> responseEntity = ResponseEntity.ok(Map.of("status", "created"));
        when(joinPoint.proceed()).thenReturn(responseEntity);

        Object result = idempotencyAspect.handleIdempotency(joinPoint, idempotent);

        assertThat(result).isEqualTo(responseEntity);
        verify(valueOperations).set(contains(":data"), anyString(), any(Duration.class));
        verify(valueOperations).set(contains(":status"), eq("COMPLETED"), any(Duration.class));
    }

    @Test
    void whenRequestInProgress_throwsConflict() {
        when(request.getHeader("Idempotency-Key")).thenReturn("test-key-123");
        when(request.getRemoteAddr()).thenReturn("127.0.0.1");
        when(stringRedisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.setIfAbsent(anyString(), eq("PROCESSING"), any(Duration.class))).thenReturn(false);
        when(valueOperations.get(contains(":status"))).thenReturn("PROCESSING");

        assertThatThrownBy(() -> idempotencyAspect.handleIdempotency(joinPoint, idempotent))
                .isInstanceOf(AppException.class)
                .satisfies(e -> {
                    AppException ex = (AppException) e;
                    assertThat(ex.getStatus()).isEqualTo(HttpStatus.CONFLICT);
                    assertThat(ex.getMessage()).isEqualTo("idempotency.error.request_in_progress");
                });
    }

    @Test
    void whenCompletedRequest_returnsCachedResponse() throws Throwable {
        when(request.getHeader("Idempotency-Key")).thenReturn("test-key-123");
        when(request.getRemoteAddr()).thenReturn("127.0.0.1");
        when(stringRedisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.setIfAbsent(anyString(), eq("PROCESSING"), any(Duration.class))).thenReturn(false);
        when(valueOperations.get(contains(":status"))).thenReturn("COMPLETED");

        IdempotencyRecord cachedRecord = IdempotencyRecord.builder()
                .statusCode(200)
                .responseBody(objectMapper.writeValueAsString(Map.of("id", 42)))
                .createdAt(System.currentTimeMillis())
                .build();
        when(valueOperations.get(contains(":data"))).thenReturn(objectMapper.writeValueAsString(cachedRecord));

        Method sampleMethod = SampleController.class.getMethod("sampleEndpoint");
        when(joinPoint.getSignature()).thenReturn(methodSignature);
        when(methodSignature.getMethod()).thenReturn(sampleMethod);

        Object result = idempotencyAspect.handleIdempotency(joinPoint, idempotent);

        assertThat(result).isInstanceOf(ResponseEntity.class);
        verify(response).setHeader("Idempotent-Replayed", "true");
        verify(joinPoint, never()).proceed();
    }

    @Test
    void whenExecutionFails_cleansUpProcessingKey() throws Throwable {
        when(request.getHeader("Idempotency-Key")).thenReturn("test-key-123");
        when(request.getRemoteAddr()).thenReturn("127.0.0.1");
        when(stringRedisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.setIfAbsent(anyString(), eq("PROCESSING"), any(Duration.class))).thenReturn(true);
        when(joinPoint.proceed()).thenThrow(new RuntimeException("Database error"));

        assertThatThrownBy(() -> idempotencyAspect.handleIdempotency(joinPoint, idempotent))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("Database error");

        verify(stringRedisTemplate).delete(contains(":status"));
    }

    static class SampleController {
        public ResponseEntity<Map<String, Object>> sampleEndpoint() {
            return ResponseEntity.ok(Map.of("id", 42));
        }
    }
}
