package com.launchly.bot.dto.moderation;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TestModerationRequest {
    private String text;
    private boolean forwarded;
    private boolean hasMedia;
}
