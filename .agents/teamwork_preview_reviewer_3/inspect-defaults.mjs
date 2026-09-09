import { spawn } from 'node:child_process'

const PORT = 3568
const BASE_URL = `http://localhost:${PORT}`

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function run() {
  const server = spawn('cmd.exe', ['/c', 'npx', 'next', 'start', '-p', String(PORT)], {
    cwd: 'd:\\alifleet',
    stdio: 'ignore',
  })

  await sleep(3000)

  try {
    for (const path of ['/privacy-policy', '/terms', '/return-policy']) {
      const res = await fetch(`${BASE_URL}${path}`)
      const html = await res.text()
      const titleMatch = html.match(/<h1[^>]*>(.*?)<\/h1>/)
      console.log(`Path: ${path} | Status: ${res.status} | H1: ${titleMatch ? titleMatch[1] : 'NONE'}`)
      const dirMatch = html.match(/<div class="min-h-screen[^"]*" dir="([^"]*)"/)
      console.log(`  dir: ${dirMatch ? dirMatch[1] : 'NONE'}`)
    }
  } finally {
    spawn('cmd.exe', ['/c', 'taskkill', '/F', '/T', '/PID', String(server.pid)])
  }
}

run().catch(console.error)
