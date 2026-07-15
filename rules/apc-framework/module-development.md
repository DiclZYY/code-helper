# 业务模块开发规范（概要）

> **本文件为 Rule 概要**：定义「在 apc 框架下新增一个标准业务模块」的最小骨架与硬约束。  
> **完整流程（含表单字段、Mock 数据、权限 SQL 等细节）**：业务仓库 `docs/framework/module-development.md`（同步保留）。
>
> 后续计划拆分为独立 Skill（`apc-module-dev`），用于 AI 按需加载完整流程。

## 适用范围

- **单表资源**：通过 `api/routes/api.php` 中 `mainResources` 注册的标准 REST 风格接口
- **管理端**：Vue2（`backend/`），与 `listMixin`、`routeMixin`、`dictMixin`、`excelMixin` 等既有模式对齐
- **业务**：列表 + 新增 + 编辑 + 详情；可选 Excel 导入导出；表单可一键模拟数据

## 必建文件清单

### 后端（`api/`）

| 路径 | 职责 |
|------|------|
| `app/Http/Controllers/Api/<Module>Controller.php` | 资源控制器：注入对应 Repository，按需 `use` 公共 Trait（如 Excel） |
| `app/Models/<Module>.php` | 表映射：`$table`、`$fillable`、`$casts`；`rules()`、`columns()`；`boot()` 内操作日志等 |
| `app/Repositories/Implement/<Module>Repository.php` | `model()` 绑定模型；`getListBuilder()` 默认排序、关键字等；导入场景配置 `importUniqueKey` |

### 前端（`backend/`）

| 路径 | 职责 |
|------|------|
| `src/router/modules/<module>.js` | 模块路由：`Layout`、子路由、`meta.title`（i18n key）、`permit` 与 `activeMenu` |
| `src/views/<module>/index.vue` | 列表：筛选、分页、权限按钮；可选高级搜索、导入 / 导出 |
| `src/views/<module>/create.vue` | 新增表单；可被编辑页复用 |
| `src/views/<module>/update.vue` | 编辑入口：优先仅包装 `create.vue` 并传入 `id` |
| `src/views/<module>/detail.vue` | 详情只读展示：主数据区与接口一致；未接 API 的区块用 `detailMockData.js` 占位 |
| `src/views/<module>/detailMockData.js`（可选） | 详情补充区块的静态模拟数据 |

### 导入模板（可选）

| 路径 | 职责 |
|------|------|
| `resources/docs/<module>_template.xlsx` | 导入模板下载文件 |

## 必改注册

| 文件 | 修改内容 |
|------|----------|
| `api/routes/api.php` | `mainResources` 数组中增加 `'module' => 'ModuleController'`，按需传入 `excel` 等选项 |
| `api/app/Repositories/ServiceFactory.php` | 增加 `public static function module(): Implement\<Module>Repository` |
| `backend/src/lang/zh-CN/menu.json` | 增加 `menu.<module>.*`：`manage` / `index` / `create` / `update` / `detail` / `delete`（可选 `import` / `export`） |
| `api/database/sql/permission_<...>.sql` | 向 `permission` 表插入模块菜单权限节点（推荐使用匿名块 `DO $$ ... END $$;`） |

## 命名约定

- **后端类**：`ModuleController`、`Module`、`ModuleRepository`（PascalCase）
- **路由与目录**：URL 段与 `src/views` 子目录使用同一小写模块名（如 `project`）
- **表名常量**：Model 中 `public const TABLE = 'module_table'`，`$table` 与之对齐
- **导入模板**：`resources/docs/<module>_template.xlsx`

## 关键硬约束（不可违反）

- **权限标识一致性**：`router/modules/<module>.js` 的 `meta.permit` 与 `permission` 表的 `permit` 列、列表页 `v-can` 必须保持一致（如 `project.manage`、`project.data`、`project.detail`）
- **表单承载模式**：默认「路由页面承载」；与产品约定走「列表页弹窗承载」时，需明确记录
- **区域字段 `region`**：必须使用 `RegionSelector` 组件，绑定区划编码（不要手输 `el-input`）；列表 / 导出展示用 `getRegionValue` 转名称
- **金额格式化**：统一走 `backend/src/utils/money.js` 的 `formatMoney` / `formatMoneyCompact`，禁止在业务组件内重复实现
- **敏感信息**：模拟数据**禁止**使用真实身份证号、手机号、银行卡
- **全局函数**：业务逻辑不进 `api/functions/helpers.php`

## 推荐实施顺序

1. 数据库与字典、多语言键
2. 后端：`Model` → `Repository` → `Controller`
3. 注册：`api.php` + `ServiceFactory.php`
4. 前端：`router` → `views` 四页
5. `menu.json` + 权限 SQL + 后台角色授权
6. 若启用导入：放置 `*_template.xlsx` 并联调下载与解析
7. 模拟数据：表单一键填充 + 详情 Mock（可选）
8. 联调：列表筛选、增删改查、导入导出、操作日志

## 自检清单

- [ ] `mainResources` 键名与前端 `requestPrefix` / `routePrefix` 一致
- [ ] `ServiceFactory::module()` 已注册
- [ ] Model `rules` / `casts` 与迁移字段一致
- [ ] 菜单 i18n 键与路由 `meta.title` 一致
- [ ] 权限标识与按钮、`permission` 表、`meta.permit` 一致
- [ ] 表单页：`form` / `rules` 与后端字段一致；日期 `value-format` 与 `casts` 一致
- [ ] 表单「添加模拟数据」满足校验、字典兜底、编辑保留 `id`、填充后 `clearValidate`
- [ ] 详情 Mock：`data` 与 `detailMock` 职责分离；`getDetail` 内按 `id` 刷新 Mock；金额走 `money.js`

---

**完整版本**：见业务仓库 `docs/framework/module-development.md`（表单字段规范、Mock 数据机制、权限 SQL 模式、表单页布局约定等）。