package com.example.multitenant;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.DockerClientFactory;
import org.testcontainers.containers.PostgreSQLContainer;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public abstract class AbstractIntegrationTest {

    private static final Logger log = LoggerFactory.getLogger(AbstractIntegrationTest.class);
    static PostgreSQLContainer<?> postgres;

    static {
        try {
            if (DockerClientFactory.instance().isDockerAvailable()) {
                postgres = new PostgreSQLContainer<>("postgres:16-alpine")
                        .withDatabaseName("multitenant_test")
                        .withUsername("test")
                        .withPassword("test");
                postgres.start();
                log.info("Testcontainers PostgreSQL started at {}", postgres.getJdbcUrl());
            } else {
                log.warn("Docker environment not detected. Falling back to configured datasource / H2.");
            }
        } catch (Throwable t) {
            log.warn("Could not start Testcontainers PostgreSQL: {}. Falling back to configured datasource / H2.", t.getMessage());
            postgres = null;
        }
    }

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        if (postgres != null && postgres.isRunning()) {
            registry.add("spring.datasource.url", postgres::getJdbcUrl);
            registry.add("spring.datasource.username", postgres::getUsername);
            registry.add("spring.datasource.password", postgres::getPassword);
            registry.add("spring.datasource.driver-class-name", () -> "org.postgresql.Driver");
            registry.add("spring.jpa.properties.hibernate.dialect", () -> "org.hibernate.dialect.PostgreSQLDialect");
            registry.add("spring.flyway.enabled", () -> "true");
        }
    }
}
