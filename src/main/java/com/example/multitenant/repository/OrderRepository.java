package com.example.multitenant.repository;

import com.example.multitenant.domain.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrderRepository extends JpaRepository<Order, String> {
    List<Order> findByCustomerEmail(String customerEmail);
    long countByTenantIdAndCreatedAtAfter(String tenantId, java.time.Instant after);
}
