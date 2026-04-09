package com.hrm.security;

import com.hrm.entity.User;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.UUID;

@RequiredArgsConstructor
public class CustomUserDetails implements UserDetails {

    @Getter
    private final User user;

    public UUID getId() {
        return user.getId();
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        List<SimpleGrantedAuthority> authorities = new ArrayList<>();
        
        // Add Role (prefix ROLE_)
        if (user.getRole() != null) {
            authorities.add(new SimpleGrantedAuthority("ROLE_" + user.getRole().getName()));
            
            // Add permission codes as-is so @PreAuthorize can use the DB code directly.
            if (user.getRole().getPermissions() != null) {
                user.getRole().getPermissions().forEach(perm -> 
                    authorities.add(new SimpleGrantedAuthority(perm.getCode()))
                );
            }
        }
        
        return authorities;
    }

    @Override public String getPassword()  { return user.getPassword(); }
    @Override public String getUsername()  { return user.getEmail(); }
    @Override public boolean isAccountNonExpired()    { return true; }
    @Override public boolean isAccountNonLocked()     { return true; }
    @Override public boolean isCredentialsNonExpired() { return true; }
    @Override public boolean isEnabled()              { return true; }
}
