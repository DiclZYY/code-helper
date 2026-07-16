#!/usr/bin/env node
/**
 * detect.mjs — 检测项目根 AGENTS.md + .agents/ 骨架状态
 *
 * 用法：
 *   node scripts/detect.mjs                          # 检测当前目录
 *   node scripts/detect.mjs <projectRoot>            # 检测指定目录
 *   node scripts/detect.mjs --hint stack             # 在输出 JSON 中追加 stack hint 字段
 *
 * 退出码：
 *   0 — ready（骨架完整）
 *   1 — partial（部分缺失，可继续）
 *   2 — missing（核心全部缺失）
 *
 * 输出 JSON 到 stdout，含每个文件是否存在、整体结论；启用 --hint stack 时追加
 * packageManager / primaryFrontend / primaryBackend / nodeVersion / phpVersion。
 */
import { existsSync, readFileSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'

const FILES = [
  'AGENTS.md',
  '.agents/README.md',
  '.agents/skills/README.md',
  '.agents/rules/README.md',
]

const DIRS = [
  '.agents',
  '.agents/skills',
  '.agents/rules',
]

function parseArgs(argv) {
  const args = { projectRoot: process.cwd(), hintStack: false }
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--hint' && argv[i + 1] === 'stack') { args.hintStack = true; i++ }
    else if (a === '-h' || a === '--help') {
      console.log('Usage: detect.mjs [--hint stack] [<projectRoot>]')
      process.exit(0)
    } else if (!a.startsWith('--')) {
      args.projectRoot = a
    }
  }
  return args
}

function detect(projectRoot) {
  const root = resolve(projectRoot)
  const result = {
    root,
    dirs: {},
    files: {},
    state: 'ready',
    missingFiles: [],
    missingDirs: [],
  }

  for (const d of DIRS) {
    const p = join(root, d)
    const ok = existsSync(p) && statSync(p).isDirectory()
    result.dirs[d] = ok
    if (!ok) result.missingDirs.push(d)
  }

  for (const f of FILES) {
    const p = join(root, f)
    const ok = existsSync(p) && statSync(p).isFile()
    result.files[f] = ok
    if (!ok) result.missingFiles.push(f)
  }

  if (result.missingDirs.includes('.agents') && !result.files['AGENTS.md']) {
    result.state = 'missing'
  } else if (result.missingDirs.length > 0 || result.missingFiles.length > 0) {
    result.state = 'partial'
  } else {
    result.state = 'ready'
  }

  return result
}

/**
 * 推断项目栈 hint，供 ai-agents-installer Step 7「深度解读源码」使用。
 * 仅基于文件存在 + package.json / composer.json 顶层字段，不递归读源码。
 */
function detectStackHints(root) {
  const hints = {
    packageManager: null,
    primaryFrontend: 'none',
    primaryBackend: 'none',
    nodeVersion: null,
    phpVersion: null,
  }

  // 包管理器
  if (existsSync(join(root, 'pnpm-lock.yaml'))) hints.packageManager = 'pnpm'
  else if (existsSync(join(root, 'yarn.lock'))) hints.packageManager = 'yarn'
  else if (existsSync(join(root, 'package-lock.json'))) hints.packageManager = 'npm'
  else if (existsSync(join(root, 'composer.lock'))) hints.packageManager = 'composer'
  else if (existsSync(join(root, 'package.json'))) hints.packageManager = 'npm'
  else if (existsSync(join(root, 'composer.json'))) hints.packageManager = 'composer'

  // 前端主框架（package.json dependencies）
  const pkgPath = join(root, 'package.json')
  if (existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'))
      if (pkg.engines?.node) hints.nodeVersion = String(pkg.engines.node)
      const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) }
      if (deps.vue) {
        const major = String(deps.vue).match(/^[\^~]?(\d+)/)?.[1]
        hints.primaryFrontend = major === '2' ? 'vue2' : major === '3' ? 'vue3' : 'vue'
      } else if (deps.react) {
        hints.primaryFrontend = 'react'
      } else if (deps.svelte) {
        hints.primaryFrontend = 'svelte'
      }
    } catch { /* ignore malformed package.json */ }
  }

  // 后端主框架（composer.json require）
  const composerPath = join(root, 'composer.json')
  if (existsSync(composerPath)) {
    try {
      const composer = JSON.parse(readFileSync(composerPath, 'utf8'))
      const req = composer.require || {}
      if (req.php) hints.phpVersion = String(req.php)
      if (req['laravel/framework']) {
        hints.primaryBackend = 'laravel'
      } else if (req.php) {
        hints.primaryBackend = 'php'
      }
    } catch { /* ignore malformed composer.json */ }
  }

  return hints
}

const args = parseArgs(process.argv)
const result = detect(args.projectRoot)
if (args.hintStack) {
  result.hints = detectStackHints(args.projectRoot)
}
console.log(JSON.stringify(result, null, 2))

if (result.state === 'ready') process.exit(0)
if (result.state === 'partial') process.exit(1)
process.exit(2)