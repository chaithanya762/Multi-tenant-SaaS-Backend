package com.example.multitenant;

import com.example.multitenant.context.TenantContext;
import com.example.multitenant.domain.Tenant;
import com.example.multitenant.repository.TenantRepository;
import com.example.multitenant.security.JwtTokenProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class SecurityIntegrationTest extends AbstractIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private TenantRepository tenantRepository;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    private String alphaToken;

    @BeforeEach
    void setUp() {
        tenantRepository.deleteAll();
        tenantRepository.save(new Tenant("tenant-alpha", "Alpha Corp", "ACTIVE"));
        tenantRepository.save(new Tenant("tenant-beta", "Beta LLC", "ACTIVE"));
        TenantContext.clear();
        
        alphaToken = jwtTokenProvider.generateToken("alpha-admin", "tenant-alpha", "ROLE_TENANT_ADMIN");
    }

    @Test
    @DisplayName("Verify GET /api/v1/products without auth returns 401")
    void testGetProductsWithoutAuthReturns401() throws Exception {
        mockMvc.perform(get("/api/v1/products")
                        .header("X-Tenant-ID", "tenant-alpha"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Verify GET /api/v1/orders without auth returns 401")
    void testGetOrdersWithoutAuthReturns401() throws Exception {
        mockMvc.perform(get("/api/v1/orders")
                        .header("X-Tenant-ID", "tenant-alpha"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Verify GET /api/v1/tenants without auth returns 200 (public endpoint)")
    void testGetTenantsWithoutAuthReturns200() throws Exception {
        mockMvc.perform(get("/api/v1/tenants"))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("Verify that a JWT for tenant-alpha with X-Tenant-ID: tenant-beta returns 403 or falls back to token tenant")
    void testTenantMismatchReturns403() throws Exception {
        mockMvc.perform(get("/api/v1/products")
                        .header("Authorization", "Bearer " + alphaToken)
                        .header("X-Tenant-ID", "tenant-beta"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Verify that a valid JWT for tenant-alpha can access tenant-alpha products")
    void testValidJwtCanAccessProducts() throws Exception {
        mockMvc.perform(get("/api/v1/products")
                        .header("Authorization", "Bearer " + alphaToken))
                .andExpect(status().isOk());
    }
}
