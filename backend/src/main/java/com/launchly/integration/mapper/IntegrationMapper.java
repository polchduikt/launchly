package com.launchly.integration.mapper;

import tools.jackson.core.JacksonException;
import tools.jackson.databind.ObjectMapper;
import com.launchly.integration.dto.response.IntegrationResponse;
import com.launchly.integration.entity.Integration;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;
import org.springframework.beans.factory.annotation.Autowired;
import java.util.List;

@Mapper(componentModel = "spring")
public abstract class IntegrationMapper {

    protected ObjectMapper objectMapper;

    @Autowired
    public void setObjectMapper(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Mapping(target = "botId", source = "bot.id")
    @Mapping(target = "config", source = "config", qualifiedByName = "jsonStringToObject")
    public abstract IntegrationResponse toResponse(Integration integration);

    public abstract List<IntegrationResponse> toResponseList(List<Integration> integrations);

    @Named("jsonStringToObject")
    protected Object jsonStringToObject(String configStr) {
        if (configStr == null || configStr.isEmpty()) {
            return null;
        }
        try {
            return objectMapper.readTree(configStr);
        } catch (JacksonException e) {
            return configStr;
        }
    }
}
