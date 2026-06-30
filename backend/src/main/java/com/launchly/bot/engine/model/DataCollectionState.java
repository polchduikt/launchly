package com.launchly.bot.engine.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DataCollectionState {
    private String nodeId;
    private String blockId;
    private String replyType;
    private String saveToField;
    private int retryCount;
    private long expiresAt;
}
