package com.launchly.analytics.entity;

import com.launchly.bot.entity.Bot;
import com.launchly.bot.entity.BotUser;
import com.launchly.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Index;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@Entity
@Table(name = "analytics_events", indexes = {
    @Index(name = "idx_analytics_events_bot", columnList = "bot_id"),
    @Index(name = "idx_analytics_events_bot_user", columnList = "bot_user_id"),
    @Index(name = "idx_analytics_events_type_created", columnList = "event_type, created_at"),
    @Index(name = "idx_analytics_bot_type_created", columnList = "bot_id, event_type, created_at DESC")
})
@Getter
@Setter
@ToString(exclude = {"bot", "botUser"})
@EqualsAndHashCode(callSuper = true, onlyExplicitlyIncluded = true)
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnalyticsEvent extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bot_id", nullable = false)
    private Bot bot;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bot_user_id", nullable = false)
    private BotUser botUser;

    @Enumerated(EnumType.STRING)
    @Column(name = "event_type", nullable = false, length = 50)
    private AnalyticsEventType eventType;

    @Column(name = "event_name", length = 255)
    private String eventName;
}
