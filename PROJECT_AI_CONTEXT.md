# AI Handoff & Architecture Guide

这份文档旨在帮助任何接手的 AI 快速理解本项目的设计初衷、底层逻辑与代码规范，以便继续升级。

## 1. 核心设计哲学 (Design Philosophy)

- **Notion 属性系统**：每一个 Trip 和 Event 都有丰富的元数据（Rating, Category, Notes, Stage, Cover）。
- **空间一致性**：灯箱 (Lightbox) 中的信息栏应与创建弹窗中的字段完全对应。
- **物理隐喻**：照片卡片 (PhotoCard) 采用堆叠视觉，归档操作应伴随平滑的位移和缩放动画。
- **极致密度**：16 列网格、紧凑卡片、本地缩略图缓存，优先顺滑滚动体验。
- **暗色风格**：底色 `#0b0c10`，主色蓝 `#0d7ff2`，所有组件遵循 Glassmorphism 风格。

## 2. 关键技术细节

### 文件系统权限 (File System Access)
- **核心文件**：`src/hooks/useFileSystemAccess.js`
- **逻辑**：不使用传统的后端，而是请求用户授权本地文件夹。数据库文件 `trip_database.json` 存放在用户选择的文件夹根目录。
- **注意**：所有的图片路径是相对于该根目录的相对路径。
- `enrichedPhotos` = `photoFiles`（含 FileSystemFileHandle）与 `dbContent.photos`（含 GPS/元数据）的合并结果，包含 `handle`。

### 虚拟列表 (Virtual Grid)
- **核心文件**：`src/components/VirtualGrid.jsx`
- **逻辑**：为了承载 6000+ 照片，网格必须进行虚拟化。固定 16 列，高度动态计算。
- 支持 `subHeader` prop：在滚动容器内（`overflow-y-auto`）渲染子头部，使 sticky 日期条 `top-0` 生效。

### 图片加载
- `useObjectUrl` hook（`src/hooks/useObjectUrl.js`）：`FileSystemFileHandle` → Object URL，异步加载，组件卸载时自动释放。
- IndexedDB（`src/utils/idb.js`）：存储 workspace FileSystemHandle 和缩略图缓存。
- 缩略图机制：本地生成低分辨率缩略图（存储于 IDB），大幅提升海量照片的首屏性能。

### 国际化 (i18n)
- **机制**：`src/locales/zh.json` + `src/locales/en.json`，简单点路径 `t('app.key.subkey')` 函数。
- `t` 在 App.jsx 顶层定义，通过 props 传递给所有子组件。
- **重要**：`vite.config.js` 中 `server.watch.ignored` 只忽略 `trip_database.json`，不忽略 locale JSON，否则 HMR 不生效。

### 交互模型
- **单击**：切换选择状态 (`selectedIds`)。
- **双击**：下钻 (Home → Trip → Event) 或打开灯箱 (Photo)。
- **右键**：触发层级菜单 (`ContextMenu`)，自动将点击项加入 selectedIds。

### 地图视图 (Map View)
- **核心文件**：`src/components/MapView.jsx`
- **库**：`react-leaflet` v5 + `leaflet` v1.9.4，CartoDB Dark 瓦片。
- **布局**：左侧行程面板 + 右侧地图。
- **交互流程**：
  1. 点击左侧 TripPanelCard → 显示该行程的事件标记和路线折线
  2. Hover 事件标记 → HoverBubble（封面图 + 信息），事件坐标来自封面照片的 GPS
  3. 点击事件标记 → 缩放到该事件区域，显示所有照片蓝点
  4. Hover 蓝点 → PhotoHoverBubble（照片预览）
  5. 点击蓝点 → Pin 该照片泡泡（蓝色边框 + "click to enlarge" 提示）
  6. 点击 Pinned 泡泡 → ExpandedPhotoOverlay（全屏原图，ESC/点击背景关闭）
- **事件系统陷阱**：泡泡通过 `createPortal` 渲染到 `map.getContainer()` 内，React 合成事件在 `#root` 捕获（bubble 阶段），晚于 Leaflet 的原生监听器。解决方案：使用 callback ref + 原生 `addEventListener` + `L.DomEvent.disableClickPropagation`。

## 3. 代码地图 (Component Map)

- `App.jsx`: 状态中枢。管理 `dbContent`、`activeFilter`、全局弹窗状态、语言 `language`、`t` 翻译函数。
- `Sidebar.jsx`: 快速导航，反映 `trips` 和 `events` 的层级。
- `ContextMenu.jsx`: 高级交互核心。支持子菜单嵌套（分类、城市、评分、事件/行程归档）。接收 `t` prop。
- `FilterMenu.jsx`: 照片筛选器（未分类 / 未标城市）。接收 `t` prop。
- `MapView.jsx`: 地图视图完整实现（路线、事件标记、照片点、泡泡、全屏叠层）。接收 `t` prop。
- `AlbumsView.jsx`: 行程卡片网格视图。接收 `t` prop。
- `VirtualGrid.jsx`: 虚拟化照片网格，支持日期分组标头和 subHeader。
- `Lightbox.jsx`: 沉浸式查看器。必须保证 Hooks 顺序一致。
- `PropertyManagerModal.jsx`: 全局属性编辑器（分类、城市、标签）。接收 `t` prop。
- `DetailModal.jsx`: 单项详情/编辑器。

## 4. 数据库 Schema 参考

详见 `DATABASE_SCHEMA.md`。

照片表新增字段（运行时合并，非持久化）：
- `handle`：`FileSystemFileHandle`，来自 photoFiles 扫描
- `latitude` / `longitude`：EXIF GPS，来自 EXIF 读取

## 5. 已完成功能 (Completed)

- ✅ 虚拟化 16 列照片网格（极致密度）
- ✅ 日期分组标头（sticky，磨砂背景）
- ✅ 本地缩略图缓存（IndexedDB）
- ✅ 地图视图（路线 + 事件标记 + 照片点 + 全屏叠层）
- ✅ 行程封面自定义
- ✅ 全局属性管理（分类/城市颜色系统）
- ✅ 右键菜单增强（溢出翻转、子菜单定位）
- ✅ 照片卡片彩色标签
- ✅ 智能过滤器（未分类/未标城市）
- ✅ 国际化（zh/en，props-based `t` 函数）
- ✅ 照片评分 1-10

## 6. 未来的升级方向 (Roadmap)

1. **智能搜索**：基于 JSON 中的 title, city, notes 进行全文检索。
2. **多文件夹合并**：支持索引多个分散的文件夹。
3. **数据恢复**：防止 JSON 损坏的备份机制。
4. **时间轴视图**：按时间线展示行程历史。
5. **无 GPS 照片手动定位**：在地图上手动为事件指定坐标。

---
*Note to AI: Always maintain the "Glassmorphism" and "Motion-Rich" UI style when adding new features. Dark theme base `#0b0c10`. Primary blue `#0d7ff2`.*
*Always pass `t` prop to any new component that displays user-facing text.*
