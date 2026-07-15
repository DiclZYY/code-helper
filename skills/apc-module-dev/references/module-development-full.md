# 业务模块开发规范（完整版）

> 来源：业务仓库 `docs/framework/module-development.md`（同步保留）。  
> Skill 入口：[../SKILL.md](../SKILL.md)  
> 模板片段：[../assets/](../assets/)

本文约定在 apc 框架下**新增一个标准业务模块**（后端资源 API + 管理端列表 / 表单 / 详情，可选 Excel 导入导出；**表单一键模拟数据**、**详情补充区块的本地模拟数据**）时应创建与修改的文件、命名与职责边界。

> **示例依据**：业务仓库提交 `735024c2fde7fad5416b1608527b3f520d83c279`（项目管理脚手架）；表单模拟数据见 `backend/src/views/project/create.vue`；详情页统计 / 子表等未接接口的展示见 `backend/src/views/project/detail.vue` + `detailMockData.js`。

## 1. 适用范围

- 与示例一致：**单表资源**、通过 `api/routes/api.php` 中 `mainResources` 注册的标准 REST 风格接口。
- 管理端为 Vue2（`backend/`），与 `listMixin`、`routeMixin`、`dictMixin`、`excelMixin` 等既有模式对齐。

## 2. 必建文件清单（按模块）

以下 `<Module>` 为 PascalCase 类名前缀（如 `Project`），`<module>` 为小写路由 / 目录名（如 `project`）。

### 2.1 后端 API（`api/`）

| 路径 | 职责 |
|------|------|
| `app/Http/Controllers/Api/<Module>Controller.php` | 资源控制器：注入对应 Repository，按需 `use` 公共 Trait（如 Excel）。 |
| `app/Models/<Module>.php` | 表映射：`$table`、`$fillable`、`$casts`；`rules()`、`columns()`；`boot()` 内操作日志等。 |
| `app/Repositories/Implement/<Module>Repository.php` | `model()` 绑定模型；`getListBuilder()` 默认排序、关键字等；导入场景配置 `importUniqueKey`。 |

### 2.2 前端管理端（`backend/`）

| 路径 | 职责 |
|------|------|
| `src/router/modules/<module>.js` | 模块路由：`Layout`、子路由、`meta.title`（i18n key）、`permit` 与 `activeMenu`。 |
| `src/views/<module>/index.vue` | 列表：筛选、分页、权限按钮；可选高级搜索、导入 / 导出。 |
| `src/views/<module>/create.vue` | 新增表单；可被编辑页复用。 |
| `src/views/<module>/update.vue` | 编辑入口：优先仅包装 `create.vue` 并传入 `id`。 |
| `src/views/<module>/detail.vue` | 详情只读展示：主数据区与接口一致；若有「仅占位 / 未接 API」的统计或子表，数据来自同目录下的 Mock 文件（见下文）。 |
| `src/views/<module>/detailMockData.js`（**可选**） | 详情页补充区块的**静态模拟数据**：按主键分支、默认兜底；与真实 `data` 分离，便于后续替换为接口字段。 |

### 2.3 导入模板（可选，启用 Excel 导入时推荐）

| 路径 | 职责 |
|------|------|
| `resources/docs/<module>_template.xlsx` | 导入模板下载文件，与列表页「下载模板」虚拟表单路径一致。 |

## 3. 必改注册与文案

| 文件 | 修改内容 |
|------|----------|
| `api/routes/api.php` | 在 `mainResources` 数组中增加 `'module' => 'ModuleController'`，并按需传入 `excel` 等选项。 |
| `api/app/Repositories/ServiceFactory.php` | 增加 `public static function module(): Implement\<Module>Repository`，统一从工厂取仓储。 |
| `backend/src/lang/zh-CN/menu.json` | 增加 `menu.<module>.*`：`manage`、`index`、`create`、`update`、`detail`、`delete`；若支持导入导出则增加 `import`、`export` 等。 |
| `api/database/sql/permission_<...>.sql`（**推荐**） | 向 `permission` 表插入模块菜单权限节点，见 **§3.1**。与路由 `meta.permit`、列表页 `v-can` 一致。 |

数据库迁移、字典配置、多语言 `database.*` 等**按实际业务**补充；须与 `Model::rules()` 中 `__()` 键及前端 `$relLabel(relTable, …)` 一致。

### 3.1 权限节点 SQL（PostgreSQL）

标准业务模块在库表 `permission` 中采用「**一级模块 + 若干子权限**」结构，与 `router/modules/<module>.js` 的 `meta.permit` 对齐。推荐使用 **匿名块 `DO $$ ... END $$;`**：先插入 **type = 1**（模块，`pid = 0`，`id_path = '[]'`），**紧接着** `SELECT lastval() INTO pid` 取父节点 id（**必须在插入子节点之前**，否则 `lastval()` 会被子行覆盖）；再插入 **type = 2** 的 `detail` / `data` / `import` / `export`，子行 `pid` 为父 id，`id_path` 使用 `('[' || pid || ']')::json`。`pre` 约定：`detail` 为空串；`data`、`import`、`export` 的前置一般为 `<module>.detail`（与现网「项目管理」一致）。

**命名与 i18n**：`name` 列存菜单 i18n 键，形如 `menu.<module>.manage`、`menu.<module>.detail`；`permit` 列为权限标识，形如 `<module>.manage`、`<module>.detail`。

**同一脚本多个模块**：每插入一个模块父行后立即 `SELECT lastval() INTO pid_xxx`，再插该模块子行；**不要**在连续插入多个模块的子行后再取 `lastval()`。

**参考实现**：业务仓库 `api/database/sql/permission_land_agreement_compensation.sql`（土地征收协议 + 土地补偿明细）。`sort` 为侧栏排序，新模块父节点宜与现有菜单错开（如 99、98）。`group` 多为 `'[1]'`（与现网一致，视实际用户组调整）。

**执行注意**：若 `permit` 有唯一约束，重复执行会失败；上线环境通常只执行一次，或在脚本中加存在性判断 / 先删后插（按团队规范）。

**通用模板**：[../assets/permission-sql.template.sql](../assets/permission-sql.template.sql)

## 4. 命名约定

- **后端类**：`ModuleController`、`Module`、`ModuleRepository`（PascalCase）。
- **路由与目录**：URL 段与 `src/views` 子目录使用同一小写模块名（如 `project`）。
- **表名常量**：在 Model 中定义 `public const TABLE = 'module_table'`，`$table` 与之对齐。
- **导入模板**：`resources/docs/<module>_template.xlsx`，与接口约定的模板文件名一致。

## 5. 各层职责要点

### 5.1 Model

- `$fillable` / `$guarded` 与表结构一致；`$casts` 与前端展示格式（日期、数字）对齐。
- `rules()`：校验规则与字段中文名（`__('database.xxx')`）完整。
- `columns($scene)`：列表场景列裁剪，避免多余字段。
- 需要审计时：在 `boot()` 的 `created` / `updated` / `deleted` 中调用 `ServiceFactory::operationLog()->push(...)`，文案使用 `__('menu.xxx')` 与 `__('database.table.xxx')`。

### 5.2 Repository

- `model()` 返回 `Module::class`。
- `getListBuilder()`：无排序参数时默认按主键降序；`keyword` 与 `Repository` 内 `keyword([...], $keyword)` 等与列表约定一致。
- 导入：设置 `$importUniqueKey` 与产品确认的「排重字段」一致。

### 5.3 Controller

- 构造函数注入对应 `ModuleRepository`，赋值 `$this->service`（与基类约定一致）。
- Excel 相关能力与基类、`ExcelRepository` 保持一致。

**通用模板**：[../assets/mainResources-entry.template.php](../assets/mainResources-entry.template.php)

### 5.4 前端页面

- **公共约定**：`relTable` 与后端表 / 资源名一致；`routePrefix` 与 `router` 及 API 前缀一致；`dictNames` 与表单 / 列表用到的字典一致。
- **index.vue**：`listMixin` + `routeMixin` + `dictMixin`；`titleColumn` / `titleLabel` 用于删除等二次确认；`filtersConfig` / `advancedSearchConfig` 与后端过滤能力对齐；导入组件 `requestEntry`、`relTable`、`requestPrefix` 正确。
- **create.vue / update.vue**：见 **§5.4.1 表单页**。
- **detail.vue**：`rowId` 与页面路由两种入口时行为一致；接口返回写入 `data`；若有统计卡片 / 子表等未接后端，绑定 **§5.5** 中的 Mock 数据。

#### 5.4.0 列表页表格列（`index.vue`）

表格列（`el-table-column` / `tableColumns`）建议按「字段值长度是否相对固定」来决定宽度策略，避免出现大量列挤压、横向滚动过长、或每次刷新列宽抖动：

- **长度相对固定的列**：使用固定 `width`。
  - 典型：`id`、状态 / 枚举、年份、日期（`yyyy-MM-dd`）、短编号（文件号 / 流水号等）。
- **长度不定的列**：使用 `minWidth` 并搭配 `showOverflowTooltip`。
  - 典型：名称、备注、描述、地址、机构名称等文本列。
  - `minWidth` 只约束最小可读宽度；当页面空间足够时允许自然扩展，提升扫读效率。
- **不建议**：对所有列统一写死 `width`（会导致长文本列被迫截断、可读性差），也不建议所有列只用 `minWidth`（会导致短字段列浪费空间）。

> **参考实现**：`backend/src/views/project/index.vue` 中 `tableColumns` 同时使用了固定 `width` 与 `minWidth + showOverflowTooltip` 的组合。

#### 5.4.0.1 列表页高级搜索：长中文 label 换行（`table-advanced-search`）

当高级搜索（`table-advanced-search` / `TableAdvancedSearch`）中出现「中文 label 较长、在固定 `label-width` 下易挤压 / 遮挡」的字段时，应通过 `advancedSearchConfig` 为该字段设置 `class: 'form-label-multiple-line'`，使 label 允许更紧凑的行高从而更自然换行展示。

- **用法**：`{ prop: 'xxx', class: 'form-label-multiple-line' }`（可与 `type: 'daterange'` 等配置并存）。
- **适用**：如「征收文件号 / 评估机构 / 签订起止日期 / 村组信息」等 label 文字较长字段（见 `backend/src/views/project/index.vue`）。
- **不滥用**：短 label 不要加该 class；优先保持全局视觉一致，仅在确有换行需求时使用。

> **机制说明**：`backend/src/components/Table/advancedSearch.vue` 会把配置项的 `class` 透传到 `el-form-item`，并在组件内提供 `.form-label-multiple-line` 的 label 样式（无需业务页单独写 CSS）。

#### 5.4.1 表单页（`create.vue`，`update.vue` 复用）

表单页与 `Model::$fillable` / `rules()` 字段一一对应，并满足下列约定：

| 项 | 要求 |
|----|------|
| 布局 | 外层 `page-container`；非弹窗时加 `app-container`；内容区常用固定宽度如 `page-content` + `style="width: 1200px;"`（与列表 / 详情对齐）。 |
| 表单 | `el-form`：`ref="form"`、`v-loading="loading"`、`:model="form"`、`:rules="rules"`、`label-width` 与 `class="admin-form"` 与现有模块一致。 |
| 防自动填充 | 在表单内保留隐藏 `input type="text"`（与现有列表 / 表单页一致）。 |
| 排版分组 | 根据字段数量与语义进行适当分组，提升填写效率与可维护性：优先按「基础信息 / 时间节点 / 机构与人员 / 位置与范围 / 备注」等分组；每组内再用 `el-row` + `el-col` 做两列 / 三列布局（移动端自动单列）。字段较少时允许单段布局，但仍应按语义顺序排列。 |
| 标签与字段 | 每项使用 `$relLabel(relTable, 'column')` 与 `prop`，与 `database` 语言包及后端校验字段名一致。 |
| 字典 | `mixins` 含 `dictMixin`，`dictNames` 声明本页用到的字典；选项用 `dict['xxx']` 渲染（如 `el-radio-group`）。 |
| 日期 / 年 | `el-date-picker` 的 `format` / `value-format` 与后端 `date_format` / `casts` 一致（如 `yyyy-MM-dd`、`yyyy`）。 |
| 文本域 | 长文本使用 `type="textarea"`，按需 `show-word-limit` 与 `maxlength` 与库表长度一致。 |
| **所在区域 `region`** | 业务含义为「行政区划」且迁移字段为短字符串时，**不要**用手输 `el-input`；表单使用 `backend/src/components/Selector/region.vue`（`RegionSelector`），`type="region"`，与 `config/region.json` 同源；`v-model` 绑定 **区划编码**（写入 `region` 列）。列表列、导出等展示用 `@/utils/region.js` 的 `getRegionValue` 将编码转为可读名称；详情只读可用 `<region-selector :value="..." readonly type="region" />`。模拟数据须为数据源中存在的编码。全国城市口径时用 `type="city"`（与 `city.json` 同源），约定方式相同。 |
| 底部操作 | **保存 / 创建**、**返回**（`closeCurrentTab` 带列表回参 `params`）；**非弹窗**（`v-if="!dialog"`）时可放「添加模拟数据」等辅助按钮（见 **§5.5.1**）。 |
| 弹窗复用 | `props`：`id`、`dialog`；弹窗内隐藏底部整块或仅保留提交逻辑，由产品约定。 |
| 表单承载模式 | 表单在模块里有两种常见承载方式：**路由页面承载**（默认，`/create`、`/update` 独立页面）或 **列表页弹窗承载**（在 `index.vue` 里用 `el-dialog` 承载 `create.vue` 复用表单）。开发前需向产品 / 需求方确认使用哪种模式；若未明确，**默认采用路由页面承载**，与「项目管理」脚手架一致。 |
| 数据与校验 | `data()` 中 `form` 默认值覆盖所有可编辑字段；`rules` 至少覆盖后端 `required` 项，文案用 `$t('validation.required', { attribute: … })`。 |
| 提交与详情 | `submit()` 走 `requestCreate` / `requestUpdate`；`getDetail()` 走 `requestDetail`；失败时 `closeCurrentTab` 回列表与现有行为一致。 |

#### 5.4.2 `update.vue`

- 仅作为路由入口：内嵌 `create.vue` 并传入 `id`；在 `created` / `activated` 中校验 `query.id` 合法，非法则提示并关闭标签页。

### 5.5 模拟数据（表单一键填充 + 详情补充区块）

模拟数据用于**本地联调、演示、验收前 UI 走查**，不替代真实接口；内容须为虚构业务数据，**禁止**使用真实身份证号、手机号、银行卡等敏感信息。

#### 5.5.1 表单页：一键填充（推荐）

在 `create.vue`（非弹窗）提供 **「添加模拟数据」** 按钮，点击后在前端生成一整表单可提交的数据，要求如下：

| 项 | 要求 |
|----|------|
| 交互 | 与提交并列，`plain` 次要样式即可；`:disabled="submitting"`，避免与保存并发。 |
| 字段合法 | 取值满足前端 `rules` 与后端 `rules()`（类型、最大长度、日期格式）；日期逻辑合理（如签订结束 ≥ 开始、公告日在合理区间等）。 |
| 字典字段 | 在 `dict` 已加载时从对应字典随机取 `value`；字典未就绪时使用与 `form` 默认值一致的兜底。 |
| 编辑模式 | 若 `form.id` 已存在（修改场景），合并模拟数据时 **保留 `id`**，避免误当新增。 |
| 校验状态 | 赋值后使用 `$nextTick`，对 `$refs.form` 调用 `clearValidate()`，避免残留红框。 |
| 可辨识 | 可在 `remark` 等字段附带「模拟数据生成 + 日期」等说明，便于区分测试数据。 |
| 可选增强 | 可与地图 / 专题等**已有静态示意数据**组合（如从 `staticTopicData` 取名称），增强真实感；注意判空与降级文案。 |
| 范围 | **不调用后端**生成数据；若需服务端造数，另起脚本或 Seeder，不在此按钮内混用。 |

**通用模板**：[../assets/form-mock-fill.template.vue](../assets/form-mock-fill.template.vue)

#### 5.5.2 详情页：补充区块 Mock 文件（可选）

当详情除 `el-descriptions` 主数据外，还有统计卡片、子表、概况等**接口尚未提供**的区块时：

| 项 | 要求 |
|----|------|
| 文件位置 | `backend/src/views/<module>/detailMockData.js`（与 `detail.vue` 同目录，便于相对路径引用）。 |
| 导出 API | 导出纯函数，例如 `get<Module>DetailMock(recordId)`，入参为当前主记录 id（或业务主键）。 |
| 按 id 分支 | 使用 `Map` 或对象字面量对少量 id 配置不同演示数据；**未知 id** 返回深拷贝的默认结构（如 `JSON.parse(JSON.stringify(defaultMock))`），避免多实例共享引用被改坏。 |
| 与接口数据分离 | 接口结果仍赋给 `data`；Mock 仅赋给独立变量（如 `detailMock`），命名清晰，后续接 API 时只删 Mock 绑定与文件即可。 |
| 刷新时机 | 在 `getDetail()`（或等价拉取主数据的方法）内根据当前 `id` **重新取 Mock**，保证切换记录时统计区与主数据一致。 |
| 金额展示 | 遵守仓库约定：展示用 `backend/src/utils/money.js` 的 `formatMoney` / `formatMoneyCompact` 等，与 `CLAUDE.md` 中金额规范一致；Mock 内金额存**原始数值（如分或元）**并与格式化函数约定统一。 |

**通用模板**：[../assets/detail-mock-data.template.js](../assets/detail-mock-data.template.js)

#### 5.5.3 文案与国际化

- 按钮与 Mock 区块标题：新模块优先走 `menu.json` / `system.json` 等 **`$t`**；历史页面若暂为中文硬编码，后续迭代再收拢到语言包。

### 5.6 路由与权限

- `router/modules/<module>.js` 中 `meta.permit` 与后端、`permission.permit`、前端 `v-can` 一致（如 `project.manage`、`project.data`、`project.detail` 等）。
- 列表「写操作」按钮使用 `v-can` 或 `can()` 与产品要求一致。
- 数据库侧权限种子：见 **§3.1**，在后台为角色勾选新权限后账号才可见菜单与按钮。

## 6. 推荐实施顺序

1. 数据库与字典、多语言键（若尚未有）。
2. 后端：`Model` → `Repository` → `Controller`。
3. 注册：`api.php`、`ServiceFactory.php`。
4. 前端：`router` → `views` 四页（表单按 **§5.4.1** 对齐字段与校验）。
5. `menu.json`、**§3.1** 权限 SQL（`api/database/sql/`）及后台角色授权。
6. 若启用导入：放置 `*_template.xlsx` 并联调下载与解析。
7. 按需实现模拟数据：**表单一键填充**（**§5.5.1**）；详情未接接口的区块配 **§5.5.2** + `detailMockData.js`。
8. 联调：列表筛选、增删改查、导入导出、操作日志；有 Mock 时确认切换记录、金额格式化与主数据区无串数据。

## 7. 自检清单（合并前）

- [ ] `mainResources` 键名与前端 `requestPrefix` / `routePrefix` 一致。
- [ ] `ServiceFactory::module()` 已注册且可被调用。
- [ ] Model `rules` / `casts` 与迁移字段一致。
- [ ] 列表关键字、高级搜索、导出列与 `Repository::getListBuilder` 行为一致。
- [ ] 菜单 i18n 键与路由 `meta.title` 一致。
- [ ] 权限标识与按钮、`permission` 表、`meta.permit` 一致；已提供 SQL 的需在目标库执行并为角色授权。
- [ ] 表单页：`form` / `rules` 与后端字段一致；日期 `value-format` 与 casts 一致；`$relLabel` 与 `database` 语言包键齐全；弹窗模式下底部按钮展示符合约定。
- [ ] 表单「添加模拟数据」：满足校验、字典兜底、编辑保留 `id`、填充后 `clearValidate`；无真实敏感信息。
- [ ] 详情 Mock（若有）：`data` 与 `detailMock` 职责分离；`getDetail` 内按 `id` 刷新 Mock；金额走 `money.js` 统一格式化。

---

**维护说明**：若仓库内「标准脚手架」流程变更（例如路由注册方式、`mainResources` 参数变化），应同步更新业务仓库 `docs/framework/module-development.md` 与本文件。