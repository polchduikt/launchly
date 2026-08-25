package com.launchly.common.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.slf4j.MDC;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import java.io.IOException;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

class CorrelationIdFilterTest {

    private CorrelationIdFilter filter;

    @BeforeEach
    void setUp() {
        filter = new CorrelationIdFilter();
        MDC.clear();
    }

    @Test
    void doFilter_withExistingTraceIdHeader_shouldUseHeaderAndSetResponseHeader() throws ServletException, IOException {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader(CorrelationIdFilter.TRACE_ID_HEADER, "custom-trace-123");
        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain filterChain = mock(FilterChain.class);

        filter.doFilter(request, response, filterChain);

        assertThat(response.getHeader(CorrelationIdFilter.TRACE_ID_HEADER)).isEqualTo("custom-trace-123");
        assertThat(response.getHeader(CorrelationIdFilter.CORRELATION_ID_HEADER)).isEqualTo("custom-trace-123");
        verify(filterChain).doFilter(request, response);
        assertThat(MDC.get(CorrelationIdFilter.TRACE_ID_MDC_KEY)).isNull();
    }

    @Test
    void doFilter_withoutHeader_shouldGenerateUuidTraceId() throws ServletException, IOException {
        MockHttpServletRequest request = new MockHttpServletRequest();
        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain filterChain = mock(FilterChain.class);

        filter.doFilter(request, response, filterChain);

        String generatedTraceId = response.getHeader(CorrelationIdFilter.TRACE_ID_HEADER);
        assertThat(generatedTraceId).isNotNull().isNotBlank();
        assertThat(response.getHeader(CorrelationIdFilter.CORRELATION_ID_HEADER)).isEqualTo(generatedTraceId);
        verify(filterChain).doFilter(request, response);
    }
}
