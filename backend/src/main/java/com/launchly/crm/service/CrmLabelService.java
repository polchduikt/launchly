package com.launchly.crm.service;

import java.util.List;

public interface CrmLabelService {

    List<String> getLabels(Long userId);

    List<String> addLabel(String name, Long userId);

    List<String> deleteLabel(String name, Long userId);
}
