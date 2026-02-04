# 🚀 GitHub Pages 部署指南

## 快速部署到 GitHub Pages

您的仓库：`git@github.com:blaublau719/zhenhuan-graph-reader.git`

### 📋 步骤 1：初始化 Git 仓库

```bash
cd "C:\Users\Lan.Yang\Projekten2026\GR\甄嬛\zhenhuan_code"

# 初始化 git（如果还没有）
git init

# 添加远程仓库
git remote add origin git@github.com:blaublau719/zhenhuan-graph-reader.git

# 添加所有文件
git add .

# 创建首次提交
git commit -m "Initial commit: Graph Book Reader with warm color theme"

# 推送到 GitHub
git push -u origin main
```

如果遇到分支名问题，可能需要：
```bash
git branch -M main
git push -u origin main
```

### 📋 步骤 2：启用 GitHub Pages

1. 打开您的仓库：https://github.com/blaublau719/zhenhuan-graph-reader

2. 点击 **Settings**（设置）

3. 在左侧菜单找到 **Pages**

4. 在 **Build and deployment** 下：
   - **Source**: 选择 `GitHub Actions`

5. 保存设置

### 📋 步骤 3：触发部署

推送代码后，GitHub Actions 会自动运行：

```bash
# 查看工作流状态
# 在 GitHub 仓库页面点击 "Actions" 标签
```

等待 3-5 分钟，构建完成后，您的网站将可以访问：

**🌐 网站地址**：
```
https://blaublau719.github.io/zhenhuan-graph-reader/
```

### 📋 步骤 4：分享给朋友

**方式 1：直接分享链接**
```
https://blaublau719.github.io/zhenhuan-graph-reader/
```

**方式 2：生成二维码**
使用任意二维码生成器创建上述链接的二维码，朋友扫码即可访问。

**方式 3：短链接**
使用 bit.ly 或 tinyurl.com 创建短链接。

## 🔧 本地测试构建

在推送到 GitHub 之前，可以先本地测试：

```bash
# 安装依赖
npm install

# 构建静态文件
npm run build

# 预览构建结果
npm run preview
```

这会在 http://localhost:4173 启动预览服务器。

## 📝 更新部署

每次修改代码后，只需：

```bash
git add .
git commit -m "描述你的修改"
git push
```

GitHub Actions 会自动重新构建和部署。

## ⚙️ 项目配置说明

### Vite 配置（已完成）

`vite.config.js` 中已添加：
```javascript
base: '/zhenhuan-graph-reader/'  // GitHub Pages 子路径
```

### GitHub Actions（已配置）

`.github/workflows/deploy.yml` 包含：
- 自动安装依赖
- 构建项目
- 部署到 GitHub Pages

### 文件结构

```
zhenhuan_code/
├── .github/
│   └── workflows/
│       └── deploy.yml        # 自动部署配置
├── public/
│   └── *.epub                # EPUB 文件会被包含在构建中
├── src/
│   └── ...                   # React 源代码
├── dist/                     # 构建输出（git 忽略）
└── package.json
```

## 🐛 常见问题

### Q1: 推送后没有自动部署？
**检查**：
1. GitHub Actions 是否启用（Settings > Actions > General）
2. 是否选择了 `GitHub Actions` 作为 Pages 源
3. 查看 Actions 标签页的工作流日志

### Q2: 网站 404 错误？
**检查**：
1. 确认 `vite.config.js` 中的 `base` 路径正确
2. 等待几分钟让 GitHub Pages 更新
3. 清除浏览器缓存

### Q3: EPUB 文件加载失败？
**确保**：
- EPUB 文件在 `public/` 目录下
- 文件名在代码中匹配

### Q4: 样式或图片丢失？
**检查**：
- 所有资源路径使用相对路径
- Tailwind CSS 已正确配置

## 📊 构建大小估算

- **EPUB 文件**：~2.1 MB
- **JavaScript**：~200 KB (gzip 后 ~70 KB)
- **CSS**：~20 KB (gzip 后 ~5 KB)
- **总计**：~2.3 MB

首次加载时间：约 3-5 秒（取决于网速）

## 🎯 优化建议

### 缓存策略
GitHub Pages 会自动设置缓存头，文件会被缓存。

### CDN 加速
GitHub Pages 使用 Fastly CDN，全球访问速度良好。

### 移动端优化
当前版本已支持响应式设计，但可以进一步优化移动端体验。

## 📱 移动端访问

网站已支持移动端，但由于屏幕限制：
- 建议横屏使用
- 图谱区域会自动调整
- 触摸手势支持缩放和拖拽

## 🔐 隐私说明

- 所有数据在客户端处理
- 无服务器端跟踪
- EPUB 文件本地加载
- 无需注册或登录

## ✅ 部署检查清单

部署前确认：
- [ ] 代码已测试
- [ ] EPUB 文件在 public 目录
- [ ] .gitignore 包含 node_modules 和 dist
- [ ] package.json 依赖正确
- [ ] vite.config.js base 路径正确
- [ ] GitHub 仓库设置正确

部署后验证：
- [ ] 网站可以访问
- [ ] EPUB 加载正常
- [ ] 图谱显示正常
- [ ] 翻页功能正常
- [ ] 颜色主题正确（暖色调）
- [ ] 移动端显示正常

---

**部署完成后的网址**：
# https://blaublau719.github.io/zhenhuan-graph-reader/

祝您分享顺利！ 🎉
