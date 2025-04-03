// 文件：bailianwanx2.js
document.addEventListener('DOMContentLoaded', () => {
    // 大白话注释：页面加载完就跑这段代码
    const hamburgerMenu = document.querySelector('.hamburger-menu');
    const leftSidebar = document.querySelector('.left-sidebar');
    const imageGenArea = document.getElementById('imageGenArea');
    const chatIcon = document.getElementById('chatIcon');
    const settingsIcon = document.getElementById('settingsIcon');
    const imageGenIcon = document.getElementById('imageGenIcon');
    const modelSelector = document.getElementById('modelSelector');
    const promptInput = document.getElementById('promptInput');
    const negativePromptInput = document.getElementById('negativePromptInput');
    const generateButton = document.querySelector('.generate-btn');
    let currentConfigId = null;

    // 汉堡菜单控制侧边栏
    hamburgerMenu.addEventListener('click', () => {
        leftSidebar.classList.toggle('active');
    });

    // 返回聊天页面
    chatIcon.addEventListener('click', () => {
        window.location.href = 'index.html';
    });

    // 返回设置页面
    settingsIcon.addEventListener('click', () => {
        window.location.href = 'index.html#settings';
    });

    // 大白话注释：加载图片模型列表到下拉框
    function loadModelList() {
        fetch('http://localhost:8080/bailianwanx2/configs')
            .then(response => response.json())
            .then(configs => {
                modelSelector.innerHTML = '<option value="">选择图片模型</option>';
                if (configs && configs.length > 0) {
                    configs.forEach(config => {
                        if (config.model && config.model !== 'undefined') {
                            const option = document.createElement('option');
                            option.value = config.id;
                            option.text = config.model;
                            modelSelector.appendChild(option);
                        }
                    });
                }
            })
            .catch(error => console.error('加载图片模型列表失败:', error));
    }

    // 模型选择事件
    modelSelector.addEventListener('change', (e) => {
        currentConfigId = e.target.value;
        if (!currentConfigId) {
            imageGenArea.innerHTML = '<div class="image-message"><p>请选择一个图片模型开始生成</p></div>';
        }
    });

    // 生成图片逻辑
    generateButton.addEventListener('click', () => {
        const promptText = promptInput.value.trim();
        const negativePromptText = negativePromptInput.value.trim();
        if (promptText && currentConfigId) {
            const userMessage = document.createElement('div');
            userMessage.classList.add('image-message', 'user-prompt');
            userMessage.innerHTML = `<p>${promptText}${negativePromptText ? ' (反向提示词：' + negativePromptText + ')' : ''}</p>`;
            imageGenArea.appendChild(userMessage);

            generateImage(promptText, negativePromptText, currentConfigId);
            promptInput.value = '';
            negativePromptInput.value = '';
            imageGenArea.scrollTop = imageGenArea.scrollHeight;
        } else if (!promptText) {
            alert('请输入正向提示词！');
        } else if (!currentConfigId) {
            alert('请先选择一个图片模型！');
        }
    });

    // 文件：bailianwanx2.js
// 修改 generateImage 函数
    function generateImage(prompt, negativePrompt, configId) {
        const generatingMessage = document.createElement('div');
        generatingMessage.classList.add('image-message', 'bot-image');
        generatingMessage.innerHTML = '<p>生成中...</p>';
        imageGenArea.appendChild(generatingMessage);

        fetch('http://localhost:8080/bailianwanx2/bailianwanx2CreateTask', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: configId,
                prompt: prompt,
                negativePrompt: negativePrompt || null
            })
        })
            .then(response => response.text())
            .then(taskId => {
                pollTaskResult(taskId, generatingMessage); // 直接传 taskId
            })
            .catch(error => {
                console.error('生成图片失败:', error);
                generatingMessage.innerHTML = '<p>生成失败，请稍后再试</p>';
            });
    }

// 修改 pollTaskResult 函数
    // 文件：bailianwanx2.js
// 大白话注释：轮询任务结果
    function pollTaskResult(taskId, messageElement) {
        const interval = setInterval(() => {
            fetch(`http://localhost:8080/bailianwanx2/bailianwanx2QueryTaskByTaskId/${taskId}`)
                .then(response => {
                    if (!response.ok) {
                        throw new Error('网络请求失败，状态码: ' + response.status);
                    }
                    return response.text(); // 先获取文本，稍后判断是否为 JSON
                })
                .then(data => {
                    // 大白话注释：检查返回的数据是不是 JSON 格式
                    let result;
                    try {
                        result = JSON.parse(data);
                    } catch (e) {
                        console.error('解析 JSON 失败:', data);
                        clearInterval(interval);
                        messageElement.innerHTML = '<p>查询失败：' + data + '</p>';
                        return;
                    }

                    if (result.output && result.output.task_status === 'SUCCEEDED') {
                        clearInterval(interval);
                        const imageUrl = result.output.results[0].url; // 假设返回的图片 URL 在这里
                        messageElement.innerHTML = `<p>生成完成！</p><img src="${imageUrl}" alt="生成图片">`;
                        imageGenArea.scrollTop = imageGenArea.scrollHeight;
                    } else if (result.output && result.output.task_status === 'FAILED') {
                        clearInterval(interval);
                        messageElement.innerHTML = '<p>生成失败：' + (result.output.message || '未知错误') + '</p>';
                    }
                })
                .catch(error => {
                    console.error('查询任务结果失败:', error);
                    clearInterval(interval);
                    messageElement.innerHTML = '<p>查询失败，请稍后再试</p>';
                });
        }, 2000); // 每 2 秒轮询一次
    }

    // 初始化加载模型列表
    loadModelList();
});