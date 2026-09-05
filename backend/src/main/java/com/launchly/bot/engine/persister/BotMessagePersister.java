package com.launchly.bot.engine.persister;

import com.launchly.bot.engine.model.FlowNode;
import com.launchly.bot.entity.BotUser;
import com.launchly.crm.service.CrmService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class BotMessagePersister {

    private final CrmService crmService;

    @SuppressWarnings("unchecked")
    public void saveBotNodeMessage(Long botId, BotUser botUser, FlowNode node) {
        try {
            Map<String, Object> data = node.data();
            if (data == null) return;

            Object blocksObj = data.get("blocks");
            if (blocksObj instanceof List<?> blocks && !blocks.isEmpty()) {
                for (Object blockObj : blocks) {
                    if (blockObj instanceof Map<?, ?> block) {
                        String type = (String) block.get("type");
                        if ("text".equals(type) || "data_collection".equals(type)) {
                            StringBuilder text = new StringBuilder();
                            Object t = block.get("text");
                            if (t instanceof String s && !s.isBlank()) {
                                text.append(s);
                            }
                            Object btns = block.get("buttons");
                            if (btns instanceof List<?> btnList) {
                                for (Object btn : btnList) {
                                    if (btn instanceof Map<?, ?> b) {
                                        Object lbl = b.get("label");
                                        if (lbl instanceof String l) {
                                            text.append(" [").append(l).append("]");
                                        }
                                    }
                                }
                            }
                            if (text.length() > 0) {
                                crmService.saveBotMessage(botId, botUser.getId(), text.toString(), null, null);
                            }
                        } else if ("image".equals(type)) {
                            String imageUrl = (String) block.get("imageUrl");
                            if (imageUrl != null && !imageUrl.trim().isEmpty()) {
                                StringBuilder caption = new StringBuilder();
                                Object t = block.get("text");
                                if (t instanceof String s && !s.isBlank()) {
                                    caption.append(s);
                                } else {
                                    Object cap = block.get("caption");
                                    if (cap instanceof String c && !c.isBlank()) {
                                        caption.append(c);
                                    }
                                }
                                crmService.saveBotMessage(botId, botUser.getId(), caption.length() > 0 ? caption.toString() : "[Image]", imageUrl, "IMAGE");
                            }
                        } else if ("video".equals(type)) {
                            String videoUrl = (String) block.get("videoUrl");
                            if (videoUrl != null && !videoUrl.trim().isEmpty()) {
                                StringBuilder caption = new StringBuilder();
                                Object t = block.get("text");
                                if (t instanceof String s && !s.isBlank()) {
                                    caption.append(s);
                                } else {
                                    Object cap = block.get("caption");
                                    if (cap instanceof String c && !c.isBlank()) {
                                        caption.append(c);
                                    }
                                }
                                crmService.saveBotMessage(botId, botUser.getId(), caption.length() > 0 ? caption.toString() : "[Video]", videoUrl, "VIDEO");
                            }
                        } else if ("audio".equals(type)) {
                            String audioUrl = (String) block.get("audioUrl");
                            if (audioUrl != null && !audioUrl.trim().isEmpty()) {
                                StringBuilder caption = new StringBuilder();
                                Object t = block.get("text");
                                if (t instanceof String s && !s.isBlank()) {
                                    caption.append(s);
                                } else {
                                    Object cap = block.get("caption");
                                    if (cap instanceof String c && !c.isBlank()) {
                                        caption.append(c);
                                    }
                                }
                                crmService.saveBotMessage(botId, botUser.getId(), caption.length() > 0 ? caption.toString() : "[Audio]", audioUrl, "AUDIO");
                            }
                        } else if ("file".equals(type)) {
                            String fileUrl = (String) block.get("fileUrl");
                            if (fileUrl != null && !fileUrl.trim().isEmpty()) {
                                String fileName = (String) block.get("fileName");
                                StringBuilder caption = new StringBuilder();
                                if (fileName != null && !fileName.isBlank()) {
                                    caption.append(fileName);
                                }
                                Object t = block.get("text");
                                if (t instanceof String s && !s.isBlank()) {
                                    if (caption.length() > 0) caption.append(": ");
                                    caption.append(s);
                                }
                                crmService.saveBotMessage(botId, botUser.getId(), caption.length() > 0 ? caption.toString() : "[File]", fileUrl, "FILE");
                            }
                        }
                    }
                }
            } else {
                String text = (String) data.getOrDefault("text", "");
                String imageUrl = (String) data.get("imageUrl");
                List<?> buttonsList = (List<?>) data.get("buttons");

                StringBuilder content = new StringBuilder();
                if (text != null && !text.isBlank()) {
                    content.append(text);
                }
                if (buttonsList != null) {
                    for (Object btn : buttonsList) {
                        if (btn instanceof Map<?, ?> b) {
                            Object lbl = b.get("label");
                            if (lbl instanceof String l) {
                                content.append(" [").append(l).append("]");
                            }
                        }
                    }
                }

                if (imageUrl != null && !imageUrl.trim().isEmpty()) {
                    if (content.length() == 0) {
                        content.append("📷 Photo");
                    }
                    crmService.saveBotMessage(botId, botUser.getId(), content.toString(), imageUrl, "image");
                } else if (content.length() > 0) {
                    crmService.saveBotMessage(botId, botUser.getId(), content.toString(), null, null);
                }
            }
        } catch (Exception e) {
            log.error("Failed to save bot message in CRM for bot {}: {}", botId, e.getMessage(), e);
        }
    }
}
