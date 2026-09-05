package com.launchly.crm.service.impl;

import com.launchly.auth.entity.User;
import com.launchly.auth.repository.UserRepository;
import com.launchly.common.exception.AppException;
import com.launchly.crm.entity.CrmLabel;
import com.launchly.crm.repository.CrmLabelRepository;
import com.launchly.crm.service.CrmLabelService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CrmLabelServiceImpl implements CrmLabelService {

    private final CrmLabelRepository crmLabelRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public List<String> getLabels(Long userId) {
        return crmLabelRepository.findByUserId(userId).stream()
                .map(CrmLabel::getName)
                .toList();
    }

    @Override
    @Transactional
    public List<String> addLabel(String name, Long userId) {
        if (name != null && !name.isBlank()) {
            String trimmed = name.trim();
            if (crmLabelRepository.findByUserIdAndName(userId, trimmed).isEmpty()) {
                User user = userRepository.findById(userId)
                        .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "User not found"));
                crmLabelRepository.save(CrmLabel.builder()
                        .name(trimmed)
                        .user(user)
                        .build());
            }
        }
        return getLabels(userId);
    }

    @Override
    @Transactional
    public List<String> deleteLabel(String name, Long userId) {
        if (name != null && !name.isBlank()) {
            crmLabelRepository.deleteByUserIdAndName(userId, name.trim());
        }
        return getLabels(userId);
    }
}
