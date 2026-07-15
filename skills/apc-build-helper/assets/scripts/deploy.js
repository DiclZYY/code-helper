#!/usr/bin/env node
/**
 * deploy.js
 * apc 框架发布脚本（全量 / 增量 + vendor 策略）
 *
 * 用法：
 *   node build/deploy.js [--mode full|incremental] [--vendor with|without]
 *                       [--commit_id=<id>] [--env=<env>] [--skip-build]
 *                       [--config=<path>]
 *
 * 默认参数：
 *   --mode    full|incremental，默认 incremental
 *   --vendor  with|without，默认 without
 *   --env     dev|staging|prod，默认 staging
 *
 * 环境变量：
 *   VUE_APP_RELEASE_DIR          产物根目录
 *   PREVIOUS_RELEASE_COMMIT      上一版本 commit（增量模式优先）
 *   BASELINE_MODE                commit | tag | hybrid（与 --config 配合）
 *   BASELINE_GREP                commit message 正则
 *   BASELINE_TAG_PATTERN         tag glob
 *   RELEASE_CONFIG               release-config.json 路径（覆盖 --config）
 *   NODE_ENV                     production
 */

const fs = require('fs')
const path = require('path')
const chalk = require('chalk')
const {
  loadenv,
  diffDetect,
  diffFiles,
  copyDir,
  ccmkdirsSync,
  cmdSync,
  runShell
} = require('./utils')

const argv = process.argv.slice(2)
const args = parseArgs(argv)

// ---------- 默认配置 ----------
const defaults = {
  mode: 'incremental',         // full | incremental | full_nv
  vendor: 'without',           // with | without
  env: 'staging',
  skipBuild: false,
  configPath: null,
  commitId: null
}

const MODE = args.mode || defaults.mode
const VENDOR = args.vendor || defaults.vendor
const ENV = args.env || defaults.env
const SKIP_BUILD = !!args['skip-build']
const WITH_VENDOR = VENDOR === 'with'

// commit_id 优先级：CLI > 环境变量 > 自动识别
let commitId = null
const cmtParam = argv.find(a => a.startsWith('--commit_id='))
if (cmtParam) {
  commitId = cmtParam.split('=')[1]
} else if (args['commit-id']) {
  commitId = args['commit-id']
} else if (process.env.PREVIOUS_RELEASE_COMMIT) {
  commitId = process.env.PREVIOUS_RELEASE_COMMIT
}

// ---------- 加载 releaseConfig ----------
function loadReleaseConfig() {
  const configPath = process.env.RELEASE_CONFIG
    || args.config
    || path.join(__dirname, '..', 'release-config.json')

  if (fs.existsSync(configPath)) {
    console.log(chalk.cyan(`[deploy] 加载配置: ${configPath}`))
    return { ...require(configPath), _configPath: configPath }
  }

  console.warn(chalk.yellow(`[deploy] 未找到 ${configPath}，使用脚本内嵌默认配置（apc vue2+laravel）`))
  return getEmbeddedDefaultConfig()
}

// 内嵌默认配置（apc 当前项目的 releaseConfig.del 18 项）
function getEmbeddedDefaultConfig() {
  return {
    projectType: 'apc-vue2-laravel',
    directories: {
      frontend: 'backend',
      backend: 'api',
      adminBuiltDir: 'public/admin',  // 增量时检测到 backend/ 变更后复制的目录
      publicPath: 'public'
    },
    del: [
      '.git/',
      '.vscode',
      '.gitignore',
      'api/.env',
      'api/.author',
      'api/composer.lock',
      'api/storage/logs/error/',
      'api/storage/logs/sql/',
      'api/storage/logs/single/*',
      'api/storage/app/',
      'api/storage/framework/session/',
      'api/storage/framework/cache/data/',
      'api/storage/framework/views/data/',
      'api/config/dict.php',
      'backend/',     // 打包时排除前端源码目录
      'backup/',
      'docs/',
      'vetur.config.js'
    ],
    copy: {},
    baseline: {
      mode: 'commit',  // commit | tag | hybrid
      grep: 'release[:：]\\s*v\\|update[:：]\\s*version\\s*v',
      tagPattern: 'v*'
    }
  }
}

const releaseConfig = loadReleaseConfig()

// mode 解析（兼容 --with_full / --with_full_nv / --with_vendor 老式写法）
let effectiveMode = MODE
if (argv.includes('--with_full')) {
  effectiveMode = 'full'
} else if (argv.includes('--with_full_nv')) {
  effectiveMode = 'full_nv'
  if (!releaseConfig.del.includes('api/vendor/')) {
    releaseConfig.del.push('api/vendor/')
  }
}
if (argv.includes('--with_vendor')) {
  releaseConfig.del = releaseConfig.del.filter(p => p !== 'api/vendor/')
}

// ---------- 环境变量加载 ----------
if (process.env.VUE_APP_RELEASE_DIR === undefined && process.env.VUE_APP_BASE_API === undefined) {
  loadenv()
}

// ---------- 产物目录 ----------
const isWin = /^win/i.test(process.platform)
const releaseDir = process.env.VUE_APP_RELEASE_DIR
  || (isWin ? path.join('C:', 'Work', 'release') : '/tmp/work/release')

const packageName = process.env.npm_package_name || path.basename(path.resolve(__dirname, '..', '..'))
const packageVersion = process.env.npm_package_version || require(path.join(path.resolve(__dirname, '..', '..', 'backend'), 'package.json')).version

releaseConfig.packageName = `${packageName}-${effectiveMode}_v${packageVersion}`
releaseConfig.dist = path.join(releaseDir, releaseConfig.packageName)
releaseConfig.mode = effectiveMode

// ---------- 构建检查 ----------
const backendDist = path.join(__dirname, '..', '..', releaseConfig.directories.frontend, 'dist')
if (!SKIP_BUILD && !fs.existsSync(backendDist)) {
  console.warn(chalk.yellow(`[deploy] ${backendDist} 不存在，请先运行 npm run build（或加 --skip-build）`))
  process.exit(1)
}

// ---------- 增量基线 ----------
let prevCommit = null
let updates = []
if (effectiveMode === 'incremental' || effectiveMode === 'update') {
  prevCommit = diffDetect(commitId, releaseConfig.baseline)
  updates = diffFiles(prevCommit)
  if (WITH_VENDOR && !updates.includes('api/vendor/')) {
    updates.push('api/vendor/')
  }
  console.log(chalk.cyan(
    `[deploy] mode=incremental, baseline=${prevCommit}, ${updates.length} files will be packaged` +
    (WITH_VENDOR ? ' (vendor included)' : '')
  ))
} else {
  console.log(chalk.cyan(`[deploy] mode=${effectiveMode}, will take some time...`))
}

// ---------- 执行打包 ----------
deploy(releaseConfig, updates, prevCommit, WITH_VENDOR, isWin)
  .then(() => {
    console.log(chalk.green(`✓ ${releaseConfig.packageName} 发布完成`))
    console.log(chalk.cyan(`产物目录: ${releaseConfig.dist}`))
    notifier(releaseConfig, isWin)
  })
  .catch(err => {
    console.error(chalk.red(`✗ 打包失败: ${err.message}`))
    process.exit(1)
  })

// ---------- 主函数 ----------
async function deploy(config, updates, prevCommit, withVendor, isWin) {
  if (!fs.existsSync(config.dist)) ccmkdirsSync(config.dist)
  const appDeployPath = path.join(config.dist, 'code')

  if (fs.existsSync(appDeployPath)) {
    fs.rmSync(appDeployPath, { recursive: true, force: true })
  }
  ccmkdirsSync(appDeployPath)

  // 占位文件，用于后续 DB 更新脚本
  const dbUpdateSqlPath = path.join(appDeployPath, 'db_update.sql')
  if (!fs.existsSync(dbUpdateSqlPath)) {
    fs.writeFileSync(dbUpdateSqlPath, '')
  }

  const rootPath = path.resolve(__dirname, '..', '..')

  if (config.mode === 'full' || config.mode === 'full_nv') {
    // 全量：复制整个项目，过滤 del
    await copyWithFilter(rootPath, appDeployPath, config.del, withVendor)
  } else {
    // 增量：按 diff 复制变更文件
    const frontendDir = config.directories.frontend
    const backendDir = config.directories.backend
    let containAdminFront = false

    for (const j of updates) {
      if (!j) continue
      const srcPath = path.join(rootPath, j)
      const destPath = path.join(appDeployPath, j)
      if (!fs.existsSync(srcPath)) {
        console.log(chalk.yellow(`[deploy] 跳过缺失文件: ${j}`))
        continue
      }
      if (j.startsWith(`${backendDir}/`) || j.startsWith(`${frontendDir}/`) || j.startsWith('transfer/') || j.startsWith('changelog/')) {
        if (j.startsWith(`${frontendDir}/`) || j.startsWith('changelog/')) {
          containAdminFront = true
          continue
        }
        fs.mkdirSync(path.dirname(destPath), { recursive: true })
        if (fs.statSync(srcPath).isDirectory()) {
          copyDir(srcPath, destPath)
        } else {
          fs.copyFileSync(srcPath, destPath)
        }
      }
    }

    if (containAdminFront) {
      const adminSrc = path.join(rootPath, frontendDir === 'backend' ? 'public/admin' : config.directories.adminBuiltDir)
      const adminDest = path.join(appDeployPath, config.directories.publicPath, 'admin')
      if (fs.existsSync(adminSrc)) {
        console.log(chalk.cyan(`[deploy] 复制构建产物: ${adminSrc} → ${adminDest}`))
        copyDir(adminSrc, adminDest)
      }
    }
  }

  // 写产物 README
  const readme = buildReadme(config, updates, prevCommit)
  fs.writeFileSync(path.join(config.dist, 'README.md'), readme, 'utf8')

  if (config.mode === 'incremental' || config.mode === 'update') {
    fs.writeFileSync(
      path.join(config.dist, 'changed-files.txt'),
      updates.join('\n'),
      'utf8'
    )
  }
}

function buildReadme(config, updates, prevCommit) {
  return [
    '# 发布产物',
    '',
    '| 项 | 值 |',
    '|---|---|',
    `| 项目 | ${config.projectType || 'apc'} |`,
    `| 包名 | ${config.packageName} |`,
    `| commit | ${cmdSync('git rev-parse --short HEAD')} |`,
    `| 分支 | ${cmdSync('git rev-parse --abbrev-ref HEAD')} |`,
    `| 模式 | ${config.mode} |`,
    `| vendor | ${config.del.includes('api/vendor/') ? 'without' : 'with'} |`,
    `| 环境 | ${ENV} |`,
    `| 上一版本 commit | ${prevCommit || '-'} |`,
    `| 基准模式 | ${config.baseline?.mode || 'commit'} |`,
    '',
    '## 变更摘要',
    (config.mode === 'incremental' || config.mode === 'update')
      ? `从 \`${prevCommit}\` 到 HEAD 的增量变更（${updates.length} 个文件）：\n\`\`\`\n${updates.join('\n')}\n\`\`\``
      : '（全量发布，无增量变更清单）',
  ].join('\n')
}

function notifier(config, isWin) {
  if (isWin) {
    console.log(chalk.cyan(`[deploy] 产物已发布到: ${config.dist}`))
  } else {
    console.log(chalk.cyan(`[deploy] 产物已发布到: ${config.dist}`))
    console.log(chalk.yellow('[deploy] 其他平台的通知弹窗需要安装 node-notifier（如需启用）'))
  }
}

// ---------- 复制带过滤 ----------
async function copyWithFilter(source, destination, ignoreList, withVendor) {
  const minimatch = require('minimatch')
  const fse = require('fs-extra')

  const filterFunc = (src) => {
    let relativePath = path.relative(source, src)
    relativePath = relativePath.split(path.sep).join('/')
    if (relativePath === '') relativePath = '.'

    for (const rawPattern of ignoreList) {
      let pattern = String(rawPattern).split(path.sep).join('/')

      if (pattern === 'api/vendor/' || pattern === 'api/vendor') {
        if (!withVendor && (relativePath === 'api/vendor' || relativePath.startsWith('api/vendor/'))) {
          return false
        }
        continue
      }

      if (pattern.endsWith('/')) {
        const dirWithoutSlash = pattern.slice(0, -1)
        if (relativePath === dirWithoutSlash || minimatch(relativePath, pattern + '**')) {
          return false
        }
      } else {
        if (minimatch(relativePath, pattern)) {
          return false
        }
      }
    }
    return true
  }

  await fse.copy(source, destination, { filter: filterFunc })
}

// ---------- 参数解析 ----------
function parseArgs(argv) {
  const out = {}
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a.startsWith('--')) {
      const key = a.slice(2)
      const eq = key.indexOf('=')
      if (eq > -1) {
        out[key.slice(0, eq)] = key.slice(eq + 1)
      } else {
        const next = argv[i + 1]
        if (next && !next.startsWith('--')) {
          out[key] = next
          i++
        } else {
          out[key] = true
        }
      }
    }
  }
  return out
}