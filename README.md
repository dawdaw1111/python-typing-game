<div align="center">

# PyType Lite
### Python 打字闯关游戏

![Platform](https://img.shields.io/badge/Platform-Web-0ea5e9?style=flat-square)
![Tech](https://img.shields.io/badge/Tech-Vanilla%20JavaScript-f59e0b?style=flat-square)
![Stars](https://img.shields.io/github/stars/dawdaw1111/python-typing-game?style=flat-square)
![Last Commit](https://img.shields.io/github/last-commit/dawdaw1111/python-typing-game?style=flat-square)

</div>

为 Python 初学者设计的打字训练游戏，通过反复输入关键词、符号和常见片段提升输入速度与准确率。

![PyType Preview](./docs/preview.png)

## 三种模式

1. `代码雨模式`：词条下落，命中得分，漏掉扣生命
2. `单词冲刺`：限时逐题，强调速度与准确率
3. `符号训练`：专项练习括号、比较符、代码片段

## 项目亮点

- 分数、生命、连击系统
- 分数解锁（基础/关键字/符号池）
- 本局结算（得分、正确率、最高连击）
- 全局统计（总局数、模式最佳、易错 Top5）
- 自动保存（`localStorage`）

## 快速开始

1. 克隆仓库或下载源码
2. 打开 `index.html`

或使用本地静态服务：

```bash
python -m http.server 8000
```

浏览器访问 `http://127.0.0.1:8000`

## 目录结构

```text
.
├─ index.html       # 页面结构
├─ style.css        # 样式
├─ data.js          # 词池、模式参数、解锁规则
├─ app.js           # 游戏循环、判定、存档逻辑
└─ docs/preview.png # README 预览图
```

