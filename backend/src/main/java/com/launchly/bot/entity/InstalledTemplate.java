package com.launchly.bot.entity;

import com.launchly.auth.entity.User;
import com.launchly.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "installed_templates", indexes = {
    @Index(name = "idx_installed_templates_user_created", columnList = "user_id, created_at DESC"),
    @Index(name = "idx_installed_templates_bot", columnList = "bot_id")
})
@Data
@EqualsAndHashCode(callSuper = true)
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InstalledTemplate extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bot_id", nullable = true)
    private Bot bot;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "template_id", nullable = false)
    private AccountTemplate template;
}
