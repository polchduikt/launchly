package com.launchly.bot.mapper;

import com.launchly.bot.dto.response.BotResponse;
import com.launchly.bot.dto.response.BotUserResponse;
import com.launchly.bot.entity.Bot;
import com.launchly.bot.entity.BotUser;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface BotMapper {

    BotResponse toBotResponse(Bot bot);

    BotUserResponse toBotUserResponse(BotUser botUser);
}
