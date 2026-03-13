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
| `category` | String | `Sightseeing`, `Dining`, `Transport`, `Housing`, `Shopping` |
| `rate` | Number | 1-5 评分 |
| `notes` | String | 详细回忆笔记 (Markdown 支持预留) |
| `date` | Date String | 事件发生日期 |
| `total_spending`| Number | 消费金额 (预留) |
| `currency` | String | 货币类型 (默认 CNY) |

## `photos` (照片表)
| 字段 | 类型 | 说明 |
| :--- | :--- | :--- |
| `photo_id` | UUID | 内部唯一 ID |
| `file_name` | String | 相对文件夹根目录的路径（作为与 handle 关联的凭据） |
| `timestamp` | ISO String | 录入/扫描时间 |
| `event_id` | UUID? | 所属事件 ID。 |

## 关系逻辑
1. `Trip` -> `Event` (1对多): 通过 `event.trip_id` 关联。
2. `Event` -> `Photo` (1对多): 通过 `photo.event_id` 关联。
3. `Photo` -> `Trip`: 间接关联。

---
*警告：手动修改 JSON 需确保 UUID 的唯一性和引用完整性。*
