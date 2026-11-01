package com.cloudguard.security.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.lang.NonNull;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.net.URI;
import java.util.Arrays;
import java.util.Set;
import java.util.stream.Collectors;

public class OriginRefererFilter extends OncePerRequestFilter {

    private final Set<String> allowedOrigins;

    public OriginRefererFilter(String allowedOriginsStr) {
        this.allowedOrigins = Arrays.stream(allowedOriginsStr.split(","))
                .map(String::trim)
                .filter(StringUtils::hasText)
                .collect(Collectors.toSet());
    }

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain filterChain) throws ServletException, IOException {
        String method = request.getMethod();

        if ("POST".equalsIgnoreCase(method) || "PUT".equalsIgnoreCase(method) ||
            "PATCH".equalsIgnoreCase(method) || "DELETE".equalsIgnoreCase(method)) {

            String uri = request.getRequestURI();
            if ("/api/health".equals(uri)) {
                filterChain.doFilter(request, response);
                return;
            }

            boolean hasCgTokenCookie = false;
            if (request.getCookies() != null) {
                for (jakarta.servlet.http.Cookie cookie : request.getCookies()) {
                    if ("cg_token".equals(cookie.getName()) && StringUtils.hasText(cookie.getValue())) {
                        hasCgTokenCookie = true;
                        break;
                    }
                }
            }

            String origin = request.getHeader("Origin");
            String referer = request.getHeader("Referer");

            // For POST/PUT/PATCH/DELETE, if the request carries the cg_token cookie and has neither Origin nor Referer -> 403
            if (hasCgTokenCookie && !StringUtils.hasText(origin) && !StringUtils.hasText(referer)) {
                response.sendError(HttpServletResponse.SC_FORBIDDEN, "Missing Origin and Referer headers for cookie-authenticated request");
                return;
            }

            if (StringUtils.hasText(origin)) {
                if (!allowedOrigins.contains(origin.trim())) {
                    response.sendError(HttpServletResponse.SC_FORBIDDEN, "Origin not allowed: " + origin);
                    return;
                }
            } else if (StringUtils.hasText(referer)) {
                try {
                    URI refererUri = URI.create(referer.trim());
                    String refererOrigin = refererUri.getScheme() + "://" + refererUri.getAuthority();
                    if (!allowedOrigins.contains(refererOrigin)) {
                        response.sendError(HttpServletResponse.SC_FORBIDDEN, "Referer origin not allowed: " + refererOrigin);
                        return;
                    }
                } catch (Exception e) {
                    response.sendError(HttpServletResponse.SC_FORBIDDEN, "Malformed Referer header");
                    return;
                }
            }
        }

        filterChain.doFilter(request, response);
    }
}
