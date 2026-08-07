import { readFile, readdir, stat } from 'node:fs/promises'
import path from 'node:path'

const root = process.cwd()
const ignoredDirectories = new Set(['.git', '.vitepress', 'node_modules'])

async function collectMarkdown(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = []

  for (const entry of entries) {
    if (entry.name.startsWith('.') && entry.name !== '.github') continue
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) continue

    const absolute = path.join(directory, entry.name)
    if (entry.isDirectory()) files.push(...(await collectMarkdown(absolute)))
    else if (entry.isFile() && entry.name.endsWith('.md')) files.push(absolute)
  }

  return files
}

function stripFencedCode(markdown) {
  return markdown.replace(/^(```|~~~)[\s\S]*?^\1\s*$/gm, '')
}

function relativeToRoot(file) {
  return path.relative(root, file).split(path.sep).join('/')
}

async function exists(file) {
  try {
    return (await stat(file)).isFile()
  } catch {
    return false
  }
}

const errors = []
const files = await collectMarkdown(root)

for (const file of files) {
  const markdown = stripFencedCode(await readFile(file, 'utf8'))
  const linkPattern = /!?\[[^\]]*\]\(([^)]+)\)/g

  for (const match of markdown.matchAll(linkPattern)) {
    const rawTarget = match[1].trim().replace(/^<|>$/g, '').split(/\s+["']/)[0]
    if (!rawTarget || /^(?:https?:|mailto:|tel:|data:|#)/i.test(rawTarget)) continue

    const target = decodeURIComponent(rawTarget.split('#')[0].split('?')[0])
    if (!target || target.startsWith('/')) continue

    const resolved = path.resolve(path.dirname(file), target)
    const outsideRepository = path.relative(root, resolved).startsWith(`..${path.sep}`)
    if (outsideRepository) {
      errors.push(`${relativeToRoot(file)} -> ${rawTarget} (tham chiếu ra ngoài repository)`)
      continue
    }

    if (!(await exists(resolved))) {
      errors.push(`${relativeToRoot(file)} -> ${rawTarget} (không tìm thấy file)`)
    }
  }
}

if (errors.length) {
  console.error(`Phát hiện ${errors.length} liên kết nội bộ lỗi:\n`)
  for (const error of errors) console.error(`- ${error}`)
  process.exit(1)
}

console.log(`Đã kiểm tra ${files.length} trang Markdown: không có liên kết nội bộ lỗi.`)
