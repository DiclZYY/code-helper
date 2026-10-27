# 位置模型与库房建模模式

参考实现（archive-hub-admin）：

- 表结构：`api/database/migrations/2022_11_17_164604_create_system_table.php`（`clever_shelf`）
- 档案箱字段：`api/database/migrations/2025_05_15_165343_create_custody_table.php`（`custody_archive_box`）
- 位置规则文档：`docs/clever-shelf-mjj.md`

## 1. 层级与命名

```
库房（3号库房）
  └─ 分区（A区）
      └─ 列（01列）           ← 位置定位到列节点
          ├─ 面 A / B
          └─ 组 × 层          ← 列上配置，不建子节点
```

- 节点 `name` 原样参与位置字符串拼接，**不要补分隔符**。
- 列节点名必须含「列」（如 `01列`），配置页用 `name.indexOf('列')` 判断是否显示面/组/层表单。
- 库、区、列、面的名称按 `name` 原样拼接；组/层用纯数字、**禁止前导 0**。
- 唯一完整位置示例：`3号库房A区01列B面3组4层`。
- 模式 B 下树**只保留列（可再分层）**：库不建 `pid` 节点（走 `warehouse_id` 外键），区不建节点（走 `area_group` 单字母），位置字符串仍由「库名 + `A区` + 列名 + 面组层」组成。

### 典型命名约定

| 层级 | 示例 | 备注 |
|------|------|------|
| 库房 | `3号库房`、`P库` | 纯字母库号写入时统一大写 |
| 分区 | `A区`、`B区` | 字母区号统一大写 |
| 列 | `01列`、`02列` | 两位补零，便于排序与解析 |
| 面 | `A` / `B` | 背靠背两面 |
| 组/层 | `3组`、`4层` | 纯数字，不加前导 0 |

## 2. 模式 A：pid 自关联树（现状）

```sql
CREATE TABLE clever_shelf (
  id          int unsigned AUTO_INCREMENT PRIMARY KEY,
  pid         int unsigned NULL COMMENT '父节点，0 为顶级',
  name        varchar(100) NOT NULL COMMENT '库 / 区 / 列',
  sort        smallint unsigned NOT NULL DEFAULT 0,
  id_path     json NULL COMMENT '祖先 ID 数组，含自身父链',
  first_face  varchar(2) NULL COMMENT '先上架面 A/B',
  groups      tinyint NULL COMMENT '组数（仅列节点）',
  layers      tinyint NULL COMMENT '先上架面层数',
  layers2     tinyint NULL COMMENT '另一面层数，空则同 layers',
  remark      varchar(1000) NULL,
  created_by  int NULL, updated_by int NULL,
  created_at  datetime NULL, updated_at datetime NULL,
  deleted_at  datetime NULL
);
```

关键行为：

- `id_path` 存祖先 ID 数组；`pid = end(id_path)`，为空则 `0`。
- 查询父链：循环 `pid` 向上，直到 `0`；`name` 拼接默认用 `/`，位置字符串用空分隔符。
- 找库名：取最顶层祖先；找区名：向上找 `name` 含「区」的祖先。
- 删除保护：存在 `pid = 当前 id` 的子节点时拒绝删除。
- 同一份 `clever_shelf` 可容纳多个库房（多个顶级节点）。

**容量陷阱**：现有 `custody_archive_box.position_mjj` 为 `unsignedTinyInteger`，列节点 ID > 255 溢出。新系统必须用 `unsignedInteger` 或 `bigInteger`。

## 3. 模式 B：库房外键 + `area_group` 单字母

适合：库房有独立属性（地址、负责人、启用状态）、需要按库房做数据权限、或库房/分区主数据由外部系统维护。

**核心约定：区不建表。** 区统一为单个大写英文字母（`A` / `B` / `C`…），直接作为属性存在箱/盒与密集架列节点上，字段名 `area_group`；展示时再拼成 `A区`。库保留独立主表，箱/盒与列节点通过 `warehouse_id` 外键挂库。

```sql
CREATE TABLE warehouse (
  id         bigint unsigned AUTO_INCREMENT PRIMARY KEY,
  code       varchar(40) NOT NULL UNIQUE COMMENT '库房编码，如 P',
  name       varchar(100) NOT NULL COMMENT 'P库',
  address    varchar(255) NULL,
  status     tinyint NOT NULL DEFAULT 1,
  sort       smallint NOT NULL DEFAULT 0,
  created_at datetime NULL,
  updated_at datetime NULL,
  deleted_at datetime NULL
) COMMENT '库房';

-- 密集架列节点：挂库外键 + 区字母（不再有「区」节点）
ALTER TABLE clever_shelf
  ADD COLUMN warehouse_id bigint unsigned NULL COMMENT '所在库房',
  ADD COLUMN area_group   char(1) NULL COMMENT '分区字母 A/B/C',
  ADD KEY idx_wh_area (warehouse_id, area_group);

-- 箱/盒（档案箱、档案盒或其他容器表）：库区直接挂在记录上
ALTER TABLE custody_archive_box
  ADD COLUMN warehouse_id bigint unsigned NULL COMMENT '所在库房',
  ADD COLUMN area_group   char(1) NULL COMMENT '分区字母 A/B/C',
  ADD KEY idx_box_wh_area (warehouse_id, area_group);
```

约束与行为：

- `area_group` **只存大写单字母**：入库前 `strtoupper(trim())` 并校验 `^[A-Z]$`；禁止存 `A区`、`a`、`1`。
- `warehouse_id` 为真外键（`warehouse.id`）；箱/盒上也保存 `warehouse_id`，便于按库房过滤与统计，不依赖 `position_mjj` 祖先。
- 密集架树退化为「列（可再分层）」：库不再作为 `pid` 顶级节点；`clever_shelf.name` 只剩 `01列`（或列/组/层），区由 `area_group` 提供。
- 名称拼接改为 `warehouse.name + area_group . '区' + column.name`；禁止再沿 `pid` 找「区」祖先。
- 箱/盒写入位置时同事务写 `warehouse_id` / `area_group`，值从列节点继承；三者不一致时以 `position_mjj` 为准并回填。
- 筛选「按库房/分区」直接 `where warehouse_id` / `where area_group`，不再做父链子查询。
- 迁移步骤：① 建 `warehouse`；② 从 `clever_shelf` 顶级节点生成库房；③ 把「区」节点的字母写入其下列节点的 `area_group`，并回填 `warehouse_id`；④ 删除/归档「区」节点；⑤ 箱/盒按 `position_mjj` 回填；⑥ 灰度校验后收紧非空。

## 4. 箱/盒三字段（任何承载容器表）

位置归属对象是「承载实体的容器」：档案箱 `custody_archive_box`、档案盒 `file_box` / `files_box`、或其他容器表，都保存同一套三字段。下表以档案箱为例，字段名不变。

| 字段 | 类型 | 含义 |
|------|------|------|
| `position` | varchar(60)，唯一 | 完整展示/扫码位置，`库名+区名+列名+面+组+层` |
| `position_mjj` | 列节点 ID | 定位到「列」 |
| `position_mjj_inner` | json(b) | `[面, 组, 层]`，索引数组；部分现场可带第 4 位「组层内序号」 |

写入优先级（与 `CustodyArchiveBoxRepository::normalizePositionPayload` 一致）：

1. `position_mjj > 0` 且 `position_mjj_inner` 长度 ≥ 3 → 直接由 ID + 坐标生成三字段（**最可靠**）
2. 只给 `position` 字符串 → 正则解析出库/区/列 → 反查列节点 ID；再解析面/组/层
3. 都没有 → 不写位置

## 5. 位置字符串规范与解析

生成：

```
库名 + 区名 + 列名 + 面 + 组 + 层
sprintf('%d组%d层', $group, $layer)
```

示例：`3号库房A区01列B面3组4层`、`P库A区02列A面1组1层`。

解析（H5 位置号）：

```php
/^(.+?区)?(.+?列)([AB])面(\d+)组(\d+)层$/u
```

解析（完整位置反查列节点）：

```php
/^([A-Za-z0-9]+库)([A-Za-z]+区)(\d+)列/u
```

容错：

- 纯字母库号大小写不敏感：映射表同时存原值与 `strtolower`。
- 列号去前导零回退：`01列` ↔ `1列` 都可命中。
- 旧数据兼容：`position_mjj_inner` 缺失时，用 `position` 字符串作为占用键兜底匹配。

## 6. H5 网格规则

- `groups` = 网格列数；层数 = 网格行数；**最高层在最上面，第 1 层在最下面**。
- A/B 面背靠背：
  - A 面：第 1 组在最右，最后一组在最左（`range(groups, 1)`）
  - B 面：第 1 组在最左，最后一组在最右（`range(1, groups)`）
- `first_face = B` 时面切换顺序为 `B面`、`A面`；否则 `A面`、`B面`。
- 层数取值：先上架面用 `layers`，另一面用 `layers2`，`layers2` 为空回退 `layers`。
- 占用判断：`position_mjj = column_id` 取出该列箱/盒，解析 `position_mjj_inner` 生成 `columnId-face-group-layer` 键；旧数据用 `position` 字符串比对 `position_no`。
- 格子响应必须带 `cell_key`、`position_no`、`position_mjj_inner`，前端只做展示与回传，不自行推导。

## 7. 兼容旧模型（`files_box` / `archives` / `file_box`）

旧表 `files_box`（档案盒）、`archives`（档案）、`file_box`（档案盒）的 `position` 均存**节点 ID**（`unsignedInteger`，语义为「区/列/节/层」中的某一层节点），与 custody 的三字段体系不同。迁移或共存时：

- 新代码只认 `position_mjj` + `position_mjj_inner`，旧字段仅用于历史数据展示。
- 若需从旧数据迁移：按层节点向上找「列」祖先 → 写 `position_mjj`；层序号与组序号从节点名解析（`03组` / `04层`）。
- 不要在新表继续新增「按层 ID 存位置」的字段。
