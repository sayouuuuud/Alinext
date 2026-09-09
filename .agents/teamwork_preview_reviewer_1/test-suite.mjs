import http from 'node:http'
import { spawn } from 'node:child_process'

const PORT = 3456
const BASE_URL = `http://localhost:${PORT}`
const GRAPHQL_ENDPOINT = 'https://a-f.site/graphql'

let serverProcess = null

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function waitForServer(url, timeoutMs = 30000) {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url)
      if (res.status) return true
    } catch {
      await sleep(500)
    }
  }
  throw new Error(`Server failed to start within ${timeoutMs}ms`)
}

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    redirect: 'manual',
    ...options,
  })
  const text = await res.text()
  return {
    status: res.status,
    location: res.headers.get('location'),
    headers: res.headers,
    body: text,
  }
}

const tests = []
function it(name, fn) {
  tests.push({ name, fn })
}

// ----------------------------------------------------
// Test Cases
// ----------------------------------------------------

// R1: Core E-commerce Pages
it('R1: /cart resolves with status 200 OK', async () => {
  const res = await request('/cart')
  if (res.status !== 200) throw new Error(`Expected 200 but got ${res.status}`)
})

it('R1: /shop resolves with status 200 OK', async () => {
  const res = await request('/shop')
  if (res.status !== 200) throw new Error(`Expected 200 but got ${res.status}`)
})

it('R1: /my-account resolves with status 200 OK', async () => {
  const res = await request('/my-account')
  if (res.status !== 200) throw new Error(`Expected 200 but got ${res.status}`)
})

// R2 & R3: Policy Pages & i18n
it('R2/R3: /privacy-policy renders and contains live GraphQL content', async () => {
  const res = await request('/privacy-policy')
  if (res.status !== 200) throw new Error(`Expected 200 but got ${res.status}`)
  if (!res.body.includes('سياسة الخصوصية')) throw new Error('Expected default Arabic title in body')
})

it('R2/R3: /privacy-policy?locale=ar renders Arabic content', async () => {
  const res = await request('/privacy-policy?locale=ar')
  if (res.status !== 200) throw new Error(`Expected 200 but got ${res.status}`)
  if (!res.body.includes('سياسة الخصوصية')) throw new Error('Missing Arabic title')
  if (!res.body.includes('علي فليت')) throw new Error('Missing Arabic content')
})

it('R2/R3: /privacy-policy?locale=en renders English content', async () => {
  const res = await request('/privacy-policy?locale=en')
  if (res.status !== 200) throw new Error(`Expected 200 but got ${res.status}`)
  if (!res.body.includes('Privacy Policy')) throw new Error('Missing English title')
  if (!res.body.includes('ALI FLEET')) throw new Error('Missing English content')
})

it('R2/R3: /privacy-policy?locale=he renders Hebrew content', async () => {
  const res = await request('/privacy-policy?locale=he')
  if (res.status !== 200) throw new Error(`Expected 200 but got ${res.status}`)
  if (!res.body.includes('מדיניות הפרטיות')) throw new Error('Missing Hebrew title')
})

it('R2/R3: /terms?locale=ar renders Arabic Terms content', async () => {
  const res = await request('/terms?locale=ar')
  if (res.status !== 200) throw new Error(`Expected 200 but got ${res.status}`)
  if (!res.body.includes('شروط الاستخدام') && !res.body.includes('الشروط والأحكام')) {
    throw new Error('Missing Arabic terms title')
  }
})

it('R2/R3: /terms?locale=en renders English Terms content', async () => {
  const res = await request('/terms?locale=en')
  if (res.status !== 200) throw new Error(`Expected 200 but got ${res.status}`)
  if (!res.body.includes('Terms &amp; Conditions') && !res.body.includes('Terms & Conditions')) {
    throw new Error('Missing English terms title')
  }
})

it('R2/R3: /terms?locale=he renders Hebrew Terms content', async () => {
  const res = await request('/terms?locale=he')
  if (res.status !== 200) throw new Error(`Expected 200 but got ${res.status}`)
  if (!res.body.includes('תנאים והגבלות')) throw new Error('Missing Hebrew terms title')
})

it('R2/R3: /return-policy?locale=ar renders Arabic Return Policy content', async () => {
  const res = await request('/return-policy?locale=ar')
  if (res.status !== 200) throw new Error(`Expected 200 but got ${res.status}`)
  if (!res.body.includes('سياسة الإرجاع والاستبدال')) throw new Error('Missing Arabic return title')
})

it('R2/R3: /return-policy?locale=en renders English Return Policy content', async () => {
  const res = await request('/return-policy?locale=en')
  if (res.status !== 200) throw new Error(`Expected 200 but got ${res.status}`)
  if (!res.body.includes('Return and exchange policy') && !res.body.includes('Return & Exchange Policy')) {
    throw new Error('Missing English return title')
  }
})

it('R2/R3: /return-policy?locale=he renders Hebrew Return Policy content', async () => {
  const res = await request('/return-policy?locale=he')
  if (res.status !== 200) throw new Error(`Expected 200 but got ${res.status}`)
  if (!res.body.includes('מדיניות החזרה והחלפה') && !res.body.includes('מדיניות החזרים')) {
    throw new Error('Missing Hebrew return title')
  }
})

// Alias Routes
it('Aliases: /terms-and-conditions returns 200 OK', async () => {
  const res = await request('/terms-and-conditions')
  if (res.status !== 200) throw new Error(`Expected 200 but got ${res.status}`)
})

it('Aliases: /terms-conditions returns 200 OK', async () => {
  const res = await request('/terms-conditions')
  if (res.status !== 200) throw new Error(`Expected 200 but got ${res.status}`)
})

it('Aliases: /refund-returns returns 200 OK', async () => {
  const res = await request('/refund-returns')
  if (res.status !== 200) throw new Error(`Expected 200 but got ${res.status}`)
})

it('Aliases: /refund_returns returns 200 OK', async () => {
  const res = await request('/refund_returns')
  if (res.status !== 200) throw new Error(`Expected 200 but got ${res.status}`)
})

it('Aliases: /refund-and-returns returns 200 OK', async () => {
  const res = await request('/refund-and-returns')
  if (res.status !== 200) throw new Error(`Expected 200 but got ${res.status}`)
})

// Redirects
it('Redirects: /ar/privacy-policy redirects to /privacy-policy?locale=ar', async () => {
  const res = await request('/ar/privacy-policy')
  if (res.status !== 307 && res.status !== 308) throw new Error(`Expected redirect status but got ${res.status}`)
  if (res.location !== '/privacy-policy?locale=ar') throw new Error(`Unexpected location: ${res.location}`)
})

it('Redirects: /en/privacy-policy redirects to /privacy-policy?locale=en', async () => {
  const res = await request('/en/privacy-policy')
  if (res.status !== 307 && res.status !== 308) throw new Error(`Expected redirect status but got ${res.status}`)
  if (res.location !== '/privacy-policy?locale=en') throw new Error(`Unexpected location: ${res.location}`)
})

it('Redirects: /ar/privacy-policy-ar redirects to /privacy-policy?locale=ar', async () => {
  const res = await request('/ar/privacy-policy-ar')
  if (res.status !== 307 && res.status !== 308) throw new Error(`Expected redirect status but got ${res.status}`)
  if (res.location !== '/privacy-policy?locale=ar') throw new Error(`Unexpected location: ${res.location}`)
})

it('Redirects: /ar/terms-ar redirects to /terms?locale=ar', async () => {
  const res = await request('/ar/terms-ar')
  if (res.status !== 307 && res.status !== 308) throw new Error(`Expected redirect status but got ${res.status}`)
  if (res.location !== '/terms?locale=ar') throw new Error(`Unexpected location: ${res.location}`)
})

it('Redirects: /ar/return-policy-ar redirects to /return-policy?locale=ar', async () => {
  const res = await request('/ar/return-policy-ar')
  if (res.status !== 307 && res.status !== 308) throw new Error(`Expected redirect status but got ${res.status}`)
  if (res.location !== '/return-policy?locale=ar') throw new Error(`Unexpected location: ${res.location}`)
})

// R3: Direct GraphQL Integration Test
it('R3: Direct live GraphQL queries against https://a-f.site/graphql', async () => {
  const query = `
    query AliFleetVerification {
      privacy: page(id: "privacy-policy-ar", idType: URI) { title slug }
      terms: page(id: "terms-en", idType: URI) { title slug }
      returns: page(id: "return-policy-he", idType: URI) { title slug }
    }
  `
  const res = await fetch(GRAPHQL_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  })
  if (res.status !== 200) throw new Error(`GraphQL failed with status ${res.status}`)
  const data = await res.json()
  if (!data?.data?.privacy?.title) throw new Error('Missing privacy page in GraphQL response')
  if (!data?.data?.terms?.title) throw new Error('Missing terms page in GraphQL response')
  if (!data?.data?.returns?.title) throw new Error('Missing returns page in GraphQL response')
})

async function runAll() {
  console.log('--- Starting Next.js Production Server ---')
  serverProcess = spawn('cmd.exe', ['/c', 'npx', 'next', 'start', '-p', String(PORT)], {
    cwd: 'd:\\alifleet',
    stdio: 'inherit',
  })

  let passed = 0
  let failed = 0

  try {
    await waitForServer(`${BASE_URL}/cart`)
    console.log(`Server started on ${BASE_URL}\n`)

    for (const test of tests) {
      process.stdout.write(`Testing: ${test.name} ... `)
      try {
        await test.fn()
        console.log('✓ PASS')
        passed++
      } catch (err) {
        console.log(`✗ FAIL: ${err.message}`)
        failed++
      }
    }

    console.log(`\n========================================`)
    console.log(`Total: ${tests.length} | Passed: ${passed} | Failed: ${failed}`)
    console.log(`========================================`)
  } finally {
    if (serverProcess) {
      console.log('Stopping server process...')
      // On Windows, taskkill is needed to kill spawned tree
      spawn('cmd.exe', ['/c', 'taskkill', '/F', '/T', '/PID', String(serverProcess.pid)])
    }
  }

  if (failed > 0) {
    process.exit(1)
  }
}

runAll()
