# 🚀 GitHub Pages 完整配置指南

## ✅ 已完成的配置

我已经帮您配置好了所有必需的文件：

### 1. Vite 配置 ✅
- **文件**：`vite.config.js`
- **变更**：添加 `base: '/zhenhuan-graph-reader/'`
- **作用**：确保资源路径在 GitHub Pages 上正确

### 2. GitHub Actions 工作流 ✅
- **文件**：`.github/workflows/deploy.yml`
- **功能**：自动构建和部署到 GitHub Pages
- **触发**：推送到 main/master 分支时

### 3. Git 忽略文件 ✅
- **文件**：`.gitignore`
- **内容**：忽略 node_modules、dist、临时文件等

### 4. 部署脚本 ✅
- **Windows**：`deploy-to-github.bat`
- **Linux/Mac**：`deploy-to-github.sh`
- **功能**：一键推送到 GitHub

---

## 📋 现在该做什么

### 方式 A：使用部署脚本（推荐）

**Windows 用户**：
```cmd
# 双击运行或在命令行执行
deploy-to-github.bat
```

**Mac/Linux 用户**：
```bash
chmod +x deploy-to-github.sh
./deploy-to-github.sh
```

### 方式 B：手动部署

```bash
# 1. 初始化 git（如果还没有）
git init

# 2. 添加远程仓库
git remote add origin git@github.com:blaublau719/zhenhuan-graph-reader.git

# 3. 添加所有文件
git add .

# 4. 创建提交
git commit -m "Initial commit: Graph Book Reader"

# 5. 确保分支是 main
git branch -M main

# 6. 推送到 GitHub
git push -u origin main
```

---

## 🔧 GitHub Pages 设置

推送代码后，在 GitHub 上完成以下设置：

### 步骤 1：打开仓库设置
1. 访问：https://github.com/blaublau719/zhenhuan-graph-reader
2. 点击 **Settings**

### 步骤 2：启用 Pages
1. 左侧菜单找到 **Pages**
2. 在 **Build and deployment** 下：
   - **Source**: 选择 `GitHub Actions`
   - （不要选择 Deploy from a branch）
3. 点击 **Save**

### 步骤 3：等待构建
1. 点击仓库顶部的 **Actions** 标签
2. 观察工作流运行状态
3. 等待绿色勾号✓（约 3-5 分钟）

### 步骤 4：访问网站
构建成功后，网站可在以下地址访问：
```
https://blaublau719.github.io/zhenhuan-graph-reader/
```

---

## 🎯 分享给朋友

### 直接分享链接
```
https://blaublau719.github.io/zhenhuan-graph-reader/
```

### 生成二维码
使用任意二维码生成器（如 https://www.qrcode-monkey.com/）：
1. 输入上述链接
2. 生成二维码
3. 下载图片分享

### 创建短链接
使用短链接服务（如 https://bitly.com/）：
1. 输入完整链接
2. 生成短链接
3. 分享简短的链接

---

## 📝 更新网站

每次修改代码后：

```bash
git add .
git commit -m "描述你的修改"
git push
```

GitHub Actions 会自动重新部署（3-5 分钟）。

---

## 🐛 常见问题排查

### 问题 1：推送失败（Permission denied）

**原因**：SSH 密钥未配置

**解决**：
```bash
# 生成 SSH 密钥
ssh-keygen -t ed25519 -C "your_email@example.com"

# 查看公钥
cat ~/.ssh/id_ed25519.pub

# 复制公钥内容，添加到 GitHub：
# Settings > SSH and GPG keys > New SSH key
```

### 问题 2：Actions 工作流失败

**检查**：
1. 查看 Actions 标签页的错误日志
2. 确认 package.json 依赖正确
3. 确认 public 目录有 EPUB 文件

**常见错误**：
- `npm ci` 失败：删除 package-lock.json 重新生成
- 构建失败：本地运行 `npm run build` 测试

### 问题 3：网站 404

**检查**：
1. 确认 Pages 设置选择了 `GitHub Actions`
2. 确认 vite.config.js 中 base 路径正确：`/zhenhuan-graph-reader/`
3. 等待几分钟让 GitHub Pages 更新
4. 清除浏览器缓存

### 问题 4：EPUB 文件无法加载

**确保**：
- EPUB 文件在 `public/` 目录
- 文件名正确：`后宫·甄嬛传（修订典藏版）-流潋紫.epub`
- 文件大小约 2.1 MB

### 问题 5：样式显示不正常

**检查**：
1. 本地运行 `npm run build` 和 `npm run preview`
2. 确认 Tailwind CSS 配置正确
3. 清除浏览器缓存

---

## 📊 构建信息

### 文件大小
- EPUB：~2.1 MB
- JS (gzip)：~70 KB
- CSS (gzip)：~5 KB
- **总计**：~2.2 MB

### 加载性能
- **首次加载**：3-5 秒
- **后续访问**：< 1 秒（缓存）
- **CDN**：Fastly（全球加速）

### 兼容性
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ✅ 移动端浏览器

---

## 🎨 自定义域名（可选）

如果您有自己的域名：

### 步骤 1：添加 CNAME 文件
在 `public/` 目录创建 `CNAME` 文件：
```
yourdomain.com
```

### 步骤 2：配置 DNS
在域名服务商添加记录：
```
CNAME  www  blaublau719.github.io
```

### 步骤 3：GitHub 设置
在 Pages 设置中输入自定义域名。

---

## ✅ 部署检查清单

部署前：
- [ ] 代码已在本地测试
- [ ] EPUB 文件在 public 目录
- [ ] .gitignore 配置正确
- [ ] vite.config.js base 路径正确

部署后：
- [ ] GitHub Actions 工作流运行成功
- [ ] 网站可以访问
- [ ] EPUB 加载正常
- [ ] 图谱显示正常
- [ ] 翻页功能正常
- [ ] 暖色调主题正确
- [ ] 移动端显示正常

---

## 📞 获取帮助

遇到问题？

1. **查看日志**：GitHub Actions 标签页
2. **本地测试**：`npm run build && npm run preview`
3. **查看文档**：`DEPLOY.md`
4. **提交 Issue**：在 GitHub 仓库

---

## 🎉 完成！

现在您可以：
1. ✅ 通过链接访问网站
2. ✅ 分享给任何人
3. ✅ 随时更新内容
4. ✅ 无需维护服务器

**网站地址**：
# https://blaublau719.github.io/zhenhuan-graph-reader/

享受分享的乐趣吧！ 🚀
