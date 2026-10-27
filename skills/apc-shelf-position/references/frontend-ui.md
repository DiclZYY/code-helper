# 前端组件与页面用法

## 1. 管理端（Vue2 + Element UI）

### 1.1 配置页

| 文件 | 说明 |
|------|------|
| `backend/src/router/modules/clever_shelf.js` | 路由 `/clever_shelf/index`，`hidden: true`，`permit: clever_shelf.index` |
| `backend/src/views/config/clever_shelf/index.vue` | 树表（`row-key` + `tree-props`），顶部有位置说明 `el-alert`，弹窗复用 `create.vue` |
| `backend/src/views/config/clever_shelf/manage.vue` | 新版：左侧位置树 + 右侧下级卡片；列节点卡片展示 `first_face / groups / layers / layers2`；支持「添加库房」「快速添加列」 |
| `backend/src/views/config/clever_shelf/create.vue` | 表单：`el-cascader` 选 `id_path`（`value: id`、`label: name`、`checkStrictly: true`）；`name` 含「列」时才显示面/组/层 |

配置页注意：

- `groups` / `layers` / `layers2` 只对列节点有意义，库/区节点不展示。
- `first_face` 只用单选 A/B，不要用自由输入。
- 删除有子节点的节点由后端拒绝，前端要给出提示而非静默失败。
- 修改库/区名后，历史 `position` 字符串不会自动更新，需在页面上明确提示或提供回填入口。

### 1.2 选位组件族（`backend/src/components/Position/`）

```
Position/index.vue        ← 对外组件（面/组/层 + 位置模式）
Position/Cascader.vue     ← 拉取 /config/clever_shelf/options 的级联树
Position/Mode.vue         ← snake（蛇形）/ coordinate（坐标）
```

`Position` 契约：

| prop / event | 说明 |
|--------------|------|
| `v-model` | 列节点 ID（写入 `position_mjj`） |
| `:offset.sync` | `[面, 组, 层]`（写入 `position_mjj_inner`） |
| `:position.sync` | 完整展示字符串（由级联文本 + 面/组/层拼出） |
| `position-mode` | `coordinate`（默认）/ `snake` |
| `show-mode` | 是否显示位置模式切换按钮 |
| `only-mode` | 只显示模式切换（批量分配场景） |
| `display-modes` | 允许的模式集合，如 `['coordinate']` |

要点：

- 组/层选项来自级联选中节点的 `groups` / `layers`，不要在前端写死 6 层。
- `offset` 变化需节流（现有实现 500ms trailing），避免连续选择触发大量接口。
- 选位结果最终以 `position` 字符串回显，但**保存仍以后端三字段收口为准**。

典型用法：

```vue
<PositionSelector
  v-model="form.position_mjj"
  :offset.sync="form.position_mjj_inner"
  :position.sync="form.position" />

<div class="form-help-text">最终位置：{{ form.position }}</div>
```

业务页落点：

| 页面 | 用法 |
|------|------|
| `views/custody/archive_box/create.vue` | 单箱位置：`v-model` + `offset` + `position` |
| `views/custody/order/import-box.vue` | 起始位置：`start_mjj` + `start_mjj_inner` + `position-mode` |
| `views/custody/order/batch-box.vue` | 起止位置：`start_mjj` / `end_mjj`，结束位只传 `offset`（`show-mode=false`） |
| `views/custody/archive_box/index.vue` | 批量分配组层号：`only-mode` + `display-modes=['coordinate']` |

### 1.3 展示

- 列表/详情直接展示 `position` 字段（后端已是「库+区+列+面+组+层」完整串）。
- 需要分列展示时，把 `position` 解析展示，不要用 `position_mjj` 再去请求树拼名称（列表会 N+1）。
- 表单里用 `form-help-text` 显示最终位置，避免用户只看到级联选择而不知道落库结果。

## 2. H5（Vue3 + Vant）

### 2.1 `ShelfGridPicker`（`src/components/ShelfGridPicker/index.vue`）

底部弹层选位器：库/区/列级联 + A/B 面切换 + 网格点选 + 占用状态。

| prop / event | 说明 |
|--------------|------|
| `v-model:show` | 弹层显隐 |
| `teleport` | 默认 `'body'`；**必须**挂到 body，避免外层 transform 导致 fixed 失效 |
| `z-index` | 默认 2000，需高于外层弹层 |
| `originPosition` | 原位置（架内移动时高亮「原位置」格） |
| `initialPosition` | 初始选中（回显上次选择） |
| `@confirm` | 回传 `{ position_no, column_id, layer_id, position_mjj_inner, ... }` |

内部流程：

```
onOpen → getShelfOptions() → 树数据
级联确认（库/区/列）→ getShelfGrid({ column_id, face })
选面 → 重新拉 grid
点格 → selectedCell
确认 → emit('confirm', cell)
```

展示要点：

- 网格按 `rows` 原样渲染（后端已处理层序与 A/B 组序），前端不要二次排序。
- `position_no` 在格子上用短格式（如 `A面3组4层`），完整串在确认区展示。
- 占用/原位置/已选三种状态分别着色，图例固定展示。
- 内层级联 `van-picker` 也需 `position="bottom"`；与外层 `ShelfGridPicker` 同处弹层栈时注意 `z-index`。

### 2.2 业务页落点

| 页面 | 用途 |
|------|------|
| `views/shelve-register/index.vue` | 上架登记：选位后随入库请求提交 `position` + `position_mjj_inner` |
| `views/shelve-register/components/NewArchiveBoxForm.vue` | 新箱表单内选位，`initialPosition` 回显 |
| `views/box-move/index.vue` | 批量移箱：多箱各自选位，`originPosition` 高亮原格；提交 `/custody_archive_box/move` |

### 2.3 API（`src/api/archiveBox.js`）

```js
getShelfOptions()                 // GET  /shelf/options
getShelfGrid({ column_id, face }) // POST /shelf/grid
resolvePosition(positionNo)       // POST /shelf/resolve-position
submitBoxMove(data)               // POST /custody_archive_box/move
```

### 2.4 保存契约

- 上架/移箱请求必须同时带 `position`（展示串）与 `position_mjj_inner`（`[面,组,层]`）；`position_mjj` 用 `column_id` / `layer_id`。
- 不要只传 `position_no` 让后端反复正则解析（能解析，但性能与健壮性都差）。
- 移动失败要整批回滚并提示具体箱号，不要部分成功。

## 3. 前后端一致性检查

- [ ] 组件与字段不绑定具体表：档案箱、档案盒或其他容器页复用同一套 `Position` / `ShelfGridPicker` 与三字段
- [ ] 模式 B 页面需显示/回传 `warehouse_id` + `area_group`，区在界面上显示为 `A区`，回传只传 `A`
- [ ] 前端选位回传的 `position_mjj_inner` 是数组，不是对象
- [ ] H5 格子 `layer_id` 与 `column_id` 都等于列节点 ID（历史命名遗留，不要当层 ID 用）
- [ ] 管理端 `offset` 与 H5 `position_mjj_inner` 字段名不同但语义一致，保存时统一映射
- [ ] 位置展示只用 `position`，不各自拼名称
- [ ] 弹层 `teleport="body"` + `z-index` 足够高
