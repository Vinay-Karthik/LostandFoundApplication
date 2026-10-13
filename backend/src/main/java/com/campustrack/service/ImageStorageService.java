package com.campustrack.service;

import com.campustrack.storage.StorageStrategy;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

/**
 * Image storage service implementing the Strategy pattern.
 * Automatically delegates to available storage strategies in order (e.g. Cloud -> Local fallback).
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ImageStorageService {

    private final List<StorageStrategy> storageStrategies;

    public String storeImage(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            return null;
        }

        for (StorageStrategy strategy : storageStrategies) {
            if (strategy.isAvailable()) {
                try {
                    String url = strategy.store(file);
                    if (url != null) {
                        log.info("Successfully stored image using provider: {}", strategy.getProviderName());
                        return url;
                    }
                } catch (Exception e) {
                    log.warn("Storage provider '{}' failed: {}. Attempting fallback...", strategy.getProviderName(), e.getMessage());
                }
            }
        }

        throw new RuntimeException("All storage strategies failed to store the file");
    }
}
