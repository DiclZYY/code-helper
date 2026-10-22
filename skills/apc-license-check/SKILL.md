---
name: apc-license-check
description: >-
  apc 框架（admin-pro-core / Laravel 8）系统许可检测能力的接入与封装：check_version() 全局函数 + config/admin.php 开关（ADMIN_CHECK_VERSION）+ bootstrap/cache/exp.bin 加密许可文件（APP_KEY 加密，含到期时间 x 与提示 message）+ OutputException 拦截 + expbuild 签发与续期。
  Use for 许可检测 / 授权校验 / 系统授权 / 授权到期 / exp.bin / expbuild / check_version / 加授权限制 / license check / 未授权使用 / 续期。
---

# apc-license-check（admin-pro-core license check）

在 apc 框架（Laravel 8 + `lis/admin-service` + admin-pro-core）中新增或维护**系统许可检测**能力的标准做法。

**不解决**：用户账号 / 角色权限校验（走 `admin_permission` 体系，见 `rules/apc-framework`）、设备级授权（见 `apc-wechat-auth`）、订阅计费与在线激活。

## When to use

**适用**：
- 给系统加「未授权 / 已到期不允许使用」的硬性拦截
- 需要一个开关能整体关闭许可检测（本地开发、临时排查）
- 需要按部署环境发放不同到期时间的许可（项目 A 到期日 ≠ 项目 B 到期日）
- 排查「部署后直接报未授权使用 / 授权已过期」类问题
- 续期 / 换发 exp.bin（用 `expbuild` 或参数化签发命令）
- 排查「许可过期后 `php artisan expbuild` 也报未授权、命令被截断」的续期死锁

**不适用**：
- 登录账号权限、按钮级权限（`AdminPermission` 中间件 + permission 表）
- 第三方客户端鉴权 / 微信小程序登录（见 `apc-wechat-auth`）
- 只需要记录授权到期时间做**提醒**而不阻断（应改用日志或中间件提示，不要抛异常）

## Core pattern

许可检测 = **配置开关** × **加密许可文件** × **启动期校验** 三件事，缺一不可。

```
请求 / CLI 启动
      ↓
Laravel bootstrap：LoadConfiguration → RegisterProviders → AppServiceProvider::register()
      ↓
check_version()                       ← 唯一入口（helpers.php 全局函数）
      ↓
config('admin.check_version') ?  ── 否 ──→ 直接放行（本地 / 临时排查）
      │ 是
      ↓
读 bootstrap/cache/exp.bin
      ├─ 文件不存在 ─────→ throw OutputException(未授权使用提示)
      ├─ Crypt::decrypt 失败 → throw OutputException(未授权使用提示)
      └─ 解密成功 → $exp = ['x' => 到期时间戳, 'message' => 提示文案]
            ↓
      time() > $exp['x'] ?  ── 是 ──→ throw OutputException($exp['message'])
            │ 否
            ↓
        放行
```

| 层 | 落点 | 职责 |
|----|------|------|
| 配置层 | `api/config/admin.php` → `check_version`；`.env` → `ADMIN_CHECK_VERSION` | 总开关，决定是否启用检测 |
| 许可文件层 | `api/bootstrap/cache/exp.bin` | 由 `APP_KEY` 加密的授权凭据，含到期时间与提示文案 |
| 检测函数层 | `api/functions/helpers.php` → `check_version()` | 读取 + 解密 + 判过期 + 抛 `OutputException` |
| 接入点层 | `api/app/Providers/AppServiceProvider.php` → `register()` | 在容器注册阶段触发一次检测，覆盖 HTTP 与 CLI |
| 签发层 | `api/routes/console.php` → `expbuild` | 生成 exp.bin（**自身不豁免**检测，过期时需先关开关） |
| 异常层 | `Las\Exceptions\OutputException` → `App\Exceptions\Handler` | 统一输出为接口 JSON 错误，不落 500 堆栈 |

### 续期死锁（关键约束）

检测点挂在 `register()`，意味着**签发许可的命令本身也会被检测拦截**：

```
exp.bin 已过期
      ↓
php artisan expbuild   ← 命令在 provider 注册阶段就被 OutputException 打断
      ↓
命令根本没跑到签发逻辑 → 无法生成新 exp.bin
      ↓
系统被永久锁死（除非有别的逃生口）
```

**唯一正解：用 `ADMIN_CHECK_VERSION=false` 临时关闭检测，签发完成后再改回 `true`。**

```
1. 编辑目标机 api/.env：ADMIN_CHECK_VERSION=false
2. php artisan config:clear            ← 必须，config:cache 后 env 不再生效
3. php artisan expbuild                ← 签发新 exp.bin
4. 编辑目标机 api/.env：ADMIN_CHECK_VERSION=true
5. php artisan config:clear
6. 复验：访问任一接口，确认不再返回「已到期」
```

> 若目标机已执行 `php artisan config:cache` / `optimize`，`env()` 读取的是缓存值，**第 2、5 步的 `config:clear` 不可省略**，否则改 `.env` 不生效。
>
> 签发端与目标机分离时，签发端同样需要 `ADMIN_CHECK_VERSION=false`（签发端可能没有有效的 exp.bin）。

## Implementation checklist

### 1. 配置层

- [ ] `api/config/admin.php` 增加开关（与现有 `dblog` / `permission` 同风格）：

  ```php
  // 许可检测开关
  'check_version' => (bool)env('ADMIN_CHECK_VERSION', true),
  ```

- [ ] `api/.env.example` 补变量说明（示例值不得为可用凭据）：

  ```dotenv
  # 系统许可检测开关（关闭后不做授权校验）
  ADMIN_CHECK_VERSION=true
  ```

- [ ] 本地开发 / 临时排查：`ADMIN_CHECK_VERSION=false`（**仅本机 .env**，禁止提交，见 `rules/apc-framework/security.md`）
- [ ] **续期死锁场景必须靠该开关自救**：许可已过期时，签发命令本身也会被检测拦截（见下方「续期死锁」小节）

### 2. 许可文件层

- [ ] 目标文件路径固定为 `api/bootstrap/cache/exp.bin`（`app()->bootstrapPath('cache/exp.bin')`）
- [ ] 内容由 `Crypt::encrypt()` 生成，载荷为**数组**：`['x' => 到期时间戳, 'message' => 到期提示文案]`
- [ ] 发放端与检测端必须使用**同一 `APP_KEY`**（`config('app.key')`）——`APP_KEY` 一变，所有已发放的 exp.bin 立即失效
- [ ] 生成 / 续期方式见 [references/license-file.md](./references/license-file.md)（含项目内既有的 `expbuild` 命令与可参数化的 `admin:license` 实现）
- [ ] `bootstrap/cache/` 属部署产物目录，**不随代码发布自动携带**，发布流程必须单独拷贝该文件（见 `apc-build-helper` 的 `del` / 拷贝映射）

### 3. 检测函数层

- [ ] `api/functions/helpers.php` 中实现 `check_version()`（该文件由 `composer.json` 的 `autoload.files` 加载，全局可用）：

  ```php
  function check_version()
  {
      if (config('admin.check_version')) {
          $expFile = app()->bootstrapPath('cache/exp.bin');
          $unexp = base64_decode('5pyq6YCa6L+H5o6I5p2D6aqM6K+B77yM6K+36IGU57O7566h55CG5ZGY77yB');
          if (!file_exists($expFile)) {
              throw new OutputException($unexp);
          }

          try {
              $exp = file_get_contents($expFile);
              $expx = Crypt::decrypt(trim($exp));
          } catch (\Throwable $e) {
              throw new OutputException($unexp);
          }

          if (time() > $expx['x']) {
              throw new OutputException($expx['message']);
          }
      }
  }
  ```

- [ ] `use Las\Exceptions\OutputException;` 与 `use Illuminate\Support\Facades\Crypt;` 已在 helpers.php 顶部声明
- [ ] 未知 / 解密失败 / 文件缺失 → 统一抛「未授权使用」提示，**不泄露**解密异常细节
- [ ] `check_version()` 内部**自带开关判断**，允许调用方无条件调用

### 4. 接入点层

- [ ] `api/app/Providers/AppServiceProvider.php` 在 `register()` 中调用（**不是 `boot()`**）：

  ```php
  public function register()
  {
      check_version();
  }
  ```

- [ ] `register()` 阶段 `config()` 已可用（`LoadConfiguration` 先于 provider 注册执行）
- [ ] `register()` 覆盖 HTTP 与 artisan CLI 两类入口；**不要**改成只挂中间件（CLI 会绕过）

### 4.1 签发层

- [ ] `api/routes/console.php` 注册签发命令（项目既有实现为 `expbuild`）：

  ```php
  use Illuminate\Support\Facades\Artisan;
  use Illuminate\Support\Facades\Crypt;

  Artisan::command('expbuild', function () {
      $exp = [
          'x' => strtotime('2027-6-1 00:00:00'),
          'message' => '您的服务已到期，请及时与服务提供商联系以获取续订或更新服务的信息。'
      ];
      $exp = Crypt::encrypt($exp);
      echo 'Build expire successfully!'.PHP_EOL;
      echo $exp;
      file_put_contents(app()->bootstrapPath('cache/exp.bin'), $exp);
  })->describe('build expire message');
  ```

- [ ] 命令**不豁免**许可检测 → 交付流程必须包含「关开关 → 签发 → 开开关」步骤
- [ ] 频繁续期场景改用参数化命令（`php artisan admin:license 2026-12-31`），避免每次改代码，见 [references/license-file.md §4.3](./references/license-file.md)
- [ ] `echo $exp` 输出的密文含到期信息，不要在共享日志 / 工单中回显

### 5. 异常与前端表现

- [ ] `OutputException` 被 `App\Exceptions\Handler::render()` 的 `expectsJson()` 分支捕获，返回统一 `ApiResponse` 结构（`code` + `message`）
- [ ] 异常文案使用**面向用户**的说明（如「系统授权已于 XXXX-XX-XX 到期，请联系管理员续期」），不要出现堆栈、路径、密钥等内部信息
- [ ] 前端（Vue2 后台）遇到该错误码时应整页提示而非跳登录；属于「部署态问题」而非「登录态问题」

### 6. 部署与自检

- [ ] 发布产物包含 `api/bootstrap/cache/exp.bin`（或等价路径下的许可文件）
- [ ] 目标机 `APP_KEY` 与发放端一致
- [ ] `ADMIN_CHECK_VERSION` 在生产为 `true`、本地为 `false`
- [ ] 自检三连：
  1. 关闭开关 → 系统可正常访问
  2. 开启开关 + 有效 exp.bin → 系统可正常访问
  3. 开启开关 + 过期 / 缺失 exp.bin → 返回「未授权使用 / 已到期」提示
- [ ] 确认签发命令（`expbuild`）在**开关关闭**时能正常跑通（否则过期后无法自救）
- [ ] 确认交付文档里写明了续期流程含 `ADMIN_CHECK_VERSION=false` 的临时关闭步骤

## Anti-patterns

- **把检测逻辑塞进中间件** → CLI（artisan / 队列 / 定时任务）不受中间件保护，绕过检测；检测必须挂在容器注册阶段
- **把检测写成「只拦 HTTP，不拦 CLI」** → 签发命令被自己的过期许可拦死，形成续期死锁；`register()` 阶段检测 + `ADMIN_CHECK_VERSION` 开关是唯一出口
- **过期后试图直接跑 `php artisan expbuild` 续期** → 命令在 provider 注册阶段就被 `OutputException` 打断，根本执行不到签发逻辑；必须先 `ADMIN_CHECK_VERSION=false` + `config:clear`
- **改了 `.env` 就以为开关已生效** → 目标机若执行过 `config:cache` / `optimize`，`env()` 读的是缓存值，必须 `php artisan config:clear`
- **`check_version()` 里不判 `config('admin.check_version')`** → 本地与续期都无法关闭，排查被阻塞
- **每个入口各写一份校验** → 逻辑分散、易漏；只保留一个 `check_version()` 入口
- **许可文件用明文 JSON / base64 不加密** → 客户端可自行改到期时间，检测形同虚设
- **把 `APP_KEY` 随 exp.bin 一起发放或写死在代码里** → 违反密钥管理，泄露即全线失效
- **解密失败时把异常原文抛给前端** → 泄露 `APP_KEY` 相关线索；统一抛「未授权使用」
- **把 `exp.bin` 提交进 git** → 许可凭据入库，违反 `rules/apc-framework/security.md`
- **只改 `bootstrap/cache` 就以为发布完成** → 该目录常被 `bootstrap:cache` / 发布脚本清理，务必单独拷贝并纳入发布清单
- **在 `helpers.php` 塞业务逻辑** → `rules/apc-framework/backend-laravel.md` 限定该文件只放稳定工具函数；许可检测属于「框架级守卫」，是现有例外，新增其他全局函数前先想清楚是否该做成类
- **用 `APP_KEY` 之外的第二把密钥加密许可** → 检测端与发放端配置来源不一致，线上必然全部失效

## Additional resources

- 许可文件机制（exp.bin 结构、加密约定、`expbuild` 签发与续期、**续期死锁与逃生流程**、部署携带）：[references/license-file.md](./references/license-file.md)
- 各接入点逐点详解（文件路径、代码落点、时序、异常链路、常见故障定位）：[references/integration-points.md](./references/integration-points.md)
- 相关 Rule：[rules/apc-framework/](../../rules/apc-framework/)
  - [backend-laravel.md](../../rules/apc-framework/backend-laravel.md) — helpers.php 约束、错误码可追踪
  - [security.md](../../rules/apc-framework/security.md) — 密钥 / 凭据禁止入库
  - [repo-structure.md](../../rules/apc-framework/repo-structure.md) — 目录边界与全局函数约定
- 相关 Skill：
  - [apc-build-helper](../apc-build-helper/) — 发布打包（exp.bin 需纳入拷贝清单）
  - [apc-wechat-auth](../apc-wechat-auth/) — 设备级授权（与本 skill 属不同层级，不要混用）
