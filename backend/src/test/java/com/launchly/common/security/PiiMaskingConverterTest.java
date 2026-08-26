package com.launchly.common.security;

import ch.qos.logback.classic.spi.ILoggingEvent;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PiiMaskingConverterTest {

    @Mock
    private ILoggingEvent loggingEvent;

    private PiiMaskingConverter converter;

    @BeforeEach
    void setUp() {
        converter = new PiiMaskingConverter();
    }

    @Test
    void convert_masksSensitivePayloadInLoggingEvent() {
        when(loggingEvent.getFormattedMessage()).thenReturn("User login attempt with password: {\"password\": \"SecretPass999!\"}");

        String result = converter.convert(loggingEvent);

        assertThat(result).contains("\"password\": \"******\"");
        assertThat(result).doesNotContain("SecretPass999!");
    }

    @Test
    void convert_handlesNullGracefully() {
        String result = converter.convert(null);
        assertThat(result).isEmpty();
    }
}
