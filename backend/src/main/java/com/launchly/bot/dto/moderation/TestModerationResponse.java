package com.launchly.bot.dto.moderation;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TestModerationResponse {
    private boolean violated;
    private List<String> reasons;
    private String matchedStopWord;
}
