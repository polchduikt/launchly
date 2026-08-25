package com.launchly.common.ratelimit;

import com.launchly.common.security.CustomUserDetails;
import com.launchly.common.utils.MessageUtils;
import io.github.bucket4j.ConsumptionProbe;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import java.io.IOException;
import java.time.Duration;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class TierRateLimitFilterTest {

    private RateLimitService rateLimitService;
    private MessageUtils messageUtils;
    private TierRateLimitFilter filter;

    @BeforeEach
    void setUp() {
        rateLimitService = mock(RateLimitService.class);
        messageUtils = mock(MessageUtils.class);
        filter = new TierRateLimitFilter(rateLimitService, messageUtils);
        SecurityContextHolder.clearContext();
    }

    @Test
    void doFilter_whenExcludedPath_shouldBypass() throws ServletException, IOException {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRequestURI("/api/v1/auth/login");
        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain filterChain = mock(FilterChain.class);

        filter.doFilter(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
        verifyNoInteractions(rateLimitService);
    }

    @Test
    void doFilter_whenWithinLimit_shouldProceedAndSetHeaders() throws ServletException, IOException {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRequestURI("/api/v1/bots");
        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain filterChain = mock(FilterChain.class);

        CustomUserDetails userDetails = new CustomUserDetails(1L, "user@test.com", "pass", true, null, List.of(new SimpleGrantedAuthority("ROLE_USER")));
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
        SecurityContextHolder.getContext().setAuthentication(auth);

        ConsumptionProbe probe = mock(ConsumptionProbe.class);
        when(probe.isConsumed()).thenReturn(true);
        when(probe.getRemainingTokens()).thenReturn(119L);
        when(probe.getNanosToWaitForRefill()).thenReturn(1000000L);
        when(rateLimitService.tryConsume(eq("rate:tier:user:1"), eq(120L), any(Duration.class), eq(1L))).thenReturn(probe);

        filter.doFilter(request, response, filterChain);

        assertThat(response.getHeader("X-RateLimit-Limit")).isEqualTo("120");
        assertThat(response.getHeader("X-RateLimit-Remaining")).isEqualTo("119");
        verify(filterChain).doFilter(request, response);
    }

    @Test
    void doFilter_whenExceeded_shouldReturn429() throws ServletException, IOException {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRequestURI("/api/v1/bots");
        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain filterChain = mock(FilterChain.class);

        CustomUserDetails userDetails = new CustomUserDetails(1L, "user@test.com", "pass", true, null, List.of(new SimpleGrantedAuthority("ROLE_USER")));
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
        SecurityContextHolder.getContext().setAuthentication(auth);

        ConsumptionProbe probe = mock(ConsumptionProbe.class);
        when(probe.isConsumed()).thenReturn(false);
        when(probe.getRemainingTokens()).thenReturn(0L);
        when(probe.getNanosToWaitForRefill()).thenReturn(15_000_000_000L);
        when(rateLimitService.tryConsume(eq("rate:tier:user:1"), eq(120L), any(Duration.class), eq(1L))).thenReturn(probe);
        when(messageUtils.getMessageWithDefault(anyString(), anyString(), any())).thenReturn("Rate limit exceeded");

        filter.doFilter(request, response, filterChain);

        assertThat(response.getStatus()).isEqualTo(HttpStatus.TOO_MANY_REQUESTS.value());
        assertThat(response.getHeader("Retry-After")).isEqualTo("15");
        verifyNoInteractions(filterChain);
    }
}