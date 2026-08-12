package com.example.multitenant.config;

import com.example.multitenant.context.TenantContext;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Before;
import org.aspectj.lang.annotation.Pointcut;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/**
 * Aspect that intercepts Spring transactional boundaries and Repository calls
 * to set the PostgreSQL session variable 'app.current_tenant_id' before executing SQL commands.
 * This activates PostgreSQL Row-Level Security (RLS) policies automatically per request.
 * Safely skips execution if running on a non-PostgreSQL driver (e.g. local H2 dev mode).
 */
@Aspect
@Component
public class TenantSessionAspect {

    private static final Logger log = LoggerFactory.getLogger(TenantSessionAspect.class);

    @PersistenceContext
    private EntityManager entityManager;

    private Boolean isPostgres = null;

    private boolean checkIsPostgres() {
        if (isPostgres == null) {
            try {
                org.hibernate.Session session = entityManager.unwrap(org.hibernate.Session.class);
                session.doWork(connection -> {
                    String productName = connection.getMetaData().getDatabaseProductName();
                    isPostgres = productName != null && productName.toLowerCase().contains("postgresql");
                });
            } catch (Exception e) {
                log.debug("Database vendor detection defaulted to non-Postgres: {}", e.getMessage());
                isPostgres = false;
            }
        }
        return Boolean.TRUE.equals(isPostgres);
    }

    @Pointcut("within(@org.springframework.stereotype.Repository *) || within(@org.springframework.stereotype.Service *)")
    public void serviceOrRepositoryMethods() {}

    @Before("serviceOrRepositoryMethods()")
    public void setTenantSessionVariable() {
        if (!checkIsPostgres()) {
            return;
        }

        String tenantId = TenantContext.getTenantId();
        String effectiveTenantId = (tenantId != null && !tenantId.isBlank()) ? tenantId.trim() : "";

        try {
            org.hibernate.Session session = entityManager.unwrap(org.hibernate.Session.class);
            session.doWork(connection -> {
                try (java.sql.PreparedStatement stmt = connection.prepareStatement("SET LOCAL app.current_tenant_id = ?")) {
                    stmt.setString(1, effectiveTenantId);
                    stmt.execute();
                } catch (Exception e) {
                    log.debug("Could not set session variable: {}", e.getMessage());
                }
            });
        } catch (Exception e) {
            log.debug("Session aspect failed: {}", e.getMessage());
        }
    }
}
