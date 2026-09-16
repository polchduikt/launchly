package com.launchly.support.service.impl;

import com.launchly.support.dto.SupportAppealRequest;
import com.launchly.support.service.SupportAppealService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class SupportAppealServiceImpl implements SupportAppealService {

    @Override
    public void submitAppeal(SupportAppealRequest request) {
        log.info("Processing public support appeal from email={}, name={}: {}", request.email(), request.name(), request.message());
    }
}
