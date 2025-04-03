// 文件名：BaiLianaiController.java
package org.example.openluckclovers.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.example.openluckclovers.config.BaiLianaiConfig;
import org.example.openluckclovers.config.ChatHistory;
import org.example.openluckclovers.service.BaiLianaiService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.apache.poi.xwpf.usermodel.XWPFParagraph;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.*;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

@RestController
@RequestMapping("/api/bailianai")
public class BaiLianaiController {

    @Autowired
    private BaiLianaiService service;

    private final ObjectMapper objectMapper = new ObjectMapper();

    // 大白话注释：加个日志工具，方便调试
    private static final Logger logger = LoggerFactory.getLogger(BaiLianaiController.class);

    @PostMapping("/config")
    public BaiLianaiConfig saveConfig(@RequestBody BaiLianaiConfig config) {
        if (config.getName() == null || config.getName().trim().isEmpty()) {
            config.setName("默认模型");
        }
        if (config.getId() != null) {
            BaiLianaiConfig existingConfig = service.getConfigById(config.getId());
            if (existingConfig != null) {
                if (config.getName() != null) existingConfig.setName(config.getName());
                if (config.getModelName() != null) existingConfig.setModelName(config.getModelName());
                if (config.getApiUrl() != null) existingConfig.setApiUrl(config.getApiUrl());
                if (config.getApiKey() != null) existingConfig.setApiKey(config.getApiKey());
                if (config.getPersonality() != null) existingConfig.setPersonality(config.getPersonality());
                // 大白话注释：更新知识库内容，如果前端传了就用新的
                if (config.getKnowledgeBaseContent() != null) existingConfig.setKnowledgeBaseContent(config.getKnowledgeBaseContent());
                return service.saveConfig(existingConfig);
            }
        }
        return service.saveConfig(config);
    }

    @GetMapping("/configs")
    public List<BaiLianaiConfig> getConfigs() {
        return service.getAllConfigs();
    }

    @GetMapping("/config/{id}")
    public BaiLianaiConfig getConfig(@PathVariable Long id) {
        return service.getConfigById(id);
    }

    @DeleteMapping("/config/{id}")
    public void deleteConfig(@PathVariable Long id) {
        service.deleteConfig(id);
    }

    @GetMapping("/history")
    public List<ChatHistory> getHistory(@RequestParam Long configId) {
        return service.getChatHistory(configId, "default");
    }

    @PostMapping("/history")
    public void saveHistory(@RequestBody ChatHistory history) {
        service.saveChatHistory(history);
    }

    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamResponse(@RequestParam String message, @RequestParam Long configId) {
        SseEmitter emitter = new SseEmitter(0L);
        BaiLianaiConfig config = service.getConfigById(configId);

        if (config == null || config.getApiKey() == null || config.getModelName() == null || config.getApiUrl() == null) {
            try {
                emitter.send("data:{\"error\":\"请先设置应用配置\"}\n\n");
                emitter.complete();
            } catch (IOException e) {
                emitter.completeWithError(e);
            }
            return emitter;
        }

        try {
            HttpClient client = HttpClient.newHttpClient();
            List<ChatHistory> history = service.getChatHistory(configId, "default");
            String context = history.stream()
                    .map(h -> (h.getUserMessage() != null ? "User: " + h.getUserMessage() : "") +
                            (h.getModelMessage() != null ? "\nBot: " + h.getModelMessage() : ""))
                    .filter(s -> !s.isEmpty())
                    .reduce("", (a, b) -> a + "\n" + b);

            String knowledgeContent = config.getKnowledgeBaseContent() != null ? config.getKnowledgeBaseContent() : "";
            String systemPrompt = "You are a helpful assistant named " + config.getName() +
                    (config.getPersonality() != null ? " with personality: " + config.getPersonality() : "") +
                    (knowledgeContent.isEmpty() ? "" : ". Knowledge base:\n" + knowledgeContent) +
                    (context.isEmpty() ? "" : ". Previous context:\n" + context);

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("model", config.getModelName());
            Map<String, Object> input = new HashMap<>();
            List<Map<String, String>> messages = List.of(
                    Map.of("role", "system", "content", systemPrompt),
                    Map.of("role", "user", "content", message)
            );
            input.put("messages", messages);
            requestBody.put("input", input);
            Map<String, Object> parameters = new HashMap<>();
            parameters.put("result_format", "message");
            parameters.put("incremental_output", true);
            requestBody.put("parameters", parameters);

            String body = objectMapper.writeValueAsString(requestBody);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(config.getApiUrl()))
                    .header("Authorization", "Bearer " + config.getApiKey())
                    .header("Content-Type", "application/json")
                    .header("X-DashScope-SSE", "enable")
                    .POST(HttpRequest.BodyPublishers.ofString(body))
                    .build();

            CompletableFuture.runAsync(() -> {
                try {
                    HttpResponse<InputStream> response = client.send(request, HttpResponse.BodyHandlers.ofInputStream());
                    try (BufferedReader reader = new BufferedReader(new InputStreamReader(response.body()))) {
                        String line;
                        StringBuilder fullResponse = new StringBuilder();
                        while ((line = reader.readLine()) != null) {
                            if (line.startsWith("data:")) {
                                String jsonData = line.substring(5).trim();
                                if (!jsonData.isEmpty()) {
                                    emitter.send("data:" + jsonData + "\n\n");
                                    Map<String, Object> data = objectMapper.readValue(jsonData, Map.class);
                                    if (data.containsKey("output") && data.get("output") instanceof Map) {
                                        Map<String, Object> output = (Map<String, Object>) data.get("output");
                                        if (output.containsKey("choices") && output.get("choices") instanceof List) {
                                            List<Map<String, Object>> choices = (List<Map<String, Object>>) output.get("choices");
                                            if (!choices.isEmpty() && choices.get(0).containsKey("message")) {
                                                Map<String, String> messageData = (Map<String, String>) choices.get(0).get("message");
                                                fullResponse.append(messageData.get("content"));
                                            }
                                        }
                                    }
                                }
                            } else if (line.isEmpty()) {
                                emitter.send("\n");
                            }
                        }
                        String rawResponse = fullResponse.toString();
                        String modelResponse = processModelResponse(rawResponse);
                        ChatHistory chat = new ChatHistory();
                        chat.setConfigId(configId);
                        chat.setSessionId("default");
                        chat.setUserMessage(message);
                        chat.setRawModelMessage(rawResponse); // 大白话注释：保存原始数据给前端展示
                        chat.setModelMessage(simplifyResponse(rawResponse)); // 大白话注释：简化版给上下文用
                        chat.setRequestModel(config.getModelName());
                        service.saveChatHistory(chat);
                        emitter.complete();
                    }
                } catch (Exception e) {
                    try {
                        emitter.send("data:{\"error\":\"流式响应出错，请稍后再试\"}\n\n");
                    } catch (IOException ex) {}
                    emitter.completeWithError(e);
                }
            });

        } catch (Exception e) {
            emitter.completeWithError(e);
        }

        return emitter;
    }

    // 大白话注释：处理模型回答，格式化给前端用
    private String processModelResponse(String rawResponse) {
        if (rawResponse.contains("```")) {
            return rawResponse;
        }
        if (rawResponse.matches("(?s).*\\b(def|class|if|for|while|print|return|function|var|let|const)\\b.*[()\\[\\]{}].*")) {
            return "```python\n" + rawResponse + "\n```";
        }
        String[] lines = rawResponse.split("\n");
        StringBuilder formattedResponse = new StringBuilder();
        boolean inList = false;
        for (String line : lines) {
            line = line.trim();
            if (line.matches("^\\d+\\..*")) {
                if (!inList && formattedResponse.length() > 0) {
                    formattedResponse.append("\n");
                }
                inList = true;
                formattedResponse.append(line).append("\n");
            } else {
                if (inList && !line.isEmpty()) {
                    formattedResponse.append("\n");
                }
                inList = false;
                formattedResponse.append(line);
                if (!line.isEmpty()) {
                    formattedResponse.append("\n");
                }
            }
        }
        return formattedResponse.toString().trim();
    }

    // 大白话注释：新增方法，把回答简化成纯文本，去掉格式，用于上下文
    private String simplifyResponse(String rawResponse) {
        String simplified = rawResponse.replaceAll("```[a-zA-Z]*\n", "").replaceAll("\n```", "");
        return simplified.replaceAll("\n+", "\n").trim();
    }

    // 大白话注释：上传知识库文件，直接解析内容返回给前端
    @PostMapping("/upload-knowledge")
    public Map<String, String> uploadKnowledgeFile(@RequestParam("file") MultipartFile file, @RequestParam("modelName") String modelName) throws IOException {
        // 大白话注释：读取 Word 文件内容
        String content;
        try (XWPFDocument document = new XWPFDocument(file.getInputStream())) {
            StringBuilder contentBuilder = new StringBuilder();
            List<XWPFParagraph> paragraphs = document.getParagraphs();
            for (XWPFParagraph para : paragraphs) {
                String text = para.getText();
                if (text != null && !text.trim().isEmpty()) {
                    contentBuilder.append(text).append("\n");
                }
            }
            content = contentBuilder.toString().trim();
        } catch (Exception e) {
            logger.error("解析 Word 文件失败: " + e.getMessage());
            throw new IOException("解析知识库文件失败: " + e.getMessage());
        }

        logger.info("上传文件成功，解析内容长度: " + content.length() + " 字符");
        Map<String, String> response = new HashMap<>();
        response.put("content", content); // 返回内容给前端确认
        return response;
    }
}