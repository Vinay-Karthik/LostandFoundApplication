package com.campustrack.storage;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Component
@Order(2)
@Slf4j
public class LocalStorageStrategy implements StorageStrategy {

    @Value("${campustrack.upload.local-dir:./uploads}")
    private String localUploadDir;

    @Override
    public boolean isAvailable() {
        return true; // Local storage is always available as reliable baseline/fallback
    }

    @Override
    public String getProviderName() {
        return "LocalFileSystem";
    }

    @Override
    public String store(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            return null;
        }

        try {
            File dir = new File(localUploadDir);
            if (!dir.exists()) {
                dir.mkdirs();
            }

            String ext = "";
            String originalName = file.getOriginalFilename();
            if (originalName != null && originalName.contains(".")) {
                ext = originalName.substring(originalName.lastIndexOf("."));
            } else {
                ext = ".jpg";
            }

            String filename = UUID.randomUUID() + ext;
            Path targetLocation = Paths.get(localUploadDir).resolve(filename);
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

            return "/api/uploads/" + filename;
        } catch (IOException e) {
            log.error("Failed to store file locally", e);
            throw new RuntimeException("Could not store image file locally", e);
        }
    }
}
