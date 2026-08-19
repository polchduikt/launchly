package com.launchly.auth.service.impl;

import com.launchly.auth.entity.User;
import com.launchly.auth.repository.UserRepository;
import com.launchly.common.exception.AppException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserQueryServiceImplTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private UserQueryServiceImpl userQueryService;

    @Test
    @DisplayName("Should find user by ID or throw NotFound exception")
    void getUserOrThrow_Scenarios() {
        User user = User.builder().email("user@test.com").build();
        ReflectionTestUtils.setField(user, "id", 10L);

        when(userRepository.findById(10L)).thenReturn(Optional.of(user));
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        assertThat(userQueryService.getUserOrThrow(10L)).isEqualTo(user);

        assertThatThrownBy(() -> userQueryService.getUserOrThrow(99L))
                .isInstanceOf(AppException.class);
    }

    @Test
    @DisplayName("Should find user by email or throw NotFound exception")
    void getUserByEmailOrThrow_Scenarios() {
        User user = User.builder().email("user@test.com").build();
        ReflectionTestUtils.setField(user, "id", 10L);

        when(userRepository.findByEmail("user@test.com")).thenReturn(Optional.of(user));
        when(userRepository.findByEmail("notfound@test.com")).thenReturn(Optional.empty());

        assertThat(userQueryService.getUserByEmailOrThrow("user@test.com")).isEqualTo(user);

        assertThatThrownBy(() -> userQueryService.getUserByEmailOrThrow("notfound@test.com"))
                .isInstanceOf(AppException.class);
    }
}
