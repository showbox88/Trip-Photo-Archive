# AI Handoff & Architecture Guide

这份文档旨在帮助任何接手的 AI 快速理解本项目的设计初衷、底层逻辑与代码规范，以便继续升级。

## 1. 核心设计哲学 (Design Philosophy)

- **Notion 属性系统**：每一个 Trip 和 Event 都有丰富的元数据（Rating, Category, Notes, Stage）。
- **空间一致性**：灯箱 (Lightbox) 中的信息栏应与创建弹窗中的字段完全对应。
- **物理隐喻**：照片卡片 (PhotoCard) 采用堆叠视觉，归档操作应伴随平滑的位移和缩放动画。

## 2. 关键技术细节

### 文件系统权限 (File System Access)
- **核心文件**：`src/hooks/useFileSystemAccess.js`
- **逻辑**：不使用传统的后端，而是请求用户授权本地文件夹。数据库文件 `trip_database.json` 存放在用户选择的文件夹根目录。
- **注意**：所有的图片路径是相对于该根目录的相对路径。

### 缩略图系统 (Thumbnail Caching)
- **核心文件**：`src/utils/thumbnailUtils.js`、`src/utils/idb.js`
- **存储**：缩略图生成后存入浏览器 **IndexedDB** 的 `ThumbnailStoreV2` store（600px 宽，JPEG 0.88 质量）。
- **加载优先级**：①IDB 缩略图（data URL）→ ②原始文件 Object URL（仅无缩略图时加载）。
- **版本管理**：`idb.js` 中 `DB_VERSION = 3`，升级时自动删除旧的 `ThumbnailStore`（250px）并创建 `ThumbnailStoreV2`。
- **注意**：缩略图存在浏览器本地，换电脑/换浏览器后会在下次打开工作区时自动重新生成。不会出现在项目文件夹，无需 `.gitignore`。

### 虚拟列表 (Virtual Grid)
- **核心文件**：`src/components/VirtualGrid.jsx`
- **实现**：基于 `@tanstack/react-virtual` 的 `useVirtualizer`，DOM 中始终只保留可视区域的行（约 4-5 行 × 10 列），无论照片库多大性能恒定。
- **布局**：固定 10 列，`groupItemsIntoRows()` 将扁平 items 分组为虚拟行（date-header 独占一行，photo/collection 每行最多 10 个）。
- **框选**：拖拽框选通过查询 `[data-item-key]` DOM 元素实现，与虚拟化兼容（只选可见范围内的卡片）。

### 共享工具 (Shared Utils)
- `src/utils/propertyColor.js`：`getPropertyColor(name, list)` — 从 categories/cities 列表查颜色，由 `PhotoCard.jsx` 和 `DetailModal.jsx` 共用。

### 交互模型
- **单击**：切换选择状态 (`selectedIds`)。
- **双击**：下钻 (Home -> Trip -> Event) 或打开灯箱 (Photo)。
- **右键**：触发层级菜单 (`ContextMenu`)。

## 3. 代码地图 (Component Map)

- `App.jsx`: 状态中枢。管理 `dbContent`、`activeFilter` 和全局弹窗状态。
- `VirtualGrid.jsx`: 虚拟化网格渲染，处理框选、日期分组、分页。
- `PhotoCard.jsx`: 单张照片卡片，memo 包裹，IDB 缩略图优先加载。
- `CollectionCard.jsx`: Trip/Event 集合卡片。
- `Sidebar.jsx`: 快速导航，反映 `trips` 和 `events` 的层级。
- `ContextMenu.jsx`: 高级交互核心。支持子菜单嵌套（例如：归档到已有行程列表）。
- `Lightbox.jsx`: 沉浸式查看器。必须保证 Hooks 顺序一致，且元数据展示与 `trip_database.json` 结构同步。

## 4. 数据库 Schema 参考

详见 `DATABASE_SCHEMA.md`。

## 5. 已完成的性能优化记录

详见 `docs/CHANGES.md`。主要优化点：
1. **死代码清除**：删除孤立组件、未使用 import、永远不渲染的 state。
2. **缩略图机制**：IDB 缓存 600px 缩略图，避免重复加载原图（通常数 MB 每张）。
3. **真正的虚拟滚动**：从分页累积方案迁移到 `@tanstack/react-virtual`，DOM 节点数从 300+ 降至 ~50。

## 6. 未来的升级方向 (Roadmap)

1. **文件系统缩略图**：将缩略图存为 `.thumbnails/` 文件夹内的 JPEG 文件，换浏览器后无需重新生成。
2. **智能搜索**：基于 JSON 中的 title, city, notes 进行全文检索。
3. **地理可视化**：如果 JSON 中有经纬度，在侧边栏显示小地图。
4. **多文件夹合并**：支持索引多个分散的文件夹。

---
*Note to AI: Always maintain the "Glassmorphism" and "Motion-Rich" UI style when adding new features.*
