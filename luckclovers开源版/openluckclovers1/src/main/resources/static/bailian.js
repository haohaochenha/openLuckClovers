// 文件：bailian.js
document.addEventListener('DOMContentLoaded', () => {
    // 大白话注释：页面加载完就跑这段代码
    const hamburgerMenu = document.querySelector('.hamburger-menu');
    const leftSidebar = document.querySelector('.left-sidebar');
    const backIcon = document.getElementById('backIcon');
    const modelIcon = document.getElementById('modelIcon');
    const modelList = document.getElementById('modelList');
    const modelConfig = document.getElementById('modelConfig');
    const addModelBtn = document.getElementById('addModelBtn');

    // 大白话注释：给拖拽框加事件需要的元素
    const dropZone = document.getElementById('knowledgeDropZone');
    const fileInput = document.getElementById('knowledgeFile');
    const fileNameDisplay = document.getElementById('fileName');
    let selectedFile = null;

    // 大白话注释：图片生成模型相关的元素
    const addImageModelBtn = document.getElementById('addImageModelBtn');
    const imageModelList = document.getElementById('imageModelList');
    const imageModelConfig = document.getElementById('imageModelConfig');

    // 汉堡菜单控制侧边栏
    hamburgerMenu.addEventListener('click', () => {
        leftSidebar.classList.toggle('active');
    });

    // 返回主页面
    backIcon.addEventListener('click', () => {
        window.location.href = 'index.html';
    });

    // 切换到模型管理界面
    modelIcon.addEventListener('click', () => {
        modelIcon.classList.add('active');
        loadModelList();
    });

    // 大白话注释：加载模型列表
    function loadModelList() {
        // 大白话注释：先清空列表，确保不会重复渲染
        modelList.innerHTML = '';
        fetch('/api/bailianai/configs')
            .then(response => response.json())
            .then(configs => {
                if (configs && configs.length > 0) {
                    configs.forEach(config => {
                        if (config.name && config.name !== 'undefined') {
                            const div = document.createElement('div');
                            div.classList.add('model-item');
                            div.innerHTML = `
                            <span>${config.name}</span>
                            <button onclick="editModel(${config.id})" class="edit-btn"><i class="fas fa-edit"></i></button>
                            <button onclick="deleteModel(${config.id})" class="delete-btn"><i class="fas fa-trash"></i></button>
                        `;
                            modelList.appendChild(div);
                        }
                    });
                } else {
                    // 大白话注释：如果没有数据，显示“暂无模型”
                    modelList.innerHTML = '<div class="no-models">暂无模型</div>';
                }
            })
            .catch(error => {
                console.error('加载模型列表失败:', error);
                modelList.innerHTML = '<div class="no-models">加载失败，请稍后再试</div>';
            });
    }

    window.deleteModel = function(id) {
        if (confirm('确定要删除这个模型吗？')) {
            fetch(`/api/bailianai/config/${id}`, {
                method: 'DELETE'
            })
                .then(() => {
                    alert('删除成功');
                    loadModelList();
                })
                .catch(error => {
                    console.error('删除模型失败:', error);
                    alert('删除失败，请稍后再试');
                });
        }
    };

    // 大白话注释：编辑模型时加载配置，包括知识库内容
    window.editModel = function(id) {
        fetch(`/api/bailianai/config/${id}`)
            .then(response => response.json())
            .then(config => {
                document.getElementById('modelName').value = config.modelName || '';
                document.getElementById('apiUrl').value = config.apiUrl || '';
                document.getElementById('apiKey').value = config.apiKey || '';
                document.getElementById('nickName').value = config.name || '';
                document.getElementById('personality').value = config.personality || '';
                fileNameDisplay.textContent = config.knowledgeBaseContent || ''; // 显示已有知识库内容
                selectedFile = null; // 重置文件选择
                modelConfig.dataset.id = id;
                modelConfig.style.display = 'block';
            });
    };

    // 大白话注释：保存模型配置，支持知识库文件内容上传
    window.saveModelConfig = function() {
        const nickName = document.getElementById('nickName').value.trim();
        if (!nickName) {
            alert('模型昵称不能为空！');
            return;
        }
        const config = {
            id: modelConfig.dataset.id || null,
            modelName: document.getElementById('modelName').value,
            apiUrl: document.getElementById('apiUrl').value,
            apiKey: document.getElementById('apiKey').value,
            name: nickName,
            personality: document.getElementById('personality').value
        };

        // 大白话注释：如果有新选的文件，就先上传再保存
        if (selectedFile) {
            const formData = new FormData();
            formData.append('file', selectedFile);
            formData.append('modelName', nickName);
            fetch('/api/bailianai/upload-knowledge', {
                method: 'POST',
                body: formData
            })
                .then(response => response.json())
                .then(data => {
                    config.knowledgeBaseContent = data.content; // 后端返回的文件内容
                    saveConfig(config);
                })
                .catch(error => {
                    console.error('上传知识库失败:', error);
                    alert('知识库上传失败，请稍后再试');
                });
        } else {
            // 大白话注释：没新文件就用原来的内容（如果有的话）
            config.knowledgeBaseContent = fileNameDisplay.textContent || null;
            saveConfig(config);
        }
    };

    // 大白话注释：单独抽出来保存配置的函数
    function saveConfig(config) {
        fetch('/api/bailianai/config', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(config)
        })
            .then(response => response.json())
            .then(() => {
                alert('保存成功');
                loadModelList();
                closeModelConfig();
            })
            .catch(error => {
                console.error('保存模型失败:', error);
                alert('保存失败，请稍后再试');
            });
    }

    // 大白话注释：关闭配置窗口，重置所有输入包括文件显示
    window.closeModelConfig = function() {
        modelConfig.style.display = 'none';
        modelConfig.dataset.id = '';
        document.getElementById('modelName').value = '';
        document.getElementById('apiUrl').value = '';
        document.getElementById('apiKey').value = '';
        document.getElementById('nickName').value = '';
        document.getElementById('personality').value = '';
        fileNameDisplay.textContent = '';
        selectedFile = null;
    };

    addModelBtn.addEventListener('click', () => {
        modelConfig.style.display = 'block';
    });

    // 大白话注释：给拖拽框加事件，支持拖放和点击上传
    dropZone.addEventListener('click', () => fileInput.click());
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });
    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('dragover');
    });
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        selectedFile = e.dataTransfer.files[0];
        fileNameDisplay.textContent = selectedFile ? selectedFile.name : '';
    });
    fileInput.addEventListener('change', () => {
        selectedFile = fileInput.files[0];
        fileNameDisplay.textContent = selectedFile ? selectedFile.name : '';
    });

    // 大白话注释：加载图片生成模型列表
    function loadImageModelList() {
        // 大白话注释：先清空列表，确保不会重复渲染
        imageModelList.innerHTML = '';
        fetch('http://localhost:8080/bailianwanx2/configs') // 假设你会加一个获取所有配置的接口
            .then(response => response.json())
            .then(configs => {
                if (configs && configs.length > 0) {
                    configs.forEach(config => {
                        if (config.model && config.model !== 'undefined') { // 用 model 字段作为显示名称
                            const div = document.createElement('div');
                            div.classList.add('model-item');
                            div.innerHTML = `
                            <span>${config.model}</span>
                            <button onclick="editImageModel(${config.id})" class="edit-btn"><i class="fas fa-edit"></i></button>
                            <button onclick="deleteImageModel(${config.id})" class="delete-btn"><i class="fas fa-trash"></i></button>
                        `;
                            imageModelList.appendChild(div);
                        }
                    });
                } else {
                    // 大白话注释：如果没有数据，显示“暂无图片模型”
                    imageModelList.innerHTML = '<div class="no-models">暂无图片模型</div>';
                }
            })
            .catch(error => {
                console.error('加载图片模型列表失败:', error);
                imageModelList.innerHTML = '<div class="no-models">加载失败，请稍后再试</div>';
            });
    }

    // 大白话注释：删除图片模型
    window.deleteImageModel = function(id) {
        if (confirm('确定要删除这个图片模型吗？')) {
            fetch(`http://localhost:8080/bailianwanx2/config/${id}`, {
                method: 'DELETE'
            })
                .then(() => {
                    alert('删除成功');
                    loadImageModelList();
                })
                .catch(error => {
                    console.error('删除图片模型失败:', error);
                    alert('删除失败，请稍后再试');
                });
        }
    }
    // 大白话注释：编辑图片模型时加载配置
    window.editImageModel = function(id) {
        fetch(`http://localhost:8080/bailianwanx2/bailianwanx2QueryTask/${id}`) // 用你的查询接口
            .then(response => response.json())
            .then(config => {
                // 大白话注释：加载基本配置
                document.getElementById('imageModelName').value = config.model || '';
                document.getElementById('imageApiUrl').value = 'http://dashscope.aliyuncs.com/api/v1/services/aigc/text2image/image-synthesis'; // 固定为你的 API 地址
                document.getElementById('imageApiKey').value = config.apiKey || '';
                document.getElementById('imageNickName').value = config.model || ''; // 用 model 作为昵称
                // 大白话注释：加载图文生成参数
                document.getElementById('negativePrompt').value = config.negativePrompt || '';
                document.getElementById('imageSize').value = config.size || '1024*1024';
                document.getElementById('imageCount').value = config.n || 4;
                document.getElementById('seed').value = config.seed || '';
                document.getElementById('promptExtend').checked = true; // 默认开启，和后端一致
                document.getElementById('watermark').checked = config.watermark === 1; // 0 或 1 转为布尔值
                imageModelConfig.dataset.id = id;
                imageModelConfig.style.display = 'block';
            })
            .catch(error => {
                console.error('加载图片模型配置失败:', error);
                alert('加载失败，请稍后再试');
            });
    }

    window.saveImageModelConfig = function() {
        const nickName = document.getElementById('imageNickName').value.trim();
        const modelName = document.getElementById('imageModelName').value.trim();
        const apiKey = document.getElementById('imageApiKey').value.trim();
        const apiUrl = document.getElementById('imageApiUrl').value.trim();

        if (!nickName || !modelName || !apiKey || !apiUrl) {
            alert('图片模型昵称、模型名称、API密钥和API地址不能为空！');
            return;
        }

        const config = {
            id: imageModelConfig.dataset.id || null,
            model: modelName,
            apiKey: apiKey,
            apiUrl: apiUrl,
            negativePrompt: document.getElementById('negativePrompt').value || null,
            size: document.getElementById('imageSize').value || '1024*1024',
            n: parseInt(document.getElementById('imageCount').value) || 4,
            seed: parseInt(document.getElementById('seed').value) || null,
            watermark: document.getElementById('watermark').checked ? 1 : 0
        };

        console.log('发送的配置数据:', config);

        fetch('http://localhost:8080/bailianwanx2/bailianwanx2CreateTask', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(config)
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('保存失败，状态码: ' + response.status);
                }
                return response.text();
            })
            .then(result => {
                if (result === '模型名称、API密钥或API地址不能为空') {
                    alert('保存失败：模型名称、API密钥或API地址不能为空');
                } else {
                    alert('保存成功，配置 ID: ' + result);
                    loadImageModelList();
                    closeImageModelConfig(); // 大白话注释：这里调用关闭函数
                }
            })
            .catch(error => {
                console.error('保存图片模型失败:', error);
                alert('保存失败，请检查控制台日志或后端服务！');
            });
    };
// 大白话注释：编辑图片模型时加载配置
    window.editImageModel = function(id) {
        fetch(`http://localhost:8080/bailianwanx2/bailianwanx2QueryTask/${id}`)
            .then(response => response.json())
            .then(config => {
                document.getElementById('imageModelName').value = config.model || '';
                document.getElementById('imageApiUrl').value = config.apiUrl || ''; // 大白话注释：加载保存的 apiUrl
                document.getElementById('imageApiKey').value = config.apiKey || '';
                document.getElementById('imageNickName').value = config.model || '';
                document.getElementById('negativePrompt').value = config.negativePrompt || '';
                document.getElementById('imageSize').value = config.size || '1024*1024';
                document.getElementById('imageCount').value = config.n || 4;
                document.getElementById('seed').value = config.seed || '';
                document.getElementById('promptExtend').checked = true;
                document.getElementById('watermark').checked = config.watermark === 1;
                imageModelConfig.dataset.id = id;
                imageModelConfig.style.display = 'block';
            })
            .catch(error => {
                console.error('加载图片模型配置失败:', error);
                alert('加载失败，请稍后再试');
            });
    };
    window.closeImageModelConfig = function() {
        imageModelConfig.style.display = 'none';
        console.log('已关闭图片模型配置窗口，imageModelConfig 应该隐藏');
        imageModelConfig.dataset.id = '';
        document.getElementById('imageModelName').value = '';
        document.getElementById('imageApiUrl').value = '';
        document.getElementById('imageApiKey').value = '';
        document.getElementById('imageNickName').value = '';
        // 大白话注释：去掉对 prompt 的操作，因为这里没有这个输入框
        document.getElementById('negativePrompt').value = '';
        document.getElementById('imageSize').value = '';
        document.getElementById('imageCount').value = '';
        document.getElementById('seed').value = '';
        document.getElementById('promptExtend').checked = true;
        document.getElementById('watermark').checked = false;
    };

    // 大白话注释：点击添加图片模型按钮，打开配置窗口
    addImageModelBtn.addEventListener('click', () => {
        imageModelConfig.style.display = 'block';
    });
    // 大白话注释：点击添加图片模型按钮，打开配置窗口
    if (!addImageModelBtn) {
        console.error('addImageModelBtn 元素未找到！请检查 HTML 中是否有 id="addImageModelBtn" 的元素');
    } else {
        console.log('addImageModelBtn 元素已找到，绑定点击事件');
        addImageModelBtn.addEventListener('click', () => {
            // 大白话注释：确保 imageModelConfig 元素存在
            if (!imageModelConfig) {
                console.error('imageModelConfig 元素未找到！请检查 HTML 中是否有 id="imageModelConfig" 的元素');
                return;
            }
            // 大白话注释：强制显示配置窗口
            imageModelConfig.style.display = 'block';
            imageModelConfig.style.visibility = 'visible';
            imageModelConfig.style.opacity = '1';
            console.log('已点击添加图片模型按钮，imageModelConfig 应该显示，当前 display:', imageModelConfig.style.display);
        });
    }

    // 大白话注释：初始化加载模型列表和图片模型列表
    loadModelList();
    loadImageModelList();
});