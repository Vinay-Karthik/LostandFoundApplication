package com.campustrack.storage;

import org.springframework.web.multipart.MultipartFile;

/**
 * Strategy interface for storing file assets.
 * Adheres to Open/Closed Principle (OCP) allowing new cloud storage providers (S3, Cloudinary, etc.)
 * to be plugged in without modifying consumer services.
 */
public interface StorageStrategy {
    String store(MultipartFile file);
    boolean isAvailable();
    String getProviderName();
}
