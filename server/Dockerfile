# Build stage
FROM maven:3.9-eclipse-temurin-17-alpine AS builder

WORKDIR /app

# Copy source code (includes static frontend assets if present)
COPY . .

# Build the application (skip tests for faster image build; run tests in CI)
RUN mvn clean package -DskipTests -B

# Runtime stage
FROM eclipse-temurin:17-jre-alpine

EXPOSE 8080

# Create a non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Copy the built JAR from the builder stage
COPY --from=builder /app/target/jobwise-0.0.1.jar app.jar

# Change ownership to non-root user
RUN chown -R appuser:appgroup /app

USER appuser

ENTRYPOINT ["java", "-jar", "/app/app.jar"]
