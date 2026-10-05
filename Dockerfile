# Stage 1: Build (compile the maven project & copy source code + dependencies run ./mvnw package
FROM eclipse-temurin:17-jdk-alpine AS builder
WORKDIR /app
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./
RUN chmod +x mvnw && ./mvnw dependency:resolve -B
COPY src/ src/
RUN ./mvnw package -DskipTests -B

# Stage 2: Run
FROM eclipse-temurin:17-jre-alpine
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
WORKDIR /app
COPY --from=builder /app/target/*.jar app.jar
USER appuser

HEALTHCHECK --interval=30s --timeout=5s --start-period=120s --retries=3 \
    CMD wget -qO- http://localhost:${PORT:-8080}/actuator/health || exit 1

EXPOSE 8080
ENTRYPOINT ["java", \
    "-XX:+UseSerialGC", \
    "-Xms256m", \
    "-Xmx320m", \
    "-XX:MaxMetaspaceSize=128m", \
    "-Djava.security.egd=file:/dev/./urandom", \
    "-jar", "app.jar"]
