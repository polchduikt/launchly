package com.launchly.common.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;
import java.lang.annotation.*;

@Documented
@Constraint(validatedBy = TelegramTokenValidator.class)
@Target({ElementType.FIELD, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
public @interface ValidTelegramToken {
    String message() default "Invalid Telegram bot token format";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}
