package com.launchly.common.security;

import com.launchly.auth.entity.Role;
import com.launchly.auth.entity.User;
import com.launchly.auth.repository.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CustomUserDetailsServiceTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private CustomUserDetailsService customUserDetailsService;

    @Test
    @DisplayName("Should load UserDetails with correct roles when user exists")
    void loadUserByUsername_WhenUserExists_ReturnsUserDetails() {
        User user = User.builder()
                .email("admin@test.com")
                .password("hashed_pwd")
                .role(Role.ROLE_ADMIN)
                .active(true)
                .build();
        ReflectionTestUtils.setField(user, "id", 1L);

        when(userRepository.findByEmail("admin@test.com")).thenReturn(Optional.of(user));

        UserDetails userDetails = customUserDetailsService.loadUserByUsername("admin@test.com");

        assertThat(userDetails).isNotNull();
        assertThat(userDetails.getUsername()).isEqualTo("admin@test.com");
        assertThat(userDetails.getAuthorities())
                .extracting("authority")
                .containsExactly("ROLE_ADMIN");
    }

    @Test
    @DisplayName("Should throw UsernameNotFoundException when user email does not exist")
    void loadUserByUsername_WhenNotFound_ThrowsException() {
        when(userRepository.findByEmail("unknown@test.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> customUserDetailsService.loadUserByUsername("unknown@test.com"))
                .isInstanceOf(UsernameNotFoundException.class);
    }
}
