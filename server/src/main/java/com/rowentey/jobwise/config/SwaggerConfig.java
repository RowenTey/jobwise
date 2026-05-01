package com.rowentey.jobwise.config;

import java.util.Collections;
import java.util.List;

import org.springdoc.core.customizers.OperationCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.method.HandlerMethod;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.Operation;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;

@Configuration
public class SwaggerConfig {

    public static final String UNSECURED = "security.open";

    @Bean
    OperationCustomizer customize() {
        return (Operation operation, HandlerMethod handlerMethod) -> {
            List<String> tags = operation.getTags();
            if (tags != null && tags.contains(UNSECURED)) {
                operation.setSecurity(Collections.emptyList());
                operation.setTags(tags.stream().filter(t -> !t.equals(UNSECURED)).toList());
            }
            return operation;
        };
    }

    @Bean
    OpenAPI openAPINonStaging() {
        return openAPI();
    }

    private OpenAPI openAPI() {
        return new OpenAPI()
                .addSecurityItem(new SecurityRequirement().addList("Bearer Authentication"))
                .addServersItem(
                        new Server().url("http://localhost:8080").description("Dev Server"))
                .components(new Components().addSecuritySchemes("Bearer Authentication",
                        createAPIKeyScheme()))
                .info(apiInfo());
    }

    private SecurityScheme createAPIKeyScheme() {
        return new SecurityScheme().name("bearerToken").type(SecurityScheme.Type.HTTP)
                .bearerFormat("JWT").scheme("bearer");
    }

    private Info apiInfo() {
        return new Info().title("JobWise API").version("0.0.1-SNAPSHOT")
                .description("REST APIs for JobWise.").contact(new Contact().name("Rowen Tey"));
    }
}
