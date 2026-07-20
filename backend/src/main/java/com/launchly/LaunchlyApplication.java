package com.launchly;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.PropertySource;

@SpringBootApplication
@PropertySource(value = "classpath:application-secrets.properties", ignoreResourceNotFound = true)
public class LaunchlyApplication {

    public static void main(String[] args) {
        SpringApplication.run(LaunchlyApplication.class, args);
    }

}
