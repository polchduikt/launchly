package com.launchly.broadcast.service;

import com.launchly.broadcast.dto.request.CreateCampaignRequest;
import com.launchly.broadcast.dto.response.CampaignResponse;
import java.util.List;

public interface BroadcastService {

    CampaignResponse createCampaign(Long botId, Long userId, CreateCampaignRequest request);

    List<CampaignResponse> getCampaigns(Long botId, Long userId);

    void sendCampaign(Long campaignId);

    CampaignResponse sendNow(Long campaignId, Long userId);
}
