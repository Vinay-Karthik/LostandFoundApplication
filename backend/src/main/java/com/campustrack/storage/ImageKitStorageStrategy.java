package com.campustrack.storage;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.annotation.Order;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.util.Base64;
import java.util.Map;
import java.util.UUID;

@Component
@Order(1)
@Slf4j
public class ImageKitStorageStrategy implements StorageStrategy {

    @Value("${campustrack.imagekit.private-key:}")
    private String imageKitPrivateKey;

    @Value("${campustrack.imagekit.upload-endpoint:https://upload.imagekit.io/api/v1/files/upload}")
    private String uploadEndpoint;

    private final RestTemplate restTemplate = new RestTemplate();

    @Override
    public boolean isAvailable() {
        return StringUtils.hasText(imageKitPrivateKey) 
                && !imageKitPrivateKey.contains("YOUR_") 
                && !imageKitPrivateKey.equals("{}");
    }

    @Override
    public String getProviderName() {
        return "ImageKit";
    }

    @Override
    public String store(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            return null;
        }

        try {
            String cleanKey = imageKitPrivateKey.trim();
            if (cleanKey.startsWith("{") && cleanKey.endsWith("}")) {
                cleanKey = cleanKey.substring(1, cleanKey.length() - 1);
            }

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);
            String auth = cleanKey + ":";
            String encodedAuth = Base64.getEncoder().encodeToString(auth.getBytes());
            headers.set("Authorization", "Basic " + encodedAuth);

            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            String originalFilename = file.getOriginalFilename() != null ? file.getOriginalFilename() : "image.jpg";
            String fileName = UUID.randomUUID() + "_" + originalFilename;

            ByteArrayResource contentsAsResource = new ByteArrayResource(file.getBytes()) {
                @Override
                public String getFilename() {
                    return fileName;
                }
            };

            body.add("file", contentsAsResource);
            body.add("fileName", fileName);
            body.add("useUniqueFileName", "true");

            HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);
            ResponseEntity<Map> response = restTemplate.postForEntity(uploadEndpoint, requestEntity, Map.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Object urlObj = response.getBody().get("url");
                if (urlObj != null) {
                    log.info("Uploaded image to ImageKit successfully: {}", urlObj);
                    return urlObj.toString();
                }
            }
        } catch (Exception e) {
            log.warn("ImageKit upload failed: {}", e.getMessage());
            throw new RuntimeException("ImageKit upload failed", e);
        }

        return null;
    }
}
