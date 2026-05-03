package com.rowentey.jobwise.middleware;

import java.io.IOException;
import java.util.List;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.servlet.HandlerExceptionResolver;

import com.rowentey.jobwise.exceptions.AuthExceptions.InvalidJwtException;
import com.rowentey.jobwise.utils.JwtUtil;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Component
@RequiredArgsConstructor
@Slf4j
public class JwtFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;
    private final UserDetailsService userDetailsService;
    private final List<HandlerExceptionResolver> handlerExceptionResolvers;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {
        log.debug(String.format("Request URI: %s", request.getRequestURI()));
        log.debug(String.format("Request Method: %s", request.getMethod()));

        String authHeader = request.getHeader("Authorization");
        String token = null;
        String username = null;
        log.debug("Auth header: " + authHeader);

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            token = authHeader.substring(7);
            try {
                username = jwtUtil.extractUsername(token);
            } catch (Exception ex) {
                log.warn("Invalid JWT provided: {}", ex.getMessage());
                resolveException(request, response, new InvalidJwtException("Invalid JWT token"));
                return;
            }
        }

        if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            UserDetails userDetails = userDetailsService.loadUserByUsername(username);
            if (jwtUtil.validateToken(token, userDetails)) {
                UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(userDetails,
                        token,
                        userDetails.getAuthorities());
                authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authToken);
            } else {
                log.warn("JWT validation failed for user: {}", username);
                resolveException(request, response, new InvalidJwtException("Invalid JWT token"));
                return;
            }
        }

        filterChain.doFilter(request, response);
    }

    private void resolveException(HttpServletRequest request, HttpServletResponse response, Exception ex) {
        for (HandlerExceptionResolver resolver : handlerExceptionResolvers) {
            if (resolver.resolveException(request, response, null, ex) != null) {
                break;
            }
        }
    }
}
