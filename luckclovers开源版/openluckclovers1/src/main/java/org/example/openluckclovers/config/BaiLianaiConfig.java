package org.example.openluckclovers.config;

import lombok.Data;
import javax.persistence.*;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "bailianai_config")
public class BaiLianaiConfig {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "api_key", nullable = false)
    private String apiKey;

    @Column(name = "model_name", nullable = false)
    private String modelName;

    @Column(name = "api_url", nullable = false)
    private String apiUrl;

    @Column(name = "personality")
    private String personality;

    @Column(name = "create_time")
    private LocalDateTime createTime;

    @Column(name = "update_time")
    private LocalDateTime updateTime;

    // 大白话注释：新增字段存知识库文件内容，可以为空
    @Column(name = "knowledge_base_content")
    private String knowledgeBaseContent;
}