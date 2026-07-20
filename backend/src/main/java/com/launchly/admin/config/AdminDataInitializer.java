package com.launchly.admin.config;

import com.launchly.auth.entity.Role;
import com.launchly.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Component
@RequiredArgsConstructor
public class AdminDataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;

    @Value("${app.security.super-admin-email:}")
    private String superAdminEmail;

    @Override
    @Transactional
    public void run(String... args) {
        if (superAdminEmail == null || superAdminEmail.isBlank()) {
            log.warn("No app.security.super-admin-email configured.");
            return;
        }

        String targetEmail = superAdminEmail.trim();
        log.info("AdminDataInitializer running. Checking super admin email: [{}]", targetEmail);

        userRepository.findByEmailIgnoreCase(targetEmail).ifPresentOrElse(
                user -> {
                    if (user.getRole() != Role.ROLE_ADMIN) {
                        user.setRole(Role.ROLE_ADMIN);
                        userRepository.save(user);
                        log.info("SUCCESS: User [{}] role elevated to ROLE_ADMIN.", targetEmail);
                    } else {
                        log.info("User [{}] is already ROLE_ADMIN.", targetEmail);
                    }
                },
                () -> log.info("Super admin user [{}] does not exist in DB yet. It will be promoted on first login.", targetEmail)
        );
    }
}
