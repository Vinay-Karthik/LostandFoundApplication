package com.campustrack.validator;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.List;

/**
 * Dedicated validator for email addresses against allowed campus domains.
 * Single Responsibility: Verify syntax and domain matching against configured institutional domains.
 */
@Component
public class CampusEmailValidator {

    @Value("${campustrack.campus.allowed-domains:gmail.com}")
    private String allowedDomainsConfig;

    public CampusEmailValidator() {
    }

    public CampusEmailValidator(String allowedDomainsConfig) {
        this.allowedDomainsConfig = allowedDomainsConfig;
    }

    public boolean isAllowedCampusEmail(String email) {
        if (email == null || !email.contains("@")) {
            return false;
        }

        String domain = email.substring(email.indexOf("@") + 1).toLowerCase().trim();
        List<String> allowedDomains = Arrays.stream(allowedDomainsConfig.split(","))
                .map(String::trim)
                .map(String::toLowerCase)
                .filter(d -> !d.isEmpty())
                .toList();

        return allowedDomains.stream().anyMatch(d -> domain.equals(d) || domain.endsWith("." + d));
    }

    public String getAllowedDomainsDescription() {
        return allowedDomainsConfig;
    }
}
