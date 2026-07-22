package com.launchly.common.security;

import com.launchly.auth.entity.Provider;
import com.launchly.auth.entity.Role;
import com.launchly.auth.entity.User;
import com.launchly.auth.repository.UserRepository;
import com.launchly.auth.service.TokenService;
import com.launchly.billing.service.BillingService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@Component
@RequiredArgsConstructor
public class OAuth2SuccessHandler implements AuthenticationSuccessHandler {

    private final UserRepository userRepository;
    private final TokenService tokenService;
    private final BillingService billingService;

    @Value("${app.oauth2.redirect-uri}")
    private String redirectUri;

    @Value("${app.security.super-admin-email:}")
    private String superAdminEmail;

    @Value("${app.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
                                        Authentication authentication) throws IOException {
        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();

        String email = oAuth2User.getAttribute("email");
        String name = oAuth2User.getAttribute("name");
        String avatar = oAuth2User.getAttribute("picture");

        boolean isSuperAdmin = email != null && superAdminEmail != null && !superAdminEmail.isBlank()
                && email.trim().equalsIgnoreCase(superAdminEmail.trim());

        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null) {
            user = userRepository.save(User.builder()
                    .email(email)
                    .name(name)
                    .avatar(avatar)
                    .role(isSuperAdmin ? Role.ROLE_ADMIN : Role.ROLE_OWNER)
                    .provider(Provider.GOOGLE)
                    .active(true)
                    .emailVerified(true)
                    .build());
        } else {
            if (!user.isActive()) {
                String reason = user.getBlockReason() != null ? user.getBlockReason() : "admin.reason_rules";
                String targetUrl = org.springframework.web.util.UriComponentsBuilder.fromUriString(frontendUrl + "/blocked")
                        .queryParam("code", URLEncoder.encode(reason, StandardCharsets.UTF_8))
                        .build().toUriString();
                response.sendRedirect(targetUrl);
                return;
            }
            boolean updated = false;
            if (isSuperAdmin && user.getRole() != Role.ROLE_ADMIN) {
                user.setRole(Role.ROLE_ADMIN);
                updated = true;
            }
            if (avatar != null && (user.getAvatar() == null || !avatar.equals(user.getAvatar()))) {
                user.setAvatar(avatar);
                updated = true;
            }
            if (updated) {
                user = userRepository.save(user);
            }
        }

        billingService.createFreeSubscription(user.getId());

        String accessToken = tokenService.generateAccessToken(user);
        String refreshToken = tokenService.generateRefreshToken(user);

        String targetUrl = redirectUri + "?accessToken=" + accessToken + "&refreshToken=" + refreshToken;
        response.sendRedirect(targetUrl);
    }
}
