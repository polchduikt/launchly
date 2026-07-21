package com.launchly.common.metric;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import java.io.IOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;

@Component
public class PerformanceMonitoringFilter implements Filter {

    public static class HourlyMetric {
        public final AtomicLong totalLatency = new AtomicLong(0);
        public final AtomicInteger requestCount = new AtomicInteger(0);
        public final AtomicInteger errorCount = new AtomicInteger(0);
    }

    private static final Map<String, HourlyMetric> hourlyMetrics = new ConcurrentHashMap<>();

    public static Map<String, HourlyMetric> getHourlyMetrics() {
        return hourlyMetrics;
    }

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        
        long startTime = System.currentTimeMillis();
        try {
            chain.doFilter(request, response);
        } finally {
            long duration = System.currentTimeMillis() - startTime;
            
            int status = 200;
            if (response instanceof HttpServletResponse) {
                status = ((HttpServletResponse) response).getStatus();
            }

            String uri = "";
            if (request instanceof HttpServletRequest) {
                uri = ((HttpServletRequest) request).getRequestURI();
            }

            // Exclude static asset resources, websocket, etc. to monitor API and page requests
            if (!uri.contains("/assets/") && !uri.contains("/webjars/") && !uri.endsWith(".png") && !uri.endsWith(".js") && !uri.endsWith(".css")) {
                String hourBucket = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:00"));
                HourlyMetric metric = hourlyMetrics.computeIfAbsent(hourBucket, k -> new HourlyMetric());
                
                metric.totalLatency.addAndGet(duration);
                metric.requestCount.incrementAndGet();
                if (status >= 400) {
                    metric.errorCount.incrementAndGet();
                }
            }
        }
    }
}
