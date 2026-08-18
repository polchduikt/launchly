package com.launchly.admin.mapper;

import com.launchly.admin.dto.AdminLogDto;
import com.launchly.admin.entity.UserAuditLog;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring")
public interface AdminLogMapper {

    @Mapping(target = "id", expression = "java(String.valueOf(log.getId()))")
    @Mapping(target = "level", expression = "java(log.getBadge() != null ? log.getBadge().toUpperCase() : \"INFO\")")
    @Mapping(target = "service", expression = "java(log.getCategory() != null ? log.getCategory().toUpperCase() : \"SYSTEM\")")
    @Mapping(target = "message", expression = "java(log.getTitle() + (log.getDescription() != null && !log.getDescription().isBlank() ? \" - \" + log.getDescription() : \"\"))")
    @Mapping(target = "userEmail", expression = "java(log.getUser() != null ? log.getUser().getEmail() : \"system\")")
    @Mapping(target = "timestamp", expression = "java(log.getCreatedAt() != null ? log.getCreatedAt() : java.time.LocalDateTime.now())")
    AdminLogDto toDto(UserAuditLog log);

    List<AdminLogDto> toDtoList(List<UserAuditLog> logs);
}
