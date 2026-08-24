package com.launchly.common.utils;

import com.launchly.common.exception.AppException;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import javax.crypto.Cipher;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.ByteBuffer;
import java.security.SecureRandom;
import java.util.Base64;

@Slf4j
@Component
public class EncryptionUtil {

    private static final String ALGORITHM = "AES/GCM/NoPadding";
    private static final int GCM_IV_LENGTH = 12;
    private static final int GCM_TAG_LENGTH = 128;
    private static final int AES_128_KEY_SIZE = 16;
    private static final int AES_192_KEY_SIZE = 24;
    private static final int AES_256_KEY_SIZE = 32;

    private final SecureRandom secureRandom = new SecureRandom();

    @Value("${app.encryption.key}")
    private String encodedKey;

    private SecretKey secretKey;

    @PostConstruct
    void init() {
        byte[] keyBytes = Base64.getDecoder().decode(encodedKey);
        byte[] finalKey;
        if (keyBytes.length == AES_128_KEY_SIZE || keyBytes.length == AES_192_KEY_SIZE || keyBytes.length == AES_256_KEY_SIZE) {
            finalKey = keyBytes;
        } else {
            finalKey = new byte[AES_256_KEY_SIZE];
            System.arraycopy(keyBytes, 0, finalKey, 0, Math.min(keyBytes.length, AES_256_KEY_SIZE));
        }
        this.secretKey = new SecretKeySpec(finalKey, "AES");
    }

    public String encrypt(String plaintext) {
        if (plaintext == null || plaintext.isBlank()) {
            return "";
        }
        try {
            byte[] iv = new byte[GCM_IV_LENGTH];
            secureRandom.nextBytes(iv);

            Cipher cipher = Cipher.getInstance(ALGORITHM);
            cipher.init(Cipher.ENCRYPT_MODE, secretKey, new GCMParameterSpec(GCM_TAG_LENGTH, iv));

            byte[] encrypted = cipher.doFinal(plaintext.getBytes());

            ByteBuffer buffer = ByteBuffer.allocate(iv.length + encrypted.length);
            buffer.put(iv);
            buffer.put(encrypted);

            return Base64.getEncoder().encodeToString(buffer.array());
        } catch (Exception e) {
            throw new AppException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to encrypt data");
        }
    }

    public String decrypt(String ciphertext) {
        if (ciphertext == null || ciphertext.isBlank()) {
            return "";
        }
        try {
            byte[] decoded = Base64.getDecoder().decode(ciphertext);
            if (decoded.length < GCM_IV_LENGTH) {
                return ciphertext;
            }

            ByteBuffer buffer = ByteBuffer.wrap(decoded);
            byte[] iv = new byte[GCM_IV_LENGTH];
            buffer.get(iv);
            byte[] encrypted = new byte[buffer.remaining()];
            buffer.get(encrypted);

            Cipher cipher = Cipher.getInstance(ALGORITHM);
            cipher.init(Cipher.DECRYPT_MODE, secretKey, new GCMParameterSpec(GCM_TAG_LENGTH, iv));

            return new String(cipher.doFinal(encrypted));
        } catch (Exception e) {
            log.debug("Ciphertext could not be decrypted with AES/GCM, returning raw string: {}", e.getMessage());
            return ciphertext;
        }
    }
}
