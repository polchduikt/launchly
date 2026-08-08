package com.launchly.bot.service;

import com.launchly.bot.dto.request.CreateTemplateRequest;
import com.launchly.bot.dto.request.UpdateTemplateRequest;
import com.launchly.bot.dto.response.TemplateResponse;
import java.util.List;

public interface TemplateService {
    TemplateResponse createTemplate(CreateTemplateRequest request, Long userId);
    TemplateResponse getTemplateByShareCode(String shareCode);
    TemplateResponse updateTemplate(String shareCode, UpdateTemplateRequest request, Long userId);
    void installTemplate(String shareCode, Long targetBotId, Long userId);
    List<TemplateResponse> getMyTemplates(Long userId);
    List<TemplateResponse> getInstalledTemplates(Long userId);
    void deleteTemplate(String shareCode, Long userId);
    void deleteInstalledTemplate(String shareCode, Long userId);
}
