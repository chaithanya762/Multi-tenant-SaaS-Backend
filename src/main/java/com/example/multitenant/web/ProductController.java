package com.example.multitenant.web;

import com.example.multitenant.domain.Product;
import com.example.multitenant.service.ProductService;
import com.example.multitenant.web.dto.CreateProductRequest;
import com.example.multitenant.web.dto.UpdateProductRequest;
import com.example.multitenant.web.dto.PagedResponse;
import com.example.multitenant.web.dto.ProductResponse;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;

@RestController
@RequestMapping("/api/v1/products")
public class ProductController {

    private final ProductService productService;

    public ProductController(ProductService productService) {
        this.productService = productService;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ROLE_TENANT_ADMIN', 'ROLE_SYS_ADMIN')")
    public ResponseEntity<ProductResponse> createProduct(@Valid @RequestBody CreateProductRequest request) {
        Product product = productService.createProduct(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ProductResponse.fromEntity(product));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ROLE_TENANT_ADMIN', 'ROLE_TENANT_USER', 'ROLE_SYS_ADMIN')")
    public ResponseEntity<PagedResponse<ProductResponse>> getAllProducts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<Product> productPage = productService.getAllProducts(
                PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt")));
        return ResponseEntity.ok(PagedResponse.from(productPage, ProductResponse::fromEntity));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ROLE_TENANT_ADMIN', 'ROLE_TENANT_USER', 'ROLE_SYS_ADMIN')")
    public ResponseEntity<ProductResponse> getProductById(@PathVariable String id) {
        Product product = productService.getProductById(id);
        return ResponseEntity.ok(ProductResponse.fromEntity(product));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ROLE_TENANT_ADMIN', 'ROLE_SYS_ADMIN')")
    public ResponseEntity<ProductResponse> updateProduct(@PathVariable String id, @Valid @RequestBody UpdateProductRequest request) {
        Product product = productService.updateProduct(id, request);
        return ResponseEntity.ok(ProductResponse.fromEntity(product));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ROLE_TENANT_ADMIN', 'ROLE_SYS_ADMIN')")
    public ResponseEntity<Void> deleteProduct(@PathVariable String id) {
        productService.deleteProduct(id);
        return ResponseEntity.noContent().build();
    }
}
