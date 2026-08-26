package com.launchly.common.utils;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class MaskingUtilTest {

    @Test
    void maskMessage_masksTelegramBotToken() {
        String input = "Connecting to bot with token 123456789:ABCdefGHIjklMNOpqrsTUVwxyz123456789 and botId 10";
        String result = MaskingUtil.maskMessage(input);

        assertThat(result).doesNotContain("ABCdefGHIjklMNOpqrsTUVwxyz");
        assertThat(result).contains("123456789:ABCd***6789");
    }

    @Test
    void maskMessage_masksJsonSensitiveFields() {
        String input = "Payload: {\"password\": \"secret123\", \"apiKey\": \"ak_live_xyz999\", \"email\": \"user@launchly.app\"}";
        String result = MaskingUtil.maskMessage(input);

        assertThat(result).contains("\"password\": \"******\"");
        assertThat(result).contains("\"apiKey\": \"******\"");
        assertThat(result).doesNotContain("secret123");
        assertThat(result).doesNotContain("ak_live_xyz999");
    }

    @Test
    void maskMessage_masksBearerJwtToken() {
        String input = "Header: Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U";
        String result = MaskingUtil.maskMessage(input);

        assertThat(result).isEqualTo("Header: Bearer [MASKED_JWT]");
        assertThat(result).doesNotContain("dozjgNryP4J3jVmNHl0w5N");
    }

    @Test
    void maskMessage_masksCreditCard() {
        String input = "Customer paid with card 4111 2222 3333 4444 on checkout";
        String result = MaskingUtil.maskMessage(input);

        assertThat(result).contains("4111-****-****-4444");
        assertThat(result).doesNotContain("2222 3333");
    }

    @Test
    void maskMessage_masksEmail() {
        String input = "Sending notification to user alexander@company.com";
        String result = MaskingUtil.maskMessage(input);

        assertThat(result).contains("al***@company.com");
    }

    @Test
    void maskEmail_variousFormats() {
        assertThat(MaskingUtil.maskEmail("john.doe@launchly.app")).isEqualTo("jo***@launchly.app");
        assertThat(MaskingUtil.maskEmail("a@b.com")).isEqualTo("a***@b.com");
        assertThat(MaskingUtil.maskEmail(null)).isNull();
    }

    @Test
    void maskPhone_variousFormats() {
        assertThat(MaskingUtil.maskPhone("+380501234567")).isEqualTo("+38****4567");
        assertThat(MaskingUtil.maskPhone(null)).isNull();
    }

    @Test
    void maskToken_variousFormats() {
        assertThat(MaskingUtil.maskToken("sk_live_1234567890abcdef")).isEqualTo("sk_l******cdef");
        assertThat(MaskingUtil.maskToken("short")).isEqualTo("******");
        assertThat(MaskingUtil.maskToken(null)).isEqualTo("******");
    }
}
