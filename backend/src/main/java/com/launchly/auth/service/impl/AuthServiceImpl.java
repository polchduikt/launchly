package com.launchly.auth.service.impl;

import com.launchly.auth.dto.request.LoginRequest;
import com.launchly.auth.dto.request.RegisterRequest;
import com.launchly.auth.dto.request.UpdateProfileRequest;
import com.launchly.auth.dto.response.AuthResponse;
import com.launchly.auth.dto.response.UserResponse;
import com.launchly.auth.entity.Provider;
import com.launchly.auth.entity.RefreshToken;
import com.launchly.auth.entity.Role;
import com.launchly.auth.entity.User;
import com.launchly.auth.mapper.AuthMapper;
import com.launchly.auth.repository.UserRepository;
import com.launchly.auth.service.AuthService;
import com.launchly.auth.service.TokenService;
import com.launchly.billing.service.BillingService;
import com.launchly.bot.entity.Bot;
import com.launchly.bot.entity.BotMember;
import com.launchly.common.exception.AppException;
import com.launchly.auth.entity.AuthSessionStatus;
import com.launchly.auth.entity.TelegramAuthSession;
import com.launchly.auth.repository.TelegramAuthSessionRepository;
import com.launchly.admin.service.UserAuditService;
import com.launchly.billing.repository.SubscriptionRepository;
import com.launchly.bot.repository.BotMemberRepository;
import com.launchly.bot.repository.BotRepository;
import com.launchly.common.security.turnstile.TurnstileService;
import com.launchly.common.utils.MessageUtils;
import com.launchly.auth.dto.response.TelegramSessionResponse;
import com.launchly.auth.dto.response.TelegramStatusResponse;
import org.springframework.beans.factory.annotation.Value;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final TokenService tokenService;
    private final AuthMapper authMapper;
    private final PasswordEncoder passwordEncoder;
    private final BillingService billingService;
    private final TelegramAuthSessionRepository telegramAuthSessionRepository;
    private final UserAuditService userAuditService;
    private final BotRepository botRepository;
    private final BotMemberRepository botMemberRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final MessageUtils messageUtils;
    private final TurnstileService turnstileService;

    @Value("${telegram.system-bot-username:}")
    private String systemBotUsername;

    @Value("${app.security.super-admin-email:}")
    private String superAdminEmail;

    @Override
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (!turnstileService.verifyToken(request.turnstileToken())) {
            throw new AppException(HttpStatus.BAD_REQUEST, messageUtils.getMessage("auth.error.captcha_invalid"));
        }

        if (userRepository.existsByEmail(request.email())) {
            throw new AppException(HttpStatus.CONFLICT, messageUtils.getMessage("auth.error.email_already_in_use"));
        }

        Role role = Role.ROLE_OWNER;
        if (superAdminEmail != null && !superAdminEmail.isBlank() && superAdminEmail.trim().equalsIgnoreCase(request.email().trim())) {
            role = Role.ROLE_ADMIN;
        }

        User user = User.builder()
                .email(request.email())
                .password(passwordEncoder.encode(request.password()))
                .name(request.name())
                .role(role)
                .provider(Provider.LOCAL)
                .active(true)
                .emailVerified(false)
                .build();

        user = userRepository.save(user);
        billingService.createFreeSubscription(user.getId());

        userAuditService.logRegistration(user, "LOCAL", user.getCreatedAt());
        userAuditService.logLogin(user, "LOCAL");

        String accessToken = tokenService.generateAccessToken(user);
        String refreshToken = tokenService.generateRefreshToken(user);
        return new AuthResponse(accessToken, refreshToken, authMapper.toUserResponse(user));
    }

    @Override
    @Transactional
    public AuthResponse login(LoginRequest request) {
        if (!turnstileService.verifyToken(request.turnstileToken())) {
            throw new AppException(HttpStatus.BAD_REQUEST, messageUtils.getMessage("auth.error.captcha_invalid"));
        }

        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new AppException(HttpStatus.UNAUTHORIZED, messageUtils.getMessage("auth.error.invalid_credentials")));

        if (!user.isActive()) {
            String reason = user.getBlockReason() != null ? user.getBlockReason() : messageUtils.getMessage("auth.error.account_blocked");
            throw new AppException(HttpStatus.FORBIDDEN, reason);
        }

        if (user.getPassword() == null || !passwordEncoder.matches(request.password(), user.getPassword())) {
            throw new AppException(HttpStatus.UNAUTHORIZED, messageUtils.getMessage("auth.error.invalid_credentials"));
        }

        if (superAdminEmail != null && !superAdminEmail.isBlank() && superAdminEmail.trim().equalsIgnoreCase(user.getEmail().trim())) {
            if (user.getRole() != Role.ROLE_ADMIN) {
                user.setRole(Role.ROLE_ADMIN);
                user = userRepository.save(user);
            }
        }

        userAuditService.logLogin(user, user.getProvider() != null ? user.getProvider().name() : "LOCAL");

        String accessToken = tokenService.generateAccessToken(user);
        String refreshToken = tokenService.generateRefreshToken(user);
        return new AuthResponse(accessToken, refreshToken, authMapper.toUserResponse(user));
    }

    @Override
    @Transactional
    public AuthResponse refreshToken(String refreshTokenStr) {
        RefreshToken refreshToken = tokenService.verifyRefreshToken(refreshTokenStr);
        User user = refreshToken.getUser();
        if (!user.isActive()) {
            throw new AppException(HttpStatus.FORBIDDEN, messageUtils.getMessage("auth.error.account_blocked"));
        }
        tokenService.deleteRefreshToken(refreshTokenStr);
        String newAccessToken = tokenService.generateAccessToken(user);
        String newRefreshToken = tokenService.generateRefreshToken(user);
        return new AuthResponse(newAccessToken, newRefreshToken, authMapper.toUserResponse(user));
    }

    @Override
    @Transactional
    public void logout(String refreshToken) {
        tokenService.deleteRefreshToken(refreshToken);
    }

    @Override
    @Transactional(readOnly = true)
    public UserResponse getCurrentUser(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, messageUtils.getMessage("auth.error.user_not_found")));
        if (!user.isActive()) {
            throw new AppException(HttpStatus.FORBIDDEN, messageUtils.getMessage("auth.error.account_blocked"));
        }
        return authMapper.toUserResponse(user);
    }

    @Override
    @Transactional
    public UserResponse updateProfile(String currentEmail, UpdateProfileRequest request) {
        User user = userRepository.findByEmail(currentEmail)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, messageUtils.getMessage("auth.error.user_not_found")));

        if (!user.isActive()) {
            throw new AppException(HttpStatus.FORBIDDEN, messageUtils.getMessage("auth.error.account_blocked"));
        }

        String newEmail = request.email().trim().toLowerCase();
        if (!user.getEmail().equalsIgnoreCase(newEmail)) {
            if (user.getProvider() == Provider.GOOGLE) {
                throw new AppException(HttpStatus.BAD_REQUEST, messageUtils.getMessage("auth.error.google_email_immutable"));
            }
            if (userRepository.existsByEmailAndIdNot(newEmail, user.getId())) {
                throw new AppException(HttpStatus.CONFLICT, messageUtils.getMessage("auth.error.email_already_in_use"));
            }
            user.setEmail(newEmail);
        }

        user.setName(request.name().trim());

        if (request.avatar() != null) {
            user.setAvatar(request.avatar().trim().isEmpty() ? null : request.avatar().trim());
        }

        if (request.newPassword() != null && !request.newPassword().isBlank()) {
            if (request.newPassword().length() < 6) {
                throw new AppException(HttpStatus.BAD_REQUEST, messageUtils.getMessage("auth.error.password_min_length"));
            }
            if (user.getPassword() != null && !user.getPassword().isBlank()) {
                if (request.currentPassword() == null || request.currentPassword().isBlank()) {
                    throw new AppException(HttpStatus.BAD_REQUEST, messageUtils.getMessage("auth.error.current_password_required"));
                }
                if (!passwordEncoder.matches(request.currentPassword(), user.getPassword())) {
                    throw new AppException(HttpStatus.BAD_REQUEST, messageUtils.getMessage("auth.error.invalid_current_password"));
                }
            }
            user.setPassword(passwordEncoder.encode(request.newPassword()));
        }

        user = userRepository.save(user);
        return authMapper.toUserResponse(user);
    }


    @Override
    @Transactional
    public TelegramSessionResponse createTelegramSession(String currentEmail, boolean isSubscription) {
        String token = UUID.randomUUID().toString();
        
        User user = null;
        if (currentEmail != null && !currentEmail.isBlank()) {
            user = userRepository.findByEmail(currentEmail).orElse(null);
        }

        TelegramAuthSession session = TelegramAuthSession.builder()
                .token(token)
                .status(AuthSessionStatus.PENDING)
                .user(user)
                .isSubscription(isSubscription)
                .createdAt(LocalDateTime.now())
                .expiresAt(LocalDateTime.now().plusMinutes(5))
                .build();

        telegramAuthSessionRepository.save(session);
        
        String cleanUsername = systemBotUsername;
        if (cleanUsername != null && cleanUsername.startsWith("@")) {
            cleanUsername = cleanUsername.substring(1);
        }
        return new TelegramSessionResponse(token, cleanUsername);
    }

    @Override
    @Transactional(readOnly = true)
    public TelegramStatusResponse checkTelegramSessionStatus(String token) {
        TelegramAuthSession session = telegramAuthSessionRepository.findByToken(token)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, messageUtils.getMessage("auth.error.session_not_found")));

        if (session.getExpiresAt().isBefore(LocalDateTime.now()) && session.getStatus() == AuthSessionStatus.PENDING) {
            session.setStatus(AuthSessionStatus.EXPIRED);
            telegramAuthSessionRepository.save(session);
            return TelegramStatusResponse.expired();
        }

        if (session.getStatus() == AuthSessionStatus.PENDING) {
            return TelegramStatusResponse.pending();
        }

        if (session.getStatus() == AuthSessionStatus.EXPIRED) {
            return TelegramStatusResponse.expired();
        }

        UserResponse userResponse = authMapper.toUserResponse(session.getUser());
        return TelegramStatusResponse.success(session.getJwtAccessToken(), session.getJwtRefreshToken(), userResponse);
    }

    @Override
    @Transactional
    public void unlinkTelegram(String currentEmail) {
        User user = userRepository.findByEmail(currentEmail)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, messageUtils.getMessage("auth.error.user_not_found")));
        user.setTelegramUserId(null);
        user.setTelegramUsername(null);
        userRepository.save(user);
    }

    @Override
    @Transactional
    public boolean handleTelegramAuth(String token, Long telegramUserId, String telegramUsername, String telegramName, String telegramPhotoUrl) {
        TelegramAuthSession session = telegramAuthSessionRepository.findByToken(token)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, messageUtils.getMessage("auth.error.session_not_found")));

        if (session.getStatus() != AuthSessionStatus.PENDING) {
            throw new AppException(HttpStatus.BAD_REQUEST, messageUtils.getMessage("auth.error.session_not_pending"));
        }

        if (session.getExpiresAt().isBefore(LocalDateTime.now())) {
            session.setStatus(AuthSessionStatus.EXPIRED);
            telegramAuthSessionRepository.save(session);
            throw new AppException(HttpStatus.BAD_REQUEST, messageUtils.getMessage("auth.error.session_expired"));
        }

        User user = session.getUser();
        if (user != null) {
            user.setTelegramUserId(telegramUserId);
            user.setTelegramUsername(telegramUsername);
            user.setTelegramName(telegramName);
            user.setTelegramPhotoUrl(telegramPhotoUrl);
            user = userRepository.save(user);
        } else {
            user = userRepository.findByTelegramUserId(telegramUserId).orElse(null);

            if (user == null) {
                String email = "tg_" + telegramUserId + "@launchly.ai";
                Optional<User> existingUser = userRepository.findByEmail(email);
                if (existingUser.isPresent()) {
                    user = existingUser.get();
                } else {
                    String name = telegramName != null ? telegramName : (telegramUsername != null ? telegramUsername : "Telegram User " + telegramUserId);
                    user = User.builder()
                            .email(email)
                            .name(name)
                            .role(Role.ROLE_OWNER)
                            .provider(Provider.LOCAL)
                            .active(true)
                            .emailVerified(true)
                            .telegramUserId(telegramUserId)
                            .telegramUsername(telegramUsername)
                            .telegramName(telegramName)
                            .telegramPhotoUrl(telegramPhotoUrl)
                            .build();
                    user = userRepository.save(user);
                    billingService.createFreeSubscription(user.getId());
                }
            } else {
                if (telegramName != null) {
                    user.setTelegramName(telegramName);
                }
                if (telegramPhotoUrl != null) {
                    user.setTelegramPhotoUrl(telegramPhotoUrl);
                }
                user = userRepository.save(user);
            }
        }

        String accessToken = tokenService.generateAccessToken(user);
        String refreshToken = tokenService.generateRefreshToken(user);

        session.setUser(user);
        session.setTelegramUserId(telegramUserId);
        session.setTelegramUsername(telegramUsername);
        session.setTelegramName(telegramName);
        session.setTelegramPhotoUrl(telegramPhotoUrl);
        session.setJwtAccessToken(accessToken);
        session.setJwtRefreshToken(refreshToken);
        session.setStatus(AuthSessionStatus.SUCCESS);
        telegramAuthSessionRepository.save(session);
        return session.isSubscription();
    }

    @Override
    @Transactional
    public void deleteUserAccount(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "User not found"));

        List<Bot> ownedBots = botRepository.findAllByUserId(userId);
        for (Bot b : ownedBots) {
            botRepository.delete(b);
        }

        List<BotMember> memberships = botMemberRepository.findByUserId(userId);
        for (BotMember bm : memberships) {
            botMemberRepository.delete(bm);
        }

        subscriptionRepository.findByUserId(userId).ifPresent(subscriptionRepository::delete);

        userRepository.delete(user);
    }

    @Override
    @Transactional
    public void deleteAccountByEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "User not found"));
        deleteUserAccount(user.getId());
    }
}
