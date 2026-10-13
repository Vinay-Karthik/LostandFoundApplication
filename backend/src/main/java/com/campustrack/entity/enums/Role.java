package com.campustrack.entity.enums;

public enum Role {
    STUDENT,
    ADMIN;

    public static Role fromString(String value) {
        if (value == null || value.isBlank()) return null;
        try {
            return Role.valueOf(value.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            return null;
        }
    }
}
