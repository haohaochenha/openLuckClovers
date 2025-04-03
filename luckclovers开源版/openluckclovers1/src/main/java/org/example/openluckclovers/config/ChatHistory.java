package org.example.openluckclovers.config;

import lombok.Data;
import javax.persistence.*;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "chat_history")
public class ChatHistory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "config_id", nullable = false)
    private Long configId;

    @Column(name = "session_id", nullable = false)
    private String sessionId;

    @Column(name = "user_message")
    private String userMessage;

    @Column(name = "model_message")
    private String modelMessage;

    // 大白话注释：新增一列存原始的大模型回答
    @Column(name = "raw_model_message")
    private String rawModelMessage;

    // 大白话注释：新增一列存请求的模型名
    @Column(name = "request_model")
    private String requestModel;

    @Column(name = "create_time")
    private LocalDateTime createTime;
}