package com.example.multitenant.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.parameters.Parameter;
import org.springdoc.core.customizers.OperationCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI multiTenantOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Multi-Tenant SaaS Backend API")
                        .description("REST API for a multi-tenant SaaS application with PostgreSQL Row-Level Security (RLS). " +
                                     "All tenant-scoped endpoints require the `X-Tenant-ID` header.")
                        .version("1.0.0")
                        .contact(new Contact()
                                .name("Chaithanya")
                                .url("https://github.com/chaithanya762/Multi-tenant-SaaS-Backend"))
                        .license(new License()
                                .name("MIT License")
                                .url("https://opensource.org/licenses/MIT")))
                .components(new io.swagger.v3.oas.models.Components()
                        .addSecuritySchemes("BearerAuth",
                                new io.swagger.v3.oas.models.security.SecurityScheme()
                                        .type(io.swagger.v3.oas.models.security.SecurityScheme.Type.HTTP)
                                        .scheme("bearer")
                                        .bearerFormat("JWT")
                                        .description("JWT access token from /api/v1/auth/login")))
                .addSecurityItem(new io.swagger.v3.oas.models.security.SecurityRequirement().addList("BearerAuth"));
    }

    /**
     * Adds X-Tenant-ID header parameter to all operations automatically.
     */
    @Bean
    public OperationCustomizer globalTenantHeaderCustomizer() {
        return (operation, handlerMethod) -> {
            Parameter tenantHeader = new Parameter()
                    .in("header")
                    .name("X-Tenant-ID")
                    .description("Tenant identifier (required for tenant-scoped endpoints)")
                    .required(false)
                    .schema(new io.swagger.v3.oas.models.media.StringSchema());
            operation.addParametersItem(tenantHeader);
            return operation;
        };
    }
}
