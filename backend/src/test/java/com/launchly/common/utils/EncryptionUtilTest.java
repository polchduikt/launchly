package com.launchly.common.utils;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.security.SecureRandom;
import java.util.Base64;

import static org.assertj.core.api.Assertions.assertThat;

class EncryptionUtilTest {

    private EncryptionUtil encryptionUtil;

    @BeforeEach
    void setUp() {
        encryptionUtil = new EncryptionUtil();
        byte[] rawKey = new byte[32];
        new SecureRandom().nextBytes(rawKey);
        String encodedKey = Base64.getEncoder().encodeToString(rawKey);

        ReflectionTestUtils.setField(encryptionUtil, "encodedKey", encodedKey);
        ReflectionTestUtils.invokeMethod(encryptionUtil, "init");
    }

    @Test
    @DisplayName("Should successfully encrypt and decrypt text")
    void encryptAndDecrypt_Success() {
        String originalText = "123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ";

        String encrypted = encryptionUtil.encrypt(originalText);
        assertThat(encrypted).isNotNull().isNotEqualTo(originalText);

        String decrypted = encryptionUtil.decrypt(encrypted);
        assertThat(decrypted).isEqualTo(originalText);
    }

    @Test
    @DisplayName("Should return empty string when encrypting null or blank text")
    void encrypt_WhenNullOrBlank_ReturnsEmptyString() {
        assertThat(encryptionUtil.encrypt(null)).isEmpty();
        assertThat(encryptionUtil.encrypt("")).isEmpty();
        assertThat(encryptionUtil.encrypt("   ")).isEmpty();
    }

    @Test
    @DisplayName("Should return empty string when decrypting null or blank text")
    void decrypt_WhenNullOrBlank_ReturnsEmptyString() {
        assertThat(encryptionUtil.decrypt(null)).isEmpty();
        assertThat(encryptionUtil.decrypt("")).isEmpty();
        assertThat(encryptionUtil.decrypt("   ")).isEmpty();
    }

    @Test
    @DisplayName("Should return original string when ciphertext is not a valid AES/GCM payload")
    void decrypt_WhenInvalidCiphertext_ReturnsOriginal() {
        String invalidCiphertext = "plain_unencrypted_text";
        String result = encryptionUtil.decrypt(invalidCiphertext);
        assertThat(result).isEqualTo(invalidCiphertext);
    }

}
