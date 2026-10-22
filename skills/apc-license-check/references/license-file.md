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

### 4.2 artisan 命令方式（项目既有实现：`expbuild`）

apc 框架内已在 `api/routes/console.php` 注册了签发命令 `expbuild`：

```php
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Crypt;

// 生成 exp.bin（到期时间与文案硬编码在命令内，签发时改这里）
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

调用：

```bash
php artisan expbuild
```

要点：
- 命令**同时**打印密文并写入 `bootstrap/cache/exp.bin`——打印的密文可用于跨机器投放（目标机 `APP_KEY` 必须一致）
- 到期时间与提示文案硬编码在命令内 → 每次续期都要改代码；命令注册在 `routes/console.php`，改的是**部署侧代码**，注意版本管理
- `strtotime('2027-6-1 00:00:00')` 依赖**服务器默认时区**，与 `config/app.php` 的 `timezone` 保持一致即可；跨时区签发前先确认时区
- `echo $exp` 会把密文写进命令输出 → 密文含到期信息，**不要**在共享日志/工单里回显

> **命令本身也会被许可检测拦截**：许可已过期时，`php artisan expbuild` 在 provider 注册阶段就抛 `OutputException`，执行不到签发逻辑。必须先按 [§5 续期死锁与逃生流程](#5-续期死锁与逃生流程) 临时关闭检测。

### 4.3 可参数化版本（推荐用于重复签发）

若需要频繁签发且不想每次改代码，可注册一个带参数的等价命令：

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

> 命令等同于密钥操作入口，建议仅在签发方环境启用；若项目采用「默认注释 + 守卫」策略（见 `apc-wechat-auth` 的 `admin:authorize` 处理方式），需要时自行取消注释启用。

### 4.4 续期

续期 = 用新到期时间**重新生成** exp.bin 并覆盖目标文件，无需改动任何业务代码。

```
1. 取新到期日（含时区确认）
2. 临时关闭许可检测（见 §5 续期死锁与逃生流程）—— 否则签发命令自身被拦死
3. 用签发端（与目标机同 APP_KEY）执行 expbuild / admin:license
4. 覆盖目标机 api/bootstrap/cache/exp.bin
5. 恢复 ADMIN_CHECK_VERSION=true 并 php artisan config:clear
6. 复验：访问任一接口，确认不再返回「未授权使用」
```

## 5. 续期死锁与逃生流程

### 现象

许可（exp.bin）已过期后，**签发命令本身也会被拦截**：

```
php artisan expbuild
      ↓
Laravel 启动 → RegisterProviders → AppServiceProvider::register() → check_version()
      ↓
读到 exp.bin 已过期 → throw OutputException
      ↓
命令未执行到签发逻辑 → 新 exp.bin 根本没有生成
```

因为检测点位于**容器注册阶段**，它对所有 CLI 命令一视同仁，签发命令并不能豁免。直接表现：控制台命令被截断，系统无法自救。

### 逃生流程（唯一正解）

用 `ADMIN_CHECK_VERSION=false` 临时关闭检测，签发完成后再改回：

```
1. 编辑目标机 api/.env：ADMIN_CHECK_VERSION=false
2. php artisan config:clear            ← 必须
3. php artisan expbuild                ← 签发新 exp.bin
4. 编辑目标机 api/.env：ADMIN_CHECK_VERSION=true
5. php artisan config:clear            ← 必须
6. 复验：访问任一接口，确认不再返回「已到期」
```

关键细节：

| 细节 | 说明 |
|------|------|
| `config:clear` 不可省略 | 目标机若执行过 `php artisan config:cache` / `optimize`，`env()` 读的是**缓存值**，改 `.env` 不生效 |
| 改的是目标机 `.env` | 不是签发端的；每台目标机都要单独改、单独改回 |
| 签发端也要关 | 签发端若没有有效 exp.bin，`expbuild` 同样会被拦，需同样临时关闭 |
| 窗口要短 | 关闭期间系统不校验许可，应尽快签发并恢复；期间不要重启到其它操作窗口外 |
| 改回后必须 `config:clear` | 否则检测仍是关闭状态，许可形同虚设 |

### 根治建议（可选）

若频繁续期，可考虑以下任一改造，避免每次都要动 `.env`：

| 方案 | 做法 | 代价 |
|------|------|------|
| 签发命令豁免 | 在 `check_version()` 中跳过「当前正在执行的命令是签发命令」 | 需要 `Artisan::runningInConsole()` + 命令名白名单判断 |
| 独立签发脚本 | 用不经过 Laravel 启动流程的独立 PHP 脚本签发（需自行 bootstrap 以取得 `Crypt`） | 脚本需与目标机同 `APP_KEY`，且解密验证要另做 |
| 续期入口后置 | 把检测从 `register()` 移到 `boot()` 并排除签发命令 | 覆盖面变弱，需评估队列 / 定时任务是否仍被保护 |

> 无论哪种方案，**都要保留 `ADMIN_CHECK_VERSION` 开关**作为最终逃生口。

## 6. 部署携带

许可文件必须随发布产物一起送到目标机。

| 方式 | 说明 |
|------|------|
| 发布脚本拷贝 | 在 `release-config.json` 的拷贝映射中显式包含 `api/bootstrap/cache/exp.bin`；**同时**确认它没有被 `del` 规则排除 |
| 部署后单独投放 | 服务器上由运维 / 交付流程单独放置，注意权限与所有权 |
| 容器挂载 | 用 volume 挂载 `bootstrap/cache/exp.bin`，避免镜像重建丢失 |

> `apc-build-helper` 的全量打包默认会跳过运行时目录，**必须**在 `del` 清单与拷贝映射中显式处理，否则目标机上线即报「未授权使用」。

## 7. 常见故障

| 现象 | 原因 | 处置 |
|------|------|------|
| 所有实例都提示「未授权使用」 | exp.bin 缺失 / 未随发布携带 | 检查目标机 `bootstrap/cache/exp.bin` 是否存在 |
| 部分实例提示「未授权使用」 | 部分节点 `APP_KEY` 与签发端不一致 | 统一各节点 `APP_KEY`，重新签发 |
| 提示「系统已过期」但明明没到期 | 服务器时间漂移 / 时区不一致 | 校准时间（`timedatectl` / NTP），确认签发时用的时区 |
| 本地开发被拦截 | `ADMIN_CHECK_VERSION` 未设为 `false` | 本机 `.env` 设置 `ADMIN_CHECK_VERSION=false` |
| **过期后 `php artisan expbuild` 报未授权 / 命令被截断** | **签发命令自身被许可检测拦截（续期死锁）** | **按 §5 逃生流程：`.env` 设 `ADMIN_CHECK_VERSION=false` → `config:clear` → 签发 → 改回 `true` → `config:clear`** |
| 改了 `.env` 但开关没生效 | 目标机跑过 `config:cache` / `optimize`，env 读的是缓存 | 执行 `php artisan config:clear` |
| 偶发报未授权，随后正常 | `bootstrap/cache` 被 `bootstrap:cache` / 部署脚本清理 | 补齐发布拷贝清单，exp.bin 不属于可清理产物 |
| 解密报类型错误 | 载荷不是数组（如写成了字符串） | 签发端统一写 `['x' => ..., 'message' => ...]` |
| 签发出来的 exp.bin 在目标机不可用 | 签发端与目标机 `APP_KEY` 不同 | 统一 `APP_KEY` 后重新签发 |
