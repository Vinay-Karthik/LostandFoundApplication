package com.campustrack.entity.enums;

public enum ItemStatus {
    OPEN,
    MATCHED,
    RESOLVED,
    REMOVED;

    public static ItemStatus fromString(String value) {
        if (value == null || value.isBlank()) return null;
        try {
            return ItemStatus.valueOf(value.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            return null;
        }
    }
}
