package com.hrm.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

/**
 * Gateway đơn trách: gọi HTTP đến LLM (Gemini) và trả về raw text.
 * Không biết gì về prompt, tool hay business logic.
 */
@Service
@RequiredArgsConstructor
public class LlmGateway {

    private final ObjectMapper objectMapper;

    @Value("${gemini.api.key:}")
    private String geminiApiKey;

    @Value("${gemini.model:gemini-1.5-flash}")
    private String geminiModel;

    /**
     * @return true nếu API key đã được cấu hình
     */
    public boolean isAvailable() {
        return geminiApiKey != null && !geminiApiKey.isBlank();
    }

    /**
     * Gọi Gemini generateContent và trả về raw text từ response.
     *
     * @param payload ObjectNode đã build sẵn (contents, generationConfig, v.v.)
     * @return raw text từ candidates[0].content.parts[0].text
     * @throws Exception nếu HTTP lỗi hoặc parse thất bại
     */
    public String call(ObjectNode payload) throws Exception {
        String url = "https://generativelanguage.googleapis.com/v1beta/models/"
                + geminiModel + ":generateContent?key=" + geminiApiKey;

        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(25000);
        requestFactory.setReadTimeout(25000);

        RestTemplate restTemplate = new RestTemplate(requestFactory);
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<String> entity = new HttpEntity<>(objectMapper.writeValueAsString(payload), headers);

        ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.POST, entity, String.class);
        if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
            throw new IllegalStateException("Gọi API Gemini thất bại.");
        }

        JsonNode root = objectMapper.readTree(response.getBody());
        JsonNode textNode = root.path("candidates").path(0).path("content").path("parts").path(0).path("text");
        return textNode.asText("");
    }
}
