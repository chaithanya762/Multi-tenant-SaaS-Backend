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
            // Skip SET LOCAL session variable if not running on real PostgreSQL
            return;
        }

        String tenantId = TenantContext.getTenantId();
        if (tenantId != null && !tenantId.isBlank()) {
            log.trace("Executing PostgreSQL SET LOCAL app.current_tenant_id = '{}'", tenantId);
            entityManager.createNativeQuery("SET LOCAL app.current_tenant_id = :tenantId")
                         .setParameter("tenantId", tenantId)
                         .executeUpdate();
        } else {
            entityManager.createNativeQuery("SET LOCAL app.current_tenant_id = ''")
                         .executeUpdate();
        }
    }
}
