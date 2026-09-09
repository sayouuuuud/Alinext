import urllib.request
import json

url = "https://a-f.site/graphql"
query = """
query {
  products(first: 5) {
    nodes {
      name
      image {
        sourceUrl
      }
    }
  }
}
"""

req = urllib.request.Request(url, method="POST")
req.add_header('Content-Type', 'application/json')
data = json.dumps({"query": query}).encode('utf-8')

try:
    response = urllib.request.urlopen(req, data=data)
    result = response.read().decode('utf-8')
    print(json.dumps(json.loads(result), indent=2))
except Exception as e:
    print(e)
