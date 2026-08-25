package com.launchly.common.ratelimit;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;
import java.util.concurrent.TimeUnit;

@Target({ElementType.METHOD, ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
public @interface RateLimit {

    RateLimitType type() default RateLimitType.IP;

    long capacity() default 60;

    long duration() default 1;

    TimeUnit unit() default TimeUnit.MINUTES;

    String keyPrefix() default "";

    String messageKey() default "rate_limit.error.too_many_requests";
}