# 目标描述

用户希望在 Albums（相册）视图中的 Trip（行程）实现一个可以自由更换封面的机制，并且封面只能从该行程包含的照片中选择。

## 修复跨组件行程关联 [Fix Transitive Trip Linkage]
确保通过事件关联到行程的照片在所有视图中都能正确显示。

### [Component] [App.jsx](file:///c:/Users/showb/Desktop/Trip-Photo-Archive/src/App.jsx)
- **[MODIFY]** `displayedItems` (line ~645): 修改 `basePhotos` 过滤逻辑。如果 `selectedTripId` 存在，则不仅根据 `p.trip_id` 过滤，还需检查照片所属 `event` 的 `trip_id`。
- **[MODIFY]** `all-albums` 视图 (line ~693): 同步更新卡片预览照片的过滤逻辑，确保包含事件内的照片。
- **[MODIFY]** 全局视图卡片 (line ~747): 同步更新。

## 提议更改

### src/App.jsx
#### [MODIFY] [App.jsx](file:///C:/Users/showb/Desktop/Trip-Photo-Archive/src/App.jsx)
- 修改上下文菜单事件处理器 `onMenuAction`，以支持新的 `set-trip-cover` 操作。
- 选定后，调用数据库更新逻辑 `handleUpdateItem`，为目标 Trip 对象附加一个 `cover_photo_id` 或者直接记录图片的 `path`。

### src/components/ContextMenu.jsx
#### [MODIFY] [ContextMenu.jsx](file:///C:/Users/showb/Desktop/Trip-Photo-Archive/src/components/ContextMenu.jsx)
- 当右键点击的照片（`targetType === 'photo'`）拥有关联的 `trip_id` 时，在菜单中增加 "设为所在行程封面" 按钮。点击时触发 `set-trip-cover` 动作。

### src/components/AlbumsView.jsx
#### [MODIFY] [AlbumsView.jsx](file:///C:/Users/showb/Desktop/Trip-Photo-Archive/src/components/AlbumsView.jsx)
- 更新 `TripCard` 组件内部获取 `coverPhoto` 的逻辑。
- 首选 `trip.cover_photo_id` 匹配的照片作为封面。如果不存在，则降级使用 `photos[0]`。

### src/components/DetailModal.jsx
#### [MODIFY] [DetailModal.jsx](file:///C:/Users/showb/Desktop/Trip-Photo-Archive/src/components/DetailModal.jsx)
- 将照片类型的 "分类" 输入框修改为下拉选择框。
- 预设选项包括：美食、景点、街景、酒店、交通、自然、人像、购物、其他。
- 修复下拉框选项在深色模式下的可见性问题（设置 `option` 的背景色）。
- 只有在 `type === 'photo'` 时才显示下拉框，其他类型（行程、事件）保留文本输入（或者也统一为下拉框？用户提到的是照片详细页，先按照片页改）。

### 性能优化：解决保存后的“闪烁”
- **src/components/VirtualGrid.jsx**: 优化 `displayLimit` 的重置逻辑。只有在列表长度发生变化或列表内容完全不同时才重置，防止元数据更新导致的列表折叠和重新加载。
- **src/components/PhotoCard.jsx**: 使用 `React.memo` 优化组件，避免不必要的重新渲染。
- **src/App.jsx**: 确保 `handleUpdateItem` 的更新不触发全量重载。

### 右键菜单增强：溢出与子菜单定位
- **src/components/ContextMenu.jsx**: 确保菜单及子菜单在边缘处自动翻转方向。

- **src/App.jsx**: 增加 `set-event-cover` 处理，更新事件元数据并持久化。

### 全局属性管理系统
- **src/utils/db.js / App.jsx**: 
    - 初始化数据库时增加全局属性：`cities`, `categories`, `tags`。
    - 预设默认分类（美食、景点等）。
- **src/components/TopBar.jsx** (或相同功能的组件):
    - 在右上角添加头像按钮。
    - 实现悬浮/点击下拉菜单，包含“设置”和“属性编辑”。
- **src/components/PropertyManagerModal.jsx [NEW]**:
    - 提供一个统一界面编辑分类、城市和标签列表。
    - 支持增删改操作。
- **src/components/ContextMenu.jsx**:
    - 增加“修改城市”子菜单（从全局列表中读取）。
    - 增加“创建新城市”可交互项，触发输入框录入新城市并同步到全局列表。
- **src/App.jsx**:
    - 处理头像菜单触发的操作。
    - 实现 `set-city` 和 `create-city` 逻辑（支持批量）。

### 基于文件夹的行程结构 (New)
- **目标**：主目录下的每个子文件夹自动识别为一个行程 (Trip)。进入行程后，所有视图（照片、事件）均被该行程隔离。

#### 1. 扫描与自动识别 (src/hooks/useFileSystemAccess.js)
- **子文件夹检测**：在 `initWorkspace` 和 `restoreWorkspace` 中，通过 `directoryHandle.values()` 识别第一层子文件夹。
- **自动创建 Trip**：如果发现新的子文件夹且数据库中没有对应的 `folder_name` 或 `trip_id`，自动在 `dbContent.trips` 中创建一个条目（使用文件夹名作为标题）。
- **照片关联**：照片元数据中自动记录所属的 `trip_id`（基于其路径深度）。

#### 2. 全局视角隔离 (src/App.jsx)
- **进入行程逻辑**：当 `activeFilter.type === 'trip'` 时，系统进入“行程模式”。
- **导航过滤**：
    - 在“行程模式”下，“所有照片”视图仅显示该子文件夹下的照片。
    - 在“行程模式”下，“事件”导航仅显示归属于该行程的事件。
- **返回主页**：点击 Logo 或特定按钮可重置隔离状态，回到全量行程列表视图。

#### 3. 界面优化 (src/components/Sidebar.jsx / TopBar)
- 显示当前处于哪个行程中。
- 在“所有照片”视图中，如果已进入行程，标题应显示为行程名称而非“全档案”。

### 按日期自动分组照片 (New)
- **目标**：在照片流视图中，按照照片的拍摄日期进行分组显示，并插入美观的日期分割线。

#### 1. 分组逻辑 (src/App.jsx)
- **辅助函数**：实现一个 `groupPhotosByDate` 函数，接收照片数组并返回插入了 `date-header` 对象的数组。
- **日期排序**：确保照片按时间倒序排列。
- **应用范围**：在 `activeFilter.type === 'event'`、行程模式下的未分类照片流以及全局模式下的未分类照片流中应用此逻辑。

#### 2. 网格显示增强 (src/components/VirtualGrid.jsx)
- **全行占据**：为 `date-header` 类型的组件设置 `grid-column: span 16`，使其横跨整个网格。
- **样式设计**：
    - 使用大而细的字体显示月份和日期。
    - 增加模糊背景或线条装饰，复刻 Google Photos 的 Premium 感。
- **交互兼容**：确保框选（Rectangle Selection）逻辑跳过日期标题。

#### 3. 日期格式化 (src/App.jsx)
- 使用 `Intl.DateTimeFormat` 格式化日期标题，支持中文（如“2024年3月15日 星期五”）。

### 每日照片一键全选 (New)
- **目标**：在每个日期标题（Date Header）右侧增加一个全选按钮或勾选框，允许用户一键选中该日期下的所有照片。

#### 1. 批量选择逻辑 (src/App.jsx)
- **实现 `handleToggleDateSelection`**：
    - 接收 `date` 参数。
    - 查找当前 `displayedItems` 中所有属于该日期的照片路径。
    - 如果该日期的照片未全选，则全数添加至 `selectedIds`；如果已全选，则全数移除。
- **状态同步**：确保 UI 能实时反馈某一天是否处于全选状态。

#### 2. UI 增强 (src/components/VirtualGrid.jsx)
- **交互组件**：在日期标题行右侧添加一个自定义 Checkbox 或“全选/取消全选”按钮。
- **智能计算**：在渲染 `date-header` 时，动态计算该日期下的照片在 `selectedIds` 中的占比，以显示半选或全选状态。
- **视觉反馈**：按钮应具有悬浮高亮效果，符合 Google Photos 的交互质感。

### 属性自定义颜色 (New)
- **目标**：为分类和城市支持自定义色彩，在 UI 中以彩色标签形式展示，并在属性编辑器中通过“颜色球”更换。

#### 1. 数据结构升级 (src/hooks/useFileSystemAccess.js)
- **Schema 迁移**：将 `categories`, `cities`, `tags` 从 `string[]` 升级为 `Array<{ name: string, color: string }>`.
- **默认色彩分配**：在初始化或恢复工作区时，若发现旧的字符串数组，自动转换为对象并分配默认色彩（如蓝色）。
- **同步更新**：确保 `handleAddProperty` 等逻辑适配新结构。

#### 2. 属性编辑器增强 (src/components/PropertyManagerModal.jsx)
- **交互组件**：在每个属性卡片中增加一个直径约 12px 的圆点（颜色球）。
- **点击切换**：点击颜色球时，弹出一个极其精美的迷你色板（Predefined Colors）或循环切换预设颜色，并调用 `onUpdate` 同步至数据库。
- **视觉反馈**：色板应具备背景模糊和物理交互动画。

#### 3. 标签展示优化 (DetailModal.jsx 等)
- **彩色标签**：在详情页（DetailModal）的下拉选择或当前属性展示中，背景色使用相应的 `color`（带透明度），文字使用白色/亮色。

## 验证计划

### 功能验证
- 在属性编辑器中点击颜色球，确认颜色发生变化且保存成功。
- 新增属性时，确认分配了初始颜色。
- 删除属性功能保持正常。

### 视觉验证
- 确认彩色标签在不同背景下（深色/浅色模式）均清晰易读。
- 确认颜色切换动画丝滑。

## 照片卡片与过滤器增强 (New)

### 1. 照片卡片标签化 (src/components/PhotoCard.jsx)
- **获取全局属性**：通过 props 接收 `metadata` (含 cities/categories 颜色映射)。
- **布局设计**：在卡片底部或覆盖层(Overlay)上方，添加一行小型彩色标签。
- **渲染逻辑**：
    - 如果照片有 `category`，显示对应颜色的分类标签。
    - 如果照片有 `city`，显示对应颜色的城市标签。

### 2. 增强过滤器逻辑 (src/App.jsx & src/components/Sidebar.jsx)
- **过滤器定义**：
    - `unclassified`: 过滤 `!p.category` 的照片。
    - `no-city`: 过滤 `!p.city` 的照片。
- **UI 集成**：在左侧边栏或主筛选区域增加这两个入口。

### 3. 数据层适配 (src/App.jsx)
- 在 `displayedItems` 的计算逻辑中，识别新增的 `filter.type` 并执行相应的过滤动作。

## 右键交互与信息展示优化 (New)

### 1. 自动选中逻辑 (src/App.jsx)
- **包装 ContextMenu 回调**：在 `App.jsx` 中定义 `handleItemContextMenu`。
- **逻辑实现**：
    - 获取右键点击项的 ID (path 或 type:id)。
    - 如果该项不在当前 `selectedIds` 选区中：
        - 清空现有选区。
        - 将该项设为唯一选中项。
    - 这样可以确保右键菜单操作的目标明确且符合用户预期。

### 2. 增强分类信息展示 (src/components/PhotoCard.jsx)
- **样式升级**：
    - 增大分类标签的字体大小 (`text-[9px]` 或更高)。
    - 调整布局，使分类信息在卡片上更加醒目。
    - 确保颜色对比度高于背景，提升可读性。
