const ENDPOINT = 'https://a-f.site/graphql'

const queries = [
  { name: 'privacy-policy-ar', slug: 'privacy-policy-ar' },
  { name: 'privacy-policy-en', slug: 'privacy-policy-en' },
  { name: 'privacy-policy-he', slug: 'privacy-policy-he' },
  { name: 'terms-ar', slug: 'terms-ar' },
  { name: 'terms-en', slug: 'terms-en' },
  { name: 'terms-he', slug: 'terms-he' },
  { name: 'return-policy-ar', slug: 'return-policy-ar' },
  { name: 'return-policy-en', slug: 'return-policy-en' },
  { name: 'return-policy-he', slug: 'return-policy-he' },
  { name: 'refund_returns', slug: 'refund_returns' },
]

async function run() {
  console.log('Querying live GraphQL endpoint:', ENDPOINT)
  for (const item of queries) {
    const body = JSON.stringify({
      query: `query AliFleetTest($id: ID!) {
        page(id: $id, idType: URI) {
          databaseId
          title
          slug
          uri
          content
        }
      }`,
      variables: { id: item.slug }
    })
    try {
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body
      })
      const json = await res.json()
      if (json.errors) {
        console.log(`[-] ${item.name}: Errors ->`, json.errors.map(e => e.message).join(', '))
      } else if (json.data && json.data.page) {
        const p = json.data.page
        console.log(`[+] ${item.name}: ID=${p.databaseId}, Title="${p.title}", ContentLen=${p.content?.length || 0}`)
      } else {
        console.log(`[?] ${item.name}: page is null or missing`)
      }
    } catch (err) {
      console.error(`[!] ${item.name}: Exception ->`, err.message)
    }
  }
}

run()
