package com.example.multitenant.service;

import com.example.multitenant.context.TenantContext;
import com.example.multitenant.domain.Product;
import com.example.multitenant.repository.ProductRepository;
import com.example.multitenant.repository.TenantRepository;
import com.example.multitenant.web.dto.CreateProductRequest;
import com.example.multitenant.web.exception.ResourceNotFoundException;
import com.example.multitenant.web.exception.TenantNotFoundException;
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

    public ProductService(ProductRepository productRepository, TenantRepository tenantRepository) {
        this.productRepository = productRepository;
        this.tenantRepository = tenantRepository;
    }

    @Transactional
    public Product createProduct(CreateProductRequest request) {
        String tenantId = TenantContext.getTenantId();
        if (tenantId == null || tenantId.isBlank()) {
            throw new IllegalStateException("Cannot create product: No active tenant context found in request headers");
        }

        // Validate the tenant exists
        if (!tenantRepository.existsById(tenantId)) {
            throw new TenantNotFoundException(tenantId);
        }

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
    public Product getProductById(String id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product", id));
    }
}
