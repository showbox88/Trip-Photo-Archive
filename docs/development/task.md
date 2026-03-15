# 任务清单

- [x] 获取并分析 "stitch" 代码以提取设计模式
- [x] 规划 "albums" 页面的技术实现
- [x] 创建或修改 "albums" 页面相关组件
- [x] 集成 "albums" 页面到主应用中
- [x] 验证并润色页面效果

## 设置行程封面功能 (New)
- [x] 修改 ContextMenu.jsx，为具有 trip_id 的照片添加“设为所在行程封面”的选项。
- [x] 修改 App.jsx 中的 onMenuAction，使得“set-trip-cover” 更新对应行程的 cover_photo_id。
- [x] 确保 AlbumsView.jsx 中优先使用 cover_photo_id 渲染封面。
- [x] 确保 DetailModal.jsx 中优先使用 cover_photo_id 作为行程大图。

## 细节调整 (New)
- [x] 在 DetailModal.jsx 中将照片分类输入框改为下拉选择。
- [x] 修复下拉菜单选项在深色模式下的显示异常。
- [x] 解决保存信息后整个网页“闪烁”的问题：
    - [x] 优化 `VirtualGrid.jsx` 的加载上限重置逻辑。
    - [x] 为 `PhotoCard.jsx` 添加 `React.memo` 优化。

## 右键分类与评分增强 (New)
- [x] 在 `ContextMenu.jsx` 中添加“修改分类”子菜单。
- [x] 在 `App.jsx` 中实现 `set-category` 的原子批量更新逻辑。
- [x] 在 `ContextMenu.jsx` 中添加“修改好感度”子菜单（单排心形图标）。
- [x] 在 `App.jsx` 中实现 `set-rating` 的原子批量更新逻辑。

## 全局属性管理系统 (New)
- [x] 在数据库中建立全局 `cities`, `categories`, `tags` 存储。
- [x] 实现右上角头像菜单（设置与属性编辑入口）。
- [x] 开发 `PropertyManagerModal` 用于管理全局属性列表。
- [x] 在 `ContextMenu.jsx` 中增加“修改城市”及“创建新城市”功能。
- [x] 在 `App.jsx` 中实现城市属性的原子批量更新及全局列表自增逻辑。

## 设置事件封面功能 (New)
- [x] 在 `ContextMenu.jsx` 中添加“设为事件封面”选项。
- [x] 在 `App.jsx` 中处理 `set-event-cover` 动作并更新事件元数据。
- [x] 确保事件封面在 UI 中正确应用（修复 `CollectionCard.jsx`）。
- [x] 统一颜色：将“设为行程封面”右键项改为紫色。

### 其他增强与优化 (Enhancements & Optimizations)
- [x] 允许在行程内将任何照片（即使未加入事件）设置为该行程的封面

## 右键菜单溢出优化 (New)
- [x] 在 `ContextMenu.jsx` 中实现边界检测逻辑。
- [x] 根据剩余空间动态决定子菜单弹出方向（左/右）。
- [x] 处理垂直方向的溢出。

## 基于文件夹的自动化行程管理 (New)
- [x] 在 `useFileSystemAccess.js` 中实现自动子文件夹检测与 Trip 创建。
- [x] 优化扫描逻辑，为照片自动关联 `trip_id`。
- [x] 在 `App.jsx` 中实现“行程视图模式”的全局过滤 isolation。
- [x] 确保在行程模式下，“所有照片”和“事件”列表均受限于该行程文件夹。
- [x] 在 `App.jsx` 中增加返回“所有行程”列表顶层的交互。

## 按日期分组的照片流 (New)
- [x] 在 `App.jsx` 中实现照片按日期排序并插入 `date-header` 的逻辑。
- [x] 在 `VirtualGrid.jsx` 中支持 `date-header` 类型，并实现全行遮盖。
- [x] 优化日期标题的视觉设计（字体、间距、背景）。
- [x] 确保框选逻辑兼容日期标题。

## 日期标题“全选”功能 (New)
- [x] 在 `App.jsx` 中实现 `handleToggleDateSelection` 逻辑。
- [x] 在 `VirtualGrid.jsx` 的日期标题中集成全选勾选框/按钮。
- [x] 实现针对特定日期选中进度的实时状态计算。
- [x] 将“全选”按钮移动到日期后面（`VirtualGrid.jsx`）
- [x] 每天加一个全选的功能
- [x] 优化全选按钮的视觉样式与悬浮反馈。

## 分类与城市自定义颜色 (New)
- [x] 在 `useFileSystemAccess.js` 中实现属性数据结构的平滑迁移（字符串 → 对象）。
- [x] 在 `PropertyManagerModal.jsx` 中增加颜色球交互及色板选择逻辑。
- [x] 为新增属性分配多样化的默认色彩。
- [x] 在 `DetailModal.jsx` 中应用彩色标签样式。
- [x] 确保在所有下拉选择器中同步显示颜色标识。

## 过滤器重构 (New)
- [x] 在 `App.jsx` 中增加 `filterState` 用于管理多选过滤条件。
- [x] 创建 `src/components/FilterMenu.jsx` 组件，支持多选切换。
- [x] 在 `App.jsx` 的右上角“Filter”按钮处集成 `FilterMenu`。
- [x] 移除 `Sidebar.jsx` 中的临时过滤器入口及相关逻辑。
- [x] 在 `PhotoCard.jsx` 中显示彩色分类和城市标签。
- [x] 优化右键交互：右键点击照片时默认选中该照片。
- [x] 增强照片卡片：使分类信息在卡片上显示得更加清晰醒目。
- [x] 修复过滤器 Bug：确保“未分类”等过滤结果中不出现重复的照片（三层去重机制）。
- [x] 优化过滤器逻辑：支持并集过滤（同时勾选时显示缺失任一属性的照片）。
- [x] 修正过滤器优先级：确保在行程视图内过滤器依然有效。
- [x] 增强元数据匹配：在 `enrichedPhotos` 中使用大小写不敏感的路径匹配。
