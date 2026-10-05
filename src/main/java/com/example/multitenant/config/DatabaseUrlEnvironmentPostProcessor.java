package com.example.multitenant.config; 
// This class belongs to the package that holds app configuration classes.
// The package name is used to organize Java classes by feature.

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
// These imports bring in the logging tools.
// SLF4J is a popular Java logging library, and LoggerFactory creates logger objects.

import org.springframework.boot.SpringApplication;
import org.springframework.boot.env.EnvironmentPostProcessor;
// Spring Boot uses EnvironmentPostProcessor to allow custom code to modify app configuration
// before the application starts running.

import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;
// These are Spring classes for reading and adding properties to the app configuration.

import java.net.URI;
// This is Java's URI class for working with URLs.
// It is imported but not actually used in this file.

import java.util.HashMap;
import java.util.Map;
// These are Java collection classes used to store key-value pairs for properties.

public class DatabaseUrlEnvironmentPostProcessor implements EnvironmentPostProcessor {
    // This class implements EnvironmentPostProcessor.
    // That means Spring will call this class automatically during startup.
    // Its job is to clean up and correct database URL settings before the app uses them.

    private static final Logger log = LoggerFactory.getLogger(DatabaseUrlEnvironmentPostProcessor.class);
    // Create a logger for this class.
    // Later, if something goes wrong, we can write a message to logs.

    @Override
    public void postProcessEnvironment(ConfigurableEnvironment environment, SpringApplication application) {
        // This method is called by Spring before the application fully starts.
        // It gives us access to the app configuration (environment) and the app object.

        String rawUrl = environment.getProperty("SPRING_DATASOURCE_URL");
        // Try to read the database URL from an environment variable or system property.
        // This name is typically used in deployment environments.

        if (rawUrl == null || rawUrl.isBlank()) {
            // If the URL is missing or empty, then do nothing.
            rawUrl = environment.getProperty("spring.datasource.url");
            // Try a second option: the normal Spring property name.
        }

        if (rawUrl == null || rawUrl.isBlank()) {
            // If both possible sources are missing, return early.
            return;
        }

        if (rawUrl.startsWith("postgres://") || rawUrl.startsWith("postgresql://")) {
            // Only process the URL if it is a PostgreSQL connection string.
            // If it is not PostgreSQL, we do not need to do anything.
            try {
                // Use try/catch so that if the URL format is invalid, the app won't crash.

                int schemeEnd = rawUrl.indexOf("://") + 3;
                // Find the end of the scheme part like "postgres://".
                // Example: "postgres://user:pass@host/db"
                // After this, the string begins at "user:pass@host/db".

                int slashIndex = rawUrl.indexOf("/", schemeEnd);
                // Find the first "/" after the scheme.
                // This tells us where the host/database part begins or ends.

                int atIndex = rawUrl.indexOf("@", schemeEnd);
                // Find the "@", which separates credentials from the host.
                // Example: "user:pass@host/db" has "@" between password and host.

                String jdbcUrl;
                // We will store the cleaned JDBC URL in this variable.

                Map<String, Object> targetProps = new HashMap<>();
                // Create a map of Spring properties we want to inject.
                // For example: spring.datasource.url, spring.datasource.username, etc.

                if (atIndex != -1 && (slashIndex == -1 || atIndex < slashIndex)) {
                    // This condition means the URL includes user credentials before the host.
                    // Example: "postgres://alice:pass@db.example.com/mydb"
                    // In that case, we need to pull username/password out and build a JDBC URL.

                    String userInfo = rawUrl.substring(schemeEnd, atIndex);
                    // Extract just the credentials section.
                    // Example: "alice:pass"

                    String hostAndDb = rawUrl.substring(atIndex + 1);
                    // Extract everything after "@"
                    // Example: "db.example.com/mydb"

                    jdbcUrl = "jdbc:postgresql://" + hostAndDb;
                    // Convert the PostgreSQL URL into the format Spring JDBC expects.
                    // Example:
                    // postgres://alice:pass@db.example.com/mydb
                    // becomes
                    // jdbc:postgresql://db.example.com/mydb

                    if (userInfo.contains(":")) {
                        // If credentials include a colon, then username and password are both present.
                        // Example: "alice:secret"

                        int colonIndex = userInfo.indexOf(":");
                        // Find the colon that separates username and password.

                        String user = userInfo.substring(0, colonIndex);
                        // Get the username before the colon.
                        // Example: "alice"

                        String pass = userInfo.substring(colonIndex + 1);
                        // Get the password after the colon.
                        // Example: "secret"

                        if (!environment.containsProperty("SPRING_DATASOURCE_USERNAME")
                                && !environment.containsProperty("spring.datasource.username")) {
                            // Only set the username if Spring is not already configured with it.
                            targetProps.put("spring.datasource.username", user);
                            // Add the username to the property map.
                        }

                        if (!environment.containsProperty("SPRING_DATASOURCE_PASSWORD")
                                && !environment.containsProperty("spring.datasource.password")) {
                            // Only set the password if Spring is not already configured with it.
                            targetProps.put("spring.datasource.password", pass);
                            // Add the password to the property map.
                        }
                    }
                } else {
                    // If there is no username/password part, then just convert the host/database portion.
                    jdbcUrl = "jdbc:postgresql://" + rawUrl.substring(schemeEnd);
                    // Example:
                    // postgres://db.example.com/mydb
                    // becomes
                    // jdbc:postgresql://db.example.com/mydb
                }

                targetProps.put("spring.datasource.url", jdbcUrl);
                // Add the sanitized JDBC URL into the property map, so Spring will use it.

                log.info("Sanitized database connection URL to {}", jdbcUrl.replaceAll(":[^/@]+@", ":****@"));
                // Print a log message showing the URL but hiding the password.
                // Example: "jdbc:postgresql://db.example.com/mydb" might become
                // "jdbc:postgresql://db.example.com/mydb" with no password anyway.
                // In a URL with password, it would show "*****" instead of the real one.

                environment.getPropertySources().addFirst(new MapPropertySource("customDatabaseUrlPostProcessor", targetProps));
                // Add these properties to Spring's config at the top of the property list.
                // This ensures our corrected values are used before older/default values.

            } catch (Exception e) {
                // If anything breaks while parsing the URL, catch the exception.
                log.warn("Failed to sanitize database connection URL '{}': {}", rawUrl, e.getMessage());
                // Log a warning and show the original URL and the error message.
                // This helps developers debug problems without crashing the app.
            }
        }
    }
}
