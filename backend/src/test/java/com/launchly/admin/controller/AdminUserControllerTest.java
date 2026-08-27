package com.launchly.admin.controller;

import com.launchly.admin.dto.AdminBlockRequest;
import com.launchly.admin.dto.AdminUserDetailDto;
import com.launchly.admin.dto.AdminUserDto;
import com.launchly.admin.dto.UpdateUserRoleRequest;
import com.launchly.admin.service.AdminUserService;
import com.launchly.auth.entity.Role;
import com.launchly.common.exception.GlobalExceptionHandler;
import com.launchly.common.utils.MessageUtils;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.MethodParameter;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;
import tools.jackson.databind.ObjectMapper;

import java.util.Collections;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class AdminUserControllerTest {

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;

    @Mock
    private AdminUserService adminUserService;

    @Mock
    private MessageUtils messageUtils;

    @InjectMocks
    private AdminUserController adminUserController;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        UserDetails userDetails = new User("admin@launchly.pro", "password", Collections.emptyList());

        HandlerMethodArgumentResolver authResolver = new HandlerMethodArgumentResolver() {
            @Override
            public boolean supportsParameter(MethodParameter parameter) {
                return parameter.hasParameterAnnotation(AuthenticationPrincipal.class)
                        || UserDetails.class.isAssignableFrom(parameter.getParameterType());
            }

            @Override
            public Object resolveArgument(MethodParameter parameter, ModelAndViewContainer mavContainer,
                                          NativeWebRequest webRequest, WebDataBinderFactory binderFactory) {
                return userDetails;
            }
        };

        GlobalExceptionHandler exceptionHandler = new GlobalExceptionHandler(messageUtils);
        mockMvc = MockMvcBuilders.standaloneSetup(adminUserController)
                .setCustomArgumentResolvers(authResolver)
                .setControllerAdvice(exceptionHandler)
                .build();
    }

    @Test
    @DisplayName("GET /api/v1/admin/users - Should return users page")
    void getUsers_Success() throws Exception {
        Page<AdminUserDto> page = new PageImpl<>(List.of(new AdminUserDto()), PageRequest.of(0, 30), 1);
        when(adminUserService.getUsers(any(), any(), any(), eq("desc"), eq(0), eq(30))).thenReturn(page);

        mockMvc.perform(get("/api/v1/admin/users"))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("PATCH /api/v1/admin/users/{userId}/role - Should update user role")
    void updateUserRole_Success() throws Exception {
        UpdateUserRoleRequest request = new UpdateUserRoleRequest();
        request.setRole(Role.ROLE_ADMIN);
        AdminUserDto dto = new AdminUserDto();
        when(adminUserService.updateUserRole(eq(5L), eq(Role.ROLE_ADMIN), eq("admin@launchly.pro"))).thenReturn(dto);

        mockMvc.perform(patch("/api/v1/admin/users/5/role")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("GET /api/v1/admin/users/{userId} - Should return user details")
    void getUserDetails_Success() throws Exception {
        AdminUserDetailDto dto = new AdminUserDetailDto();
        when(adminUserService.getUserDetails(eq(5L), eq("all"), eq("all"), eq(0), eq(20))).thenReturn(dto);

        mockMvc.perform(get("/api/v1/admin/users/5"))
                .andExpect(status().isOk());
    }
}
