package com.launchly.chaos;

import io.github.resilience4j.retry.Retry;
import io.github.resilience4j.retry.RetryConfig;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.telegram.telegrambots.meta.api.methods.send.SendMessage;
import org.telegram.telegrambots.meta.exceptions.TelegramApiException;
import org.telegram.telegrambots.meta.generics.TelegramClient;
import java.time.Duration;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.function.Supplier;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class TelegramApiDegradationChaosTest {

    @Test
    @DisplayName("Chaos: Telegram 429 Flood Control with Retry-After should auto-retry and succeed")
    void telegram429_FloodControl_AutoRetriesAndSucceeds() throws Exception {
        TelegramClient mockClient = mock(TelegramClient.class);
        AtomicInteger attempts = new AtomicInteger(0);
        doAnswer(invocation -> {
            int attempt = attempts.incrementAndGet();
            if (attempt == 1) {
                throw new TelegramApiException("429 Too Many Requests: retry after 1 seconds");
            }
            return null;
        }).when(mockClient).execute(any(SendMessage.class));

        RetryConfig retryConfig = RetryConfig.custom()
                .maxAttempts(3)
                .waitDuration(Duration.ofMillis(20))
                .retryOnException(e -> e instanceof TelegramApiException || e.getCause() instanceof TelegramApiException)
                .build();

        Retry retry = Retry.of("telegramSendRetry", retryConfig);
        Supplier<Void> decoratedSend = Retry.decorateSupplier(retry, () -> {
            try {
                SendMessage msg = SendMessage.builder().chatId("123456").text("Hello!").build();
                mockClient.execute(msg);
                return null;
            } catch (TelegramApiException e) {
                throw new RuntimeException(e);
            }
        });

        decoratedSend.get();
        assertThat(attempts.get()).isEqualTo(2);
        verify(mockClient, times(2)).execute(any(SendMessage.class));
    }

    @Test
    @DisplayName("Chaos: Telegram 504 Gateway Timeout exhausting max retries should fail gracefully")
    void telegram504_GatewayTimeout_ExhaustsMaxRetriesGracefully() throws Exception {
        TelegramClient mockClient = mock(TelegramClient.class);
        AtomicInteger attempts = new AtomicInteger(0);

        doAnswer(invocation -> {
            attempts.incrementAndGet();
            throw new TelegramApiException("504 Gateway Timeout");
        }).when(mockClient).execute(any(SendMessage.class));

        RetryConfig retryConfig = RetryConfig.custom()
                .maxAttempts(3)
                .waitDuration(Duration.ofMillis(10))
                .retryOnException(e -> e instanceof TelegramApiException || e.getCause() instanceof TelegramApiException)
                .build();

        Retry retry = Retry.of("telegramTimeoutRetry", retryConfig);
        Supplier<Void> decoratedSend = Retry.decorateSupplier(retry, () -> {
            try {
                SendMessage msg = SendMessage.builder().chatId("123456").text("Urgent!").build();
                mockClient.execute(msg);
                return null;
            } catch (TelegramApiException e) {
                throw new RuntimeException(e);
            }
        });

        try {
            decoratedSend.get();
        } catch (Exception e) {
            assertThat(e.getCause()).isInstanceOf(TelegramApiException.class);
            assertThat(e.getCause().getMessage()).contains("504 Gateway Timeout");
        }
        assertThat(attempts.get()).isEqualTo(3);
    }
}
