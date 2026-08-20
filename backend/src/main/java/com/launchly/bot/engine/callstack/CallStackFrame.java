package com.launchly.bot.engine.callstack;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CallStackFrame {
    private Long executingBotId;
    private String returnNodeId;
    private Long campaignId;
}
