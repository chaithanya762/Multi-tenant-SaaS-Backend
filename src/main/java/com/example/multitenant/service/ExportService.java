package com.example.multitenant.service;

import com.example.multitenant.context.TenantContext;
import com.example.multitenant.domain.AuditLog;
import com.example.multitenant.domain.Order;
import com.example.multitenant.domain.Product;
import com.example.multitenant.repository.AuditLogRepository;
import com.example.multitenant.repository.OrderRepository;
import com.example.multitenant.repository.ProductRepository;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.util.List;

@Service
public class ExportService {

    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;
    private final AuditLogRepository auditLogRepository;

    public ExportService(ProductRepository productRepository,
                         OrderRepository orderRepository,
                         AuditLogRepository auditLogRepository) {
        this.productRepository = productRepository;
        this.orderRepository = orderRepository;
        this.auditLogRepository = auditLogRepository;
    }

    public byte[] exportProductsCsv() {
        List<Product> products = productRepository.findAll();
        StringBuilder sb = new StringBuilder();
        sb.append("ID,Name,Description,Price,Stock Quantity,Created At\n");
        for (Product p : products) {
            sb.append(escapeCsv(p.getId())).append(",")
              .append(escapeCsv(p.getName())).append(",")
              .append(escapeCsv(p.getDescription())).append(",")
              .append(p.getPrice() != null ? p.getPrice().toString() : "0.00").append(",")
              .append(p.getStockQuantity()).append(",")
              .append(p.getCreatedAt() != null ? p.getCreatedAt().toString() : "").append("\n");
        }
        return sb.toString().getBytes(StandardCharsets.UTF_8);
    }

    public byte[] exportOrdersCsv() {
        List<Order> orders = orderRepository.findAll();
        StringBuilder sb = new StringBuilder();
        sb.append("ID,Customer Email,Total Amount,Status,Created At\n");
        for (Order o : orders) {
            sb.append(escapeCsv(o.getId())).append(",")
              .append(escapeCsv(o.getCustomerEmail())).append(",")
              .append(o.getTotalAmount() != null ? o.getTotalAmount().toString() : "0.00").append(",")
              .append(escapeCsv(o.getStatus())).append(",")
              .append(o.getCreatedAt() != null ? o.getCreatedAt().toString() : "").append("\n");
        }
        return sb.toString().getBytes(StandardCharsets.UTF_8);
    }

    public byte[] exportAuditLogsCsv() {
        String tenantId = TenantContext.getTenantId();
        List<AuditLog> logs = auditLogRepository.findByTenantIdOrderByOccurredAtDesc(tenantId, org.springframework.data.domain.Pageable.unpaged()).getContent();
        StringBuilder sb = new StringBuilder();
        sb.append("ID,Action,Resource Type,Resource ID,Username,Occurred At\n");
        for (AuditLog log : logs) {
            sb.append(escapeCsv(log.getId())).append(",")
              .append(escapeCsv(log.getAction())).append(",")
              .append(escapeCsv(log.getResourceType())).append(",")
              .append(escapeCsv(log.getResourceId())).append(",")
              .append(escapeCsv(log.getUsername())).append(",")
              .append(log.getOccurredAt() != null ? log.getOccurredAt().toString() : "").append("\n");
        }
        return sb.toString().getBytes(StandardCharsets.UTF_8);
    }

    private String escapeCsv(String value) {
        if (value == null) return "";
        if (value.contains(",") || value.contains("\"") || value.contains("\n")) {
            return "\"" + value.replace("\"", "\"\"") + "\"";
        }
        return value;
    }
}
