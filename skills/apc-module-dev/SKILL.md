---
name: apc-module-dev
description: >-
  apc 框架（Vue2 管理后台 + Laravel API）新增一个标准业务模块的完整流程：后端 Model / Repository / Controller + 前端四页（列表 / 表单 / 编辑 / 详情）+ mainResources 路由注册 + 权限 SQL 节点 + menu.json i18n + 可选 Excel 导入导出 + 表单一键模拟数据 + 详情补充区块 Mock。
  Use for 新增模块 / 新建模块 / 加一个模块 / CRUD 脚手架 / 三件套 / 四页一路由 / 标准业务模块开发。
---

# apc-module-dev（apc-module-development）

在 apc 框架下新增一个标准业务模块（单表资源）的端到端 SOP。覆盖后端三件套 + 前端四页一路由 + 注册 + 菜单 + 权限 + 可选导入导出与模拟数据。

**不解决**：非单表资源（多表 join 复杂场景）、管理端以外的前端形态（小程序 / App）、发布流程（见 `apc-deploy-release`）。

## When to use

**适用**：
- 用户说「新增一个 X 模块 / 加一个 X 业务 / 做一个 X 管理页」且该模块是标准 CRUD 资源
- 需要同时新增后端接口 + 前端四页（列表 / 表单 / 编辑 / 详情）
- 需要按现有脚手架流程（mainResources / ServiceFactory / permission / menu.json）注册
- 可选：Excel 导入导出、表单一键模拟数据、详情未接 API 的统计/子表 Mock

**不适用**：
- 仅修改现有模块的某一处页面或字段（直接编辑对应文件，无需走完整流程）
- 修改既有列表 / 表单 / 详情页的样式或交互（属于 `frontend-vue2` 工程规范范围）
- 跨表复杂业务（建议先做领域拆分，再按需走标准模块流程）
- 非 Vue2 + Laravel 技术栈（如 SPA / 小程序 / 纯前端）

## Core pattern

```
业务建模（表 / 字段 / 字典 / 多语言键）
        ↓
后端三件套：Model → Repository → Controller
        ↓
后端注册：mainResources（routes/api.php）+ ServiceFactory
        ↓
前端路由：router/modules/<module>.js（meta.title / permit / activeMenu）
        ↓
前端四页：index.vue → create.vue → update.vue → detail.vue
        ↓
菜单与权限：menu.json + permission SQL + 后台角色授权
        ↓
可选：导入模板（resources/docs/<module>_template.xlsx）+ 联调
可选：表单一键模拟数据 + 详情 Mock（detailMockData.js）
        ↓
联调：列表筛选 / 增删改查 / 导入导出 / 操作日志 / 金额格式 / 区域选择
```

## Implementation checklist（端到端）

### 1. 业务建模
- [ ] 表结构、字段、类型、约束确定（迁移脚本就绪）
- [ ] 字典项（如有）已配好 `dict` 表 / Seed
- [ ] 多语言键：`database.<table>.<column>`、`menu.<module>.*`

### 2. 后端三件套
- [ ] `app/Models/<Module>.php`：`$table`、`$fillable`、`$casts`、`rules()`、`columns()`、`boot()` 内审计
- [ ] `app/Repositories/Implement/<Module>Repository.php`：`model()`、`getListBuilder()`（默认排序 + 关键字）、导入场景 `importUniqueKey`
- [ ] `app/Http/Controllers/Api/<Module>Controller.php`：注入 Repository，按需 `use` 公共 Trait（如 Excel）

### 3. 后端注册
- [ ] `api/routes/api.php`：`mainResources` 增加 `'module' => 'ModuleController'`，按需传入 `excel` 等选项
- [ ] `app/Repositories/ServiceFactory.php`：增加 `public static function module(): Implement\<Module>Repository`

### 4. 前端四页
- [ ] `backend/src/router/modules/<module>.js`：`Layout` + 子路由 + `meta.title`（i18n key）+ `meta.permit` + `meta.activeMenu`
- [ ] `backend/src/views/<module>/index.vue`：`listMixin` + `routeMixin` + `dictMixin`；`filtersConfig` / `advancedSearchConfig`；可选导入 / 导出
- [ ] `backend/src/views/<module>/create.vue`：表单页（详见 [references/module-development-full.md §5.4.1](./references/module-development-full.md)）
- [ ] `backend/src/views/<module>/update.vue`：仅包装 `create.vue` 并传 `id`
- [ ] `backend/src/views/<module>/detail.vue`：主数据区走接口；补充区块走 [detailMockData.js](./assets/detail-mock-data.template.js)

### 5. 菜单与权限
- [ ] `backend/src/lang/zh-CN/menu.json`：增加 `menu.<module>.*`（`manage` / `index` / `create` / `update` / `detail` / `delete`，可选 `import` / `export`）
- [ ] `api/database/sql/permission_<...>.sql`：见 [permission-sql.template.sql](./assets/permission-sql.template.sql)（使用 `DO $$ ... END $$;` 匿名块）
- [ ] 后台为角色勾选新权限

### 6. 模拟数据（可选，强烈推荐）
- [ ] 表单一键模拟数据：见 [form-mock-fill.template.vue](./assets/form-mock-fill.template.vue)（满足校验、字典兜底、编辑保留 `id`、`clearValidate`）
- [ ] 详情补充区块 Mock：见 [detail-mock-data.template.js](./assets/detail-mock-data.template.js)（按 `id` 分支、默认兜底深拷贝、金额走 `money.js`）

### 7. 联调自检
- [ ] 列表筛选、分页、关键字、排序与 `Repository::getListBuilder` 一致
- [ ] 表单提交 / 编辑 / 删除 / 详情接口闭环
- [ ] 操作日志（`ServiceFactory::operationLog()`）正确
- [ ] 金额字段走 `backend/src/utils/money.js`（`formatMoney` / `formatMoneyCompact`）
- [ ] 区域字段 `region` 用 `RegionSelector` 组件，列表 / 导出展示用 `getRegionValue` 转名称
- [ ] 模拟数据无真实敏感信息（身份证 / 手机号 / 银行卡）

## Anti-patterns

- **直接在某个模块目录下复制粘贴另一模块全部文件** → 必须按本 SOP 走，从 Model 重新建起
- **不注册就写代码**：漏 `mainResources` 或 `ServiceFactory` 会导致接口未挂载 / 仓储取不到
- **权限标识不一致**：`router.meta.permit` / `permission.permit` / `v-can` 必须保持一致（如 `project.manage`）
- **业务逻辑塞进全局 helper**：`api/functions/helpers.php` 只能放稳定工具函数
- **手输 `el-input` 写 `region`**：必须用 `RegionSelector`，否则行政区划无来源约束
- **金额字段手写格式化**：统一走 `money.js`，禁止散落重复实现
- **Mock 数据写真实敏感信息**：身份证 / 手机号 / 银行卡必须虚构
- **detailMock 与接口 data 混用**：必须用 `data` / `detailMock` 双变量职责分离，便于后续接 API 时一键替换

## Additional resources

- 完整流程文档：[references/module-development-full.md](./references/module-development-full.md)（从业务仓库 `docs/framework/module-development.md` 同步）
- 模板片段：[assets/](./assets/)
  - [permission-sql.template.sql](./assets/permission-sql.template.sql) — 权限节点 SQL 模板（PostgreSQL `DO $$ ... END $$;`）
  - [mainResources-entry.template.php](./assets/mainResources-entry.template.php) — 后端路由注册片段
  - [form-mock-fill.template.vue](./assets/form-mock-fill.template.vue) — 表单一键模拟数据按钮逻辑
  - [detail-mock-data.template.js](./assets/detail-mock-data.template.js) — 详情补充区块 Mock 文件模板
- 相关 Rule：[rules/apc-framework/](../../rules/apc-framework/)（仓库级硬约束始终生效）