# 接入点逐点详解

本文按「文件 → 行 → 时序」拆解许可检测的每个落点，便于定位与排障。

## 1. 配置层：`api/config/admin.php`

```php
// 是否开启许可检测
'check_version' => (bool)env('ADMIN_CHECK_VERSION', true),
```

| 关注点 | 说明 |
|--------|------|
| 默认值 | `true`——生产默认开启；关闭开关必须显式写 `ADMIN_CHECK_VERSION=false` |
| 缓存 | `config:cache` 后 env 不再生效，改 `.env` 需 `php artisan config:clear` |
| 风格对齐 | 与同文件的 `dblog` / `operation_log` / `permission` / `captcha` 保持一致写法 |

`api/.env.example` 需同步补一行说明（**示例值不可用**，且 `.env` 本体禁止入库）：

```dotenv
# 系统许可检测开关（关闭后不做授权校验）
ADMIN_CHECK_VERSION=true
```

## 2. 检测函数层：`api/functions/helpers.php`

### 加载方式

`api/composer.json`：

```json
"autoload": {
    "files": [
        "functions/helpers.php"
    ]
}
```

Composer autoload files 在应用启动时（`LoadConfiguration` 之后、provider 注册之前）加载，因此 `check_version()` 在 `AppServiceProvider::register()` 中可直接调用，**无需 `use` 导入**。

### 完整实现

```php
use Illuminate\Support\Facades\Crypt;
use Las\Exceptions\OutputException;

// ...

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

### 设计要点

| 要点 | 原因 |
|------|------|
| 函数内自带 `config('admin.check_version')` 判断 | 调用方可无条件调用；本地/临时排查只需改 env |
| 文件不存在 / 解密失败 → 同一提示 | 统一「未授权使用」文案，不泄露文件路径、密钥、异常堆栈 |
| `trim()` 后再解密 | `Crypt::encrypt()` 输出的 base64 可能带换行 |
| `catch (\Throwable $e)` | 覆盖 `DecryptException` 与可能的 `TypeError` / 数组越界等 |
| 提示语用 base64 存储 | 中文提示以 base64 内联，避免 helpers 文件编码/转义问题 |

### 与 helpers.php 的既有约束的关系

`rules/apc-framework/backend-laravel.md` 要求 `api/functions/helpers.php` 只放「稳定工具函数」。许可检测属于**框架级守卫**（应用启动期唯一入口），是这条约束的既有例外；若要新增其他全局函数，优先考虑做成类 / 服务注入。

## 3. 接入点层：`api/app/Providers/AppServiceProvider.php`

```php
public function register()
{
    check_version();
}
```

### 为什么必须在 `register()` 而不是 `boot()`

Laravel 8 启动顺序（关键片段）：

```
bootstrap/app.php
  └─ Application::bootstrapWith(...)
       ├─ LoadEnvironmentVariables      ← 读 .env
       ├─ LoadConfiguration             ← 读 config/*.php（config() 此时可用）
       ├─ HandleExceptions
       ├─ RegisterFacades
       ├─ RegisterProviders              ← AppServiceProvider::register() 执行
       │    └─ check_version()  ← 本检测点
       └─ BootProviders                  ← AppServiceProvider::boot() 执行
```

- `register()` 早于 `boot()`，也早于任何路由 / 控制器 / 中间件
- 放 `register()` 意味着**所有请求**（HTTP、artisan、队列 worker、调度任务）在业务代码运行前就完成许可校验
- 放 `boot()` 也早于路由匹配，但**晚于部分 provider 的注册逻辑**，不如 `register()` 严格

### 覆盖范围

| 入口 | 是否被覆盖 | 说明 |
|------|-----------|------|
| HTTP 请求 | ✅ | provider 注册先于路由分发 |
| `php artisan` 命令 | ✅ | 同样走 provider 注册 |
| 队列 worker | ✅ | 启动时注册一次 |
| 计划任务 `schedule:run` | ✅ | 同上 |
| 纯 PHP 脚本（不 boot Laravel） | ❌ | 无 provider 注册；如需单独检测需手动调用 `check_version()` |

## 4. 异常层：`Las\Exceptions\OutputException` → `App\Exceptions\Handler`

`api/app/Exceptions/Handler.php` 的 `render()` 中，`expectsJson()` 分支对 `OutputException` 有专门 case：

```php
case OutputException::class:
    // 输出异常的同时记录日志
case RecordException::class:
case DataNotFoundException::class:
    $result = $response->output($e->getCode(), $e->getMessage(), $data);
    break;
```

效果：

- 返回统一 `ApiResponse` 结构（`code` + `message`），**不是** Laravel 默认 500 页面
- `config('app.debug')` 为 true 时附带堆栈（开发期排查方便，**生产必须关闭 debug**）
- 非 JSON 请求（浏览器直接访问）走 `outputHtml()`，输出 `errors.message` 视图

### 提示文案要求

| 要求 | 反例 |
|------|------|
| 面向最终用户 | ❌ `Crypt::decrypt failed: unsupported cipher` |
| 说明当前状态 + 下一步动作 | ✅ `系统授权已于 2026-01-01 到期，请联系管理员续期。` |
| 不含内部路径 / 密钥 / 堆栈 | ❌ `D:\deploy\api\bootstrap\cache\exp.bin not found` |

## 5. 检测逻辑伪码

```
check_version():
  if (!config('admin.check_version')) return;          // 开关关闭 → 放行
  if (!file_exists(exp.bin)) throw OutputException(未授权使用);
  try { exp = Crypt::decrypt(trim(file_get_contents(exp.bin))) }
  catch (Throwable) { throw OutputException(未授权使用); }
  if (time() > exp['x']) throw OutputException(exp['message']);
  // 通过
```

## 6. 排障对照表

| 报错文案 / 现象 | 定位步骤 |
|-----------------|----------|
| 「未授权使用」 | ① `ADMIN_CHECK_VERSION` 是否为 true ② 目标机 `api/bootstrap/cache/exp.bin` 是否存在 ③ 目标机 `APP_KEY` 是否与签发端一致 |
| 「系统授权已到期」 | ① 解密 `exp.bin` 看 `x` 值 ② 核对服务器时间与时区 ③ 确认签发时到期日是否算错（含 `23:59:59` 与时区） |
| 本地开发被拦截 | 本机 `api/.env` 设置 `ADMIN_CHECK_VERSION=false`，并 `php artisan config:clear` |
| 只有 CLI 报错，HTTP 正常 | 检测点被移出了 provider 注册阶段；恢复到 `AppServiceProvider::register()` |
| 部署后首次访问报未授权，随后正常 | 目标机写文件与首次请求之间有竞态，或 `bootstrap/cache` 被清理后由外部流程重新投放 |
| 生产返回 500 + 堆栈 | `APP_DEBUG=true` 未关闭；许可异常应走 `OutputException` 分支，不应进 default 分支 |
