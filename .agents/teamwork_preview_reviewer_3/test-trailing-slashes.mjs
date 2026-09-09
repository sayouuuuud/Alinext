import { spawn } from 'node:child_process'

const PORT = 3569
const BASE_URL = `http://localhost:${PORT}`

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function run() {
  const server = spawn('cmd.exe', ['/c', 'npx', 'next', 'start', '-p', String(PORT)], {
    cwd: 'd:\\alifleet',
    stdio: 'ignore',
  })

  await sleep(3500)

  const paths = [
    '/cart',
    '/cart/',
    '/shop',
    '/shop/',
    '/my-account',
    '/my-account/',
    '/privacy-policy',
    '/privacy-policy/',
    '/terms',
    '/terms/',
    '/return-policy',
    '/return-policy/',
    '/terms-and-conditions',
    '/terms-and-conditions/',
    '/refund-returns',
    '/refund-returns/',
  ]

  try {
    for (const p of paths) {
      const res = await fetch(`${BASE_URL}${p}`, { redirect: 'manual' })
      console.log(`Path: ${p} -> Status: ${res.status} Location: ${res.headers.get('location') || 'NONE'}`)
    }
  } finally {
    spawn('cmd.exe', ['/c', 'taskkill', '/F', '/T', '/PID', String(server.pid)])
  }
}

run().catch(console.error)
