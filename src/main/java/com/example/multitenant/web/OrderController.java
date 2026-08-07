package com.example.multitenant.web;

import com.example.multitenant.domain.Order;
import com.example.multitenant.service.OrderService;
import com.example.multitenant.web.dto.CreateOrderRequest;
import com.example.multitenant.web.dto.OrderResponse;
import com.example.multitenant.web.dto.PagedResponse;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/orders")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @PostMapping
    public ResponseEntity<OrderResponse> createOrder(@Valid @RequestBody CreateOrderRequest request) {
        Order order = orderService.createOrder(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(OrderResponse.fromEntity(order));
    }

    @GetMapping
    public ResponseEntity<PagedResponse<OrderResponse>> getAllOrders(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<Order> orderPage = orderService.getAllOrders(
                PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt")));
        return ResponseEntity.ok(PagedResponse.from(orderPage, OrderResponse::fromEntity));
    }

    @GetMapping("/{id}")
    public ResponseEntity<OrderResponse> getOrderById(@PathVariable String id) {
        Order order = orderService.getOrderById(id);
        return ResponseEntity.ok(OrderResponse.fromEntity(order));
    }

    @GetMapping(params = "email")
    public ResponseEntity<List<OrderResponse>> getOrdersByEmail(@RequestParam String email) {
        List<OrderResponse> orders = orderService.getOrdersByEmail(email).stream()
                .map(OrderResponse::fromEntity)
                .toList();
        return ResponseEntity.ok(orders);
    }
}
