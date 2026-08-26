package com.launchly.common.idempotency;

import com.fasterxml.jackson.databind.JavaType;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.launchly.common.exception.AppException;
import com.launchly.common.security.CustomUserDetails;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import java.lang.reflect.Method;
import java.lang.reflect.ParameterizedType;
import java.lang.reflect.Type;
import java.time.Duration;

@Slf4j
@Aspect
@Component
public class IdempotencyAspect {

    private final StringRedisTemplate stringRedisTemplate;
    private final ObjectMapper objectMapper;

    public IdempotencyAspect(@Autowired(required = false) StringRedisTemplate stringRedisTemplate,
                             @Autowired(required = false) ObjectMapper objectMapper) {
        this.stringRedisTemplate = stringRedisTemplate;
        this.objectMapper = objectMapper != null ? objectMapper : new ObjectMapper();
    }

    @Around("@annotation(idempotent)")
    public Object handleIdempotency(ProceedingJoinPoint joinPoint, Idempotent idempotent) throws Throwable {
        if (stringRedisTemplate == null) {
            return joinPoint.proceed();
        }

        ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (attributes == null) {
            return joinPoint.proceed();
        }

        HttpServletRequest request = attributes.getRequest();
        HttpServletResponse response = attributes.getResponse();

        String keyHeader = request.getHeader(idempotent.headerName());
        if (!StringUtils.hasText(keyHeader)) {
            return joinPoint.proceed();
        }

        String trimmedKey = keyHeader.trim();
        if (trimmedKey.length() > 255) {
            throw new AppException(HttpStatus.BAD_REQUEST, "idempotency.error.invalid_key");
        }

        String scope = resolveScope(request);
        String baseKey = "idempotency:" + scope + ":" + trimmedKey;
        String statusKey = baseKey + ":status";
        String dataKey = baseKey + ":data";

        Boolean acquired = stringRedisTemplate.opsForValue().setIfAbsent(statusKey, "PROCESSING", Duration.ofSeconds(60));

        if (Boolean.TRUE.equals(acquired)) {
            try {
                Object result = joinPoint.proceed();
                saveIdempotencyRecord(dataKey, statusKey, result, idempotent.ttlSeconds());
                return result;
            } catch (Throwable t) {
                stringRedisTemplate.delete(statusKey);
                throw t;
            }
        } else {
            String status = stringRedisTemplate.opsForValue().get(statusKey);
            if ("PROCESSING".equals(status)) {
                throw new AppException(HttpStatus.CONFLICT, "idempotency.error.request_in_progress");
            }
            if ("COMPLETED".equals(status)) {
                String cachedJson = stringRedisTemplate.opsForValue().get(dataKey);
                if (StringUtils.hasText(cachedJson)) {
                    if (response != null) {
                        response.setHeader("Idempotent-Replayed", "true");
                    }
                    return reconstructResponse(joinPoint, cachedJson);
                }
            }
            return joinPoint.proceed();
        }
    }

    private void saveIdempotencyRecord(String dataKey, String statusKey, Object result, long ttlSeconds) {
        try {
            int statusCode = HttpStatus.OK.value();
            String bodyJson = null;

            if (result instanceof ResponseEntity<?> responseEntity) {
                statusCode = responseEntity.getStatusCode().value();
                if (responseEntity.getBody() != null) {
                    bodyJson = objectMapper.writeValueAsString(responseEntity.getBody());
                }
            } else if (result != null) {
                bodyJson = objectMapper.writeValueAsString(result);
            }

            IdempotencyRecord record = IdempotencyRecord.builder()
                    .statusCode(statusCode)
                    .responseBody(bodyJson)
                    .createdAt(System.currentTimeMillis())
                    .build();

            String recordJson = objectMapper.writeValueAsString(record);
            Duration ttl = Duration.ofSeconds(ttlSeconds);
            stringRedisTemplate.opsForValue().set(dataKey, recordJson, ttl);
            stringRedisTemplate.opsForValue().set(statusKey, "COMPLETED", ttl);
        } catch (Exception e) {
            log.error("Failed to cache idempotency response for key {}", dataKey, e);
        }
    }

    private Object reconstructResponse(ProceedingJoinPoint joinPoint, String cachedJson) throws Exception {
        IdempotencyRecord record = objectMapper.readValue(cachedJson, IdempotencyRecord.class);
        MethodSignature signature = (MethodSignature) joinPoint.getSignature();
        Method method = signature.getMethod();
        Type returnType = method.getGenericReturnType();

        if (returnType instanceof ParameterizedType parameterizedType &&
                parameterizedType.getRawType().equals(ResponseEntity.class)) {
            Type bodyType = parameterizedType.getActualTypeArguments()[0];
            if (record.getResponseBody() == null) {
                return ResponseEntity.status(record.getStatusCode()).build();
            }
            JavaType javaType = objectMapper.getTypeFactory().constructType(bodyType);
            Object deserializedBody = objectMapper.readValue(record.getResponseBody(), javaType);
            return ResponseEntity.status(record.getStatusCode()).body(deserializedBody);
        }

        if (ResponseEntity.class.equals(returnType)) {
            return ResponseEntity.status(record.getStatusCode()).body(record.getResponseBody());
        }

        if (record.getResponseBody() == null) {
            return null;
        }

        JavaType javaType = objectMapper.getTypeFactory().constructType(returnType);
        return objectMapper.readValue(record.getResponseBody(), javaType);
    }

    private String resolveScope(HttpServletRequest request) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof CustomUserDetails userDetails) {
            return "user:" + userDetails.getId();
        }
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (StringUtils.hasText(xForwardedFor)) {
            return "ip:" + xForwardedFor.split(",")[0].trim();
        }
        return "ip:" + request.getRemoteAddr();
    }
}
