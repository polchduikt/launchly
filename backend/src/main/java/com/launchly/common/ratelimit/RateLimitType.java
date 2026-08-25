package com.launchly.common.ratelimit;

public enum RateLimitType {
    IP,
    USER,
    IP_OR_USER,
    EMAIL,
    BOT_USER,
    GLOBAL_TIER
}