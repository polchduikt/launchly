package com.launchly.bot.service.impl;

import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;
import com.launchly.auth.entity.User;
import com.launchly.auth.service.UserQueryService;
import com.launchly.bot.constant.BotConstants;
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
import com.launchly.common.utils.JsonUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
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
    private final UserQueryService userQueryService;
    private final BroadcastCampaignRepository broadcastCampaignRepository;
    private final TagRepository tagRepository;
    private final EncryptionUtil encryptionUtil;
    private final ObjectMapper objectMapper;

    @Value("${app.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    @Override
    @Transactional
    public TemplateResponse createTemplate(CreateTemplateRequest request, Long userId) {
        User creator = userQueryService.getUserOrThrow(userId);

        Bot bot = null;
        String sourceBotName = BotConstants.DEFAULT_AUTOMATION_NAME;
        String sourceBotDescription = "";
        String nodes = "[]";
        String edges = "[]";
        String customFieldsData = "{}";

        if (request.botId() != null) {
            bot = botRepository.findById(request.botId()).orElse(null);
            if (bot != null) {
                if (!bot.getUser().getId().equals(userId) && !botMemberRepository.existsByBotIdAndUserId(request.botId(), userId)) {
                    throw new AppException(HttpStatus.FORBIDDEN, "bot.error.access_denied");
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
            log.warn("Failed to serialize template flow schema: {}", e.getMessage());
            schemaJson = "{\"nodes\":\"[]\",\"edges\":\"[]\"}";
        }

        List<String> flowIds = request.selectedFlowIds() != null ? request.selectedFlowIds() : Collections.emptyList();
        List<Long> broadcastIds = request.selectedBroadcastIds() != null ? request.selectedBroadcastIds() : Collections.emptyList();
        List<Long> tagIds = request.selectedTagIds() != null ? request.selectedTagIds() : Collections.emptyList();
        List<Long> fieldIds = request.selectedFieldIds() != null ? request.selectedFieldIds() : Collections.emptyList();

        String flowIdsJson = JsonUtils.toJson(flowIds);
        String broadcastIdsJson = JsonUtils.toJson(broadcastIds);
        String tagIdsJson = JsonUtils.toJson(tagIds);
        String fieldIdsJson = JsonUtils.toJson(fieldIds);

        int resolvedFieldCount = 0;
        if (bot != null && bot.getCustomFieldsData() != null && !bot.getCustomFieldsData().trim().isEmpty() && !bot.getCustomFieldsData().trim().equals("{}")) {
            try {
                Map<String, Object> botFieldsMap = objectMapper.readValue(bot.getCustomFieldsData(), new TypeReference<Map<String, Object>>() {});
                List<Map<String, Object>> botFieldsList = botFieldsMap.containsKey("fields") && botFieldsMap.get("fields") instanceof List<?>
                        ? (List<Map<String, Object>>) botFieldsMap.get("fields")
                        : new ArrayList<>();

                if (fieldIds.isEmpty()) {
                    Map<String, Object> emptyMap = new HashMap<>();
                    emptyMap.put("fields", Collections.emptyList());
                    emptyMap.put("folders", Collections.emptyList());
                    emptyMap.put("archivedFields", Collections.emptyList());
                    customFieldsData = objectMapper.writeValueAsString(emptyMap);
                    resolvedFieldCount = 0;
                } else {
                    List<Map<String, Object>> selectedFieldsList = new ArrayList<>();
                    for (int i = 0; i < botFieldsList.size(); i++) {
                        if (fieldIds.contains((long) i)) {
                            selectedFieldsList.add(botFieldsList.get(i));
                        }
                    }
                    if (selectedFieldsList.isEmpty() && !botFieldsList.isEmpty()) {
                        selectedFieldsList.addAll(botFieldsList);
                    }
                    Map<String, Object> filteredMap = new HashMap<>(botFieldsMap);
                    filteredMap.put("fields", selectedFieldsList);
                    customFieldsData = objectMapper.writeValueAsString(filteredMap);
                    resolvedFieldCount = selectedFieldsList.size();
                }
            } catch (Exception e) {
                log.warn("Failed to filter custom fields data for template: {}", e.getMessage());
                customFieldsData = bot.getCustomFieldsData();
                resolvedFieldCount = fieldIds.size();
            }
        }

        List<Map<String, Object>> broadcastsList = new ArrayList<>();
        if (broadcastIds != null && !broadcastIds.isEmpty()) {
            List<BroadcastCampaign> camps = broadcastCampaignRepository.findAllById(broadcastIds);
            for (BroadcastCampaign c : camps) {
                if (c == null) continue;
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
        String broadcastsDataJson = JsonUtils.toJson(broadcastsList);

        List<String> tagNames = new ArrayList<>();
        if (tagIds != null && !tagIds.isEmpty()) {
            List<Tag> tags = tagRepository.findAllById(tagIds);
            for (Tag t : tags) {
                if (t != null && t.getName() != null && !t.getName().isBlank()) {
                    tagNames.add(t.getName());
                }
            }
        }
        String tagsDataJson = JsonUtils.toJson(tagNames);

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
                .flowCount(flowIds != null && !flowIds.isEmpty() ? flowIds.size() : 1)
                .broadcastCount(broadcastsList != null ? broadcastsList.size() : 0)
                .tagCount(tagNames != null ? tagNames.size() : 0)
                .fieldCount(resolvedFieldCount)
                .build();

        template = accountTemplateRepository.save(template);

        return toTemplateResponse(template);
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = "templates", key = "#shareCode")
    public TemplateResponse getTemplateByShareCode(String shareCode) {
        AccountTemplate template = accountTemplateRepository.findByShareCode(shareCode)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Template not found"));

        return toTemplateResponse(template);
    }

    @Override
    @Transactional
    public void trackTemplateView(String shareCode, Long viewerUserId) {
        AccountTemplate template = accountTemplateRepository.findByShareCode(shareCode).orElse(null);
        if (template == null) return;
        if (viewerUserId != null && template.getCreator() != null && template.getCreator().getId().equals(viewerUserId)) {
            return;
        }
        template.setViewsCount(template.getViewsCount() + 1);
        accountTemplateRepository.save(template);
    }

    @Override
    @Transactional
    @CacheEvict(value = "templates", key = "#shareCode")
    public TemplateResponse updateTemplate(String shareCode, UpdateTemplateRequest request, Long userId) {
        AccountTemplate template = accountTemplateRepository.findByShareCode(shareCode)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "common.error.not_found"));

        if (!template.getCreator().getId().equals(userId)) {
            throw new AppException(HttpStatus.FORBIDDEN, "bot.error.access_denied");
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
            template.setSelectedFlowIdsJson(JsonUtils.toJson(request.selectedFlowIds()));
            template.setFlowCount(request.selectedFlowIds().size());
        }
        if (request.selectedBroadcastIds() != null) {
            template.setSelectedBroadcastIdsJson(JsonUtils.toJson(request.selectedBroadcastIds()));
            template.setBroadcastCount(request.selectedBroadcastIds().size());
        }
        if (request.selectedTagIds() != null) {
            template.setSelectedTagIdsJson(JsonUtils.toJson(request.selectedTagIds()));
            template.setTagCount(request.selectedTagIds().size());
        }
        if (request.selectedFieldIds() != null) {
            template.setSelectedFieldIdsJson(JsonUtils.toJson(request.selectedFieldIds()));
            template.setFieldCount(request.selectedFieldIds().size());
        }

        template = accountTemplateRepository.save(template);

        return toTemplateResponse(template);
    }

    @Override
    @Transactional
    @Caching(evict = {
            @CacheEvict(value = "bots", key = "#userId"),
            @CacheEvict(value = "flow_schemas", allEntries = true)
    })
    public void installTemplate(String shareCode, Long targetBotId, Long userId) {
        AccountTemplate template = accountTemplateRepository.findByShareCode(shareCode)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Template not found"));
        User user = userQueryService.getUserOrThrow(userId);

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
                    .telegramToken(encryptionUtil.encrypt(BotConstants.DUMMY_TOKEN_PLACEHOLDER))
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
                    } catch (Exception e) {
                        log.warn("Invalid broadcast filterType '{}' in template {}, fallback to ALL", filterTypeStr, template.getId());
                    }


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

        if (template.getCustomFieldsDataJson() != null && !template.getCustomFieldsDataJson().trim().isEmpty() && !template.getCustomFieldsDataJson().trim().equals("{}")) {
            try {
                String existingBotFieldsJson = targetBot.getCustomFieldsData();
                Map<String, Object> targetData = (existingBotFieldsJson != null && !existingBotFieldsJson.trim().isEmpty() && !existingBotFieldsJson.trim().equals("{}"))
                        ? objectMapper.readValue(existingBotFieldsJson, new TypeReference<Map<String, Object>>() {})
                        : new HashMap<>();

                Map<String, Object> templateData = objectMapper.readValue(template.getCustomFieldsDataJson(), new TypeReference<Map<String, Object>>() {});

                List<Map<String, Object>> targetFieldsList = targetData.containsKey("fields") && targetData.get("fields") instanceof List<?>
                        ? new ArrayList<>((List<Map<String, Object>>) targetData.get("fields"))
                        : new ArrayList<>();

                List<Map<String, Object>> tplFieldsList = templateData.containsKey("fields") && templateData.get("fields") instanceof List<?>
                        ? (List<Map<String, Object>>) templateData.get("fields")
                        : new ArrayList<>();

                Set<String> existingNames = new HashSet<>();
                for (Map<String, Object> f : targetFieldsList) {
                    if (f.get("name") != null) {
                        existingNames.add(f.get("name").toString().trim().toLowerCase());
                    }
                }

                for (Map<String, Object> tf : tplFieldsList) {
                    if (tf.get("name") != null && !existingNames.contains(tf.get("name").toString().trim().toLowerCase())) {
                        targetFieldsList.add(tf);
                        existingNames.add(tf.get("name").toString().trim().toLowerCase());
                    }
                }

                targetData.put("fields", targetFieldsList);
                if (!targetData.containsKey("folders")) {
                    targetData.put("folders", templateData.getOrDefault("folders", Collections.emptyList()));
                }
                if (!targetData.containsKey("archivedFields")) {
                    targetData.put("archivedFields", Collections.emptyList());
                }

                targetBot.setCustomFieldsData(objectMapper.writeValueAsString(targetData));
                botRepository.save(targetBot);
            } catch (Exception e) {
                log.error("Error merging custom fields: {}", e.getMessage());
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
        template.setInstallsCount(template.getInstallsCount() + 1);
        accountTemplateRepository.save(template);
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
    @CacheEvict(value = "templates", key = "#shareCode")
    public void deleteTemplate(String shareCode, Long userId) {
        AccountTemplate template = accountTemplateRepository.findByShareCode(shareCode)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "common.error.not_found"));

        if (!template.getCreator().getId().equals(userId)) {
            throw new AppException(HttpStatus.FORBIDDEN, "bot.error.access_denied");
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
        String resolvedShareUrl = frontendUrl + "/templates/install/" + t.getShareCode();
        Long creatorId = t.getCreator() != null ? t.getCreator().getId() : null;
        String creatorName = t.getCreator() != null ? t.getCreator().getName() : "Користувач";

        String sourceBotName = t.getSourceBotName();
        String sourceBotDesc = t.getSourceBotDescription();
        List<String> flowIds = JsonUtils.readStringList(t.getSelectedFlowIdsJson());
        List<Long> broadcastIds = JsonUtils.readLongList(t.getSelectedBroadcastIdsJson());
        List<Long> tagIds = JsonUtils.readLongList(t.getSelectedTagIdsJson());
        List<Long> fieldIds = JsonUtils.readLongList(t.getSelectedFieldIdsJson());

        int automationNodeCount = 0;
        int automationEdgeCount = 0;
        if (t.getSchemaJson() != null && !t.getSchemaJson().trim().isEmpty()) {
            try {
                Map<String, Object> schema = objectMapper.readValue(t.getSchemaJson(), new TypeReference<Map<String, Object>>() {});
                automationNodeCount = JsonUtils.countElements(schema.get("nodes"));
                automationEdgeCount = JsonUtils.countElements(schema.get("edges"));
            } catch (Exception e) {
                log.warn("Failed to parse schemaJson for template {}: {}", t.getId(), e.getMessage());
            }
        }
        if (automationNodeCount == 0 && (t.getFlowCount() > 0 || (flowIds != null && !flowIds.isEmpty()))) {
            automationNodeCount = 1;
        }

        int broadcastNodeCount = 0;
        int broadcastEdgeCount = 0;
        if (t.getBroadcastsDataJson() != null && !t.getBroadcastsDataJson().trim().isEmpty()) {
            try {
                List<Map<String, Object>> camps = objectMapper.readValue(t.getBroadcastsDataJson(), new TypeReference<List<Map<String, Object>>>() {});
                for (Map<String, Object> c : camps) {
                    broadcastNodeCount += JsonUtils.countElements(c.get("nodes"));
                    broadcastEdgeCount += JsonUtils.countElements(c.get("edges"));
                }
            } catch (Exception e) {
                log.warn("Failed to parse broadcastsDataJson for template {}: {}", t.getId(), e.getMessage());
            }
        }

        int totalNodeCount = automationNodeCount + broadcastNodeCount;
        int totalEdgeCount = automationEdgeCount + broadcastEdgeCount;

        int fieldCount = t.getFieldCount();
        if (fieldCount == 0 && t.getCustomFieldsDataJson() != null && !t.getCustomFieldsDataJson().trim().isEmpty() && !t.getCustomFieldsDataJson().trim().equals("{}")) {
            try {
                Object parsed = objectMapper.readValue(t.getCustomFieldsDataJson(), Object.class);
                if (parsed instanceof Map<?, ?> m) {
                    if (m.containsKey("fields") && m.get("fields") instanceof List<?> fl) {
                        fieldCount = fl.size();
                    } else {
                        fieldCount = m.size();
                    }
                } else if (parsed instanceof List<?> l) {
                    fieldCount = l.size();
                }
            } catch (Exception e) {
                log.warn("Failed to parse customFieldsDataJson for template {}: {}", t.getId(), e.getMessage());
            }
        }

        int tagCount = t.getTagCount();
        if (tagCount == 0 && t.getTagsDataJson() != null && !t.getTagsDataJson().trim().isEmpty()) {
            try {
                List<?> list = objectMapper.readValue(t.getTagsDataJson(), List.class);
                tagCount = list.size();
            } catch (Exception e) {
                log.warn("Failed to parse tagsDataJson for template {}: {}", t.getId(), e.getMessage());
            }
        }


        int viewsCount = t.getViewsCount();
        int dbInstalls = (int) installedTemplateRepository.countByTemplateId(t.getId());
        int installsCount = Math.max(t.getInstallsCount(), dbInstalls);

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
                t.getFlowCount() > 0 ? t.getFlowCount() : (flowIds.isEmpty() ? 1 : flowIds.size()),
                t.getBroadcastCount(),
                tagCount,
                fieldCount,
                automationNodeCount,
                automationEdgeCount,
                broadcastNodeCount,
                broadcastEdgeCount,
                totalNodeCount,
                totalEdgeCount,
                viewsCount,
                installsCount,
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
}

