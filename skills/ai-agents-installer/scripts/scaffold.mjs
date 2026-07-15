#!/usr/bin/env node
/**
 * scaffold.mjs — 仅写缺失的 AGENTS.md + .agents/ 骨架文件
 *
 * 用法：
 *   node scripts/scaffold.mjs                                  # 当前目录，默认仓库
 *   node scripts/scaffold.mjs --repo DiclZYY/code-helper-skills
 *   node scripts/scaffold.mjs --project-root /path/to/project
 *
 * 行为：
 *   - 读取 package.json（若存在）取 name 作为 PROJECT_NAME
 *   - 占位符：{{PROJECT_NAME}} {{PRIMARY_LANG}} {{REPO_DEFAULT}} {{DATE}}
 *   - 已有文件一律不动（只补缺失）
 */
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync, readdirSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const SKILL_ROOT = resolve(__dirname, '..')
const TEMPLATE_DIR = join(SKILL_ROOT, 'assets', 'templates')

function parseArgs(argv) {
  const args = { repo: 'DiclZYY/code-helper-skills', projectRoot: process.cwd() }
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--repo') args.repo = argv[++i]
    else if (a === '--project-root') args.projectRoot = argv[++i]
    else if (a === '-h' || a === '--help') {
      console.log('Usage: scaffold.mjs [--repo owner/name] [--project-root <dir>]')
      process.exit(0)
    }
  }
  return args
}

function readPackageName(root) {
  const pkgPath = join(root, 'package.json')
  if (!existsSync(pkgPath)) return basename(root)
  try {
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'))
    return pkg.name || basename(root)
  } catch {
    return basename(root)
  }
}

function basename(p) {
  return p.split(/[\\/]/).filter(Boolean).pop() || p
}

function today() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function render(tpl, vars) {
  return tpl.replace(/\{\{(\w+)\}\}/g, (_, k) => (k in vars ? vars[k] : `{{${k}}}`))
}

function readTemplate(name) {
  const p = join(TEMPLATE_DIR, name)
  if (!existsSync(p)) throw new Error(`Template not found: ${p}`)
  return readFileSync(p, 'utf8')
}

function ensureDir(dir) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
}

function writeIfMissing(path, content) {
  if (existsSync(path)) {
    return { path, status: 'skipped (exists)' }
  }
  ensureDir(dirname(path))
  writeFileSync(path, content, 'utf8')
  return { path, status: 'written' }
}

function main() {
  const args = parseArgs(process.argv)
  const root = resolve(args.projectRoot)
  const vars = {
    PROJECT_NAME: readPackageName(root),
    PRIMARY_LANG: '<fill>', // 用户后续在 AGENTS.md 自行补充
    REPO_DEFAULT: args.repo,
    DATE: today(),
  }

  const writes = []
  writes.push(writeIfMissing(
    join(root, 'AGENTS.md'),
    render(readTemplate('AGENTS.md.tpl'), vars),
  ))

  writes.push(writeIfMissing(
    join(root, '.agents', 'README.md'),
    readTemplate('agents-readme.md.tpl'),
  ))
  writes.push(writeIfMissing(
    join(root, '.agents', 'skills', 'README.md'),
    readTemplate('skills-readme.md.tpl'),
  ))
  writes.push(writeIfMissing(
    join(root, '.agents', 'rules', 'README.md'),
    readTemplate('rules-readme.md.tpl'),
  ))

  console.log(JSON.stringify({ root, vars, writes }, null, 2))
}

main()
