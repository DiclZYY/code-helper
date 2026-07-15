#!/usr/bin/env node
/**
 * version.js
 * 扫描 git log 计算版本号，写入 changelog/version.json + backend/package.json
 *
 * 算法（保留 apc 现状）：
 *   feat:*    → minor++
 *   fix/perf/update/add/style/styles/css:*  → patch++
 *   其他 commit 不计
 *
 * 用法：
 *   node build/version.js [--show] [--mode=release|develop] [--no-write]
 *   node build/version.js --help
 */

const path = require('path')
const fs = require('fs')
const chalk = require('chalk')
const { cmdSync } = require('./utils')

// ---------- 参数解析 ----------
const argv = process.argv.slice(2)
const args = parseArgs(argv)

if (args.help || args.h) {
  console.log(`
用法: node build/version.js [options]

选项:
  --show            仅显示当前版本，不写文件
  --mode=<release|develop>  提交模式（影响 versionCode 计数），默认 release
  --no-write        仅计算，不写文件
  --help, -h        显示帮助

环境变量:
  VERSION_FILE      changelog/version.json 路径，默认 <root>/changelog/version.json
  PACKAGE_FILE      package.json 路径，默认 <root>/backend/package.json
`)
  process.exit(0)
}

const SHOW_ONLY = !!args.show
const NO_WRITE = !!args['no-write']
const MODE = args.mode || 'release'

// ---------- 路径定位 ----------
const root = path.resolve(__dirname, '..', '..')
const versionFile = process.env.VERSION_FILE || path.join(root, 'changelog', 'version.json')
const packageFile = process.env.PACKAGE_FILE || path.join(root, 'backend', 'package.json')

if (!fs.existsSync(versionFile)) {
  console.error(chalk.red(`[version] 未找到 ${versionFile}`))
  process.exit(1)
}

const versionInfo = require(versionFile)

if (SHOW_ONLY) {
  console.log(chalk.cyan('当前版本信息:'))
  console.log(JSON.stringify(versionInfo, null, 2))
  process.exit(0)
}

// ---------- 计算 ----------
versionInfo.date = new Date().toISOString().split('T')[0]

const logsResult = cmdSync(`git log --no-merges --pretty=format:"%s"`)
const logs = logsResult.split('\n').reverse()
versionInfo.versionCode = logs.length

let [major, minor, patch] = [0, 0, 0]
const regs = /^(feat|perf|fix|update|add|style|styles|css).*[:：]\s*(.*)/im
logs.forEach((logContext) => {
  if (!logContext) return
  const matches = regs.exec(logContext)
  if (!matches) return
  const scope = matches[1]
  switch (scope) {
    case 'feat':
      minor += 1
      patch = 0
      break
    case 'fix':
    case 'perf':
    case 'update':
    case 'add':
    case 'style':
    case 'styles':
    case 'css':
      patch += 1
      break
  }
})

const newVersion = [major, minor, patch].join('.')
versionInfo.version = newVersion

// ---------- 写文件 ----------
if (!NO_WRITE) {
  fs.writeFileSync(versionFile, JSON.stringify(versionInfo, null, 2) + '\n')

  if (fs.existsSync(packageFile)) {
    const pkg = require(packageFile)
    pkg.version = newVersion
    fs.writeFileSync(packageFile, JSON.stringify(pkg, null, 2) + '\n')
  } else {
    console.warn(chalk.yellow(`[version] package.json 不存在: ${packageFile}，跳过同步`))
  }
}

console.log(chalk.green('[version] 版本更新完成:'))
console.table(versionInfo)

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