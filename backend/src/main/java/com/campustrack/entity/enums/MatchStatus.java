package com.campustrack.entity.enums;

public enum MatchStatus {
    SUGGESTED,
    CONFIRMED,
    REJECTED;

    public static MatchStatus fromString(String value) {
        if (value == null || value.isBlank()) return null;
        try {
            return MatchStatus.valueOf(value.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            return null;
        }
    }
}
