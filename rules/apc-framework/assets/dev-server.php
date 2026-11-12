<?php
/**
 * 本地开发用 PHP 内置服务器路由（文档根为仓库根 public/）
 * 用法：php -S 127.0.0.1:8001 -t public dev-server.php
 * 说明：api/ 下无 public 目录，php artisan serve 不可用；本脚本仅用于本地联调。
 */

$uri = urldecode(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) ?? '');

if ($uri !== '/' && file_exists(__DIR__ . '/public' . $uri) && !is_dir(__DIR__ . '/public' . $uri)) {
    return false;
}

require __DIR__ . '/public/index.php';
