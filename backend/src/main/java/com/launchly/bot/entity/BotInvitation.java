package com.launchly.bot.entity;

import com.launchly.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "bot_invitations")
@Data
@EqualsAndHashCode(callSuper = true)
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BotInvitation extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bot_id", nullable = false)
    private Bot bot;

    @Column(nullable = false)
    private String email;

    @Column(nullable = false)
    private String role;

    @Column(name = "inbox_seat", nullable = false)
    private boolean inboxSeat;

    @Column(name = "billing_permission", nullable = false)
    private boolean billingPermission;

    @Column(nullable = false)
    private boolean accepted;
}
