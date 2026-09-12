package com.launchly.bot.entity;

import com.launchly.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "flow_schemas")
@Getter
@Setter
@ToString(exclude = {"bot"})
@EqualsAndHashCode(callSuper = true, onlyExplicitlyIncluded = true)
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FlowSchema extends BaseEntity {

    @Column(name = "version", nullable = false)
    @Builder.Default
    private int version = 1;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb", nullable = false)
    @Builder.Default
    private String nodes = "[]";

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb", nullable = false)
    @Builder.Default
    private String edges = "[]";

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "published_nodes", columnDefinition = "jsonb")
    @Builder.Default
    private String publishedNodes = "[]";

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "published_edges", columnDefinition = "jsonb")
    @Builder.Default
    private String publishedEdges = "[]";

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bot_id", nullable = false, unique = true)
    private Bot bot;

    public String getEffectivePublishedNodes() {
        if (publishedNodes != null && !publishedNodes.isBlank() && !"[]".equals(publishedNodes.trim())) {
            return publishedNodes;
        }
        return nodes;
    }

    public String getEffectivePublishedEdges() {
        if (publishedEdges != null && !publishedEdges.isBlank() && !"[]".equals(publishedEdges.trim())) {
            return publishedEdges;
        }
        return edges;
    }
}
