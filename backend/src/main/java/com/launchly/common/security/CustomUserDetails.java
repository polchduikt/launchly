package com.launchly.common.security;

import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.User;
import java.util.Collection;

@Getter
public class CustomUserDetails extends User {

    private final Long id;
    private final String blockReason;

    public CustomUserDetails(Long id, String email, String password, boolean active, String blockReason, Collection<? extends GrantedAuthority> authorities) {
        super(email, password, active, true, true, true, authorities);
        this.id = id;
        this.blockReason = blockReason;
    }
}
