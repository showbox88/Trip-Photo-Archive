# Trip Photo Archive (Web Edition)

一个专注于“行程-事件-照片”三层结构的智能旅游记忆管理系统。受 Notion 启发，采用极致的交互动效与本地优先的数据管理理念。

## 🚀 核心特性

- **本地优先 (Local-First)**：直接利用浏览器 `File System Access API` 读写本地文件夹，无需上传云端。
- **三层架构**：
  - **行程 (Trip)**：顶层档案（如：2024 日本夏季旅行）。
  - **事件 (Event)**：行程中的具体活动（如：浅草寺一日游）。
  - **照片 (Photo)**：最底层的记录单元。
- **极致视觉**：
  - 基于 **Framer Motion** 的物理聚拢动画与卡片堆叠感。
  - 沉浸式 **Lightbox** 灯箱浏览，自带 Notion 风格的元数据侧边栏。
- **高性能渲染**：
  - 使用 `@tanstack/react-virtual` 实现海量照片 (6000+) 的流畅滚动。

## 🛠️ 技术栈

- **前端**：React 18, Vite
- **动效**：Framer Motion
- **图标**：Lucide React
- **虚拟化**：React Virtual
- **样式**：Tailwind CSS (Vanilla CSS utilities)
- **数据**：本地 `trip_database.json` (通过浏览器 API 直接读写)

## 📦 安装与运行

1. 确保已安装 Node.js 环境。
2. 克隆项目后，在根目录运行：
   ```bash
   npm install
   ```
3. 启动开发服务器：
   ```bash
   npm run dev
   ```
4. 在浏览器中打开提示的地址（推荐使用 Chrome 或 Edge）。

## 📖 使用指南

1. **初始化**：首次启动点击“选择文件夹”，授权访问您的照片存放目录。
2. **浏览**：单选照片可进行批量操作，双击可进入沉浸式灯箱浏览。
3. **归档**：
   - 右键照片 -> 聚集到新事件。
   - 右键事件 -> 归档到已有行程（层级菜单）或创建新行程。
4. **属性管理**：在灯箱侧边栏或创建弹窗中，可以为事件设置地点、评分、笔记等。

---
*Created with ❤️ by Antigravity AI*
