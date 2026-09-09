import 'server-only'

import type { BlogPost } from '@/lib/data/blog'
import { postToBlogPost } from './adapters'
import { getSiteContent } from './repository'

export type PostsStatus = 'ok' | 'empty'
export type PostList = {
  posts: BlogPost[]
  featured: BlogPost | null
  status: PostsStatus
}

export async function getPosts(): Promise<PostList> {
  const posts = getSiteContent().blog
    .filter((post) => post.published !== false)
    .map(postToBlogPost)
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
  return {
    posts,
    featured: posts.find((post) => post.featured) || posts[0] || null,
    status: posts.length ? 'ok' : 'empty',
  }
}

export async function getPost(
  slug: string
): Promise<(BlogPost & { content: string }) | null> {
  const post = getSiteContent().blog.find(
    (item) => (item.slug || item.id) === slug && item.published !== false
  )
  if (!post) return null
  const mapped = postToBlogPost(post)
  const content = post.content?.en || post.content?.ar || post.content?.he || ''
  return { ...mapped, content }
}

export async function getRelatedPosts(
  post: BlogPost,
  limit = 3
): Promise<BlogPost[]> {
  const { posts } = await getPosts()
  const others = posts.filter((item) => item.slug !== post.slug)
  return [
    ...others.filter((item) => item.category === post.category),
    ...others.filter((item) => item.category !== post.category),
  ].slice(0, limit)
}
