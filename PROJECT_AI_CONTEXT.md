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

### 虚拟列表 (Virtual Grid)
- **核心文件**：`src/components/VirtualGrid.jsx`
- **逻辑**：为了承载 6000+ 照片，网格必须进行虚拟化。目前固定为 5 列，高度动态计算。

### 交互模型
- **单击**：切换选择状态 (`selectedIds`)。
- **双击**：下钻 (Home -> Trip -> Event) 或打开灯箱 (Photo)。
- **右键**：触发层级菜单 (`ContextMenu`)。

## 3. 代码地图 (Component Map)

- `App.jsx`: 状态中枢。管理 `dbContent`、`activeFilter` 和全局弹窗状态。
- `Sidebar.jsx`: 快速导航，反映 `trips` 和 `events` 的层级。
- `ContextMenu.jsx`: 高级交互核心。支持子菜单嵌套（例如：归档到已有行程列表）。
- `Lightbox.jsx`: 沉浸式查看器。必须保证 Hooks 顺序一致，且元数据展示与 `trip_database.json` 结构同步。

## 4. 数据库 Schema 参考

详见 `DATABASE_SCHEMA.md`。

## 5. 未来的升级方向 (Roadmap)

1. **智能搜索**：基于 JSON 中的 title, city, notes 进行全文检索。
2. **多文件夹合并**：支持索引多个分散的文件夹。
3. **数据恢复**：防止 JSON 损坏的备份机制。
4. **地理可视化**：如果 JSON 中有经纬度，在侧边栏显示小地图。

---
*Note to AI: Always maintain the "Glassmorphism" and "Motion-Rich" UI style when adding new features.*
