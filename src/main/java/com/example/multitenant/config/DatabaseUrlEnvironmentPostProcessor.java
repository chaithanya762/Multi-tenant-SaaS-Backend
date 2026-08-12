package com.example.multitenant.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;

import java.net.URI;
import java.util.HashMap;
import java.util.Map;

public class DatabaseUrlEnvironmentPostProcessor implements EnvironmentPostProcessor {

    private static final Logger log = LoggerFactory.getLogger(DatabaseUrlEnvironmentPostProcessor.java);

    @Override
    public void postProcessEnvironment(ConfigurableEnvironment environment, SpringApplication application) {
        String rawUrl = environment.getProperty("SPRING_DATASOURCE_URL");
        if (rawUrl == null || rawUrl.isBlank()) {
            rawUrl = environment.getProperty("spring.datasource.url");
        }

        if (rawUrl == null || rawUrl.isBlank()) {
            return;
        }

        if (rawUrl.startsWith("postgres://") || rawUrl.startsWith("postgresql://")) {
            try {
                String cleanUriStr = rawUrl.startsWith("postgres://")
                        ? "http" + rawUrl.substring(8)
                        : "http" + rawUrl.substring(10);

                URI uri = new URI(cleanUriStr);

                String host = uri.getHost();
                int port = uri.getPort() > 0 ? uri.getPort() : 5432;
                String path = uri.getPath();

                String jdbcUrl = "jdbc:postgresql://" + host + ":" + port + path;

                Map<String, Object> targetProps = new HashMap<>();
                targetProps.put("spring.datasource.url", jdbcUrl);

                if (uri.getUserInfo() != null && uri.getUserInfo().contains(":")) {
                    String[] userInfo = uri.getUserInfo().split(":", 2);
                    if (!environment.containsProperty("SPRING_DATASOURCE_USERNAME")
                            && !environment.containsProperty("spring.datasource.username")) {
                        targetProps.put("spring.datasource.username", userInfo[0]);
                    }
                    if (!environment.containsProperty("SPRING_DATASOURCE_PASSWORD")
                            && !environment.containsProperty("spring.datasource.password")) {
                        targetProps.put("spring.datasource.password", userInfo[1]);
                    }
                }

                log.info("Sanitized database connection URL from postgres:// scheme to {}", jdbcUrl);
                environment.getPropertySources().addFirst(new MapPropertySource("customDatabaseUrlPostProcessor", targetProps));
            } catch (Exception e) {
                log.warn("Failed to parse database connection URL '{}': {}", rawUrl, e.getMessage());
            }
        }
    }
}
