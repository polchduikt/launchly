package com.launchly.auth.mapper;

import com.launchly.auth.dto.response.UserResponse;
import com.launchly.auth.entity.Provider;
import com.launchly.auth.entity.Role;
import com.launchly.auth.entity.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mapstruct.factory.Mappers;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.assertThat;

class AuthMapperTest {

    private AuthMapper authMapper;

    @BeforeEach
    void setUp() {
        authMapper = Mappers.getMapper(AuthMapper.class);
    }

    @Test
    @DisplayName("Should map User entity to UserResponse correctly")
    void toUserResponse_Success() {
        User user = User.builder()
                .name("Alex")
                .email("alex@launchly.pro")
                .password("encoded_pass")
                .role(Role.ROLE_OWNER)
                .provider(Provider.LOCAL)
                .build();
        ReflectionTestUtils.setField(user, "id", 1L);

        UserResponse response = authMapper.toUserResponse(user);

        assertThat(response).isNotNull();
        assertThat(response.id()).isEqualTo(1L);
        assertThat(response.name()).isEqualTo("Alex");
        assertThat(response.role()).isEqualTo("ROLE_OWNER");
        assertThat(response.provider()).isEqualTo("LOCAL");
        assertThat(response.hasPassword()).isTrue();
    }

    @Test
    @DisplayName("Should handle null password and OAuth provider correctly")
    void toUserResponse_WithoutPassword_ReturnsFalseHasPassword() {
        User user = User.builder()
                .name("Google User")
                .email("g@launchly.pro")
                .password(null)
                .role(Role.ROLE_ADMIN)
                .provider(Provider.GOOGLE)
                .build();

        UserResponse response = authMapper.toUserResponse(user);

        assertThat(response).isNotNull();
        assertThat(response.hasPassword()).isFalse();
        assertThat(response.provider()).isEqualTo("GOOGLE");
    }
}
