package com.example.multitenant.service;

import com.example.multitenant.context.TenantContext;
import com.example.multitenant.domain.Product;
import com.example.multitenant.repository.ProductRepository;
import com.example.multitenant.repository.TenantRepository;
import com.example.multitenant.web.dto.CreateProductRequest;
import com.example.multitenant.web.dto.UpdateProductRequest;
import com.example.multitenant.web.exception.ResourceNotFoundException;
import com.example.multitenant.web.exception.TenantNotFoundException;
import com.example.multitenant.repository.SubscriptionPlanRepository;
import com.example.multitenant.web.exception.QuotaExceededException;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class ProductService {

    private final ProductRepository productRepository;
    private final TenantRepository tenantRepository;
    private final SubscriptionPlanRepository planRepository;

    public ProductService(ProductRepository productRepository, TenantRepository tenantRepository, SubscriptionPlanRepository planRepository) {
        this.productRepository = productRepository;
        this.tenantRepository = tenantRepository;
        this.planRepository = planRepository;
    }

    @Transactional
    @CacheEvict(value = "productsCache", allEntries = true)
    public Product createProduct(CreateProductRequest request) {
        String tenantId = TenantContext.getTenantId();
        if (tenantId == null || tenantId.isBlank()) {
            throw new IllegalStateException("Cannot create product: No active tenant context found in request headers");
        }

        if (!tenantRepository.existsById(tenantId)) {
            throw new TenantNotFoundException(tenantId);
        }

        tenantRepository.findById(tenantId).ifPresent(tenant -> {
            planRepository.findById(tenant.getPlanId()).ifPresent(plan -> {
                int maxProducts = plan.getMaxProducts();
                if (maxProducts != -1) {
                    long currentCount = productRepository.countByTenantId(tenantId);
                    if (currentCount >= maxProducts) {
                        throw new QuotaExceededException("Product", maxProducts);
                    }
                }
            });
        });

        String id = UUID.randomUUID().toString();
        Product product = new Product(
                id,
                request.getName(),
                request.getDescription(),
                request.getPrice(),
                request.getStockQuantity()
        );
        product.setTenantId(tenantId);
        return productRepository.save(product);
    }

    @Transactional(readOnly = true)
    public Page<Product> getAllProducts(Pageable pageable) {
        return productRepository.findAll(pageable);
    }

    @Transactional(readOnly = true)
    public List<Product> getAllProducts() {
        return productRepository.findAll();
    }

    @Transactional(readOnly = true)
    @Cacheable(value = "productsCache", key = "T(com.example.multitenant.context.TenantContext).getTenantId() + '-' + #id")
    public Product getProductById(String id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product", id));
    }

    @Transactional
    @CacheEvict(value = "productsCache", allEntries = true)
    public Product updateProduct(String id, UpdateProductRequest request) {
        Product product = getProductById(id);
        if (request.getName() != null) {
            product.setName(request.getName());
        }
        if (request.getDescription() != null) {
            product.setDescription(request.getDescription());
        }
        if (request.getPrice() != null) {
            product.setPrice(request.getPrice());
        }
        if (request.getStockQuantity() != null) {
            product.setStockQuantity(request.getStockQuantity());
        }
        return productRepository.save(product);
    }

    @Transactional
    @CacheEvict(value = "productsCache", allEntries = true)
    public void deleteProduct(String id) {
        Product product = getProductById(id);
        product.setDeletedAt(java.time.Instant.now());
        productRepository.save(product);
    }
}
