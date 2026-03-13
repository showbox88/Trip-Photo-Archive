# Trip-Photo-Archive (Web 版) - 软件开发需求与架构计划书

## 1. 项目概述 (Project Overview)
- **项目名称**：Trip-Photo-Archive (Web 版)
- **核心愿景**：受 Notion 启发，构建一个具有“行程-事件-照片”三级结构的智能旅游记忆数据库。
- **技术选型**：基于 Web 技术栈 (如 React + Tailwind CSS)，利用现代 Web 动效库 (Framer Motion) 实现极致的交互视觉体验。

## 2. 功能模块 (Functional Requirements)
- **模块 A：Web 端本地文件索引 (Web File Access)**
  - File System Access API：利用浏览器原生 API 允许用户授权访问“总相册文件夹”。
  - 虚拟映射：通过临时 URL (`URL.createObjectURL`) 实现本地照片即时预览，不上传服务器。
- **模块 B：统一交互大厅**
  - 左键浏览/右键管理。
  - 递归归类：照片 -> 事件 -> 行程。
- **模块 D：跨应用联动**
  - 外部 ID 关联：支持绑定规划 App 的 ID，通过 Web URL Scheme 或本地 Web Storage 联动。

## 3. 用户界面与交互 (UI/UX Design)
- **视觉特效 (Visual Effects)**：
  - 聚拢动画 (The Gathering)：使用 CSS Transform 和 Framer Motion 实现照片聚集的平滑物理动画。
  - 堆叠感 (Visual Stacking)：通过 box-shadow 和 z-index 营造真实的相片物理堆叠感。
  - 毛玻璃效果 (Glassmorphism)：底部计数条、属性弹窗使用 `backdrop-filter: blur`。
  - 平滑下钻 (Smooth Drilling)：使用 View Transitions API 或是 Shared Element Transitions 在层级间平滑切换图片。

## 4. 业务逻辑与系统架构 (Logic & Architecture)
- **存储架构**：本地 JSON 驱动 (Web Local Storage/File/IndexedDB)
- **Web 性能策略**：
  - 虚拟列表 (Virtual Scrolling)：应对海量照片 (6000+) 的 DOM 渲染压力。
  - 图片懒加载 (Lazy Loading)：仅在图片进入视口时动态生成预览。

## 5. 数据结构与存储 (Database Schema)
包含 `Trips` (行程表), `Events` (事件表), `PhotoRecords` (照片记录表) 的三层结构。

## 6. 待确认与待办事项 (Questions & Suggestions)
- [x] 浏览器兼容性确认：确定使用 Chrome/Edge 作为主要运行环境以利用完整的 File System Access API。
- [x] 本地存储方案敲定：直接利用 File System Access API 读写项目所在地的原生 `trip_database.json` 文件进行本地硬持久化保存。
- [x] 前端框架敲定：使用 React (Vite) + Tailwind CSS + Framer Motion + `@tanstack/react-virtual` 进行开发。
- [x] **Notion 属性系统**：实现详细的元数据录入与灯箱展示。
- [x] **层级管理交互**：实现基于 ContextMenu 的高效层级归档逻辑。
- [x] **AI 迁移交接准备**：建立完整的项目说明文档 (`README`, `PROJECT_AI_CONTEXT`, `DATABASE_SCHEMA`)。

## 7. 版本修订记录
- v1.0: 初始构思。
- v2.0: 性能优化专题更新。
- v2.1: Web 技术架构确立。明确了使用 Web 技术实现炫酷 CSS 特效的方针，并引入了 File System Access API 解决本地文件访问问题。
- v2.2: (2026-03) 技术栈全面敲定为 React + Vite + Framer Motion + Tailwind，并确认以 Chromium 衍生浏览器为核心运行环境，JSON 持久化方案采用纯本地直写。
