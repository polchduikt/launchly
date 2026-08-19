package com.launchly.common.security;

import com.launchly.admin.service.UserAuditService;
import com.launchly.auth.entity.Role;
import com.launchly.auth.entity.User;
import com.launchly.auth.repository.UserRepository;
import com.launchly.auth.service.TokenService;
import com.launchly.billing.service.BillingService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OAuth2SuccessHandlerTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private TokenService tokenService;

    @Mock
    private BillingService billingService;

    @Mock
    private UserAuditService userAuditService;

    @Mock
    private Authentication authentication;

    @Mock
    private OAuth2User oAuth2User;

    @InjectMocks
    private OAuth2SuccessHandler successHandler;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(successHandler, "redirectUri", "http://localhost:5173/auth/callback");
        ReflectionTestUtils.setField(successHandler, "frontendUrl", "http://localhost:5173");
        ReflectionTestUtils.setField(successHandler, "superAdminEmail", "admin@launchly.pro");

        when(authentication.getPrincipal()).thenReturn(oAuth2User);
    }

    @Test
    @DisplayName("Should register new user upon first Google OAuth2 login and redirect with tokens")
    void onAuthenticationSuccess_NewUser_Success() throws Exception {
        when(oAuth2User.getAttribute("email")).thenReturn("newoauth@launchly.pro");
        when(oAuth2User.getAttribute("name")).thenReturn("OAuth User");
        when(oAuth2User.getAttribute("picture")).thenReturn("https://avatar.com/pic.png");

        User savedUser = User.builder().email("newoauth@launchly.pro").role(Role.ROLE_OWNER).active(true).build();
        ReflectionTestUtils.setField(savedUser, "id", 10L);

        when(userRepository.findByEmail("newoauth@launchly.pro")).thenReturn(Optional.empty());
        when(userRepository.save(any(User.class))).thenReturn(savedUser);
        when(tokenService.generateAccessToken(any(User.class))).thenReturn("oauth_access_token");
        when(tokenService.generateRefreshToken(any(User.class))).thenReturn("oauth_refresh_token");

        MockHttpServletRequest request = new MockHttpServletRequest();
        MockHttpServletResponse response = new MockHttpServletResponse();

        successHandler.onAuthenticationSuccess(request, response, authentication);

        assertThat(response.getRedirectedUrl()).contains("accessToken=oauth_access_token");
        verify(billingService, times(1)).createFreeSubscription(10L);
        verify(userAuditService, times(1)).logRegistration(any(User.class), eq("GOOGLE"), any());
    }

    @Test
    @DisplayName("Should redirect blocked OAuth2 user to /blocked frontend page")
    void onAuthenticationSuccess_BlockedUser_RedirectsToBlockedPage() throws Exception {
        when(oAuth2User.getAttribute("email")).thenReturn("blocked@launchly.pro");

        User blockedUser = User.builder()
                .email("blocked@launchly.pro")
                .active(false)
                .blockReason("Spam violation")
                .build();

        when(userRepository.findByEmail("blocked@launchly.pro")).thenReturn(Optional.of(blockedUser));

        MockHttpServletRequest request = new MockHttpServletRequest();
        MockHttpServletResponse response = new MockHttpServletResponse();

        successHandler.onAuthenticationSuccess(request, response, authentication);

        assertThat(response.getRedirectedUrl()).contains("/blocked?code=");
        verify(tokenService, never()).generateAccessToken(any());
    }
}
