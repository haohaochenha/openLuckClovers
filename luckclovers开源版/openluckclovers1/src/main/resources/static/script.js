// 文件：script.js
document.addEventListener('DOMContentLoaded', () => {
  // 大白话注释：页面加载完就跑这段代码
  const hamburgerMenu = document.querySelector('.hamburger-menu');
  const leftSidebar = document.querySelector('.left-sidebar');
  const chatArea = document.getElementById('chatArea');
  const settingsPanel = document.getElementById('settingsPanel');
  const chatIcon = document.getElementById('chatIcon');
  const settingsIcon = document.getElementById('settingsIcon');
  const modelSelector = document.getElementById('modelSelector');
  let currentConfigId = null;

  // 大白话注释：页面加载时显示欢迎弹窗
  const welcomeModal = document.getElementById('welcomeModal');
  if (welcomeModal) {
    // 大白话注释：延迟 0ms 确保 DOM 渲染完成后再显示弹窗
    setTimeout(() => {
      welcomeModal.style.display = 'flex'; // 打开页面就显示
    }, 0);
  } else {
    console.error('找不到 welcomeModal 元素，请检查 HTML！');
  }

  // 大白话注释：新增图像生成图标的点击事件
  const imageGenIcon = document.getElementById('imageGenIcon');
  if (!imageGenIcon) {
    console.error('找不到 imageGenIcon 元素，请检查 HTML 中的 ID 是否正确！');
  } else {
    imageGenIcon.addEventListener('click', () => {
      console.log('点击了图像生成图标，即将跳转到 bailianwanx2.html');
      try {
        window.location.href = 'bailianwanx2.html';
      } catch (error) {
        console.error('跳转失败:', error);
        alert('跳转到图像生成页面失败，请检查文件路径或服务器配置！');
      }
    });
  }

  // 大白话注释：定义主类数据，未来扩展就在这里加
  const categories = [
    { name: '百炼大模型', icon: 'fas fa-robot', url: 'bailian.html' },
    { name: '聊天', icon: 'fas fa-comment', url: '#' }
  ];

  // 汉堡菜单控制侧边栏
  hamburgerMenu.addEventListener('click', () => {
    leftSidebar.classList.toggle('active');
  });

  // 切换到聊天界面
  chatIcon.addEventListener('click', () => {
    chatArea.style.display = 'block';
    settingsPanel.style.display = 'none';
    chatIcon.classList.add('active');
    settingsIcon.classList.remove('active');
  });

  // 切换到设置界面
  settingsIcon.addEventListener('click', () => {
    chatArea.style.display = 'none';
    settingsPanel.style.display = 'block';
    chatIcon.classList.remove('active');
    settingsIcon.classList.add('active');
    loadCategoryList();
  });

  // 大白话注释：加载主类列表
  function loadCategoryList() {
    const categoryList = document.getElementById('categoryList');
    categoryList.innerHTML = '';
    categories.forEach(category => {
      const div = document.createElement('div');
      div.classList.add('category-item');
      div.innerHTML = `
        <i class="${category.icon}"></i>
        <span>${category.name}</span>
      `;
      div.addEventListener('click', () => {
        if (category.url) window.location.href = category.url;
      });
      categoryList.appendChild(div);
    });
  }

  // 大白话注释：加载模型列表到下拉框
  function loadModelList() {
    fetch('/api/bailianai/configs')
        .then(response => response.json())
        .then(configs => {
          modelSelector.innerHTML = '<option value="">选择模型</option>';
          if (configs && configs.length > 0) {
            configs.forEach(config => {
              if (config.name && config.name !== 'undefined') {
                const option = document.createElement('option');
                option.value = config.id;
                option.text = config.name;
                modelSelector.appendChild(option);
              }
            });
          }
        })
        .catch(error => console.error('加载模型列表失败:', error));
  }

  // 模型选择事件
  modelSelector.addEventListener('change', (e) => {
    currentConfigId = e.target.value;
    if (currentConfigId) {
      loadChatHistory(currentConfigId);
    } else {
      chatArea.innerHTML = '<div class="message"><p>请选择一个模型开始对话</p></div>';
    }
  });

  // 发送消息逻辑
  const sendButton = document.querySelector('.send');
  const inputField = document.querySelector('.input-area input');
  sendButton.addEventListener('click', () => {
    const messageText = inputField.value.trim();
    if (messageText && currentConfigId) {
      const newMessage = document.createElement('div');
      newMessage.classList.add('message', 'user-message');
      newMessage.innerHTML = marked.parse(messageText); // 大白话注释：用户消息也支持 Markdown
      chatArea.appendChild(newMessage);
      saveMessage(currentConfigId, messageText, null);
      streamResponse(messageText, chatArea, currentConfigId);
      inputField.value = '';
      chatArea.scrollTop = chatArea.scrollHeight;
    } else if (!currentConfigId) {
      alert('请先选择一个模型！');
    }
  });

  // 回车发送
  inputField.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendButton.click();
  });

  // 大白话注释：加载聊天记录，展示原始数据并用 Markdown 渲染
  function loadChatHistory(configId) {
    fetch(`/api/bailianai/history?configId=${configId}`)
        .then(response => response.json())
        .then(history => {
          chatArea.innerHTML = '';
          history.forEach(item => {
            if (item.userMessage) {
              const userMsg = document.createElement('div');
              userMsg.classList.add('message', 'user-message');
              const messageContent = marked.parse(item.userMessage);
              // 大白话注释：给用户消息加一个复制按钮
              userMsg.innerHTML = `
            <div class="message-content">${messageContent}</div>
            <button class="copy-text-btn" onclick="copyMessageText(this, '${encodeURIComponent(item.userMessage)}')">
              <i class="fas fa-copy"></i>
            </button>
          `;
              chatArea.appendChild(userMsg);
            }
            if (item.rawModelMessage) {
              const botMsg = document.createElement('div');
              botMsg.classList.add('message', 'bot-message');
              const rawHtml = marked.parse(item.rawModelMessage);
              const html = rawHtml.replace(/<pre><code class="language-(\w+)?">([\s\S]*?)<\/code><\/pre>/g, (match, lang, code) => {
                const language = lang || 'plaintext';
                const decodedCode = code.replace(/</g, '<').replace(/>/g, '>').replace(/&/g, '&');
                const highlightedCode = hljs.highlight(decodedCode, { language }).value;
                return `
              <div class="model-code-block">
                <div class="model-code-header">
                  <span class="model-code-label">${language}</span>
                  <button class="model-copy-btn" onclick="copyModelCode(this)"><i class="fas fa-copy"></i> 复制</button>
                </div>
                <pre><code class="language-${language}">${highlightedCode}</code></pre>
              </div>
            `;
              });
              // 大白话注释：给 AI 消息加一个复制按钮
              botMsg.innerHTML = `
            <div class="message-content">${html}</div>
            <button class="copy-text-btn" onclick="copyMessageText(this, '${encodeURIComponent(item.rawModelMessage)}')">
              <i class="fas fa-copy"></i>
            </button>
          `;
              chatArea.appendChild(botMsg);
              hljs.highlightAll();
            }
          });
          chatArea.scrollTop = chatArea.scrollHeight;
        })
        .catch(error => console.error('加载聊天记录失败:', error));
  }

  // 保存消息到后端
  function saveMessage(configId, userMessage, modelMessage) {
    fetch('/api/bailianai/history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ configId, sessionId: 'default', userMessage, modelMessage })
    })
        .then(response => {
          if (!response.ok) throw new Error('保存聊天记录失败，状态码: ' + response.status);
          console.log(`消息保存成功: userMessage=${userMessage}, modelMessage=${modelMessage}`);
        })
        .catch(error => {
          console.error('保存消息出错:', error);
          alert('消息保存失败，请检查后端日志！');
        });
  }

  // 大白话注释：流式输出，用 Markdown 渲染
  function streamResponse(message, chatArea, configId) {
    const responseMessage = document.createElement('div');
    responseMessage.classList.add('message', 'bot-message', 'streaming');
    // 大白话注释：加一个容器放消息内容和暂停按钮
    responseMessage.innerHTML = `
    <div class="message-content"><p></p></div>
    <button class="pause-btn" onclick="pauseStream(this)"><i class="fas fa-pause"></i> 暂停</button>
    <button class="copy-text-btn" style="display: none;" onclick="copyMessageText(this, '')">
      <i class="fas fa-copy"></i>
    </button>
  `;
    chatArea.appendChild(responseMessage);

    // 大白话注释：如果有正在流的旧消息，先中断它
    const previousStreaming = chatArea.querySelector('.streaming');
    if (previousStreaming && previousStreaming !== responseMessage) {
      const eventSource = previousStreaming.eventSource;
      if (eventSource) {
        eventSource.close();
        previousStreaming.classList.remove('streaming');
        const terminatedDiv = document.createElement('div');
        terminatedDiv.classList.add('terminated');
        terminatedDiv.innerText = '已终止';
        previousStreaming.appendChild(terminatedDiv);
      }
    }

    const eventSource = new EventSource(`/api/bailianai/stream?message=${encodeURIComponent(message)}&configId=${configId}`);
    responseMessage.eventSource = eventSource; // 大白话注释：存到元素上，方便后面暂停用
    let fullText = '';

    eventSource.onmessage = (event) => {
      const rawData = event.data.trim();
      console.log('收到流数据: ' + rawData);

      if (rawData.startsWith('data:')) {
        const jsonData = rawData.substring(5);
        try {
          const data = JSON.parse(jsonData);
          if (data.code && data.message) {
            fullText = `错误: ${data.message}`;
            const messageContent = responseMessage.querySelector('.message-content');
            messageContent.innerHTML = marked.parse(fullText);
          } else if (data.output && data.output.choices && data.output.choices[0].message.content) {
            fullText += data.output.choices[0].message.content;
            const rawHtml = marked.parse(fullText);
            const html = rawHtml.replace(/<pre><code class="language-(\w+)?">([\s\S]*?)<\/code><\/pre>/g, (match, lang, code) => {
              const language = lang || 'plaintext';
              const decodedCode = code.replace(/</g, '<').replace(/>/g, '>').replace(/&/g, '&');
              const highlightedCode = hljs.highlight(decodedCode, { language }).value;
              return `
              <div class="model-code-block">
                <div class="model-code-header">
                  <span class="model-code-label">${language}</span>
                  <button class="model-copy-btn" onclick="copyModelCode(this)"><i class="fas fa-copy"></i> 复制</button>
                </div>
                <pre><code class="language-${language}">${highlightedCode}</code></pre>
              </div>
            `;
            });
            const messageContent = responseMessage.querySelector('.message-content');
            messageContent.innerHTML = html;
            // 大白话注释：更新复制按钮的文本内容
            const copyBtn = responseMessage.querySelector('.copy-text-btn');
            copyBtn.setAttribute('onclick', `copyMessageText(this, '${encodeURIComponent(fullText)}')`);
            copyBtn.style.display = 'inline-block';
            hljs.highlightAll();
          }
          chatArea.scrollTop = chatArea.scrollHeight;
        } catch (e) {
          console.error('解析JSON失败: ' + e.message + ', 数据: ' + jsonData);
        }
      }
    };

    eventSource.onerror = () => {
      eventSource.close();
      responseMessage.classList.remove('streaming');
      if (!fullText) {
        const messageContent = responseMessage.querySelector('.message-content');
        messageContent.innerHTML = marked.parse('连接出错，请稍后再试');
      }
      // 大白话注释：流结束时隐藏暂停按钮，显示复制按钮
      const pauseBtn = responseMessage.querySelector('.pause-btn');
      const copyBtn = responseMessage.querySelector('.copy-text-btn');
      pauseBtn.style.display = 'none';
      copyBtn.style.display = 'inline-block';
      chatArea.scrollTop = chatArea.scrollHeight;
    };

    eventSource.onopen = () => console.log('流式连接已建立');
  }

  // 大白话注释：复制模型返回的代码
  window.copyModelCode = function(button) {
    const code = button.closest('.model-code-block').querySelector('code').innerText;
    navigator.clipboard.writeText(code).then(() => {
      button.innerHTML = '<i class="fas fa-check"></i> 已复制';
      setTimeout(() => {
        button.innerHTML = '<i class="fas fa-copy"></i> 复制';
      }, 2000);
    }).catch(err => {
      console.error('复制失败:', err);
      alert('复制失败，请手动复制！');
    });
  };

  // 大白话注释：复制消息文本
  window.copyMessageText = function(button, encodedText) {
    const text = decodeURIComponent(encodedText);
    navigator.clipboard.writeText(text).then(() => {
      button.innerHTML = '<i class="fas fa-check"></i>';
      setTimeout(() => {
        button.innerHTML = '<i class="fas fa-copy"></i>';
      }, 2000);
    }).catch(err => {
      console.error('复制失败:', err);
      alert('复制失败，请手动复制！');
    });
  };

  // 大白话注释：暂停流式输出
  window.pauseStream = function(button) {
    const messageDiv = button.closest('.message');
    const eventSource = messageDiv.eventSource;
    if (eventSource) {
      eventSource.close();
      messageDiv.classList.remove('streaming');
      const terminatedDiv = document.createElement('div');
      terminatedDiv.classList.add('terminated');
      terminatedDiv.innerText = '已终止';
      messageDiv.appendChild(terminatedDiv);
      button.style.display = 'none';
      const copyBtn = messageDiv.querySelector('.copy-text-btn');
      copyBtn.style.display = 'inline-block';
    }
  };

  // 大白话注释：初始化加载主类列表和模型列表
  loadCategoryList();
  loadModelList();
});

// 大白话注释：关闭弹窗的函数
window.closeModal = function() {
  const welcomeModal = document.getElementById('welcomeModal');
  if (welcomeModal) {
    welcomeModal.style.display = 'none';
  }
};