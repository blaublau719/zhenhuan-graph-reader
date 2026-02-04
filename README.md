# 📖 Graph Book Reader - 甄嬛传版

一个动态的图书阅读器，左边显示 EPUB 电子书内容，右边实时显示人物关系图谱。

## 🚀 快速启动

### 使用 Docker（推荐）

```bash
# 启动项目
docker-compose up

# 访问
http://localhost:4000
```

### 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

## ✨ 功能特性

- **左栏 EPUB 阅读器（70%）**：
  - 直接读取《后宫·甄嬛传（修订典藏版）》EPUB 文件
  - 自动提取目录，支持章节跳转
  - 翻页导航（左右箭头键 / 按钮）
  - 显示阅读进度（当前页/总页数）

- **右栏动态关系图（30%）**：
  - 使用 D3.js 可视化人物关系
  - **核心功能：随阅读进度动态显示**
    - 读到哪里，图谱就显示哪些人物
    - 自动扫描文本中的人名，实时添加节点
  - 阵营筛选：皇室成员、皇后阵营、甄嬛阵营、华妃阵营
  - 缩放拖拽：支持图谱缩放和节点拖拽
  - 悬浮提示：鼠标悬停显示角色详情
  - 标签切换：显示/隐藏人名和关系标签
  - 已发现人物计数器

## 📂 项目结构

```
.
├── docker-compose.yml      # Docker 配置
├── Dockerfile              # Docker 镜像
├── package.json            # 项目依赖（添加了 epubjs）
├── vite.config.js          # Vite 配置
├── tailwind.config.js      # Tailwind CSS 配置
├── index.html              # HTML 入口
├── public/
│   └── 后宫·甄嬛传（修订典藏版）-流潋紫.epub  # EPUB 文件
└── src/
    ├── main.jsx            # React 入口
    ├── App.jsx             # 主应用（处理文本扫描和状态管理）
    ├── components/
    │   ├── ChapterReader.jsx        # EPUB 阅读器（使用 epub.js）
    │   └── GraphVisualization.jsx   # 图谱可视化
    └── data/
        └── graphData.js    # 人物关系数据（44个角色）
```

## 🎯 技术栈

- **React 18** - UI 框架
- **Vite 5** - 构建工具
- **Tailwind CSS 3** - 样式框架
- **D3.js 7** - 图谱可视化
- **epub.js** - EPUB 阅读器库
- **JSZip** - ZIP 解压（EPUB 依赖）
- **Docker** - 容器化部署

## 🧠 核心逻辑

### 文本扫描与人物检测

```javascript
// 在 App.jsx 中
const handleTextUpdate = (text) => {
  // 扫描当前页文本，匹配人物名字
  const chars = new Set()
  graphData.nodes.forEach(node => {
    if (text.includes(node.Label)) {
      chars.add(node.Label)
    }
  })
  setReadCharacters(prev => new Set([...prev, ...chars]))
}
```

### 动态图谱渲染

```javascript
// 在 GraphVisualization.jsx 中
const visibleNodes = graphData.nodes.filter(node =>
  readCharacters.has(node.Label)  // 只显示已读到的人物
)
```

## 📝 数据说明

- **graphData.js**：包含44个主要人物及其关系
  - 每个节点包含：Label（名字）、Alliance（阵营）、Title（职位）
  - 边包含：source、target、Relationship（关系类型）
- **EPUB 文件**：完整的《甄嬛传》电子书
  - 自动提取章节和文本
  - 实时扫描人物名字

## 🎨 阵营配色

- 🔴 皇室成员：#ff6b6b
- 🔵 皇后阵营：#4ecdc4
- 🟢 甄嬛阵营：#95e1d3
- 🟡 华妃阵营：#f38181

## ⚡ 性能

- 离线运行，无需外部依赖
- 页面加载时间约 3秒
- EPUB 解析和渲染由 epub.js 优化处理
- 图谱渲染使用 D3.js force simulation

## 🔧 环境要求

- Node.js 18+
- Docker（可选）
- 现代浏览器（支持 ES6+）

## 📄 License

MIT
