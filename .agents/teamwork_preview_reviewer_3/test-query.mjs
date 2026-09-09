const query = `
  query AliFleetVerification {
    privacy_ar: page(id: "privacy-policy-ar", idType: URI) { databaseId title slug }
    privacy_en: page(id: "privacy-policy-en", idType: URI) { databaseId title slug }
    privacy_he: page(id: "privacy-policy-he", idType: URI) { databaseId title slug }
    terms_ar: page(id: "terms-ar", idType: URI) { databaseId title slug }
    terms_en: page(id: "terms-en", idType: URI) { databaseId title slug }
    terms_he: page(id: "terms-he", idType: URI) { databaseId title slug }
    return_ar: page(id: "return-policy-ar", idType: URI) { databaseId title slug }
    return_en: page(id: "return-policy-en", idType: URI) { databaseId title slug }
    return_he: page(id: "return-policy-he", idType: URI) { databaseId title slug }
  }
`

async function test() {
  const res = await fetch('https://a-f.site/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  })
  console.log('HTTP Status:', res.status)
  const data = await res.json()
  console.log('Result:', JSON.stringify(data, null, 2))
}

test().catch(console.error)
