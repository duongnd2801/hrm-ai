package com.hrm.config;

import com.fasterxml.jackson.annotation.JsonTypeInfo;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.jsontype.impl.LaissezFaireSubTypeValidator;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext;
import org.springframework.data.redis.serializer.StringRedisSerializer;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;

@Configuration
@EnableCaching
public class CacheConfig {

    @Bean
    public RedisCacheManager cacheManager(RedisConnectionFactory connectionFactory) {
        // Configure ObjectMapper for GenericJackson2JsonRedisSerializer
        // to support LocalTime and other Java 8 Date/Time types
        ObjectMapper objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
        
        // Enable polymorphic type handling for generic objects
        objectMapper.activateDefaultTyping(
                LaissezFaireSubTypeValidator.instance,
                ObjectMapper.DefaultTyping.NON_FINAL,
                JsonTypeInfo.As.PROPERTY
        );

        GenericJackson2JsonRedisSerializer jsonSerializer = new GenericJackson2JsonRedisSerializer(objectMapper);

        RedisCacheConfiguration defaultConfig = RedisCacheConfiguration.defaultCacheConfig()
                .entryTtl(Duration.ofHours(24))
                .serializeKeysWith(RedisSerializationContext.SerializationPair.fromSerializer(new StringRedisSerializer()))
                .serializeValuesWith(RedisSerializationContext.SerializationPair.fromSerializer(jsonSerializer))
                .disableCachingNullValues()
                .computePrefixWith(cacheName -> "hrm:cache:" + cacheName + ":");

        Map<String, RedisCacheConfiguration> configurations = new HashMap<>();
        
        // Employee stats cache (short TTL - 5 minutes)
        configurations.put(CacheNames.EMPLOYEE_STATS, defaultConfig.entryTtl(Duration.ofMinutes(5)));
        
        // Other caches mostly use default (24h), but we can explicitly define if needed
        configurations.put(CacheNames.COMPANY_CONFIG, defaultConfig);
        configurations.put(CacheNames.DEPARTMENTS, defaultConfig);
        configurations.put(CacheNames.POSITIONS, defaultConfig);
        configurations.put(CacheNames.HOLIDAYS, defaultConfig);
        configurations.put(CacheNames.ROLES, defaultConfig);
        configurations.put(CacheNames.PERMISSIONS, defaultConfig);
        configurations.put(CacheNames.EMPLOYEE_DETAILS, defaultConfig);

        return RedisCacheManager.builder(connectionFactory)
                .cacheDefaults(defaultConfig)
                .withInitialCacheConfigurations(configurations)
                .build();
    }
}
