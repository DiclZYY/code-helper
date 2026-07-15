<?php
// =============================================================================
// apc 模块路由注册片段（api/routes/api.php）
// =============================================================================
// 使用说明：
//   1. 在 $mainResources 数组中按字母序或业务顺序追加一行
//   2. 模块名键名 <module> 与前端 requestPrefix / routePrefix 必须一致
//   3. 需要 Excel 导入导出时传 'excel' => true，按需启用
// =============================================================================

// 标准资源（仅 CRUD）
$mainResources = [
    // ... 已有模块 ...
    '<module>' => '<Module>Controller',
    // ... 其他模块 ...
];

// 带 Excel 能力的资源（示例）
// $mainResources = [
//     'project' => 'ProjectController',
//     '<module>' => '<Module>Controller', // + Excel
// ];

// 注册路由（项目既有方式，复制粘贴即可）
foreach ($mainResources as $name => $controller) {
    // 项目既有注册逻辑，如：
    // Route::resource($name, $controller)->middleware('auth:sanctum');
}

// Excel 路由（如启用，按项目既有方式追加）：
// Route::post('<module>/import', '<Module>Controller@import');
// Route::get('<module>/export', '<Module>Controller@export');
// Route::get('<module>/template', '<Module>Controller@template');