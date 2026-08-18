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
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.math.BigDecimal;

@Entity
@Table(name = "orders", indexes = {
    @Index(name = "idx_orders_bot_id", columnList = "bot_id"),
    @Index(name = "idx_orders_bot_user_id", columnList = "bot_user_id"),
    @Index(name = "idx_orders_status", columnList = "status"),
    @Index(name = "idx_orders_created_at", columnList = "created_at DESC"),
    @Index(name = "idx_orders_bot_status", columnList = "bot_id, status")
})
@Data
@EqualsAndHashCode(callSuper = true)
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Order extends BaseEntity {

    @Column(name = "order_number", nullable = false, unique = true)
    private String orderNumber;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private OrderStatus status = OrderStatus.NEW;

    @Column(name = "total_amount", precision = 12, scale = 2)
    private BigDecimal totalAmount;

    @Column(length = 10)
    @Builder.Default
    private String currency = "UAH";

    @Column(columnDefinition = "TEXT")
    private String notes;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private String items;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bot_id", nullable = false)
    private Bot bot;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bot_user_id", nullable = false)
    private BotUser botUser;

    public void changeStatus(OrderStatus newStatus) {
        if (newStatus == null) {
            throw new IllegalArgumentException("Order status cannot be null");
        }
        this.status = newStatus;
    }

    public void updateAmount(BigDecimal newAmount) {
        if (newAmount != null && newAmount.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Order amount cannot be negative");
        }
        this.totalAmount = newAmount;
    }

    public void addNote(String note) {
        if (note != null && !note.isBlank()) {
            this.notes = (this.notes == null || this.notes.isBlank()) ? note.trim() : this.notes + "\n" + note.trim();
        }
    }
}

