package com.launchly.bot.mapper;

import com.launchly.bot.dto.response.BotResponse;
import com.launchly.bot.dto.response.BotUserResponse;
import com.launchly.bot.entity.Bot;
import com.launchly.bot.entity.BotUser;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface BotMapper {

    @Mapping(target = "totalUsers", ignore = true)
    BotResponse toBotResponse(Bot bot);

    @Mapping(target = "tags", ignore = true)
    BotUserResponse toBotUserResponse(BotUser botUser);
}
