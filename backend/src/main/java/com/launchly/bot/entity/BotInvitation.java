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
@Table(name = "bot_invitations", indexes = {
    @Index(name = "idx_bot_invitations_bot_id", columnList = "bot_id"),
    @Index(name = "idx_bot_invitations_email", columnList = "email"),
    @Index(name = "idx_bot_invitations_email_accepted", columnList = "email, accepted")
})
@Getter
@Setter
@ToString(exclude = {"bot"})
@EqualsAndHashCode(callSuper = true, onlyExplicitlyIncluded = true)
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
