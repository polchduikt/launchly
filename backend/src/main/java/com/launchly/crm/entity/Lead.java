package com.launchly.crm.entity;

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
import jakarta.persistence.Version;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "leads", indexes = {
    @Index(name = "idx_leads_bot_id", columnList = "bot_id"),
    @Index(name = "idx_leads_bot_user_id", columnList = "bot_user_id"),
    @Index(name = "idx_leads_status", columnList = "status"),
    @Index(name = "idx_leads_created_at", columnList = "created_at DESC"),
    @Index(name = "idx_leads_bot_created", columnList = "bot_id, created_at DESC"),
    @Index(name = "idx_leads_bot_user_bot", columnList = "bot_user_id, bot_id")
})
@Getter
@Setter
@ToString(exclude = {"bot", "botUser"})
@EqualsAndHashCode(callSuper = true, onlyExplicitlyIncluded = true)
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Lead extends BaseEntity {

    @Version
    private Long version;

    private String name;

    private String email;

    @Column(length = 50)
    private String phone;

    @Column(length = 50)
    @Builder.Default
    private String source = "TELEGRAM";

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private LeadStatus status = LeadStatus.NEW;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private String data;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bot_id", nullable = false)
    private Bot bot;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bot_user_id", nullable = false)
    private BotUser botUser;


    public void changeStatus(LeadStatus newStatus) {
        if (newStatus == null) {
            throw new IllegalArgumentException("Lead status cannot be null");
        }
        this.status = newStatus;
    }

    public void updateContact(String name, String email, String phone) {
        if (name != null && !name.isBlank()) {
            this.name = name.trim();
        }
        if (email != null && !email.isBlank()) {
            this.email = email.trim();
        }
        if (phone != null && !phone.isBlank()) {
            this.phone = phone.trim();
        }
    }

    public void addNote(String note) {
        if (note != null && !note.isBlank()) {
            this.notes = (this.notes == null || this.notes.isBlank()) ? note.trim() : this.notes + "\n" + note.trim();
        }
    }
}

