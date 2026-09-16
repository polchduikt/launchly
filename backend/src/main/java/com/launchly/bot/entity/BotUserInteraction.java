package com.launchly.bot.entity;

import com.launchly.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
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
@Table(name = "bot_user_interactions", indexes = {
    @Index(name = "idx_bui_bot_src_type", columnList = "bot_id, source_telegram_id, interaction_type"),
    @Index(name = "idx_bui_bot_tgt_type", columnList = "bot_id, target_telegram_id, interaction_type"),
    @Index(name = "idx_bui_bot_src_tgt", columnList = "bot_id, source_telegram_id, target_telegram_id")
})
@Getter
@Setter
@ToString(exclude = {"bot"})
@EqualsAndHashCode(callSuper = true, onlyExplicitlyIncluded = true)
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BotUserInteraction extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bot_id", nullable = false)
    private Bot bot;

    @Column(name = "source_telegram_id", nullable = false)
    private Long sourceTelegramId;

    @Column(name = "target_telegram_id", nullable = false)
    private Long targetTelegramId;

    @Column(name = "interaction_type", nullable = false, length = 64)
    private String interactionType;
}
