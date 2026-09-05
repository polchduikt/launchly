package com.launchly.support.service;

import com.launchly.support.dto.SupportAppealRequest;

public interface SupportAppealService {

    void submitAppeal(SupportAppealRequest request);
}
