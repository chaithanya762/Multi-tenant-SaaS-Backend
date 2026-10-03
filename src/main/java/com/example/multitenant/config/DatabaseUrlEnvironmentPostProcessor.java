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

    private static final Logger log = LoggerFactory.getLogger(DatabaseUrlEnvironmentPostProcessor.class);

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
                int schemeEnd = rawUrl.indexOf("://") + 3;
                int slashIndex = rawUrl.indexOf("/", schemeEnd);
                int atIndex = rawUrl.indexOf("@", schemeEnd);

                String jdbcUrl;
                Map<String, Object> targetProps = new HashMap<>();

                if (atIndex != -1 && (slashIndex == -1 || atIndex < slashIndex)) {
                    String userInfo = rawUrl.substring(schemeEnd, atIndex);
                    String hostAndDb = rawUrl.substring(atIndex + 1);
                    jdbcUrl = "jdbc:postgresql://" + hostAndDb;

                    if (userInfo.contains(":")) {
                        int colonIndex = userInfo.indexOf(":");
                        String user = userInfo.substring(0, colonIndex);
                        String pass = userInfo.substring(colonIndex + 1);

                        if (!environment.containsProperty("SPRING_DATASOURCE_USERNAME")
                                && !environment.containsProperty("spring.datasource.username")) {
                            targetProps.put("spring.datasource.username", user);
                        }
                        if (!environment.containsProperty("SPRING_DATASOURCE_PASSWORD")
                                && !environment.containsProperty("spring.datasource.password")) {
                            targetProps.put("spring.datasource.password", pass);
                        }
                    }
                } else {
                    jdbcUrl = "jdbc:postgresql://" + rawUrl.substring(schemeEnd);
                }

                targetProps.put("spring.datasource.url", jdbcUrl);
                log.info("Sanitized database connection URL to {}", jdbcUrl.replaceAll(":[^/@]+@", ":****@"));
                environment.getPropertySources().addFirst(new MapPropertySource("customDatabaseUrlPostProcessor", targetProps));
            } catch (Exception e) {
                log.warn("Failed to sanitize database connection URL '{}': {}", rawUrl, e.getMessage());
            }
        }
    }
}
