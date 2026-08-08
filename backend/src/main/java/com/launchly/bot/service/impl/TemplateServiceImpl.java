package com.launchly.bot.service.impl;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.launchly.auth.entity.User;
import com.launchly.auth.repository.UserRepository;
import com.launchly.bot.dto.request.CreateTemplateRequest;
import com.launchly.bot.dto.request.UpdateTemplateRequest;
import com.launchly.bot.dto.response.TemplateResponse;
import com.launchly.bot.entity.AccountTemplate;
import com.launchly.bot.entity.Bot;
import com.launchly.bot.entity.FlowSchema;
import com.launchly.bot.entity.InstalledTemplate;
import com.launchly.bot.repository.AccountTemplateRepository;
import com.launchly.bot.repository.BotMemberRepository;
import com.launchly.bot.repository.BotRepository;
import com.launchly.bot.repository.FlowSchemaRepository;
import com.launchly.bot.repository.InstalledTemplateRepository;
import com.launchly.bot.service.TemplateService;
import com.launchly.broadcast.entity.BroadcastCampaign;
import com.launchly.broadcast.entity.CampaignStatus;
import com.launchly.broadcast.entity.FilterType;
import com.launchly.broadcast.entity.Tag;
import com.launchly.broadcast.repository.BroadcastCampaignRepository;
import com.launchly.broadcast.repository.TagRepository;
import com.launchly.common.exception.AppException;
import com.launchly.common.utils.EncryptionUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class TemplateServiceImpl implements TemplateService {

    private final AccountTemplateRepository accountTemplateRepository;
    private final InstalledTemplateRepository installedTemplateRepository;
    private final BotRepository botRepository;
    private final BotMemberRepository botMemberRepository;
    private final FlowSchemaRepository flowSchemaRepository;
    private final UserRepository userRepository;
    private final BroadcastCampaignRepository broadcastCampaignRepository;
    private final TagRepository tagRepository;
    private final EncryptionUtil encryptionUtil;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${app.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    @Override
    @Transactional
    public TemplateResponse createTemplate(CreateTemplateRequest request, Long userId) {
        User creator = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "User not found"));

        Bot bot = null;
        String sourceBotName = "Автоматизація";
        String sourceBotDescription = "";
        String nodes = "[]";
        String edges = "[]";
        String customFieldsData = "{}";

        if (request.botId() != null) {
            bot = botRepository.findById(request.botId()).orElse(null);
            if (bot != null) {
                if (!bot.getUser().getId().equals(userId) && !botMemberRepository.existsByBotIdAndUserId(request.botId(), userId)) {
                    throw new AppException(HttpStatus.FORBIDDEN, "Access denied to source bot");
                }
                sourceBotName = bot.getName();
                sourceBotDescription = bot.getDescription() != null ? bot.getDescription() : "";
                customFieldsData = bot.getCustomFieldsData() != null ? bot.getCustomFieldsData() : "{}";
                Optional<FlowSchema> schemaOpt = flowSchemaRepository.findByBotId(bot.getId());
                nodes = schemaOpt.map(FlowSchema::getNodes).orElse("[]");
                edges = schemaOpt.map(FlowSchema::getEdges).orElse("[]");
            }
        }

        Map<String, Object> payload = new HashMap<>();
        payload.put("nodes", nodes);
        payload.put("edges", edges);
        payload.put("originalBotName", sourceBotName);
        payload.put("originalBotDescription", sourceBotDescription);

        String schemaJson;
        try {
            schemaJson = objectMapper.writeValueAsString(payload);
        } catch (Exception e) {
            schemaJson = "{\"nodes\":\"[]\",\"edges\":\"[]\"}";
        }

        List<String> flowIds = request.selectedFlowIds() != null ? request.selectedFlowIds() : Collections.emptyList();
        List<Long> broadcastIds = request.selectedBroadcastIds() != null ? request.selectedBroadcastIds() : Collections.emptyList();
        List<Long> tagIds = request.selectedTagIds() != null ? request.selectedTagIds() : Collections.emptyList();
        List<Long> fieldIds = request.selectedFieldIds() != null ? request.selectedFieldIds() : Collections.emptyList();

        String flowIdsJson = writeJson(flowIds);
        String broadcastIdsJson = writeJson(broadcastIds);
        String tagIdsJson = writeJson(tagIds);
        String fieldIdsJson = writeJson(fieldIds);
        List<Map<String, Object>> broadcastsList = new ArrayList<>();
        if (!broadcastIds.isEmpty()) {
            List<BroadcastCampaign> camps = broadcastCampaignRepository.findAllById(broadcastIds);
            for (BroadcastCampaign c : camps) {
                Map<String, Object> campMap = new HashMap<>();
                campMap.put("name", c.getName());
                campMap.put("message", c.getMessage());
                campMap.put("filterType", c.getFilterType() != null ? c.getFilterType().name() : "ALL");
                campMap.put("filterValue", c.getFilterValue());
                campMap.put("nodes", c.getNodes());
                campMap.put("edges", c.getEdges());
                broadcastsList.add(campMap);
            }
        }
        String broadcastsDataJson = writeJson(broadcastsList);

        List<String> tagNames = new ArrayList<>();
        if (!tagIds.isEmpty()) {
            List<Tag> tags = tagRepository.findAllById(tagIds);
            for (Tag t : tags) {
                if (t.getName() != null && !t.getName().isBlank()) {
                    tagNames.add(t.getName());
                }
            }
        }
        String tagsDataJson = writeJson(tagNames);

        String shareCode = "tpl_" + UUID.randomUUID().toString().replace("-", "").substring(0, 10);
        String name = (request.name() != null && !request.name().trim().isEmpty())
                ? request.name()
                : (bot != null ? "Шаблон " + bot.getName() : "Новий шаблон");

        AccountTemplate template = AccountTemplate.builder()
                .shareCode(shareCode)
                .name(name)
                .description(request.description() != null ? request.description() : "")
                .avatarUrl(request.avatarUrl())
                .isProtected(request.isProtected())
                .guideUrl(request.guideUrl())
                .videoUrl(request.videoUrl())
                .creator(creator)
                .sourceBot(bot)
                .sourceBotName(sourceBotName)
                .sourceBotDescription(sourceBotDescription)
                .schemaJson(schemaJson)
                .broadcastsDataJson(broadcastsDataJson)
                .tagsDataJson(tagsDataJson)
                .customFieldsDataJson(customFieldsData)
                .selectedFlowIdsJson(flowIdsJson)
                .selectedBroadcastIdsJson(broadcastIdsJson)
                .selectedTagIdsJson(tagIdsJson)
                .selectedFieldIdsJson(fieldIdsJson)
                .flowCount(flowIds.isEmpty() ? 1 : flowIds.size())
                .broadcastCount(broadcastsList.size())
                .tagCount(tagNames.size())
                .fieldCount(fieldIds.size())
                .build();

        template = accountTemplateRepository.save(template);

        return toTemplateResponse(template);
    }

    @Override
    @Transactional(readOnly = true)
    public TemplateResponse getTemplateByShareCode(String shareCode) {
        AccountTemplate template = accountTemplateRepository.findByShareCode(shareCode)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Template not found"));

        return toTemplateResponse(template);
    }

    @Override
    @Transactional
    public TemplateResponse updateTemplate(String shareCode, UpdateTemplateRequest request, Long userId) {
        AccountTemplate template = accountTemplateRepository.findByShareCode(shareCode)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Template not found"));

        if (!template.getCreator().getId().equals(userId)) {
            throw new AppException(HttpStatus.FORBIDDEN, "Only creator can update template");
        }

        if (request.name() != null) {
            template.setName(request.name());
        }
        if (request.description() != null) {
            template.setDescription(request.description());
        }
        if (request.avatarUrl() != null) {
            template.setAvatarUrl(request.avatarUrl());
        }
        template.setProtected(request.isProtected());
        if (request.guideUrl() != null) {
            template.setGuideUrl(request.guideUrl());
        }
        if (request.videoUrl() != null) {
            template.setVideoUrl(request.videoUrl());
        }

        if (request.selectedFlowIds() != null) {
            template.setSelectedFlowIdsJson(writeJson(request.selectedFlowIds()));
            template.setFlowCount(request.selectedFlowIds().size());
        }
        if (request.selectedBroadcastIds() != null) {
            template.setSelectedBroadcastIdsJson(writeJson(request.selectedBroadcastIds()));
            template.setBroadcastCount(request.selectedBroadcastIds().size());
        }
        if (request.selectedTagIds() != null) {
            template.setSelectedTagIdsJson(writeJson(request.selectedTagIds()));
            template.setTagCount(request.selectedTagIds().size());
        }
        if (request.selectedFieldIds() != null) {
            template.setSelectedFieldIdsJson(writeJson(request.selectedFieldIds()));
            template.setFieldCount(request.selectedFieldIds().size());
        }

        template = accountTemplateRepository.save(template);

        return toTemplateResponse(template);
    }

    @Override
    @Transactional
    public void installTemplate(String shareCode, Long targetBotId, Long userId) {
        AccountTemplate template = accountTemplateRepository.findByShareCode(shareCode)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Template not found"));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "User not found"));

        Bot targetBot = null;
        if (targetBotId != null) {
            Optional<Bot> botOpt = botRepository.findById(targetBotId);
            if (botOpt.isPresent() && (botOpt.get().getUser().getId().equals(userId) || botMemberRepository.existsByBotIdAndUserId(targetBotId, userId))) {
                targetBot = botOpt.get();
            }
        }

        String originalBotName = template.getSourceBotName();
        if (originalBotName == null || originalBotName.trim().isEmpty()) {
            originalBotName = template.getName();
        }
        String originalBotDesc = template.getSourceBotDescription() != null ? template.getSourceBotDescription() : template.getDescription();
        String customFields = template.getCustomFieldsDataJson() != null ? template.getCustomFieldsDataJson() : "{}";

        if (targetBot == null) {
            targetBot = Bot.builder()
                    .name(originalBotName)
                    .description(originalBotDesc)
                    .avatar(template.getAvatarUrl())
                    .templateName(template.getName())
                    .template(true)
                    .telegramToken(encryptionUtil.encrypt("0000000000:dummyTokenPlaceholderForNoBotConfig"))
                    .active(false)
                    .user(user)
                    .customFieldsData(customFields)
                    .build();
            targetBot = botRepository.save(targetBot);
        } else {
            targetBot.setTemplateName(template.getName());
            botRepository.save(targetBot);
        }

        try {
            Map<String, Object> payload = objectMapper.readValue(template.getSchemaJson(), new TypeReference<Map<String, Object>>() {});
            String nodes = (String) payload.getOrDefault("nodes", "[]");
            String edges = (String) payload.getOrDefault("edges", "[]");

            FlowSchema schema = flowSchemaRepository.findByBotId(targetBot.getId())
                    .orElse(FlowSchema.builder().bot(targetBot).build());
            schema.setNodes(nodes);
            schema.setEdges(edges);
            flowSchemaRepository.save(schema);
        } catch (Exception e) {
            log.error("Error applying template schema: {}", e.getMessage());
        }

        if (template.getBroadcastsDataJson() != null && !template.getBroadcastsDataJson().trim().isEmpty()) {
            try {
                List<Map<String, Object>> campsList = objectMapper.readValue(template.getBroadcastsDataJson(), new TypeReference<List<Map<String, Object>>>() {});
                for (Map<String, Object> cMap : campsList) {
                    String campName = (String) cMap.getOrDefault("name", "Campaign");
                    String campMsg = (String) cMap.getOrDefault("message", "");
                    String filterTypeStr = (String) cMap.getOrDefault("filterType", "ALL");
                    String filterVal = (String) cMap.get("filterValue");
                    String cNodes = (String) cMap.getOrDefault("nodes", "[]");
                    String cEdges = (String) cMap.getOrDefault("edges", "[]");

                    FilterType fType = FilterType.ALL;
                    try {
                        fType = FilterType.valueOf(filterTypeStr);
                    } catch (Exception ignored) {}

                    BroadcastCampaign newCamp = BroadcastCampaign.builder()
                            .name(campName)
                            .message(campMsg)
                            .status(CampaignStatus.DRAFT)
                            .filterType(fType)
                            .filterValue(filterVal)
                            .nodes(cNodes != null ? cNodes : "[]")
                            .edges(cEdges != null ? cEdges : "[]")
                            .scheduledAt(null)
                            .sentCount(0)
                            .targetAllBots(true)
                            .templateName(template.getName())
                            .bot(targetBot)
                            .build();
                    broadcastCampaignRepository.save(newCamp);
                }
            } catch (Exception e) {
                log.error("Error creating template broadcast campaigns: {}", e.getMessage());
            }
        }

        if (template.getTagsDataJson() != null && !template.getTagsDataJson().trim().isEmpty()) {
            try {
                List<String> tagNames = objectMapper.readValue(template.getTagsDataJson(), new TypeReference<List<String>>() {});
                for (String tName : tagNames) {
                    if (tName != null && !tName.isBlank() && tagRepository.findByBotIdAndName(targetBot.getId(), tName).isEmpty()) {
                        Tag newTag = Tag.builder()
                                .name(tName)
                                .bot(targetBot)
                                .build();
                        tagRepository.save(newTag);
                    }
                }
            } catch (Exception e) {
                log.error("Error creating template tags: {}", e.getMessage());
            }
        }

        boolean alreadyInstalled = installedTemplateRepository.existsByUserIdAndTemplateId(userId, template.getId());
        if (!alreadyInstalled) {
            InstalledTemplate installed = InstalledTemplate.builder()
                    .user(user)
                    .template(template)
                    .bot(targetBot)
                    .build();
            installedTemplateRepository.save(installed);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<TemplateResponse> getMyTemplates(Long userId) {
        return accountTemplateRepository.findAllByCreatorIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::toTemplateResponse)
                .toList();
    }

    @Override
    @Transactional
    public List<TemplateResponse> getInstalledTemplates(Long userId) {
        List<InstalledTemplate> installed = installedTemplateRepository.findAllByUserIdOrderByCreatedAtDesc(userId);
        return installed.stream()
                .map(it -> toTemplateResponse(it.getTemplate()))
                .toList();
    }

    @Override
    @Transactional
    public void deleteTemplate(String shareCode, Long userId) {
        AccountTemplate template = accountTemplateRepository.findByShareCode(shareCode)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Template not found"));

        if (!template.getCreator().getId().equals(userId)) {
            throw new AppException(HttpStatus.FORBIDDEN, "Only creator can delete template");
        }

        installedTemplateRepository.deleteAllByTemplateId(template.getId());
        accountTemplateRepository.delete(template);
    }

    @Override
    @Transactional
    public void deleteInstalledTemplate(String shareCode, Long userId) {
        installedTemplateRepository.deleteByUserIdAndTemplate_ShareCode(userId, shareCode);
    }

    private TemplateResponse toTemplateResponse(AccountTemplate t) {
        List<String> flowIds = readStringList(t.getSelectedFlowIdsJson());
        List<Long> broadcastIds = readLongList(t.getSelectedBroadcastIdsJson());
        List<Long> tagIds = readLongList(t.getSelectedTagIdsJson());
        List<Long> fieldIds = readLongList(t.getSelectedFieldIdsJson());

        String resolvedShareUrl = frontendUrl.replaceAll("/+$", "") + "/templates/install/" + t.getShareCode();
        String creatorName = (t.getCreator() != null && t.getCreator().getName() != null)
                ? t.getCreator().getName()
                : (t.getCreator() != null ? t.getCreator().getEmail() : "Launchly User");
        String sourceBotName = t.getSourceBotName() != null ? t.getSourceBotName() : (t.getSourceBot() != null ? t.getSourceBot().getName() : "Launchly Bot");
        String sourceBotDesc = t.getSourceBotDescription() != null ? t.getSourceBotDescription() : "";

        Long creatorId = t.getCreator() != null ? t.getCreator().getId() : null;

        return new TemplateResponse(
                t.getId(),
                t.getShareCode(),
                resolvedShareUrl,
                t.getName(),
                t.getDescription(),
                t.getAvatarUrl(),
                t.isProtected(),
                t.getGuideUrl(),
                t.getVideoUrl(),
                creatorId,
                creatorName,
                sourceBotName,
                sourceBotDesc,
                t.getFlowCount(),
                t.getBroadcastCount(),
                t.getTagCount(),
                t.getFieldCount(),
                flowIds,
                broadcastIds,
                tagIds,
                fieldIds,
                t.getBroadcastsDataJson(),
                t.getTagsDataJson(),
                t.getCustomFieldsDataJson(),
                t.getCreatedAt()
        );
    }

    private String writeJson(Object obj) {
        if (obj == null) return "[]";
        try {
            return objectMapper.writeValueAsString(obj);
        } catch (Exception e) {
            return "[]";
        }
    }

    private List<String> readStringList(String json) {
        if (json == null || json.trim().isEmpty()) return Collections.emptyList();
        try {
            return objectMapper.readValue(json, new TypeReference<List<String>>() {});
        } catch (Exception e) {
            return Collections.emptyList();
        }
    }

    private List<Long> readLongList(String json) {
        if (json == null || json.trim().isEmpty()) return Collections.emptyList();
        try {
            List<Object> raw = objectMapper.readValue(json, new TypeReference<List<Object>>() {});
            List<Long> result = new ArrayList<>();
            for (Object item : raw) {
                if (item instanceof Number n) {
                    result.add(n.longValue());
                } else if (item instanceof String s) {
                    try {
                        result.add(Long.parseLong(s.trim()));
                    } catch (NumberFormatException ignored) {}
                }
            }
            return result;
        } catch (Exception e) {
            return Collections.emptyList();
        }
    }
}
