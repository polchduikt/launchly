package com.launchly.broadcast.service;

import com.launchly.bot.entity.BotUser;
import com.launchly.bot.repository.BotUserRepository;
import com.launchly.broadcast.entity.FilterType;
import com.launchly.broadcast.repository.BotUserTagRepository;
import com.launchly.crm.repository.LeadRepository;
import com.launchly.crm.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class BroadcastFilterService {

    private final BotUserRepository botUserRepository;
    private final BotUserTagRepository botUserTagRepository;
    private final OrderRepository orderRepository;
    private final LeadRepository leadRepository;

    public List<BotUser> filterUsers(Long botId, FilterType filterType, String filterValue) {
        return switch (filterType) {
            case ALL -> botUserRepository.findAllByBotId(botId);
            case BY_TAG -> filterByTag(botId, filterValue);
            case HAS_ORDERS -> filterByOrders(botId);
            case HAS_LEADS -> filterByLeads(botId);
        };
    }

    private List<BotUser> filterByTag(Long botId, String tagName) {
        List<Long> botUserIds = botUserTagRepository.findBotUserIdsByTagNameAndBotId(tagName, botId);
        if (botUserIds.isEmpty()) {
            return List.of();
        }
        return botUserRepository.findAllById(botUserIds);
    }

    private List<BotUser> filterByOrders(Long botId) {
        List<BotUser> allUsers = botUserRepository.findAllByBotId(botId);
        return allUsers.stream()
                .filter(user -> orderRepository.existsByBotUserIdAndBotId(user.getId(), botId))
                .toList();
    }

    private List<BotUser> filterByLeads(Long botId) {
        List<BotUser> allUsers = botUserRepository.findAllByBotId(botId);
        return allUsers.stream()
                .filter(user -> leadRepository.existsByBotUserIdAndBotId(user.getId(), botId))
                .toList();
    }
}
