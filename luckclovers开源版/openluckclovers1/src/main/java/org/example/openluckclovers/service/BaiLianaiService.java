package org.example.openluckclovers.service;

import org.example.openluckclovers.config.BaiLianaiConfig;
import org.example.openluckclovers.config.ChatHistory;
import org.example.openluckclovers.repository.BaiLianaiConfigRepository;
import org.example.openluckclovers.repository.ChatHistoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class BaiLianaiService {

    @Autowired
    private BaiLianaiConfigRepository configRepository;

    @Autowired
    private ChatHistoryRepository historyRepository;

    public BaiLianaiConfig saveConfig(BaiLianaiConfig config) {
        // 大白话注释：保存配置到数据库，新配置就设创建时间
        if (config.getId() == null) {
            config.setCreateTime(LocalDateTime.now());
        }
        config.setUpdateTime(LocalDateTime.now());
        return configRepository.save(config);
    }

    public List<BaiLianaiConfig> getAllConfigs() {
        // 大白话注释：返回所有配置给前端
        return configRepository.findAll();
    }

    public BaiLianaiConfig getConfigById(Long id) {
        // 大白话注释：根据ID找配置，没找到就返回null
        return configRepository.findById(id).orElse(null);
    }

    public void deleteConfig(Long id) {
        // 大白话注释：根据ID删除配置
        configRepository.deleteById(id);
    }

    public List<ChatHistory> getChatHistory(Long configId, String sessionId) {
        // 大白话注释：根据模型ID和会话ID拿聊天记录
        return historyRepository.findByConfigIdAndSessionId(configId, sessionId);
    }

    public void saveChatHistory(ChatHistory history) {
        // 大白话注释：保存聊天记录，新记录就设创建时间
        if (history.getId() == null) {
            history.setCreateTime(LocalDateTime.now());
        }
        System.out.println("保存聊天记录: configId=" + history.getConfigId() +
                ", userMessage=" + history.getUserMessage() +
                ", modelMessage=" + history.getModelMessage() +
                ", requestModel=" + history.getRequestModel()); // 大白话注释：加了请求模型的日志
        historyRepository.save(history);
    }
}