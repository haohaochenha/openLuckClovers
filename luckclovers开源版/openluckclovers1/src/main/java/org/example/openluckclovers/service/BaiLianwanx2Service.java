package org.example.openluckclovers.service;

import org.example.openluckclovers.config.BaiLianwanx2Config;

// 服务接口，定义业务逻辑
public interface BaiLianwanx2Service {
    // 创建任务：保存配置并调用通义万相 API 生成图片
    String createTask(BaiLianwanx2Config config);

    // 查询任务结果：根据任务 ID 查询生成结果
    String queryTaskResult(Long configId);

    // 大白话注释：新增方法，根据 taskId 查询任务结果
    String queryTaskResultByTaskId(String taskId);
}