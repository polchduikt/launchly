package com.launchly.broadcast.util;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class BroadcastUtilsTest {

    @Test
    @DisplayName("Should extract first MESSAGE text connected to START_BROADCAST")
    void extractFirstMessageText_WhenValidFlow_ReturnsText() {
        String nodes = "[{\"id\":\"start_1\",\"type\":\"START_BROADCAST\"},{\"id\":\"msg_1\",\"type\":\"MESSAGE\",\"data\":{\"text\":\"Hello Subscribers!\"}}]";
        String edges = "[{\"source\":\"start_1\",\"target\":\"msg_1\"}]";

        String text = BroadcastUtils.extractFirstMessageText(nodes, edges, "Default fallback");

        assertThat(text).isEqualTo("Hello Subscribers!");
    }

    @Test
    @DisplayName("Should return default fallback text when nodes is null or empty")
    void extractFirstMessageText_WhenEmpty_ReturnsDefault() {
        assertThat(BroadcastUtils.extractFirstMessageText(null, null, "Fallback")).isEqualTo("Fallback");
        assertThat(BroadcastUtils.extractFirstMessageText("[]", "[]", "Fallback")).isEqualTo("Fallback");
    }

    @Test
    @DisplayName("Should return default fallback text when no MESSAGE node is connected")
    void extractFirstMessageText_WhenNoConnectedNode_ReturnsDefault() {
        String nodes = "[{\"id\":\"start_1\",\"type\":\"START_BROADCAST\"}]";
        String edges = "[]";

        String text = BroadcastUtils.extractFirstMessageText(nodes, edges, "Fallback");

        assertThat(text).isEqualTo("Fallback");
    }
}
