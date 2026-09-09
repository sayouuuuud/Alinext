const WP_POLICY_GRAPHQL_ENDPOINT = 'https://a-f.site/graphql'

const queries = {
  privacy: `
    query {
      ar: page(id: "privacy-policy-ar", idType: URI) { databaseId title slug uri content }
      en: page(id: "privacy-policy-en", idType: URI) { databaseId title slug uri content }
      he: page(id: "privacy-policy-he", idType: URI) { databaseId title slug uri content }
    }
  `,
  terms: `
    query {
      ar: page(id: "terms-ar", idType: URI) { databaseId title slug uri content }
      en: page(id: "terms-en", idType: URI) { databaseId title slug uri content }
      he: page(id: "terms-he", idType: URI) { databaseId title slug uri content }
    }
  `,
  return: `
    query {
      ar: page(id: "return-policy-ar", idType: URI) { databaseId title slug uri content }
      en: page(id: "return-policy-en", idType: URI) { databaseId title slug uri content }
      he: page(id: "return-policy-he", idType: URI) { databaseId title slug uri content }
    }
  `,
  refund_returns: `
    query {
      page(id: "refund_returns", idType: URI) { databaseId title slug uri content }
    }
  `
}

async function run() {
  for (const [key, query] of Object.entries(queries)) {
    const res = await fetch(WP_POLICY_GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    })
    const json = await res.json()
    console.log(`\n=== Result for ${key} (HTTP ${res.status}) ===`)
    if (json.errors) {
      console.error('Errors:', json.errors)
    } else {
      for (const [lang, val] of Object.entries(json.data)) {
        if (val) {
          console.log(`- [${lang}] title: "${val.title}", slug: "${val.slug}", id: ${val.databaseId}, contentLength: ${val.content?.length}`)
        } else {
          console.log(`- [${lang}] NULL!`)
        }
      }
    }
  }
}

run()
