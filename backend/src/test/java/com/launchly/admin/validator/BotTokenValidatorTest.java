package com.launchly.admin.validator;

import com.launchly.bot.entity.Bot;
import com.launchly.common.utils.EncryptionUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class BotTokenValidatorTest {

    @Mock
    private EncryptionUtil encryptionUtil;

    @InjectMocks
    private BotTokenValidator validator;

    private Bot realBot;
    private Bot dummyBot;

    @BeforeEach
    void setUp() {
        realBot = Bot.builder().name("Real Assistant").telegramToken("enc_real").build();
        dummyBot = Bot.builder().name("Dummy Bot").telegramToken("enc_dummy").build();
    }

    @Test
    @DisplayName("Should return true for connected bot with real token")
    void isConnected_WhenRealToken_ReturnsTrue() {
        when(encryptionUtil.decrypt("enc_real")).thenReturn("123456789:ABCDefgh-real-token");

        boolean connected = validator.isConnected(realBot);

        assertThat(connected).isTrue();
    }

    @Test
    @DisplayName("Should return false for bot with dummy token or empty token")
    void isConnected_WhenDummyOrBlankToken_ReturnsFalse() {
        when(encryptionUtil.decrypt("enc_dummy"))
                .thenReturn("0000000000:dummyTokenPlaceholderForNoBotConfig");

        boolean dummyConnected = validator.isConnected(dummyBot);
        boolean nullConnected = validator.isConnected(null);
        boolean emptyConnected = validator.isConnected(Bot.builder().build());

        assertThat(dummyConnected).isFalse();
        assertThat(nullConnected).isFalse();
        assertThat(emptyConnected).isFalse();
    }

    @Test
    @DisplayName("Should resolve bot name or return dash placeholder")
    void resolveBotName_ReturnsNameOrDash() {
        when(encryptionUtil.decrypt("enc_real")).thenReturn("123456789:ABCDefgh-real-token");

        String name = validator.resolveBotName(realBot);
        String dash = validator.resolveBotName(dummyBot);

        assertThat(name).isEqualTo("Real Assistant");
        assertThat(dash).isEqualTo("—");
    }
}
