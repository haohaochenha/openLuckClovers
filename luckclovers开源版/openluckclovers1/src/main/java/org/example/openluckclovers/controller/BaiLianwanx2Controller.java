package org.example.openluckclovers.controller;

import org.example.openluckclovers.config.BaiLianwanx2Config;
import org.example.openluckclovers.repository.BaiLianwanx2Repository;
import org.example.openluckclovers.service.BaiLianwanx2Service;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

// 控制器，处理 HTTP 请求
@RestController
@RequestMapping("/bailianwanx2")
public class BaiLianwanx2Controller {

    @Autowired
    private BaiLianwanx2Service service;

    @Autowired
    private BaiLianwanx2Repository repository;

    // 大白话注释：获取所有配置的接口，给前端列表用
    @GetMapping("/configs")
    public List<BaiLianwanx2Config> getAllConfigs() {
        return repository.findAll();
    }

    // 大白话注释：删除配置的接口，给前端删除按钮用
    @DeleteMapping("/config/{id}")
    public void deleteConfig(@PathVariable Long id) {
        repository.deleteById(id);
    }

    // 大白话注释：创建任务的接口，前端传配置过来
    @PostMapping("/bailianwanx2CreateTask")
    public String createTask(@RequestBody BaiLianwanx2Config config) {
        return service.createTask(config);
    }

    // 大白话注释：原来的查询接口，保留给其他地方用
    @GetMapping("/bailianwanx2QueryTask/{configId}")
    public String queryTaskResult(@PathVariable Long configId) {
        return service.queryTaskResult(configId);
    }

    // 大白话注释：新增的查询接口，用 taskId 查询任务结果
    @GetMapping("/bailianwanx2QueryTaskByTaskId/{taskId}")
    public String queryTaskResultByTaskId(@PathVariable String taskId) {
        return service.queryTaskResultByTaskId(taskId);
    }
}