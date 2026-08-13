package com.example.multitenant.web.dto;

import com.example.multitenant.domain.Order;

import java.math.BigDecimal;
import java.time.Instant;

public class OrderResponse {

    private String id;
    private String tenantId;
    private String customerEmail;
    private BigDecimal totalAmount;
    private String status;
    private Instant createdAt;
    private Instant updatedAt;

    public OrderResponse() {}

    public static OrderResponse fromEntity(Order order) {
        OrderResponse dto = new OrderResponse();
        dto.id = order.getId();
        dto.tenantId = order.getTenantId();
        dto.customerEmail = order.getCustomerEmail();
        dto.totalAmount = order.getTotalAmount();
        dto.status = order.getStatus();
        dto.createdAt = order.getCreatedAt();
        dto.updatedAt = order.getUpdatedAt();
        return dto;
    }

    public String getId() { return id; }
    public String getTenantId() { return tenantId; }
    public String getCustomerEmail() { return customerEmail; }
    public BigDecimal getTotalAmount() { return totalAmount; }
    public String getStatus() { return status; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
