package com.campustrack.mapper;

import com.campustrack.dto.AuthDTOs.AuthResponse;
import com.campustrack.dto.AuthDTOs.PublicUserDTO;
import com.campustrack.dto.AuthDTOs.UserDTO;
import com.campustrack.entity.User;
import org.springframework.stereotype.Component;

/**
 * Mapper component for User entities and authentication DTOs.
 */
@Component
public class UserMapper {

    public UserDTO toUserDTO(User user) {
        if (user == null) {
            return null;
        }

        return UserDTO.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole())
                .verified(Boolean.TRUE.equals(user.getVerified()))
                .suspended(Boolean.TRUE.equals(user.getSuspended()))
                .avatarUrl(user.getAvatarUrl())
                .createdAt(user.getCreatedAt())
                .build();
    }

    public AuthResponse toAuthResponse(User user, String jwtToken) {
        if (user == null) {
            return null;
        }

        return AuthResponse.builder()
                .token(jwtToken)
                .type("Bearer")
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole())
                .verified(Boolean.TRUE.equals(user.getVerified()))
                .suspended(Boolean.TRUE.equals(user.getSuspended()))
                .avatarUrl(user.getAvatarUrl())
                .build();
    }

    public PublicUserDTO toPublicUserDTO(User user) {
        if (user == null) {
            return null;
        }

        return PublicUserDTO.builder()
                .id(user.getId())
                .name(user.getName())
                .role(user.getRole())
                .avatarUrl(user.getAvatarUrl())
                .build();
    }
}
