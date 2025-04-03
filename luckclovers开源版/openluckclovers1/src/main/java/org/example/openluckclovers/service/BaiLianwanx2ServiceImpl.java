package org.example.openluckclovers.service;

import com.alibaba.fastjson.JSONObject;
import org.example.openluckclovers.config.BaiLianwanx2Config;
import org.example.openluckclovers.repository.BaiLianwanx2Repository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;

@Service
public class BaiLianwanx2ServiceImpl implements BaiLianwanx2Service {

    private static final Logger logger = LoggerFactory.getLogger(BaiLianwanx2ServiceImpl.class);

    @Autowired
    private BaiLianwanx2Repository repository;

    @Autowired
    private RestTemplate restTemplate;

    @Override
    public String createTask(BaiLianwanx2Config config) {
        logger.info("收到前端传来的配置: {}", config);

        BaiLianwanx2Config savedConfig;

        // 大白话注释：如果有 id，说明是生成图片，加载数据库中的配置
        if (config.getId() != null) {
            savedConfig = repository.findById(config.getId()).orElse(null);
            if (savedConfig == null) {
                logger.error("配置 ID {} 不存在", config.getId());
                return "配置不存在";
            }
            // 大白话注释：更新 prompt 和 negativePrompt
            savedConfig.setPrompt(config.getPrompt());
            savedConfig.setNegativePrompt(config.getNegativePrompt());
        } else {
            // 大白话注释：没有 id，说明是保存配置，直接用前端传来的数据
            savedConfig = config;
        }

        // 大白话注释：检查必填字段，model、apiKey、apiUrl 必须有值
        if (savedConfig.getModel() == null || savedConfig.getApiKey() == null || savedConfig.getApiUrl() == null) {
            logger.error("创建任务失败：模型名称、API密钥或API地址为空，model: {}, apiKey: {}, apiUrl: {}",
                    savedConfig.getModel(), savedConfig.getApiKey(), savedConfig.getApiUrl());
            return "模型名称、API密钥或API地址不能为空";
        }

        // 大白话注释：保存配置时允许 prompt 为空，生成图片时必须有值
        boolean isGenerateTask = config.getPrompt() != null && !config.getPrompt().trim().isEmpty();
        if (isGenerateTask && (savedConfig.getPrompt() == null || savedConfig.getPrompt().trim().isEmpty())) {
            logger.error("创建任务失败：prompt 为空");
            return "prompt 不能为空";
        }

        // 大白话注释：设置时间并保存到数据库
        savedConfig.setCreateTime(savedConfig.getCreateTime() != null ? savedConfig.getCreateTime() : LocalDateTime.now());
        savedConfig.setUpdateTime(LocalDateTime.now());
        savedConfig = repository.save(savedConfig);
        logger.info("配置已保存到数据库，ID: {}", savedConfig.getId());

        // 大白话注释：如果没有 prompt，说明只是保存配置，直接返回 ID
        if (!isGenerateTask) {
            return savedConfig.getId().toString();
        }

        // 大白话注释：以下是生成图片的逻辑
        HttpHeaders headers = new HttpHeaders();
        headers.add("Content-Type", "application/json");
        headers.add("Authorization", "Bearer " + savedConfig.getApiKey());
        headers.add("X-DashScope-Async", "enable");

        JSONObject requestBody = new JSONObject();
        requestBody.put("model", savedConfig.getModel());

        JSONObject input = new JSONObject();
        input.put("prompt", savedConfig.getPrompt());
        if (savedConfig.getNegativePrompt() != null) {
            input.put("negative_prompt", savedConfig.getNegativePrompt());
        }
        requestBody.put("input", input);

        JSONObject parameters = new JSONObject();
        parameters.put("size", savedConfig.getSize() != null ? savedConfig.getSize() : "1024*1024");
        parameters.put("n", savedConfig.getN() != null ? savedConfig.getN() : 4);
        if (savedConfig.getSeed() != null) {
            parameters.put("seed", savedConfig.getSeed());
        }
        parameters.put("prompt_extend", true);
        parameters.put("watermark", savedConfig.getWatermark() != null && savedConfig.getWatermark() == 1);
        requestBody.put("parameters", parameters);

        logger.info("发送请求到 API: {}, URL: {}", requestBody.toJSONString(), savedConfig.getApiUrl());

        HttpEntity<String> entity = new HttpEntity<>(requestBody.toJSONString(), headers);
        try {
            ResponseEntity<String> response = restTemplate.exchange(
                    savedConfig.getApiUrl(),
                    HttpMethod.POST,
                    entity,
                    String.class
            );

            if (response.getStatusCode().is2xxSuccessful()) {
                String body = response.getBody();
                logger.info("收到 API 响应: {}", body);

                if (body == null || body.trim().isEmpty()) {
                    logger.error("API 返回空响应");
                    return "API 返回空响应，请检查 API Key 或网络";
                }

                JSONObject responseBody = JSONObject.parseObject(body);
                JSONObject output = responseBody.getJSONObject("output");
                if (output != null && "PENDING".equals(output.getString("task_status"))) {
                    String taskId = output.getString("task_id");
                    savedConfig.setTaskId(taskId);
                    repository.save(savedConfig);
                    logger.info("任务创建成功，任务 ID: {}", taskId);
                    return taskId;
                } else {
                    logger.error("任务创建失败，响应: {}", body);
                    return "任务创建失败，状态不是 PENDING";
                }
            } else {
                logger.error("API 返回错误状态码: {}", response.getStatusCodeValue());
                return "API 调用失败，状态码: " + response.getStatusCodeValue();
            }
        } catch (Exception e) {
            logger.error("调用 API 失败: {}", e.getMessage(), e);
            return "调用 API 失败，请检查日志";
        }
    }

    @Override
    public String queryTaskResult(Long configId) {
        // 大白话注释：根据配置 ID 从数据库查配置
        BaiLianwanx2Config config = repository.findById(configId).orElse(null);
        if (config == null || config.getTaskId() == null) {
            logger.error("查询任务结果失败：配置 ID {} 不存在或任务 ID 为空", configId);
            return "配置不存在或任务未创建";
        }
        return queryTaskResultByTaskId(config.getTaskId()); // 调用新方法
    }

    // 大白话注释：根据 taskId 查询任务结果
    @Override
    public String queryTaskResultByTaskId(String taskId) {
        // 大白话注释：先从数据库找对应的配置，拿到 apiKey
        BaiLianwanx2Config config = repository.findAll().stream()
                .filter(c -> taskId.equals(c.getTaskId()))
                .findFirst()
                .orElse(null);
        if (config == null || config.getApiKey() == null) {
            logger.error("查询任务结果失败：任务 ID {} 对应的配置不存在或 API Key 为空", taskId);
            return "任务不存在或配置错误";
        }

        // 构造请求头
        HttpHeaders headers = new HttpHeaders();
        headers.add("Authorization", "Bearer " + config.getApiKey());

        // 大白话注释：调用通义万相的查询接口，注意用 HTTPS
        String url = "https://dashscope.aliyuncs.com/api/v1/tasks/" + taskId; // 修改为 HTTPS
        HttpEntity<String> entity = new HttpEntity<>(headers);

        try {
            ResponseEntity<String> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    entity,
                    String.class
            );

            // 大白话注释：检查响应状态码和内容
            if (response.getStatusCode().is2xxSuccessful()) {
                String body = response.getBody();
                if (body == null || body.trim().isEmpty()) {
                    logger.error("查询任务结果失败：任务 ID {} 的 API 返回空响应", taskId);
                    return "查询失败：API 返回空响应";
                }
                logger.info("查询任务结果成功，任务 ID: {}, 响应: {}", taskId, body);
                return body; // 直接返回查询结果给前端
            } else {
                logger.error("查询任务结果失败：任务 ID {} 的 API 返回状态码 {}", taskId, response.getStatusCodeValue());
                return "查询失败：API 返回状态码 " + response.getStatusCodeValue();
            }
        } catch (Exception e) {
            logger.error("查询任务结果失败，任务 ID: {}，错误: {}", taskId, e.getMessage(), e);
            return "查询失败，请检查日志";
        }
    }
}