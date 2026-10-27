---
name: apc-shelf-position
description: >-
  密集架（库房智能密集架）配置与档案箱/盒存储位置的落地指引：clever_shelf 树形建模
  （库/区/列 + 面/组/层）、position / position_mjj / position_mjj_inner 三字段的写入与解析、
  库房分区两种建模模式（pid 自关联树 vs 库房外键 + area_group 单字母分区）、admin Vue2 PositionSelector、
  H5 Vant ShelfGridPicker 选位与网格占用展示、相关接口与缓存。
  Use for 密集架 / 存储位置 / position_mjj / position_mjj_inner / 库房分区 / 扩张库区 /
  选位 / 移箱 / 上架登记 / 网格占用 / 档案盒 / shelf grid / clever_shelf.
---

# apc-shelf-position（密集架配置与存储位置）

在 apc 框架（Vue2 管理后台 + Laravel API + Vue3/Vant H5）中落地「密集架怎么配、档案箱/盒位置怎么存、前端怎么选与展示」的标准做法。

**位置归属对象不限于档案箱**：档案箱、档案盒（以及其他承载实体的容器）只要需要保存库内位置，都复用同一套三字段与选位组件；下文统称「箱/盒」。

**不解决**：箱/盒自身的业务状态流转（入库/出库/盘点）、订单分配算法、RFID 设备对接。

## 0. 使用前：先确定库房建模模式（必须询问）

两种模式**不可混用**，先让用户选，再往下写代码。用 `AskUserQuestion` 弹出：

```yaml
questions:
  - header: 库房模式
    multiSelect: false
    question: 目标系统的库房 / 分区用哪种建模？
    options:
      - label: pid 自关联树 (推荐/现状)
        description: 单表 clever_shelf，库→区→列 全靠 pid + id_path 父子链；箱/盒只存 position_mjj 指向列节点。改造成本最低，适合单系统多库房。
      - label: 库房外键 + 区单字母
        description: 库房保留独立主表，箱/盒与密集架列节点用 warehouse_id 外键挂库；区不建表，统一为单字母 area_group（如 A）直接存在箱/盒与列节点上。适合库房有独立属性、需按库房隔离数据。
```

| 维度 | 模式 A：pid 自关联 | 模式 B：库房外键 + 区单字母 |
|------|-------------------|---------------------------|
| 层级来源 | `clever_shelf.pid` + `id_path` | 密集架列节点 `warehouse_id` 外键 + `area_group` 字母 |
| 库区名称 | 沿父链拼 `name` | JOIN 库房表取库名；区名由 `area_group` 拼成 `A区` |
| 箱/盒库区归属 | 只能靠 `position_mjj` 反推祖先 | 箱/盒直接存 `warehouse_id` + `area_group`，可直接过滤统计 |
| 适用 | 现有系统、单库房为主 | 多库房隔离、库房有独立负责人/地址等属性 |
| 迁移 | — | 由 `pid` 祖先回填 `warehouse_id` / `area_group`，保留 `position_mjj` |

选定后按 [references/position-model.md](references/position-model.md) 对应章节建表。

## When to use

**适用**：
- 新建或改造「密集架配置」页面（库/区/列、组数、层数、先上架面）
- 档案箱/盒（或其他承载容器）需要保存存储位置（三字段 `position` / `position_mjj` / `position_mjj_inner`）
- 实现选位器：管理端点选级联、H5 网格点选、扫码/输入位置号解析
- 移箱、上架登记、批量分配位置区间
- 位置字符串反查、占用状态判断、按库房/分区筛箱盒

**不适用**：
- 只改箱/盒业务字段（走 `apc-module-dev`）
- 只做 H5 页面样式（走 `spa-naf` + H5 规范）
- 库房温湿度/门禁等设备管理（与位置无关）

## Core pattern

```
clever_shelf 配置（库 → 区 → 列，列上带 groups / layers / layers2 / first_face）
        │
        ├─ 模式 A：pid + id_path 自关联
        └─ 模式 B：warehouse_id 外键 + area_group 单字母（不建区表）
        ↓
选位（admin PositionSelector / H5 ShelfGridPicker / 位置号解析）
        ↓
统一写三字段（后端 normalizePositionPayload 收口）
   position          = 库名+区名+列名+面+组+层（唯一，展示/扫码）
   position_mjj      = 列节点 ID（定位到列）
   position_mjj_inner = ["A", 组, 层]（定位到格）
        ↓
H5 网格：按 position_mjj 查该列箱/盒 → 用 position_mjj_inner 标占用
```

> 位置归属对象是「承载实体的容器」：档案箱（`custody_archive_box`）、档案盒（`file_box` / `files_box`）或其他容器表，字段与组件完全一致，只是表名不同。

## 数据模型（要点）

`clever_shelf`（模式 A）：

| 字段 | 含义 |
|------|------|
| `id` / `pid` / `id_path` | 树形自关联；`pid` 由 `id_path` 末位推导，顶级 `pid = 0` |
| `name` | 节点名：`3号库房` / `A区` / `01列`（列名带「列」） |
| `first_face` | 先上架面 `A` / `B`，决定自动分配与 H5 面顺序 |
| `groups` | 组数（网格列），仅列节点有效 |
| `layers` / `layers2` | 先上架面层数 / 另一面层数（空则回退 `layers`） |
| `sort` | 排序 |

箱/盒位置三字段（任何承载容器表都适用）：`position`（60 字符、唯一）、`position_mjj`（列节点 ID）、`position_mjj_inner`（JSON 数组 `[面, 组, 层]`，**不是对象**）。

模式 B 额外字段：箱/盒与密集架列节点均保存 `warehouse_id`（库房外键）与 `area_group`（单字母大写 `A` / `B` / `C`，**不建分区表**）；展示时拼成 `A区`，存储与筛选只用字母。

完整建表、层级命名、字符串格式与解析正则见 [references/position-model.md](references/position-model.md)。

## Implementation checklist

### 1. 配置表与模型
- [ ] 建表：模式 A / B 的完整 SQL 见 [references/position-model.md](references/position-model.md) 第 2、3 节
- [ ] 模型 `$fillable` 含 `pid, name, sort, id_path, first_face, groups, layers, layers2, remark`
- [ ] `create()` 由 `id_path` 计算 `pid`（顶级置 0），见 [assets/position-fields.template.php](assets/position-fields.template.php)
- [ ] 删除保护：有子节点时抛业务异常，禁止直接删库/区
- [ ] 模式 B：库房保留主表，密集架列节点加 `warehouse_id` 外键 + `area_group` 单字母；**禁止为「区」单独建表**
- [ ] 保存/删除后清位置缓存（同时清 `position-all` 与 `clevershelf:index`）

### 2. 位置写入收口（后端）
- [ ] 列表/表单/导入/移动所有写入口，统一调用 `normalizePositionPayload()`，见 [references/backend-api.md](references/backend-api.md)
- [ ] 有 `position_mjj + position_mjj_inner` → 反查路径生成 `position`
- [ ] 只有 `position` 字符串 → 正则解析库/区/列定位 `position_mjj`，再解析面/组/层
- [ ] `position` 唯一约束冲突要转成可读提示（如「该位置已有箱/盒」）
- [ ] 校验组/层不超过列的 `groups` / 对应面 `layers(layers2)`
- [ ] 模式 B：写位置时同事务写 `warehouse_id` / `area_group`（与 `position_mjj` 祖先一致），`area_group` 只存字母

### 3. 接口
- [ ] 管理端：`config/clever_shelf/options`（树）、`index`（树表）、增删改查
- [ ] H5：`shelf/options`（树）、`shelf/grid`（列面二维格）、`shelf/resolve-position`（位置号解析）
- [ ] 箱/盒：`PUT custody_archive_box/{id}`（改位置）、`POST custody_archive_box/move`；档案盒或其他容器表按同一收口方法接入
- [ ] 接口清单与返回结构见 [references/backend-api.md](references/backend-api.md)

### 4. 前端
- [ ] 管理端配置页：左树右卡片（库→区→列），列节点表单显示 `first_face / groups / layers / layers2`
- [ ] 管理端选位：`components/Position`（Cascader + 面/组/层），`v-model` 绑 `position_mjj`，`:offset` 绑 `position_mjj_inner`
- [ ] H5 选位：`ShelfGridPicker`（底部弹层 + 网格 + 占用状态），必须 `teleport="body"`
- [ ] 展示位置直接用 `position` 字符串，不要在页面里重新拼名字
- [ ] 细节与 props 见 [references/frontend-ui.md](references/frontend-ui.md)

### 5. 自检
- [ ] 同一格位不能落两个箱/盒（`position` 唯一 + 占用刷新）
- [ ] `first_face = B` 时 H5 面按钮顺序与 A/B 组编号方向正确
- [ ] `layers2` 为空时回退 `layers`，两面层数不同时不串用
- [ ] 位置字符串无前导 0（`3组4层`，不是 `03组04层`）
- [ ] 库区改名后历史 `position` 是否需要回填（默认不回填，需明确）

## Anti-patterns

- **位置只存一个字符串**：缺少 `position_mjj` / `position_mjj_inner` 后，网格占用、移动、统计全部退化为正则匹配
- **`position_mjj_inner` 存成对象**（`{face,group,layer}`）：读取端按索引数组取值会拿到 `null`；兼容读取可两种都兼容，但**写入必须数组**
- **`position_mjj` 用 `unsignedTinyInteger`**：列 ID 超过 255 直接溢出；新系统一律 `unsignedInteger`/`bigInteger`
- **前端各自拼位置字符串**：出现「A区01列」与「A区1列」两种写法，导致反查失败；只允许后端 `name()` 统一生成
- **移动/导入绕过收口方法**：直接 `update(['position' => ...])` 会漏掉另外两个字段
- **改库房名不同步历史位置**：展示用旧名、反查失败；需给出回填脚本或明确不做
- **删除有子节点的库/区**：配置树出现孤儿数据，位置无法解析
- **H5 弹层不加 `teleport="body"`**：在外层 `transform` 容器内 `position: fixed` 失效，网格错位
- **只清 `clevershelf:index` 不清 `position-all`**：配置改了但选位树仍是旧数据
- **模式 A 与模式 B 混用**：一半靠 `pid` 一半靠外键，查询条件互相打架
- **为「区」单独建表**：区就是单字母属性，直接存箱/盒与列节点的 `area_group`；建表只会增加 JOIN 与不一致风险
- **`area_group` 存成 `A区` / `a` / `1`**：统一存大写单字母 `A`，展示层再拼「区」字，否则筛选与唯一性都对不上
- **位置能力写死在档案箱表**：档案盒或其他容器另起字段/组件；应复用同一套三字段与同一收口方法
- **把「库」也塞进 `pid` 树又保留 `warehouse_id`**：模式 B 下库走外键，树里不要再出现库节点

## Additional resources

- [references/position-model.md](references/position-model.md) — 表结构、两种模式（含 `area_group` 字母分区）、位置字符串规范、H5 网格规则、旧数据兼容
- [references/backend-api.md](references/backend-api.md) — 接口清单、箱/盒位置收口方法、缓存与校验
- [references/frontend-ui.md](references/frontend-ui.md) — admin `Position` 组件族、H5 `ShelfGridPicker`、箱/盒业务页用法
- [assets/position-fields.template.php](assets/position-fields.template.php) — `pid` 推导 + 位置三字段构建/解析模板
