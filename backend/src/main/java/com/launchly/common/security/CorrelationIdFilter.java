package com.launchly.common.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.MDC;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;
import java.io.IOException;
import java.util.UUID;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class CorrelationIdFilter extends OncePerRequestFilter {

    public static final String TRACE_ID_MDC_KEY = "traceId";
    public static final String CLIENT_IP_MDC_KEY = "clientIp";
    public static final String TRACE_ID_HEADER = "X-Trace-Id";
    public static final String CORRELATION_ID_HEADER = "X-Correlation-Id";
    public static final String REQUEST_ID_HEADER = "X-Request-Id";

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        String traceId = resolveTraceId(request);

        MDC.put(TRACE_ID_MDC_KEY, traceId);
        MDC.put(CLIENT_IP_MDC_KEY, extractClientIp(request));

        response.setHeader(TRACE_ID_HEADER, traceId);
        response.setHeader(CORRELATION_ID_HEADER, traceId);

        try {
            filterChain.doFilter(request, response);
        } finally {
            MDC.remove(TRACE_ID_MDC_KEY);
            MDC.remove(CLIENT_IP_MDC_KEY);
            MDC.remove("userId");
            MDC.remove("userEmail");
            MDC.remove("botId");
        }
    }

    private String resolveTraceId(HttpServletRequest request) {
        String header = request.getHeader(TRACE_ID_HEADER);
        if (!StringUtils.hasText(header)) {
            header = request.getHeader(CORRELATION_ID_HEADER);
        }
        if (!StringUtils.hasText(header)) {
            header = request.getHeader(REQUEST_ID_HEADER);
        }

        if (StringUtils.hasText(header) && header.length() <= 64 && header.matches("^[a-zA-Z0-9_.-]+$")) {
            return header;
        }

        return UUID.randomUUID().toString();
    }

    private String extractClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (StringUtils.hasText(xForwardedFor)) {
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
