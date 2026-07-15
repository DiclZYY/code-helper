#!/usr/bin/env node
/**
 * release.js
 * 发布编排：version → build → deploy
 *
 * 用法：
 *   node build/release.js [--vlogs] [--mode=<mode>] [--vendor=<with|without>] [--push] [--tag=<tagname>]
 *
 * 选项：
 *   --vlogs           仅运行 version，不做 build/deploy
 *   --mode            透传给 deploy.js（full | incremental | full_nv，默认 incremental）
 *   --vendor          透传给 deploy.js（with | without，默认 without）
 *   --push            发布完成后自动 git push 并打 tag
 *   --tag             tag 名（默认 v<version>）
 *   --no-version      跳过 version 步骤
 *   --no-build        跳过 build 步骤
 *   --no-deploy       跳过 deploy 步骤
 *   --skip-build      deploy 跳过 dist 存在性检查
 *
 * 与原 release.js 的差异：
 *   - 支持通过 release-config.json 自定义 vendor 策略 / baseline 模式
 *   - CLI 参数化，不再写死 vue-cli-service
 *   - 集成包管理器检测（npm/pnpm）
 */

const path = require('path')
const fs = require('fs')
const chalk = require('chalk')
const { runShell, cmdSync, detectPackageManager, loadenv } = require('./utils')

const argv = process.argv.slice(2)
const args = parseArgs(argv)

// ---------- 加载配置 ----------
const configPath = process.env.RELEASE_CONFIG
  || args.config
  || path.join(__dirname, '..', 'release-config.json')

let config = {}
if (fs.existsSync(configPath)) {
  config = require(configPath)
  console.log(chalk.cyan(`[release] 加载配置: ${configPath}`))
} else {
  console.warn(chalk.yellow(`[release] 未找到 ${configPath}，使用脚本内默认（apc vue2+laravel）`))
  config = {
    directories: { frontend: 'backend', backend: 'api' },
    build: {
      command: 'vue-cli-service build',  // 可改为 vite build / next build 等
      mode: 'production'
    }
  }
}

const SKIP_VERSION = !!args['no-version']
const SKIP_BUILD = !!args['no-build'] || !!args['vlogs']
const SKIP_DEPLOY = !!args['no-deploy'] || !!args['vlogs']
const VLOGS = !!args['vlogs']
const DO_PUSH = !!args.push
const TAG_NAME = args.tag || `v${getCurrentVersion()}`

// ---------- 包管理器 ----------
const root = path.resolve(__dirname, '..', '..')
const pkgManager = detectPackageManager(root)
console.log(chalk.cyan(`[release] 包管理器: ${pkgManager}`))

// ---------- 步骤 1：version ----------
if (!SKIP_VERSION) {
  console.log(chalk.cyan(`\n[release] 步骤 1/3: 更新版本号`))
  runShell(`node ${path.join(__dirname, 'version.js')}`)
} else {
  console.log(chalk.gray(`[release] 跳过 version 步骤`))
}

// ---------- 步骤 2：build ----------
if (VLOGS) {
  console.log(chalk.yellow(`\n[release] ⚠ --vlogs 模式：仅运行 version，跳过 build/deploy`))
  console.log(chalk.yellow(`请手动更新 changelog/admin.json 后，使用不带 --vlogs 的命令重试`))
  process.exit(0)
}

if (!SKIP_BUILD) {
  console.log(chalk.cyan(`\n[release] 步骤 2/3: 构建前端`))
  const buildCmd = config.build?.command || 'vue-cli-service build'
  const modeFlag = config.build?.mode ? `--mode ${config.build.mode}` : ''
  const pm = pkgManager === 'npm' ? 'npm run' : `${pkgManager}`
  const cmd = pkgManager === 'npm'
    ? `npm run build`
    : `${pkgManager} build`
  console.log(chalk.gray(`  执行: ${cmd}`))
  runShell(cmd)
} else {
  console.log(chalk.gray(`[release] 跳过 build 步骤`))
}

// ---------- 步骤 3：deploy ----------
if (!SKIP_DEPLOY) {
  console.log(chalk.cyan(`\n[release] 步骤 3/3: 打包部署`))
  const mode = args.mode || 'incremental'
  const vendor = args.vendor || 'without'
  const deployScript = path.join(__dirname, 'deploy.js')
  const deployEnv = {
    ...process.env,
    RELEASE_CONFIG: configPath,
    VUE_APP_RELEASE_DIR: process.env.VUE_APP_RELEASE_DIR
  }
  if (process.env.PREVIOUS_RELEASE_COMMIT) {
    deployEnv.PREVIOUS_RELEASE_COMMIT = process.env.PREVIOUS_RELEASE_COMMIT
  }
  runShell(`node ${deployScript} --mode=${mode} --vendor=${vendor}${args['skip-build'] ? ' --skip-build' : ''}`, { env: deployEnv })
} else {
  console.log(chalk.gray(`[release] 跳过 deploy 步骤`))
}

// ---------- 步骤 4：push + tag ----------
if (DO_PUSH) {
  console.log(chalk.cyan(`\n[release] 步骤 4/4: git push + tag`))
  try {
    runShell('git add -A')
    runShell(`git commit -m "release: ${TAG_NAME}"`)
    runShell('git push')
    try {
      runShell(`git tag -a ${TAG_NAME} -m "release ${TAG_NAME}"`)
      runShell(`git push origin ${TAG_NAME}`)
    } catch (e) {
      console.log(chalk.yellow(`[release] tag 已存在或创建失败: ${e.message}`))
    }
  } catch (e) {
    console.error(chalk.red(`[release] push 失败: ${e.message}`))
  }
}

console.log(chalk.green(`\n✓ release 完成`))

// ---------- 工具 ----------
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

function getCurrentVersion() {
  const pkgPath = path.join(root, 'backend', 'package.json')
  if (fs.existsSync(pkgPath)) {
    return require(pkgPath).version || '0.0.0'
  }
  return '0.0.0'
}