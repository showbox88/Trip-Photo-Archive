@echo off
echo ==========================================
echo   Trip-Photo-Archive 启动助手
echo ==========================================
echo.
echo [1/2] 正在检查依赖项...
if not exist node_modules (
    echo [!] 未检测到 node_modules，正在运行 npm install...
    call npm install
) else (
    echo [OK] 依赖项已安装。
)

echo.
echo [2/2] 正在启动 Vite 开发服务器...
echo.
call npm run dev

pause
