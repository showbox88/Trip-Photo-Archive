# 代码优化记录

## 一、代码精简（死代码清除）

### 删除文件
- **`src/components/OptimizedImage.jsx`** — 无任何文件 import，完全孤立，已删除。

### `src/components/CollectionCard.jsx`
- 删除 `TAG_PALETTES` / `tagColor` / `Tag` 组件（33行）——构建了但从未渲染到 UI。
- 删除 `tags` / `cities` 变量——计算后未使用。
- 删除 `associatedEvents` prop——移除上述变量后不再需要。
- 删除 `activeMenu === 'rating'` 下拉菜单（26行）——没有任何代码调用 `setActiveMenu('rating')`，永远不会显示。

### `src/App.jsx`
- 删除重复/未使用的 import：`PhotoCard`、`Sidebar`、`MapPin`、`Tag`（第二次导入）、`LayoutGrid`、`AlignJustify`、`ListFilter`、`ArrowUpDown`、`ChevronDown`。
- 删除 `viewMode` state 及 Sidebar 条件渲染——`viewMode` 初始值固定为 `'gallery'`，没有 UI 可切换，Sidebar 永远不渲染。
- 删除废弃的 `handleUpdateTrip`——注释已标记 deprecated，所有调用方改用 `handleUpdateItem`。
- **修复硬编码子标题**——原来写死 "Switzerland Trip 2024 / August 12-24 / 142 items"，改为动态读取当前行程名称和实际照片数量。

### `src/components/Lightbox.jsx`
- 删除未使用的 `Maximize2` import。
- 删除传给 `ImageBuffer` 的无效 `showInfo` prop（组件签名中未使用）。

### `src/components/Sidebar.jsx`
- 删除手写的自定义 `Plus` SVG 组件，改用 lucide-react 的 `Plus` 图标。
- 删除未使用的 import：`ChevronRight`、`MoreHorizontal`、`Tag`、`MapPin`。

### `src/utils/propertyColor.js`（新建）
- 从 `PhotoCard.jsx` 和 `DetailModal.jsx` 中提取重复的 `getPropertyColor` 函数为共享 util。
- 两个组件均改为 `import { getPropertyColor } from '../utils/propertyColor'`。

---

## 二、性能优化

### `src/components/PhotoCard.jsx` — 原图按需加载

**问题**：原来每张 PhotoCard 无论是否有缩略图，都通过 `useObjectUrl(fileInfo.handle)` 加载完整原图 Blob URL 驻留内存。数百张照片时内存压力极大。

**改动**：
```jsx
// 旧逻辑（始终加载原图）
const rawUrl = useObjectUrl(fileInfo.handle);

// 新逻辑（有缩略图则跳过原图）
const [thumbChecked, setThumbChecked] = useState(false);
// 先查 IDB，有缩略图 → thumbChecked=true, thumbUrl=dataUrl
// 无缩略图 → thumbChecked=true, thumbUrl=null
const rawUrl = useObjectUrl(thumbChecked && !thumbUrl ? fileInfo.handle : null);
```
效果：对已扫描过的照片库，原图几乎不再加载，内存占用大幅下降。

### `src/components/PhotoCard.jsx` — 移除动画开销

- 移除 `<motion.div layout>` 的 `layout` prop——避免 framer-motion 在任何布局变化时对所有卡片执行全局重排计算。
- 移除入场动画的逐帧延迟 `delay: index * 0.01`——大量卡片时会积累大量动画任务。
- 入场动画改为简单的 `opacity: 0→1`，duration 0.2s。

### `src/components/VirtualGrid.jsx` — 增大分页

- `PAGE_SIZE` 从 21 → 64，减少触底加载频率，滚动更流畅。

---

## 三、架构说明（供后续开发参考）

### 缩略图机制
- 扫描工作区时，`useFileSystemAccess.js` 的 `syncPhotosWithExif` 会为每张新照片生成缩略图（250px 宽，JPEG 0.7质量），存入浏览器 **IndexedDB** 的 `ThumbnailStore`。
- 缩略图在浏览器本地，不会出现在项目文件夹，无需 `.gitignore`，也不会上传 git。
- 换电脑/换浏览器后缩略图需重新生成（下次打开工作区时自动触发）。

### 图片加载优先级
1. IDB 缩略图（data URL，约原图 1/50 大小）— 最优先
2. 原始文件 Object URL — 仅在无缩略图时加载

### 真正的虚拟滚动（已实现）

**`src/components/VirtualGrid.jsx`** 已重构为基于 `@tanstack/react-virtual` 的真正虚拟滚动：

- 原先：分页加载（每批 64 个），滚动后旧卡片永远留在 DOM，照片多了会有几百个节点同时存在
- 现在：DOM 中始终只保留可视区域内的行（约 4-5 行 × 10 列 = 40-50 个卡片），无论照片库多大性能恒定

**实现细节**：
- `groupItemsIntoRows(items)` 把扁平 items 数组按类型分组为虚拟行：
  - `date-header` → 独占一行（全宽）
  - `photo/collection` → 每行最多 10 个
  - 末尾追加 `new-page` 行
- `useVirtualizer` 使用 `measureElement` ref 自动测量实际行高（无需精确估算）
- 框选（drag-to-select）逻辑保留，改为查询 `parentRef` 下的 `[data-item-key]` 元素（只有可见行有 DOM 节点）
