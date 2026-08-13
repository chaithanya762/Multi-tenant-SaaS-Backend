package com.example.multitenant.service;

import com.example.multitenant.context.TenantContext;
import com.example.multitenant.domain.Order;
import com.example.multitenant.repository.OrderRepository;
import com.example.multitenant.repository.TenantRepository;
import com.example.multitenant.web.dto.CreateOrderRequest;
import com.example.multitenant.web.exception.ResourceNotFoundException;
import com.example.multitenant.web.exception.TenantNotFoundException;
import com.example.multitenant.repository.SubscriptionPlanRepository;
import com.example.multitenant.web.exception.QuotaExceededException;
import java.time.YearMonth;
import java.time.ZoneOffset;
import java.time.Instant;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class OrderService {

    private final OrderRepository orderRepository;
    private final TenantRepository tenantRepository;
    private final SubscriptionPlanRepository planRepository;

    public OrderService(OrderRepository orderRepository, TenantRepository tenantRepository, SubscriptionPlanRepository planRepository) {
        this.orderRepository = orderRepository;
        this.tenantRepository = tenantRepository;
        this.planRepository = planRepository;
    }

    @Transactional
    public Order createOrder(CreateOrderRequest request) {
        String tenantId = TenantContext.getTenantId();
        if (tenantId == null || tenantId.isBlank()) {
            throw new IllegalStateException("Cannot create order: No active tenant context found in request headers");
        }

        // Validate the tenant exists
        if (!tenantRepository.existsById(tenantId)) {
            throw new TenantNotFoundException(tenantId);
        }

        tenantRepository.findById(tenantId).ifPresent(tenant -> {
            planRepository.findById(tenant.getPlanId()).ifPresent(plan -> {
                int maxOrders = plan.getMaxOrdersPerMonth();
                if (maxOrders != -1) {
                    Instant startOfMonth = YearMonth.now(ZoneOffset.UTC).atDay(1).atStartOfDay(ZoneOffset.UTC).toInstant();
                    long currentCount = orderRepository.countByTenantIdAndCreatedAtAfter(tenantId, startOfMonth);
                    if (currentCount >= maxOrders) {
                        throw new QuotaExceededException("Order", maxOrders);
                    }
                }
            });
        });

        String id = UUID.randomUUID().toString();
        String status = (request.getStatus() != null && !request.getStatus().isBlank())
                ? request.getStatus()
                : "PENDING";

        Order order = new Order(id, request.getCustomerEmail(), request.getTotalAmount(), status);
        order.setTenantId(tenantId);
        return orderRepository.save(order);
    }

    @Transactional(readOnly = true)
    public Page<Order> getAllOrders(Pageable pageable) {
        return orderRepository.findAll(pageable);
    }

    @Transactional(readOnly = true)
    public List<Order> getAllOrders() {
        return orderRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Order getOrderById(String id) {
        return orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order", id));
    }

    @Transactional(readOnly = true)
    public List<Order> getOrdersByEmail(String email) {
        return orderRepository.findByCustomerEmail(email);
    }

    @Transactional
    public Order updateOrderStatus(String id, String newStatus) {
        Order order = getOrderById(id);
        String currentStatus = order.getStatus();

        if ("DELIVERED".equals(currentStatus) || "CANCELLED".equals(currentStatus)) {
            throw new IllegalArgumentException("Cannot transition from terminal status " + currentStatus);
        }

        if ("PENDING".equals(currentStatus) && !("PROCESSING".equals(newStatus) || "CANCELLED".equals(newStatus))) {
            throw new IllegalArgumentException("Invalid transition from PENDING to " + newStatus);
        }

        if ("PROCESSING".equals(currentStatus) && !("SHIPPED".equals(newStatus) || "CANCELLED".equals(newStatus))) {
            throw new IllegalArgumentException("Invalid transition from PROCESSING to " + newStatus);
        }

        if ("SHIPPED".equals(currentStatus) && !("DELIVERED".equals(newStatus))) {
            throw new IllegalArgumentException("Invalid transition from SHIPPED to " + newStatus);
        }

        order.setStatus(newStatus);
        return orderRepository.save(order);
    }
}
