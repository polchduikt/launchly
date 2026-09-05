package com.launchly.common.security.turnstile;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "cloudflare.turnstile")
@Getter
@Setter
public class TurnstileProperties {
    private boolean enabled;
    private String secretKey;
    private String verifyUrl;
}
