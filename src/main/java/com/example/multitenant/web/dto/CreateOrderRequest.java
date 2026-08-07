package com.example.multitenant.web.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public class CreateOrderRequest {

    @NotBlank(message = "Customer email is required")
    @Email(message = "Customer email must be a valid email address")
    private String customerEmail;

    @NotNull(message = "Total amount is required")
    @DecimalMin(value = "0.01", message = "Total amount must be greater than 0")
    private BigDecimal totalAmount;

    private String status;

    public CreateOrderRequest() {}

    public CreateOrderRequest(String customerEmail, BigDecimal totalAmount, String status) {
        this.customerEmail = customerEmail;
        this.totalAmount = totalAmount;
        this.status = status;
    }

    public String getCustomerEmail() { return customerEmail; }
    public void setCustomerEmail(String customerEmail) { this.customerEmail = customerEmail; }

    public BigDecimal getTotalAmount() { return totalAmount; }
    public void setTotalAmount(BigDecimal totalAmount) { this.totalAmount = totalAmount; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
