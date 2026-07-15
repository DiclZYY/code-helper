#!/usr/bin/env node
/**
 * detect.mjs — 检测项目根 AGENTS.md + .agents/ 骨架状态
 *
 * 用法：
 *   node scripts/detect.mjs                # 检测当前目录
 *   node scripts/detect.mjs <projectRoot>  # 检测指定目录
 *
 * 退出码：
 *   0 — ready（骨架完整）
 *   1 — partial（部分缺失，可继续）
 *   2 — missing（核心全部缺失）
 *
 * 输出 JSON 到 stdout，含每个文件是否存在与整体结论。
 */
import { existsSync, statSync } from 'node:fs'
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

const target = process.argv[2] || process.cwd()
const r = detect(target)
console.log(JSON.stringify(r, null, 2))

if (r.state === 'ready') process.exit(0)
if (r.state === 'partial') process.exit(1)
process.exit(2)
