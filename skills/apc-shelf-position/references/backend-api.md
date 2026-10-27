# 后端接口与位置收口

参考实现：`api/app/Repositories/Implement/Config/CustodyCleverShelfRepository.php`、`CleverShelfRepository.php`、`CustodyArchiveBoxRepository.php`。

## 1. 接口清单

### 管理端（`routes/api.php`）

| 方法 | 路径 | 控制器 | 说明 |
|------|------|--------|------|
| GET | `config/clever_shelf/options` | `Config\CleverShelfController@options` | 库/区/列树，供级联选择（缓存） |
| GET | `config/clever_shelf` | 资源路由 `index` | 树表（`tree-props: children`） |
| POST/PUT/DELETE | `config/clever_shelf` 资源路由 | `Config\CleverShelfController` | 配置增删改 |
| POST | `config/clever_shelf/getColData` | `shelfColData` | 旧版：按分区+列统计格内档案数 |
| POST | `config/clever_shelf/getBoxData` | `shelfBoxData` | 旧版：按 `分区-列-节-层` 取格内档案 |

注册方式：`api.php` 的 `mainResources` 增加 `'clever_shelf' => 'Config\CleverShelfController'`；Repository 通过 `ServiceFactory::cleverShelf()` 获取。

### H5（`routes/h5.php`）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `shelf/options` | 位置树（选位器首屏） |
| POST | `shelf/grid` | 入参 `column_id`、可选 `face`；返回列面二维格子 |
| POST | `shelf/resolve-position` | 入参 `position_no`；返回标准位置号 + 架内坐标 |
| PUT | `custody_archive_box/{id}` | 改位置（仅传 `position`，后端反解析） |
| POST | `custody_archive_box/move` | 批量移箱：`box_ids[]` + `positions[]`（`position_no` / `layer_id` / `position_mjj_inner`） |
| POST | `custody_archive_box/store`、`store_and_operate` | 入库/上架登记时写位置 |

## 2. `shelf/grid` 响应结构

```json
{
  "column_id": 12,
  "column_name": "01列",
  "face": "A",
  "first_face": "A",
  "faces": ["A", "B"],
  "groups": 6,
  "layers": 6,
  "rows": [
    {
      "layer_index": 6,
      "layer_name": "6层",
      "cells": [
        {
          "cell_key": "12-A-6-6",
          "layer_id": 12,
          "column_id": 12,
          "position_no": "P库A区01列A面6组6层",
          "face": "A",
          "group_index": 6,
          "layer_index": 6,
          "section_name": "6组",
          "layer_name": "6层",
          "position_mjj_inner": ["A", 6, 6],
          "occupied": false
        }
      ]
    }
  ]
}
```

要点：

- `rows` 从最高层向下排（`for ($layer = $layers; $layer >= 1; $layer--)`）。
- A 面组号倒序、B 面组号正序。
- `occupied` 由该列箱/盒（档案箱、档案盒等容器）的 `position_mjj_inner` 标记；旧数据用 `position` 字符串兜底。
- 前端确认位置时回传 `position_no`、`layer_id`（= 列 ID）、`position_mjj_inner`。

## 3. 位置收口方法（必须复用）

`CustodyArchiveBoxRepository`：

| 方法 | 职责 |
|------|------|
| `normalizePositionPayload($data)` | 所有写入口前置：统一三字段（见下） |
| `buildPositionFields($mjjId, $face, $group, $layer)` | ID + 坐标 → 三字段 |
| `buildPositionString($mjj, $inner)` | 由位置树 `name($mjj, null, '')` 拼完整字符串 |
| `parsePositionInnerFromString($position)` | 字符串 → `[面, 组, 层]` |
| `resolveMjjIdFromPositionString($position, $map)` | 字符串 → 列节点 ID |
| `buildShelfPathMap($all, $repo)` | 构建「库/区/列 → ID」映射，含小写与去零回退 |
| `parseMjjString($mjjStr, ...)` | `p-a-2-a` → 列 ID + 面 + 两面层数 |

写入优先级：

```php
if ($mjjId > 0 && is_array($inner) && count($inner) >= 3) {
    return array_merge($data, $this->buildPositionFields($mjjId, $inner[0], $inner[1], $inner[2]));
}
if ($position 非空 && $mjjId <= 0) {
    $mjjId = $this->resolveMjjIdFromPositionString($position, $pathMap);
    $inner = $this->parsePositionInnerFromString($position);
    // 命中则 buildPositionFields
}
```

**任何移动、导入、批量分配、更新位置的代码路径都必须经过它**，不要直接 `update(['position' => ...])`。

`CustodyCleverShelfRepository`：

| 方法 | 职责 |
|------|------|
| `h5Grid($columnId, $face)` | 列面二维格子 + 占用状态 |
| `h5ResolvePosition($positionNo)` | 位置号校验 + 归一化 + 回传架内坐标 |
| `h5FaceOrder` / `h5FaceLayers` / `h5FirstFace` | 面顺序与两面层数 |
| `h5FindLibraryName` / `h5FindAncestorName` | 沿 `pid` 找库名 / 含「区」的祖先 |

`CleverShelfRepository`（通用）：

| 方法 | 职责 |
|------|------|
| `create($data)` | `pid = end(id_path)`，顶级 0 |
| `options()` | `getAll()` + `Helper::arrayToTree` |
| `getAll()` | 全表按 `sort` 排序、keyBy(id)，缓存 `position-all` 86400s |
| `name($id, $all, $separator)` | 父链名称拼接；默认 `/` |
| `deleteCache()` | 清 `clevershelf:index` |

## 4. 缓存

- `position-all`：全量位置树缓存（`getAll`），位置配置的读性能依赖它。
- `clevershelf:index`：管理端树表缓存（3600s）。
- `saved` / `deleted` 事件中调 `deleteCache()`。**现状只清 `clevershelf:index`，`position-all` 会残留旧数据**；新实现必须两个都清，或统一缓存键。

## 5. 校验

- 组/层必须落在 `1..groups`、`1..layers(layers2)` 内，且面必须是 `A/B`。
- `position` 唯一：冲突时返回可读提示，不要抛 SQL 异常。
- 删除节点前检查子节点（`pid` 存在即拒绝）。
- 位置字符串必须符合约定格式，拒绝前导 0、缺面/组/层。
- 模式 B（外键）需额外校验 `warehouse_id` / `area_group` 与 `position_mjj` 列节点一致；`area_group` 必须匹配 `^[A-Z]$`。

## 6. 库房维度的查询与查重

- 箱/盒唯一性可按「同库房内查重」：`duplicate_check_fields` + `with_library`，库房 key 取 `position_mjj` 的顶级祖先名（模式 A）或 `warehouse_id`（模式 B）。
- 列表按库房/分区筛选：模式 A 需先按名称定位库/区节点再取列 ID 集合；模式 B 直接 `where warehouse_id` / `where area_group`（区只存大写单字母，**不建也不 JOIN 分区表**）。
- 大数据量统计必须数据库侧聚合（`GROUP BY` / MongoDB `$group`），禁止全量 `get()` 后 `foreach`。

## 7. 批量分配位置（导入装箱 / 批量装箱）

- 入参：`start_mjj` / `start_mjj_inner`、可选 `end_mjj` / `end_mjj_inner`、`position.mode`（`snake` 蛇形 / `coordinate` 坐标）。
- 区间展开时按面切分：先上架面用 `layers`，另一面用 `layers2`；蛇形模式同层走完再折返，坐标模式按组优先再下一层。
- 展开结果逐箱走 `buildPositionFields`，不要直接拼字符串。
- 区间容量不足要提前报错，不能写到一半再回滚。
