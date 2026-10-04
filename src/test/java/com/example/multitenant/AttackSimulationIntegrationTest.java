package com.example.multitenant;

import com.example.multitenant.context.TenantContext;
import com.example.multitenant.domain.Product;
import com.example.multitenant.domain.Tenant;
import com.example.multitenant.repository.ProductRepository;
import com.example.multitenant.repository.TenantRepository;
import com.example.multitenant.security.JwtTokenProvider;
import com.example.multitenant.web.AttackSimulationController;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class AttackSimulationIntegrationTest extends AbstractIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private TenantRepository tenantRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    private String alphaToken;

    @BeforeEach
    void setUp() {
        productRepository.deleteAll();
        tenantRepository.deleteAll();

        tenantRepository.save(new Tenant("tenant-alpha", "Alpha Corp", "ACTIVE"));
        tenantRepository.save(new Tenant("tenant-beta", "Beta LLC", "ACTIVE"));

        // Pre-seed victim product under tenant-beta
        TenantContext.setTenantId("tenant-beta");
        Product victim = new Product(
                AttackSimulationController.TARGET_VICTIM_PRODUCT_ID,
                "Confidential Financial Ledger",
                "Sensitive proprietary data belonging to tenant-beta",
                new BigDecimal("9999.99"),
                1
        );
        victim.setTenantId("tenant-beta");
        productRepository.save(victim);

        TenantContext.clear();
        alphaToken = jwtTokenProvider.generateToken("alpha-admin", "tenant-alpha", "ROLE_TENANT_ADMIN");
    }

    @Test
    @DisplayName("Simulate IDOR attack: Verify 0 records leaked across tenants")
    void testIdorAttackSimulation() throws Exception {
        mockMvc.perform(post("/api/v1/security/simulate/idor")
                        .header("Authorization", "Bearer " + alphaToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.defenseStatus").value("BLOCKED_SUCCESSFULLY"))
                .andExpect(jsonPath("$.recordsLeaked").value(0))
                .andExpect(jsonPath("$.attackType").value("INSECURE_DIRECT_OBJECT_REFERENCE (IDOR)"))
                .andExpect(jsonPath("$.attackerTenant").value("tenant-alpha"))
                .andExpect(jsonPath("$.targetTenant").value("tenant-beta"));
    }

    @Test
    @DisplayName("Simulate Header Spoofing: Verify privilege escalation is rejected")
    void testHeaderSpoofingSimulation() throws Exception {
        mockMvc.perform(post("/api/v1/security/simulate/header-spoof")
                        .header("Authorization", "Bearer " + alphaToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.defenseStatus").value("BLOCKED_SUCCESSFULLY"))
                .andExpect(jsonPath("$.attackType").value("TENANT_HEADER_SPOOFING / PRIVILEGE_ESCALATION"));
    }

    @Test
    @DisplayName("Simulate Cross-Tenant Write: Verify data poisoning is blocked")
    void testCrossTenantWriteSimulation() throws Exception {
        mockMvc.perform(post("/api/v1/security/simulate/cross-tenant-write")
                        .header("Authorization", "Bearer " + alphaToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.defenseStatus").value("BLOCKED_SUCCESSFULLY"))
                .andExpect(jsonPath("$.recordsLeaked").value(0))
                .andExpect(jsonPath("$.attackType").value("CROSS_TENANT_DATA_POISONING"));
    }
}
