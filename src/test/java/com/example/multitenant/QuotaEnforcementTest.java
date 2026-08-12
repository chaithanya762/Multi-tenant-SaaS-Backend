package com.example.multitenant;

import com.example.multitenant.context.TenantContext;
import com.example.multitenant.domain.Tenant;
import com.example.multitenant.repository.TenantRepository;
import com.example.multitenant.security.JwtTokenProvider;
import com.example.multitenant.web.dto.CreateProductRequest;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class QuotaEnforcementTest extends AbstractIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private TenantRepository tenantRepository;

    @Autowired
    private com.example.multitenant.repository.SubscriptionPlanRepository planRepository;

    @Autowired
    private com.example.multitenant.repository.ProductRepository productRepository;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private ObjectMapper objectMapper;

    private String freeToken;
    private String enterpriseToken;

    @BeforeEach
    void setUp() {
        productRepository.deleteAll();
        tenantRepository.deleteAll();
        planRepository.deleteAll();

        planRepository.save(new com.example.multitenant.domain.SubscriptionPlan(
                "plan-free", "Free Plan", 10, 100, 3, 60, "[]", java.math.BigDecimal.ZERO
        ));
        planRepository.save(new com.example.multitenant.domain.SubscriptionPlan(
                "plan-enterprise", "Enterprise Plan", -1, -1, -1, 10000, "[]", new java.math.BigDecimal("499.00")
        ));

        Tenant freeTenant = new Tenant("tenant-free", "Free Corp", "ACTIVE");
        freeTenant.setPlanId("plan-free");
        tenantRepository.save(freeTenant);

        Tenant enterpriseTenant = new Tenant("tenant-enterprise", "Enterprise LLC", "ACTIVE");
        enterpriseTenant.setPlanId("plan-enterprise");
        tenantRepository.save(enterpriseTenant);

        TenantContext.clear();

        freeToken = jwtTokenProvider.generateToken("free-admin", "tenant-free", "ROLE_TENANT_ADMIN");
        enterpriseToken = jwtTokenProvider.generateToken("enterprise-admin", "tenant-enterprise", "ROLE_TENANT_ADMIN");
    }

    @Test
    @DisplayName("Verify FREE plan quota enforcement (max 10 products)")
    void testFreePlanQuotaEnforcement() throws Exception {
        // Create 10 products
        for (int i = 0; i < 10; i++) {
            CreateProductRequest product = new CreateProductRequest(
                    "Free Product " + i,
                    "Description " + i,
                    new BigDecimal("10.00"),
                    100
            );
            
            mockMvc.perform(post("/api/v1/products")
                            .header("Authorization", "Bearer " + freeToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(product)))
                    .andExpect(status().isCreated());
        }

        // 11th product should return 429 Too Many Requests
        CreateProductRequest extraProduct = new CreateProductRequest(
                "Extra Product",
                "Should fail",
                new BigDecimal("10.00"),
                100
        );
        
        mockMvc.perform(post("/api/v1/products")
                        .header("Authorization", "Bearer " + freeToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(extraProduct)))
                .andExpect(status().isTooManyRequests());
    }

    @Test
    @DisplayName("Verify ENTERPRISE plan has unlimited quota")
    void testEnterprisePlanUnlimitedQuota() throws Exception {
        // Create 15 products (above the FREE limit)
        for (int i = 0; i < 15; i++) {
            CreateProductRequest product = new CreateProductRequest(
                    "Enterprise Product " + i,
                    "Description " + i,
                    new BigDecimal("99.99"),
                    100
            );
            
            mockMvc.perform(post("/api/v1/products")
                            .header("Authorization", "Bearer " + enterpriseToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(product)))
                    .andExpect(status().isCreated());
        }
    }
}
