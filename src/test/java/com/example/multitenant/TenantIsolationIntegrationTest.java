package com.example.multitenant;

import com.example.multitenant.context.TenantContext;
import com.example.multitenant.domain.Tenant;
import com.example.multitenant.repository.TenantRepository;
import com.example.multitenant.web.dto.CreateOrderRequest;
import com.example.multitenant.web.dto.CreateProductRequest;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class TenantIsolationIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private TenantRepository tenantRepository;

    @Autowired
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        tenantRepository.deleteAll();
        tenantRepository.save(new Tenant("tenant-alpha", "Alpha Corp", "ACTIVE"));
        tenantRepository.save(new Tenant("tenant-beta", "Beta LLC", "ACTIVE"));
        TenantContext.clear();
    }

    @Test
    @DisplayName("Verify strict data isolation: Tenant Beta cannot see Tenant Alpha's products")
    void testTenantDataIsolation() throws Exception {
        // 1. Create Product for Tenant Alpha
        CreateProductRequest alphaProduct = new CreateProductRequest(
                "Alpha Server",
                "Dedicated server for Tenant Alpha",
                new BigDecimal("999.99"),
                10
        );

        mockMvc.perform(post("/api/v1/products")
                        .header("X-Tenant-ID", "tenant-alpha")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(alphaProduct)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name", is("Alpha Server")))
                .andExpect(jsonPath("$.tenantId", is("tenant-alpha")));

        // 2. Fetch products as Tenant Alpha -> Should return 1 product (paginated response)
        mockMvc.perform(get("/api/v1/products")
                        .header("X-Tenant-ID", "tenant-alpha"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].name", is("Alpha Server")));

        // 3. Fetch products as Tenant Beta -> Should return 0 products!
        mockMvc.perform(get("/api/v1/products")
                        .header("X-Tenant-ID", "tenant-beta"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(0)));

        // 4. Create Product for Tenant Beta
        CreateProductRequest betaProduct = new CreateProductRequest(
                "Beta Tablet",
                "Tablet for Tenant Beta",
                new BigDecimal("499.50"),
                50
        );

        mockMvc.perform(post("/api/v1/products")
                        .header("X-Tenant-ID", "tenant-beta")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(betaProduct)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name", is("Beta Tablet")))
                .andExpect(jsonPath("$.tenantId", is("tenant-beta")));

        // 5. Fetch products as Tenant Beta -> Should return only Beta's product
        mockMvc.perform(get("/api/v1/products")
                        .header("X-Tenant-ID", "tenant-beta"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].name", is("Beta Tablet")));

        // 6. Verify TenantContext ThreadLocal cleanup
        assertNull(TenantContext.getTenantId(), "TenantContext should be null after request completes");
    }

    @Test
    @DisplayName("Verify 400 Bad Request when X-Tenant-ID header is missing for product endpoints")
    void testMissingTenantHeaderReturns400() throws Exception {
        CreateProductRequest productRequest = new CreateProductRequest(
                "Orphan Product",
                "Product without tenant header",
                new BigDecimal("10.00"),
                1
        );

        mockMvc.perform(post("/api/v1/products")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(productRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status", is(400)))
                .andExpect(jsonPath("$.error", is("Bad Request")))
                .andExpect(jsonPath("$.message").exists());
    }

    @Test
    @DisplayName("Verify 400 Bad Request when X-Tenant-ID header is missing for order endpoints")
    void testMissingTenantHeaderForOrders() throws Exception {
        CreateOrderRequest orderRequest = new CreateOrderRequest(
                "test@example.com",
                new BigDecimal("50.00"),
                null
        );

        mockMvc.perform(post("/api/v1/orders")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(orderRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status", is(400)));
    }

    @Test
    @DisplayName("Verify Order data isolation between tenants")
    void testOrderTenantDataIsolation() throws Exception {
        // Create order for Tenant Alpha
        CreateOrderRequest alphaOrder = new CreateOrderRequest(
                "alpha@example.com",
                new BigDecimal("150.00"),
                "PENDING"
        );

        mockMvc.perform(post("/api/v1/orders")
                        .header("X-Tenant-ID", "tenant-alpha")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(alphaOrder)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.tenantId", is("tenant-alpha")))
                .andExpect(jsonPath("$.customerEmail", is("alpha@example.com")));

        // Tenant Beta should see 0 orders
        mockMvc.perform(get("/api/v1/orders")
                        .header("X-Tenant-ID", "tenant-beta"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(0)));

        // Tenant Alpha should see 1 order
        mockMvc.perform(get("/api/v1/orders")
                        .header("X-Tenant-ID", "tenant-alpha"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].customerEmail", is("alpha@example.com")));
    }

    @Test
    @DisplayName("Verify duplicate tenant creation returns 409 Conflict")
    void testDuplicateTenantReturns409() throws Exception {
        mockMvc.perform(post("/api/v1/tenants")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                new com.example.multitenant.web.dto.CreateTenantRequest("tenant-alpha", "Duplicate Alpha"))))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status", is(409)))
                .andExpect(jsonPath("$.error", is("Conflict")));
    }

    @Test
    @DisplayName("Verify validation errors return 422 with field details")
    void testValidationErrorsReturn422() throws Exception {
        // Empty product name should fail validation
        String invalidProduct = "{\"name\":\"\",\"price\":null,\"stockQuantity\":-1}";

        mockMvc.perform(post("/api/v1/products")
                        .header("X-Tenant-ID", "tenant-alpha")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(invalidProduct))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.status", is(422)))
                .andExpect(jsonPath("$.error", is("Validation Failed")))
                .andExpect(jsonPath("$.fieldErrors").exists());
    }
}
