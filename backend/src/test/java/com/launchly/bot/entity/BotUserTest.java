package com.launchly.bot.entity;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class BotUserTest {

    @Test
    void getDisplayName_WithFirstAndLastName_ReturnsFullName() {
        BotUser user = BotUser.builder()
                .firstName("John")
                .lastName("Doe")
                .username("johndoe")
                .telegramId(123456L)
                .build();

        assertEquals("John Doe", user.getDisplayName());
    }

    @Test
    void getDisplayName_WithFirstNameOnly_ReturnsFirstName() {
        BotUser user = BotUser.builder()
                .firstName("Alice")
                .lastName(null)
                .username("alice_w")
                .telegramId(123456L)
                .build();

        assertEquals("Alice", user.getDisplayName());
    }

    @Test
    void getDisplayName_WithLastNameOnly_ReturnsLastName() {
        BotUser user = BotUser.builder()
                .firstName(null)
                .lastName("Smith")
                .username("smith")
                .telegramId(123456L)
                .build();

        assertEquals("Smith", user.getDisplayName());
    }

    @Test
    void getDisplayName_WithUsernameOnly_ReturnsUsernameWithAtPrefix() {
        BotUser user = BotUser.builder()
                .firstName("")
                .lastName("  ")
                .username("cooluser")
                .telegramId(123456L)
                .build();

        assertEquals("@cooluser", user.getDisplayName());
    }

    @Test
    void getDisplayName_WithUsernameAlreadyHavingAtPrefix_DoesNotDoubleAt() {
        BotUser user = BotUser.builder()
                .username("@cooluser")
                .telegramId(123456L)
                .build();

        assertEquals("@cooluser", user.getDisplayName());
    }

    @Test
    void getDisplayName_WithTelegramIdOnly_ReturnsUserWithTelegramId() {
        BotUser user = BotUser.builder()
                .telegramId(987654321L)
                .build();

        assertEquals("User 987654321", user.getDisplayName());
    }

    @Test
    void getDisplayName_WithAllEmpty_ReturnsUnknown() {
        BotUser user = BotUser.builder().build();

        assertEquals("Unknown", user.getDisplayName());
    }
}
