package com.launchly.auth.service.impl;

import com.launchly.auth.dto.request.LoginRequest;
import com.launchly.auth.dto.request.RegisterRequest;
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
    private final com.launchly.admin.service.UserAuditService userAuditService;
    private final com.launchly.bot.repository.BotRepository botRepository;
    private final com.launchly.bot.repository.BotMemberRepository botMemberRepository;
    private final com.launchly.billing.repository.SubscriptionRepository subscriptionRepository;

    @Value("${telegram.system-bot-username:}")
    private String systemBotUsername;

    @Override
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new AppException(HttpStatus.CONFLICT, "Email already in use");
        }
        User user = User.builder()
                .email(request.email())
                .password(passwordEncoder.encode(request.password()))
                .name(request.name())
                .role(Role.ROLE_OWNER)
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
        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new AppException(HttpStatus.UNAUTHORIZED, "Invalid email or password"));

        if (!user.isActive()) {
            String reason = user.getBlockReason() != null ? user.getBlockReason() : "admin.reason_rules";
            throw new AppException(HttpStatus.FORBIDDEN, reason);
        }

        if (user.getPassword() == null || !passwordEncoder.matches(request.password(), user.getPassword())) {
            throw new AppException(HttpStatus.UNAUTHORIZED, "Invalid email or password");
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
            throw new AppException(HttpStatus.FORBIDDEN, "Ваш акаунт заблоковано. Зверніться до адміністратора.");
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
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "User not found"));
        if (!user.isActive()) {
            throw new AppException(HttpStatus.FORBIDDEN, "Ваш акаунт заблоковано. Зверніться до адміністратора.");
        }
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
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Auth session not found"));

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
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "User not found"));
        user.setTelegramUserId(null);
        user.setTelegramUsername(null);
        userRepository.save(user);
    }

    @Override
    @Transactional
    public boolean handleTelegramAuth(String token, Long telegramUserId, String telegramUsername, String telegramName, String telegramPhotoUrl) {
        TelegramAuthSession session = telegramAuthSessionRepository.findByToken(token)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Auth session not found"));

        if (session.getStatus() != AuthSessionStatus.PENDING) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Auth session is not pending");
        }

        if (session.getExpiresAt().isBefore(LocalDateTime.now())) {
            session.setStatus(AuthSessionStatus.EXPIRED);
            telegramAuthSessionRepository.save(session);
            throw new AppException(HttpStatus.BAD_REQUEST, "Auth session expired");
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
                if (userRepository.existsByEmail(email)) {
                    user = userRepository.findByEmail(email).get();
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
}
