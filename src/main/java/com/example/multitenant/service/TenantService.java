package com.example.multitenant.service;

import com.example.multitenant.domain.Tenant;
import com.example.multitenant.repository.TenantRepository;
import com.example.multitenant.web.dto.CreateTenantRequest;
import com.example.multitenant.web.exception.TenantNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class TenantService {

    private final TenantRepository tenantRepository;

    public TenantService(TenantRepository tenantRepository) {
        this.tenantRepository = tenantRepository;
    }

    @Transactional
    public Tenant createTenant(CreateTenantRequest request) {
        if (tenantRepository.existsById(request.getId())) {
            throw new IllegalArgumentException("Tenant with ID '" + request.getId() + "' already exists");
        }
        Tenant tenant = new Tenant(request.getId(), request.getName(), "ACTIVE");
        return tenantRepository.save(tenant);
    }

    @Transactional(readOnly = true)
    public List<Tenant> getAllTenants() {
        return tenantRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Tenant getTenantById(String id) {
        return tenantRepository.findById(id)
                .orElseThrow(() -> new TenantNotFoundException(id));
    }
}
