package com.launchly.admin.service;

import com.launchly.admin.dto.AdminBroadcastDto;
import com.launchly.admin.dto.CreateBroadcastRequest;
import java.util.List;

public interface AdminBroadcastService {
    List<AdminBroadcastDto> getBroadcasts();
    AdminBroadcastDto createBroadcast(CreateBroadcastRequest request, String adminEmail);
}
