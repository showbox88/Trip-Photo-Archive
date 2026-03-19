@echo off
setlocal
title Trip-Photo-Archive Starter

echo ==========================================
echo   Trip-Photo-Archive 启动助手 (v2.2+)
echo ==========================================
echo.

:: 1. Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] 未检测到 Node.js 环境！
    echo 请先前往 https://nodejs.org/ 下载并安装。
    pause
    exit /b
)

:: 2. Check dependencies
if not exist node_modules (
    echo [!] 未检测到 node_modules，正在执行初始化安装...
    :: Use legacy-peer-deps to avoid the Vite 8 vs Tailwind 4 peer dependency issue
    call npm install --legacy-peer-deps
) else (
    echo [OK] 依赖项已存在。
    echo [TIP] 如果运行报错，请删除 node_modules 文件夹后重新运行此脚本。
)

echo.
echo [2/2] 正在启动 Vite 开发服务器...
echo ------------------------------------------
call npm run dev

if %errorlevel% neq 0 (
    echo.
    echo [!] 服务器异常退出。
)

pause
