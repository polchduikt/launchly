package com.launchly.admin.service;

import com.launchly.admin.dto.AdminBroadcastDetailDto;
import com.launchly.admin.dto.AdminBroadcastDto;
import com.launchly.admin.dto.AdminBlockRequest;
import org.springframework.data.domain.Page;

public interface AdminBroadcastService {
    Page<AdminBroadcastDto> getBroadcasts(String search, String status, String sort, int page, int size);
    AdminBroadcastDetailDto getBroadcastDetails(Long broadcastId, String period, int page, int size);
    void cancelBroadcast(Long broadcastId);
    void blockBroadcast(Long broadcastId, AdminBlockRequest request);
    void unblockBroadcast(Long broadcastId);
}
