package org.example.openluckclovers.config;

import lombok.Data;
import javax.persistence.*;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "bailianwanx2_config")
public class BaiLianwanx2Config {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "model", nullable = false)
    private String model;

    @Column(name = "api_key", nullable = false)
    private String apiKey;

    @Column(name = "prompt", length = 800)
    private String prompt;

    @Column(name = "negative_prompt", length = 500)
    private String negativePrompt;

    @Column(name = "size")
    private String size;

    @Column(name = "n")
    private Integer n;

    @Column(name = "seed")
    private Long seed;

    @Column(name = "watermark")
    private Integer watermark;

    @Column(name = "create_time", nullable = false)
    private LocalDateTime createTime;

    @Column(name = "update_time")
    private LocalDateTime updateTime;

    @Column(name = "task_id")
    private String taskId;

    // 大白话注释：API URL 字段，从前端动态读取，不设置默认值
    @Column(name = "api_url")
    private String apiUrl;
}