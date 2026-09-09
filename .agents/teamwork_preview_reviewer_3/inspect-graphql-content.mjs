const query = `
  query AliFleetAllPolicies {
    privacy_ar: page(id: "privacy-policy-ar", idType: URI) { databaseId title slug uri content }
    privacy_en: page(id: "privacy-policy-en", idType: URI) { databaseId title slug uri content }
    privacy_he: page(id: "privacy-policy-he", idType: URI) { databaseId title slug uri content }
    terms_ar: page(id: "terms-ar", idType: URI) { databaseId title slug uri content }
    terms_en: page(id: "terms-en", idType: URI) { databaseId title slug uri content }
    terms_he: page(id: "terms-he", idType: URI) { databaseId title slug uri content }
    return_ar: page(id: "return-policy-ar", idType: URI) { databaseId title slug uri content }
    return_en: page(id: "return-policy-en", idType: URI) { databaseId title slug uri content }
    return_he: page(id: "return-policy-he", idType: URI) { databaseId title slug uri content }
    refund_returns: page(id: "refund_returns", idType: URI) { databaseId title slug uri content }
  }
`

async function check() {
  const res = await fetch('https://a-f.site/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  })
  const json = await res.json()
  for (const [key, val] of Object.entries(json.data)) {
    console.log(`Key: ${key}`)
    console.log(`  title: ${val?.title}`)
    console.log(`  slug: ${val?.slug}`)
    console.log(`  uri: ${val?.uri}`)
    console.log(`  content length: ${val?.content?.length}`)
    console.log(`  content snippet: ${val?.content?.slice(0, 100).replace(/\n/g, ' ')}...`)
  }
}

check().catch(console.error)
