#!/bin/bash

# Graph Book Reader - 一键部署到 GitHub
# 使用方法: bash deploy-to-github.sh

echo "📖 Graph Book Reader - GitHub 部署脚本"
echo "========================================"
echo ""

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 检查是否在正确的目录
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ 错误：请在项目根目录运行此脚本${NC}"
    exit 1
fi

# 检查 git 是否安装
if ! command -v git &> /dev/null; then
    echo -e "${RED}❌ 错误：未安装 git${NC}"
    exit 1
fi

echo -e "${YELLOW}步骤 1/5: 检查 Git 状态${NC}"
if [ -d ".git" ]; then
    echo -e "${GREEN}✓ Git 仓库已存在${NC}"
else
    echo "初始化 Git 仓库..."
    git init
    echo -e "${GREEN}✓ Git 仓库已初始化${NC}"
fi

echo ""
echo -e "${YELLOW}步骤 2/5: 配置远程仓库${NC}"
REMOTE_URL="git@github.com:blaublau719/zhenhuan-graph-reader.git"

if git remote | grep -q "origin"; then
    echo "更新远程仓库地址..."
    git remote set-url origin $REMOTE_URL
else
    echo "添加远程仓库..."
    git remote add origin $REMOTE_URL
fi
echo -e "${GREEN}✓ 远程仓库已配置: $REMOTE_URL${NC}"

echo ""
echo -e "${YELLOW}步骤 3/5: 添加文件${NC}"
git add .
echo -e "${GREEN}✓ 文件已添加${NC}"

echo ""
echo -e "${YELLOW}步骤 4/5: 创建提交${NC}"
COMMIT_MSG="Update: Warm color theme + graph refresh fix"
if [ -n "$1" ]; then
    COMMIT_MSG="$1"
fi
git commit -m "$COMMIT_MSG" || echo "没有新的更改需要提交"
echo -e "${GREEN}✓ 提交已创建${NC}"

echo ""
echo -e "${YELLOW}步骤 5/5: 推送到 GitHub${NC}"

# 检查当前分支
CURRENT_BRANCH=$(git branch --show-current)
if [ -z "$CURRENT_BRANCH" ]; then
    echo "设置默认分支为 main..."
    git branch -M main
    CURRENT_BRANCH="main"
fi

echo "推送分支: $CURRENT_BRANCH"
if git push -u origin $CURRENT_BRANCH; then
    echo -e "${GREEN}✓ 推送成功！${NC}"
else
    echo -e "${RED}❌ 推送失败${NC}"
    echo ""
    echo "可能的原因："
    echo "1. SSH 密钥未配置"
    echo "2. 没有仓库访问权限"
    echo "3. 网络连接问题"
    echo ""
    echo "手动推送命令："
    echo "  git push -u origin $CURRENT_BRANCH"
    exit 1
fi

echo ""
echo "========================================"
echo -e "${GREEN}✅ 部署完成！${NC}"
echo ""
echo "📌 后续步骤："
echo "1. 访问 https://github.com/blaublau719/zhenhuan-graph-reader"
echo "2. 进入 Settings > Pages"
echo "3. Source 选择 'GitHub Actions'"
echo "4. 等待 3-5 分钟构建完成"
echo ""
echo "🌐 网站地址（构建完成后）："
echo "   https://blaublau719.github.io/zhenhuan-graph-reader/"
echo ""
echo "📊 查看构建状态："
echo "   https://github.com/blaublau719/zhenhuan-graph-reader/actions"
echo ""
