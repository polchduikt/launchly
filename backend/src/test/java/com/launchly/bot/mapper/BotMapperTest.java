package com.launchly.bot.mapper;

import com.launchly.bot.dto.response.BotResponse;
import com.launchly.bot.dto.response.BotUserResponse;
import com.launchly.bot.entity.Bot;
import com.launchly.bot.entity.BotUser;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mapstruct.factory.Mappers;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.assertThat;

class BotMapperTest {

    private BotMapper botMapper;

    @BeforeEach
    void setUp() {
        botMapper = Mappers.getMapper(BotMapper.class);
    }

    @Test
    @DisplayName("Should map Bot entity to BotResponse")
    void toBotResponse_Success() {
        Bot bot = Bot.builder()
                .name("Sales Bot")
                .description("Sales automation bot")
                .active(true)
                .build();
        ReflectionTestUtils.setField(bot, "id", 10L);

        BotResponse response = botMapper.toBotResponse(bot);

        assertThat(response).isNotNull();
        assertThat(response.id()).isEqualTo(10L);
        assertThat(response.name()).isEqualTo("Sales Bot");
        assertThat(response.active()).isTrue();
    }

    @Test
    @DisplayName("Should map BotUser entity to BotUserResponse")
    void toBotUserResponse_Success() {
        BotUser botUser = BotUser.builder()
                .telegramId(987654321L)
                .username("telegram_lead")
                .firstName("John")
                .lastName("Doe")
                .build();
        ReflectionTestUtils.setField(botUser, "id", 5L);

        BotUserResponse response = botMapper.toBotUserResponse(botUser);

        assertThat(response).isNotNull();
        assertThat(response.id()).isEqualTo(5L);
        assertThat(response.telegramId()).isEqualTo(987654321L);
        assertThat(response.username()).isEqualTo("telegram_lead");
    }
}
