package com.launchly.admin.entity;

import com.launchly.admin.enums.AuditActionType;
import com.launchly.auth.entity.User;
import com.launchly.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "user_audit_logs", indexes = {
    @Index(name = "idx_user_audit_logs_user_date", columnList = "user_id, created_at")
})
@Data
@EqualsAndHashCode(callSuper = true)
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserAuditLog extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(name = "action_type", length = 50)
    private AuditActionType actionType;

    @Column(name = "target_id")
    private Long targetId;

    @Column(name = "target_name")
    private String targetName;

    @Column(name = "title", nullable = false)
    private String title;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "category", nullable = false, length = 50)
    private String category;

    @Column(name = "badge", nullable = false, length = 50)
    private String badge;
}
