
# openLuckClovers 项目文档

## 项目介绍

**openLuckClovers** 是一个基于百炼大模型（通义万相-文生图2.0-Turbo 和通义千问大语言模型）的通用配置平台，支持代码块展示，并集成了 Markdown 转 HTTP 格式的功能。项目旨在对接当前热门的 API 接口，未来会持续开发和扩展更多功能。

- **核心功能**：
  - 支持大模型调用、文生图、聊天记录管理。
  - 支持 Markdown 渲染，代码高亮，流式输出。
- **技术亮点**：
  - 前端使用 Markdown 渲染，支持代码高亮。
  - 后端基于 Java 17 开发，集成大模型 API。
- **未来计划**：
  - 对接更多主流大模型。
  - 添加用户登录逻辑。

## 软件架构

- **前端**：HTML + CSS + JavaScript，基于 Markdown 渲染，支持代码高亮和流式输出。
- **后端**：基于 Java 17 开发，使用 Spring Boot 框架（如果不是 Spring Boot，可以告诉我，我会调整）。
- **数据库**：MySQL，存储模型配置、聊天记录等数据。
- **API 对接**：支持百炼大模型和通义千问的 API 调用，未来会扩展更多接口。

## 安装教程

1. **创建数据库**  
   在 MySQL 中创建一个名为 `openluckclovers` 的数据库：
   ```sql
   CREATE DATABASE openluckclovers DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```
   然后执行项目提供的建表语句，语句文件位于 `mysql_commands.sql`（建议你将之前的建表语句整理到这个文件中，方便用户直接导入）：
   ```bash
   mysql -u 用户名 -p openluckclovers < mysql_commands.sql
   ```

2. **配置后端数据库连接**  
   打开后端配置文件（例如 `application.yml` 或 `application.properties`），修改数据库连接信息：
   ```yaml
   spring:
     datasource:
       url: jdbc:mysql://localhost:3306/openluckclovers?useUnicode=true&characterEncoding=UTF-8
       username: 你的数据库用户名
       password: 你的数据库密码
       driver-class-name: com.mysql.cj.jdbc.Driver
   ```

3. **启动项目**  
   - 确保你的环境已安装 Java 17 和 Maven。
   - 在项目根目录下运行以下命令：
     ```bash
     mvn clean install
     mvn spring-boot:run
     ```
   - 启动后，访问本地地址：`http://localhost:8080`（端口号根据你的配置可能不同）。

## 使用说明

1. **运行环境**  
   - 项目使用 Java 17 开发，请确保你的 JDK 版本符合要求。
   - 目前未实现用户登录功能，所有功能对所有用户开放。

2. **核心功能**  
   - **聊天功能**：通过前端界面与大模型交互，支持 Markdown 格式输入和输出。
   - **文生图**：通过 `bailianwanx2.html` 页面调用通义万相 API 生成图片。
   - **模型配置**：支持动态加载模型列表，选择不同模型进行对话。

3. **后续计划**  
   - 添加用户登录和权限管理。
   - 集成更多主流大模型（如 GPT、LLaMA 等）。
   - 优化性能，支持更大规模的并发请求。

4. **遇到问题**  
   如果有任何疑问，可以添加我的微信：**15127988973**，我会尽快帮你解决。

## 参与贡献

欢迎大家一起参与 openLuckClovers 的开发！以下是贡献流程：

1. Fork 本仓库到你的 Gitee 账号。
2. 新建一个分支，分支名建议为 `Feat_xxx`（例如 `Feat_add_login`）。
3. 在新分支上提交你的代码。
4. 创建 Pull Request，描述你的改动内容，等待审核。

## 特技与资源

1. **多语言支持**  
   项目支持多语言 README 文件，例如 `Readme_en.md`（英文）、`Readme_zh.md`（中文），方便不同语言的用户阅读。


## 联系方式

- **微信**：15127988973  
<!-- 大白话注释：这是一张项目截图，用 HTML 控制大小 -->
<img src="/zhaopian/b241e74c092e923942072c09e911dd6.jpg" alt="项目截图" width="300" height="500" />
<img src="/zhaopian/b22c24986e02aa00ce7b15e7d6f1c16.jpg" alt="项目截图" width="300" height="500" />







