package com.launchly.bot.entity;

import com.launchly.auth.entity.User;
import com.launchly.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "account_templates")
@Data
@EqualsAndHashCode(callSuper = true)
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AccountTemplate extends BaseEntity {

    @Column(name = "share_code", nullable = false, unique = true)
    private String shareCode;

    @Column(nullable = false)
    private String name;

    @Column(length = 2000)
    private String description;

    @Column(name = "is_protected", nullable = false)
    @Builder.Default
    private boolean isProtected = false;

    @Column(name = "guide_url", length = 1000)
    private String guideUrl;

    @Column(name = "video_url", length = 1000)
    private String videoUrl;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "creator_id", nullable = false)
    private User creator;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "source_bot_id", nullable = true)
    private Bot sourceBot;

    @Column(name = "source_bot_name", length = 500)
    private String sourceBotName;

    @Lob
    @Column(name = "source_bot_description", columnDefinition = "TEXT")
    private String sourceBotDescription;

    @Lob
    @Column(name = "schema_json", columnDefinition = "TEXT", nullable = false)
    private String schemaJson;

    @Lob
    @Column(name = "broadcasts_data_json", columnDefinition = "TEXT")
    private String broadcastsDataJson;

    @Lob
    @Column(name = "tags_data_json", columnDefinition = "TEXT")
    private String tagsDataJson;

    @Lob
    @Column(name = "custom_fields_data_json", columnDefinition = "TEXT")
    private String customFieldsDataJson;

    @Lob
    @Column(name = "selected_flow_ids_json", columnDefinition = "TEXT")
    private String selectedFlowIdsJson;

    @Lob
    @Column(name = "selected_tag_ids_json", columnDefinition = "TEXT")
    private String selectedTagIdsJson;

    @Lob
    @Column(name = "selected_field_ids_json", columnDefinition = "TEXT")
    private String selectedFieldIdsJson;

    @Lob
    @Column(name = "selected_broadcast_ids_json", columnDefinition = "TEXT")
    private String selectedBroadcastIdsJson;

    @Column(name = "flow_count")
    private int flowCount;

    @Column(name = "broadcast_count")
    private int broadcastCount;

    @Column(name = "tag_count")
    private int tagCount;

    @Column(name = "field_count")
    private int fieldCount;

    @Column(name = "views_count", columnDefinition = "integer default 0")
    @Builder.Default
    private int viewsCount = 0;

    @Column(name = "installs_count", columnDefinition = "integer default 0")
    @Builder.Default
    private int installsCount = 0;

    @Lob
    @Column(name = "avatar_url", columnDefinition = "TEXT")
    private String avatarUrl;
}
