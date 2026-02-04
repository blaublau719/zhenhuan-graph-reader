@echo off
chcp 65001 >nul
REM Graph Book Reader - 一键部署到 GitHub (Windows)

echo 📖 Graph Book Reader - GitHub 部署脚本
echo ========================================
echo.

REM 检查是否在正确的目录
if not exist "package.json" (
    echo ❌ 错误：请在项目根目录运行此脚本
    pause
    exit /b 1
)

REM 检查 git 是否安装
where git >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ 错误：未安装 git
    pause
    exit /b 1
)

echo 步骤 1/5: 检查 Git 状态
if exist ".git" (
    echo ✓ Git 仓库已存在
) else (
    echo 初始化 Git 仓库...
    git init
    echo ✓ Git 仓库已初始化
)

echo.
echo 步骤 2/5: 配置远程仓库
set REMOTE_URL=git@github.com:blaublau719/zhenhuan-graph-reader.git

git remote | findstr "origin" >nul
if %errorlevel% equ 0 (
    echo 更新远程仓库地址...
    git remote set-url origin %REMOTE_URL%
) else (
    echo 添加远程仓库...
    git remote add origin %REMOTE_URL%
)
echo ✓ 远程仓库已配置: %REMOTE_URL%

echo.
echo 步骤 3/5: 添加文件
git add .
echo ✓ 文件已添加

echo.
echo 步骤 4/5: 创建提交
if "%~1"=="" (
    set COMMIT_MSG=Update: Warm color theme + graph refresh fix
) else (
    set COMMIT_MSG=%~1
)
git commit -m "%COMMIT_MSG%"
if %errorlevel% neq 0 (
    echo 没有新的更改需要提交
)
echo ✓ 提交已创建

echo.
echo 步骤 5/5: 推送到 GitHub

REM 获取当前分支
for /f "tokens=*" %%i in ('git branch --show-current') do set CURRENT_BRANCH=%%i

if "%CURRENT_BRANCH%"=="" (
    echo 设置默认分支为 main...
    git branch -M main
    set CURRENT_BRANCH=main
)

echo 推送分支: %CURRENT_BRANCH%
git push -u origin %CURRENT_BRANCH%
if %errorlevel% neq 0 (
    echo ❌ 推送失败
    echo.
    echo 可能的原因：
    echo 1. SSH 密钥未配置
    echo 2. 没有仓库访问权限
    echo 3. 网络连接问题
    echo.
    echo 手动推送命令：
    echo   git push -u origin %CURRENT_BRANCH%
    pause
    exit /b 1
)

echo ✓ 推送成功！
echo.
echo ========================================
echo ✅ 部署完成！
echo.
echo 📌 后续步骤：
echo 1. 访问 https://github.com/blaublau719/zhenhuan-graph-reader
echo 2. 进入 Settings ^> Pages
echo 3. Source 选择 'GitHub Actions'
echo 4. 等待 3-5 分钟构建完成
echo.
echo 🌐 网站地址（构建完成后）：
echo    https://blaublau719.github.io/zhenhuan-graph-reader/
echo.
echo 📊 查看构建状态：
echo    https://github.com/blaublau719/zhenhuan-graph-reader/actions
echo.
pause
