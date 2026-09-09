import { spawn } from 'node:child_process'
import http from 'node:http'

const PORT = 3088
const BASE_URL = `http://localhost:${PORT}`
const GRAPHQL_ENDPOINT = 'https://a-f.site/graphql'

const results = {
  graphql: [],
  routes: [],
  summary: { total: 0, passed: 0, failed: 0 }
}

function recordResult(category, name, passed, details) {
  results[category].push({ name, passed, details })
  results.summary.total++
  if (passed) results.summary.passed++
  else results.summary.failed++
}

async function testGraphQL() {
  console.log('=== [PHASE C.1] Independent Live GraphQL Testing ===')
  const slugs = [
    'privacy-policy-ar', 'privacy-policy-en', 'privacy-policy-he',
    'terms-ar', 'terms-en', 'terms-he',
    'return-policy-ar', 'return-policy-en', 'return-policy-he',
    'refund_returns'
  ]

  for (const slug of slugs) {
    try {
      const query = JSON.stringify({
        query: `query VerifyPolicy($id: ID!) {
          page(id: $id, idType: URI) {
            databaseId
            title
            slug
            content
          }
        }`,
        variables: { id: slug }
      })

      const res = await fetch(GRAPHQL_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: query
      })

      const json = await res.json()
      if (res.ok && json.data && json.data.page && json.data.page.content?.length > 100) {
        recordResult('graphql', slug, true, {
          id: json.data.page.databaseId,
          title: json.data.page.title,
          contentLength: json.data.page.content.length
        })
        console.log(`[PASS] GraphQL slug "${slug}" -> ID ${json.data.page.databaseId}, Title: "${json.data.page.title}" (${json.data.page.content.length} chars)`)
      } else {
        recordResult('graphql', slug, false, { json })
        console.log(`[FAIL] GraphQL slug "${slug}" -> missing or empty content`)
      }
    } catch (err) {
      recordResult('graphql', slug, false, { error: err.message })
      console.log(`[FAIL] GraphQL slug "${slug}" -> ${err.message}`)
    }
  }
}

async function fetchRoute(path, followRedirect = true, maxRedirects = 5) {
  let curUrl = `${BASE_URL}${path}`
  let redirects = 0

  while (redirects < maxRedirects) {
    const res = await fetch(curUrl, { redirect: 'manual' })
    if ([301, 302, 307, 308].includes(res.status)) {
      const loc = res.headers.get('location')
      if (!followRedirect || !loc) {
        return { status: res.status, location: loc, body: '' }
      }
      curUrl = loc.startsWith('http') ? loc : `${BASE_URL}${loc}`
      redirects++
      continue
    }
    const text = await res.text()
    return { status: res.status, finalUrl: curUrl, body: text }
  }
  throw new Error(`Too many redirects for ${path}`)
}

async function testRoutes() {
  console.log('\n=== [PHASE C.2] Independent Route Testing against Local Server ===')

  // R1 Core Ecommerce Routes
  const ecommerceRoutes = [
    { path: '/cart', expectedSnippet: 'cart' },
    { path: '/my-account', expectedSnippet: 'account' },
    { path: '/shop', expectedSnippet: 'catalog' },
    { path: '/account', expectedSnippet: 'account' },
    { path: '/products', expectedSnippet: 'products' },
  ]

  for (const item of ecommerceRoutes) {
    try {
      const res = await fetchRoute(item.path)
      const is200 = res.status === 200
      const pass = is200 && res.body.length > 500
      recordResult('routes', `R1: ${item.path}`, pass, { status: res.status, bodyLength: res.body.length })
      console.log(`[${pass ? 'PASS' : 'FAIL'}] ${item.path} -> Status ${res.status}, Len: ${res.body.length}`)
    } catch (e) {
      recordResult('routes', `R1: ${item.path}`, false, { error: e.message })
      console.log(`[FAIL] ${item.path} -> Error: ${e.message}`)
    }
  }

  // R2 Policy Pages & Multilingual rendering
  const policyTests = [
    // Privacy Policy
    { path: '/privacy-policy?locale=ar', expectedTitle: 'سياسة الخصوصية', expectedDir: 'rtl' },
    { path: '/privacy-policy?locale=en', expectedTitle: 'Privacy Policy', expectedDir: 'ltr' },
    { path: '/privacy-policy?locale=he', expectedTitle: 'מדיניות הפרטיות', expectedDir: 'rtl' },

    // Terms & Conditions
    { path: '/terms?locale=ar', expectedTitle: 'شروط', expectedDir: 'rtl' },
    { path: '/terms?locale=en', expectedTitle: 'Terms', expectedDir: 'ltr' },
    { path: '/terms?locale=he', expectedTitle: 'תנאים', expectedDir: 'rtl' },

    // Refund & Return
    { path: '/return-policy?locale=ar', expectedTitle: 'الإرجاع', expectedDir: 'rtl' },
    { path: '/return-policy?locale=en', expectedTitle: 'Return', expectedDir: 'ltr' },
    { path: '/return-policy?locale=he', expectedTitle: 'החזרה', expectedDir: 'rtl' },

    // Uppercase normalization edge cases
    { path: '/privacy-policy?locale=AR', expectedTitle: 'سياسة الخصوصية', expectedDir: 'rtl' },
    { path: '/terms?locale=HE', expectedTitle: 'תנאים', expectedDir: 'rtl' },
    { path: '/return-policy?locale=EN', expectedTitle: 'Return', expectedDir: 'ltr' },

    // Default locale route resolution (defaultLocale is 'en', dir="ltr")
    { path: '/privacy-policy', expectedTitle: 'Privacy Policy', expectedDir: 'ltr' },
    { path: '/terms', expectedTitle: 'Terms', expectedDir: 'ltr' },
    { path: '/return-policy', expectedTitle: 'Return', expectedDir: 'ltr' },

    // Aliases (Default renders 200 OK without 404)
    { path: '/terms-and-conditions', expectedTitle: 'Terms', expectedDir: 'ltr' },
    { path: '/terms-conditions', expectedTitle: 'Terms', expectedDir: 'ltr' },
    { path: '/refund-returns', expectedTitle: 'Return', expectedDir: 'ltr' },
    { path: '/refund-and-returns', expectedTitle: 'Return', expectedDir: 'ltr' },
    { path: '/refund_returns', expectedTitle: 'Return', expectedDir: 'ltr' },

    // Aliases with explicit locale
    { path: '/terms-and-conditions?locale=ar', expectedTitle: 'شروط', expectedDir: 'rtl' },
    { path: '/refund-returns?locale=ar', expectedTitle: 'الإرجاع', expectedDir: 'rtl' },
    { path: '/refund-and-returns?locale=he', expectedTitle: 'החזרה', expectedDir: 'rtl' },
  ]

  for (const item of policyTests) {
    try {
      const res = await fetchRoute(item.path)
      const is200 = res.status === 200
      const hasTitle = res.body.includes(item.expectedTitle)
      const hasDir = item.expectedDir ? res.body.includes(`dir="${item.expectedDir}"`) : true
      const pass = is200 && hasTitle && hasDir
      recordResult('routes', `R2: ${item.path}`, pass, {
        status: res.status,
        hasTitle,
        hasDir,
        expectedTitle: item.expectedTitle
      })
      console.log(`[${pass ? 'PASS' : 'FAIL'}] ${item.path} -> Status ${res.status}, hasTitle: ${hasTitle}, hasDir: ${hasDir}`)
    } catch (e) {
      recordResult('routes', `R2: ${item.path}`, false, { error: e.message })
      console.log(`[FAIL] ${item.path} -> Error: ${e.message}`)
    }
  }

  // Redirect tests
  const redirectTests = [
    { path: '/ar/privacy-policy', expectedLocation: '/privacy-policy?locale=ar' },
    { path: '/en/terms', expectedLocation: '/terms?locale=en' },
    { path: '/he/return-policy', expectedLocation: '/return-policy?locale=he' },
    { path: '/terms-ar', expectedLocation: '/terms?locale=ar' },
    { path: '/return-policy-en', expectedLocation: '/return-policy?locale=en' },
    { path: '/ar/terms-conditions', expectedLocation: '/terms?locale=ar' },
    { path: '/ar/refund-and-returns', expectedLocation: '/return-policy?locale=ar' },
    { path: '/en/refund-and-returns', expectedLocation: '/return-policy?locale=en' },
    { path: '/he/refund_returns', expectedLocation: '/return-policy?locale=he' },
  ]

  for (const item of redirectTests) {
    try {
      const res = await fetchRoute(item.path, false)
      const isRedirect = [301, 302, 307, 308].includes(res.status)
      const matchLoc = res.location === item.expectedLocation
      const pass = isRedirect && matchLoc
      recordResult('routes', `Redirect: ${item.path}`, pass, {
        status: res.status,
        location: res.location,
        expected: item.expectedLocation
      })
      console.log(`[${pass ? 'PASS' : 'FAIL'}] Redirect ${item.path} -> Status ${res.status}, Loc: ${res.location}`)
    } catch (e) {
      recordResult('routes', `Redirect: ${item.path}`, false, { error: e.message })
      console.log(`[FAIL] Redirect ${item.path} -> Error: ${e.message}`)
    }
  }
}

async function waitForServer(url, timeoutMs = 45000) {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(`${url}/api/ready-check`).catch(() => fetch(`${url}/`))
      if (res.status >= 200 && res.status < 500) return true
    } catch {}
    await new Promise(r => setTimeout(r, 1000))
  }
  return false
}

async function main() {
  await testGraphQL()

  console.log('\n=== Starting Next.js Production/Test Server on port ' + PORT + ' ===')
  const server = spawn('cmd.exe', ['/c', `npx next start -p ${PORT}`], {
    cwd: process.cwd(),
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: false
  })

  server.stdout.on('data', d => process.stdout.write(`[SERVER] ${d}`))
  server.stderr.on('data', d => process.stderr.write(`[SERVER ERR] ${d}`))

  const ready = await waitForServer(BASE_URL)
  if (!ready) {
    console.error('Server failed to start within timeout!')
    server.kill()
    process.exit(1)
  }
  console.log('Server is ready on port ' + PORT)

  try {
    await testRoutes()
  } finally {
    console.log('\nStopping server...')
    server.kill('SIGTERM')
    try {
      spawn('cmd.exe', ['/c', `taskkill /pid ${server.pid} /T /F`])
    } catch {}
  }

  console.log('\n=========================================')
  console.log('AUDIT TEST SUMMARY:')
  console.log(`Total: ${results.summary.total} | Passed: ${results.summary.passed} | Failed: ${results.summary.failed}`)
  console.log('=========================================')

  if (results.summary.failed > 0) {
    process.exit(1)
  }
}

main().catch(err => {
  console.error('Audit test failed with uncaught error:', err)
  process.exit(1)
})
