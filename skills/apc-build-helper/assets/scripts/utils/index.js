/**
 * utils/index.js
 * build 工具集（loadenv / diffDetect / 包管理器检测）
 *
 * 导出：
 *   loadenv(mode, basedir)
 *   diffDetect(commitIdOrNull, options)  options: { baseline: 'commit' | 'tag', grep: string }
 *   detectPackageManager(projectRoot)
 *   copyDir(src, dest, exclude)
 *   ccmkdirsSync(dir)
 *   runShell(cmd) / cmdSync(cmd)
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')
const chalk = require('chalk')

const isWin = /^win/i.test(process.platform)

// ---------- 递归创建目录 ----------
function ccmkdirsSync(dirname) {
  if (fs.existsSync(dirname)) return true
  if (ccmkdirsSync(path.dirname(dirname))) {
    fs.mkdirSync(dirname)
    return true
  }
}

// ---------- 加载 .env ----------
function loadenv(mode = 'production', basedir) {
  basedir = basedir || path.resolve(__dirname, '..', '..')
  // 尝试加载 dotenv，无依赖时降级为简单解析
  let dotenv
  try {
    dotenv = require('dotenv')
  } catch (e) {
    console.warn(chalk.yellow('[utils] dotenv 未安装，使用内置简单解析'))
    dotenv = { parse: simpleDotenvParse }
  }

  const files = [
    path.join(basedir, '.env'),
    path.join(basedir, `.env.${mode}`),
    path.join(basedir, `.env.${mode}.local`)
  ]

  files.forEach(file => {
    if (fs.existsSync(file)) {
      try {
        const parsed = dotenv.parse(fs.readFileSync(file, { encoding: 'utf8' }))
        Object.keys(parsed).forEach(key => {
          let val = parsed[key]
          val = String(val).replace(/^"(.*)"$/s, '$1').replace(/^'(.*)'$/s, '$1')
          val = val.replace(/\\(["'\\])/g, '$1')
          process.env[key] = val
        })
      } catch (e) {
        console.log(chalk.yellow(`[utils] 解析 .env 失败: ${file}: ${e.message}`))
      }
    }
  })
}

// 简单 .env 解析（KEY=VALUE，支持 # 注释）
function simpleDotenvParse(src) {
  const out = {}
  src.split(/\r?\n/).forEach(line => {
    line = line.trim()
    if (!line || line.startsWith('#')) return
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/)
    if (m) out[m[1]] = m[2]
  })
  return out
}

// ---------- 检测包管理器 ----------
function detectPackageManager(projectRoot) {
  const root = projectRoot || path.resolve(__dirname, '..', '..', '..')
  if (fs.existsSync(path.join(root, 'pnpm-lock.yaml'))) return 'pnpm'
  if (fs.existsSync(path.join(root, 'yarn.lock'))) return 'yarn'
  if (fs.existsSync(path.join(root, 'package-lock.json'))) return 'npm'
  if (fs.existsSync(path.join(root, 'bun.lockb'))) return 'bun'
  return 'npm' // 默认
}

// ---------- shell ----------
function cmdSync(cmd, opts = {}) {
  return execSync(cmd, { encoding: 'utf8', stdio: opts.stdio || 'pipe', ...opts }).trim()
}

function runShell(cmd, opts = {}) {
  try {
    execSync(cmd, { stdio: 'inherit', shell: true, ...opts })
  } catch (e) {
    throw new Error(`命令执行失败: ${cmd}`)
  }
}

// ---------- 增量基线识别 ----------
/**
 * 根据配置识别"上一次发布"基准，返回 commit id
 *
 * @param {string|null} commitIdOrTag  显式指定（commit id 或 tag），优先级最高
 * @param {object} options
 *   - baseline: 'commit' | 'tag' | 'hybrid'  默认 'commit'
 *   - grep:  正则表达式（commit 模式下使用）默认 'release[:：]\\s*v\\|update[:：]\\s*version\\s*v'
 *   - tagPattern: tag 模式下使用的 glob（默认 'v*'）
 * @returns {string} commit id（短格式）
 */
function diffDetect(commitIdOrTag, options = {}) {
  const baseline = options.baseline || process.env.BASELINE_MODE || 'commit'
  const grep = options.grep || process.env.BASELINE_GREP || 'release[:：]\\s*v\\|update[:：]\\s*version\\s*v'
  const tagPattern = options.tagPattern || process.env.BASELINE_TAG_PATTERN || 'v*'

  // 显式指定时直接用
  if (commitIdOrTag) {
    // 若是 tag 形式（不以 hex 开头），解析为 commit
    if (!/^[0-9a-f]{6,}$/i.test(commitIdOrTag)) {
      try {
        const resolved = cmdSync(`git rev-list -1 ${commitIdOrTag}`)
        return resolved.slice(0, 7)
      } catch (e) {
        throw new Error(`无法解析 tag/commit: ${commitIdOrTag}`)
      }
    }
    return commitIdOrTag.slice(0, 7)
  }

  // 自动识别
  if (baseline === 'tag' || baseline === 'hybrid') {
    const tagCommit = findLastTagCommit(tagPattern)
    if (tagCommit) return tagCommit
    if (baseline === 'tag') {
      throw new Error(`未找到匹配的 tag（pattern: ${tagPattern}）`)
    }
    // hybrid: 回退到 commit
    console.log(chalk.yellow(`[utils] 未找到 tag，回退到 commit message 模式`))
  }

  if (baseline === 'commit' || baseline === 'hybrid') {
    const commitCommit = findLastCommitByGrep(grep)
    if (commitCommit) return commitCommit
    throw new Error(`未通过 grep "${grep}" 找到上次发版 commit；请显式指定 --commit_id=<id> 或检查 commit 规范`)
  }

  throw new Error(`不支持的 baseline 模式: ${baseline}`)
}

function findLastCommitByGrep(grep) {
  try {
    const result = cmdSync(`git log -1 --pretty=format:"%h" --grep="${grep}"`)
    if (result) return result
    return null
  } catch (e) {
    console.log(chalk.red(`[utils] grep 查询失败: ${e.message}`))
    return null
  }
}

function findLastTagCommit(pattern) {
  try {
    // 找到最近一个匹配 pattern 的 tag
    const tag = cmdSync(`git tag --sort=-creatordate --list "${pattern}" | head -1`)
    if (!tag) return null
    return cmdSync(`git rev-list -1 ${tag}`).slice(0, 7)
  } catch (e) {
    return null
  }
}

// ---------- diff file list ----------
function diffFiles(commitId) {
  try {
    const output = cmdSync(`git diff --name-only ${commitId}`)
    return output ? output.split('\n').filter(Boolean) : []
  } catch (e) {
    throw new Error(`无法计算 diff（commit: ${commitId}）: ${e.message}`)
  }
}

// ---------- 拷贝目录（带 exclude） ----------
function copyDir(src, dest, exclude = []) {
  if (!fs.existsSync(src)) return
  ccmkdirsSync(dest)

  const entries = fs.readdirSync(src, { withFileTypes: true })
  for (const entry of entries) {
    if (exclude.includes(entry.name)) continue
    const srcPath = path.join(src, entry.name)
    const destPath = path.join(dest, entry.name)

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath, exclude)
    } else {
      ccmkdirsSync(path.dirname(destPath))
      fs.copyFileSync(srcPath, destPath)
    }
  }
}

module.exports = {
  loadenv,
  diffDetect,
  diffFiles,
  detectPackageManager,
  copyDir,
  ccmkdirsSync,
  runShell,
  cmdSync,
  isWin
}