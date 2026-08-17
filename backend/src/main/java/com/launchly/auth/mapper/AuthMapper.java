package com.launchly.auth.mapper;

import com.launchly.auth.dto.response.UserResponse;
import com.launchly.auth.entity.User;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface AuthMapper {

    @Mapping(target = "role", expression = "java(user.getRole().name())")
    @Mapping(target = "provider", expression = "java(user.getProvider() != null ? user.getProvider().name() : \"LOCAL\")")
    @Mapping(target = "hasPassword", expression = "java(user.getPassword() != null && !user.getPassword().isBlank())")
    UserResponse toUserResponse(User user);
}
