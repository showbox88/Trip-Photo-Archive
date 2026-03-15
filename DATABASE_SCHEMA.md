# Database Schema (trip_database.json)

本项目使用纯本地 JSON 文件作为数据库。

## `trips` (行程表)
| 字段 | 类型 | 说明 |
| :--- | :--- | :--- |
| `trip_id` | UUID | 唯一标识符 |
| `title` | String | 行程名称 |
| `country` | String | 国家/地区 (Notion 风格) |
| `start_date` | Date String | 格式: YYYY-MM-DD |
| `end_date` | Date String | 格式: YYYY-MM-DD |
| `stage` | Enum | `Planning`, `Completed`, `Ongoing`, `Canceled` |
| `cover_photo_id` | ID? | 行程封面（预留） |

## `events` (事件表)
| 字段 | 类型 | 说明 |
| :--- | :--- | :--- |
| `event_id` | UUID | 唯一标识符 |
| `trip_id` | UUID? | 所属行程 ID。若为 null 则表示独立事件。 |
| `title` | String | 事件名称 |
| `city` | String | 具体城市/地点 |
| `category` | String | 业务分类（如：美食、景点、交通等） |
| `rating` | Number | 1-10 评分 |
| `notes` | String | 详细回忆笔记 (Markdown 支持) |
| `date` | Date String | 事件发生日期 |
| `spending`| Number | 消费金额 |
| `currency` | String | 货币类型 (默认 CNY) |

## `photos` (照片表)
| 字段 | 类型 | 说明 |
| :--- | :--- | :--- |
| `photo_id` | UUID | 内部唯一 ID |
| `file_name` | String | 相对文件夹根目录的路径（主要索引凭据） |
| `timestamp` | ISO String | EXIF/拍摄时间 |
| `date` | Date String | 归一化日期 (YYYY-MM-DD) |
| `event_id` | UUID? | 所属事件 ID |
| `trip_id` | UUID? | 所属行程 ID（冗余存储以便快速查询） |
| `city` | String | 照片关联城市 |
| `category` | String | 照片关联分类 |
| `rating` | Number | 1-10 评分 |

## 关系逻辑
1. `Trip` 主表：管理一级文件夹。
2. `Event` 被 `Trip` 包含：通过 `event.trip_id` 关联。
3. `Photo` 被 `Event` 或 `Trip` 包含：通过 `photo.event_id` 或 `photo.trip_id` 直接关联。
4. **实时过滤**：基于 `photo.category` 与 `photo.city` 的 null 状态实现智能过滤器。

---
*警告：手动修改 JSON 需确保 UUID 的唯一性和引用完整性。*
