package com.campustrack.entity.enums;

public enum ItemType {
    LOST,
    FOUND;

    public static ItemType fromString(String value) {
        if (value == null || value.isBlank()) return null;
        try {
            return ItemType.valueOf(value.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            return null;
        }
    }
}
