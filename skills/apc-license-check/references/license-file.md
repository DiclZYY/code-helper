# 许可文件机制（exp.bin）

许可检测的核心载体是 `api/bootstrap/cache/exp.bin`。本文说明其结构、加密约定、生成方式与部署携带要求。

## 1. 文件位置

| 项 | 值 |
|----|----|
| 物理路径 | `api/bootstrap/cache/exp.bin` |
| Laravel 取值方式 | `app()->bootstrapPath('cache/exp.bin')` |
| 同目录邻居 | `dict.php`（字典缓存）、`table-sharp.php`（表配置缓存）——均由 `bootstrap/cache` 统一管理 |

> `bootstrap/cache` 是 Laravel 的**运行时产物目录**：`php artisan bootstrap:cache` 会重建该目录内容，发布脚本也常把它当临时目录清理。因此 exp.bin **不会**随代码仓库自动分发给目标机器。

## 2. 文件内容结构

文件内容是 `Crypt::encrypt()` 后的**单个字符串**，解密后是一个 PHP 数组：

```php
[
    'x'       => 1735689600,                        // 到期时间（Unix 时间戳，秒）
    'message' => '系统授权已于 2025-01-01 到期，请联系管理员续期。',  // 过期时的提示文案
]
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `x` | int | 是 | 到期时间戳；检测逻辑为 `time() > $expx['x']` 则判定过期 |
| `message` | string | 是 | 过期提示文案，直接作为 `OutputException` 的 message 输出给前端 |

**约定**：
- `x` 表示「**到期时刻**」，即到期时间戳本身，**不再**额外加有效期天数
- `message` 面向最终用户，应包含到期日期与续期指引
- 如需附加信息（如授权模块、授权对象），可另加键，检测端忽略即可

## 3. 加密约定

- 加密算法：`Illuminate\Support\Facades\Crypt::encrypt()`
- 依赖密钥：`config('app.key')`，即 `.env` 的 `APP_KEY`
- 密文是 base64 字符串，**可能含换行**；检测端读取后必须 `trim()` 再解密
- 检测端用 `Crypt::decrypt()` 解密，失败（密钥不匹配 / 文件被改 / 内容非法）一律按「未授权」处理

### 致命约束：APP_KEY 必须一致

```
发放端 APP_KEY  ==  检测端 APP_KEY   →  正常
发放端 APP_KEY  ≠  检测端 APP_KEY   →  解密失败 → 全部实例报「未授权使用」
```

`APP_KEY` 一旦变更（`php artisan key:generate`、从 `.env.example` 复制、容器重建未挂载 volume），**所有已发放的 exp.bin 立即全部失效**，必须用新密钥重新签发。

## 4. 生成与续期

### 4.1 一次性脚本方式（推荐用于内部签发）

在项目根（`api/`）执行内联 PHP：

```bash
php -r '
require "vendor/autoload.php";
$app = require_once "bootstrap/app.php";
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$payload = [
    "x"       => 1767225600,   // 2026-01-01 00:00:00 UTC
    "message" => "系统授权已于 2026-01-01 到期，请联系管理员续期。",
];

$file = app()->bootstrapPath("cache/exp.bin");
$dir  = dirname($file);
if (!is_dir($dir)) { mkdir($dir, 0755, true); }

file_put_contents($file, Crypt::encrypt($payload));
echo "written: {$file}\n";
'
```

要点：
- `bootstrap()` 是必须的——不 bootstrap 则 `app()` / `Crypt` 不可用
- `mkdir` 兜底：`bootstrap/cache` 不存在时脚本会失败
- 落地文件权限建议 `0640`（含到期信息，属于凭据）

### 4.2 artisan 命令方式（推荐用于重复签发）

在 `api/routes/console.php` 中注册命令：

```php
Artisan::command('admin:license', function () {
    $expire = $this->argument('expire');          // YYYY-MM-DD
    $message = $this->option('message') ?: '系统授权已到期，请联系管理员续期。';

    $timestamp = strtotime($expire . ' 23:59:59');
    if ($timestamp === false) {
        $this->error('到期日期格式错误，应为 YYYY-MM-DD');
        return;
    }

    $file = app()->bootstrapPath('cache/exp.bin');
    if (!is_dir(dirname($file))) {
        mkdir(dirname($file), 0755, true);
    }

    file_put_contents($file, Crypt::encrypt([
        'x'       => $timestamp,
        'message' => $message,
    ]));

    $this->info('许可文件已生成：' . $file . '（到期 ' . $expire . '）');
})->argument('expire')->option('message', null, '过期提示文案');
```

调用：

```bash
php artisan admin:license 2026-12-31 --message="系统授权已于 2026-12-31 到期，请联系管理员续期。"
```

> 命令默认**不**自动注册到 `routes/console.php`（若项目采用「默认注释 + 守卫」策略，见 `apc-wechat-auth` 的 `admin:authorize` 处理方式），需要时自行取消注释启用。签发命令等同于密钥操作入口，建议仅在签发方环境启用。

### 4.3 续期

续期 = 用新到期时间**重新生成** exp.bin 并覆盖目标文件，无需改动任何业务代码。

```
1. 取新到期日（含时区确认）
2. 用签发端（与目标机同 APP_KEY）执行生成命令
3. 覆盖目标机 api/bootstrap/cache/exp.bin
4. 重启 / 清理缓存（php artisan optimize:clear）
5. 复验：访问任一接口，确认不再返回「未授权使用」
```

## 5. 部署携带

许可文件必须随发布产物一起送到目标机。

| 方式 | 说明 |
|------|------|
| 发布脚本拷贝 | 在 `release-config.json` 的拷贝映射中显式包含 `api/bootstrap/cache/exp.bin`；**同时**确认它没有被 `del` 规则排除 |
| 部署后单独投放 | 服务器上由运维 / 交付流程单独放置，注意权限与所有权 |
| 容器挂载 | 用 volume 挂载 `bootstrap/cache/exp.bin`，避免镜像重建丢失 |

> `apc-build-helper` 的全量打包默认会跳过运行时目录，**必须**在 `del` 清单与拷贝映射中显式处理，否则目标机上线即报「未授权使用」。

## 6. 常见故障

| 现象 | 原因 | 处置 |
|------|------|------|
| 所有实例都提示「未授权使用」 | exp.bin 缺失 / 未随发布携带 | 检查目标机 `bootstrap/cache/exp.bin` 是否存在 |
| 部分实例提示「未授权使用」 | 部分节点 `APP_KEY` 与签发端不一致 | 统一各节点 `APP_KEY`，重新签发 |
| 提示「系统已过期」但明明没到期 | 服务器时间漂移 / 时区不一致 | 校准时间（`timedatectl` / NTP），确认签发时用的时区 |
| 本地开发被拦截 | `ADMIN_CHECK_VERSION` 未设为 `false` | 本机 `.env` 设置 `ADMIN_CHECK_VERSION=false` |
| 偶发报未授权，随后正常 | `bootstrap/cache` 被 `bootstrap:cache` / 部署脚本清理 | 补齐发布拷贝清单，exp.bin 不属于可清理产物 |
| 解密报类型错误 | 载荷不是数组（如写成了字符串） | 签发端统一写 `['x' => ..., 'message' => ...]` |
