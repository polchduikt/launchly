package com.launchly.integration.service;

import com.launchly.integration.entity.Integration;
import java.util.List;

public interface MailchimpService {
    void addOrUpdateSubscriber(Integration integration, String email, String firstName, String lastName, String phone, List<String> tags);
    void addOrUpdateSubscriber(String apiKey, String listId, String serverPrefix, String email, String firstName, String lastName, String phone, List<String> tags);
}
