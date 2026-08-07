package com.example.multitenant.service;

import com.example.multitenant.context.TenantContext;
import com.example.multitenant.domain.Order;
import com.example.multitenant.repository.OrderRepository;
import com.example.multitenant.repository.TenantRepository;
import com.example.multitenant.web.dto.CreateOrderRequest;
import com.example.multitenant.web.exception.ResourceNotFoundException;
import com.example.multitenant.web.exception.TenantNotFoundException;
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

    public OrderService(OrderRepository orderRepository, TenantRepository tenantRepository) {
        this.orderRepository = orderRepository;
        this.tenantRepository = tenantRepository;
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
}
