package com.example.multitenant.web.dto;

import jakarta.validation.constraints.NotBlank;

public class CreateTenantRequest {

    @NotBlank(message = "Tenant ID is required")
    private String id;

    @NotBlank(message = "Tenant name is required")
    private String name;

    public CreateTenantRequest() {}

    public CreateTenantRequest(String id, String name) {
        this.id = id;
        this.name = name;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
}
