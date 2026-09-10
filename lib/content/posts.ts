import 'server-only'

import type { BlogPost } from '@/lib/data/blog'
import { postToBlogPost } from './adapters'
import { getPublicPosts } from './public-database'

export type PostsStatus = 'ok' | 'empty'
export type PostList = { posts: BlogPost[]; featured: BlogPost | null; status: PostsStatus }

export async function getPosts(): Promise<PostList> {
  const posts = (await getPublicPosts())
    .map(postToBlogPost)
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
  return {
    posts,
    featured: posts.find((post) => post.featured) || posts[0] || null,
    status: posts.length ? 'ok' : 'empty',
  }
}

export async function getPost(slug: string): Promise<(BlogPost & { content: string }) | null> {
  const post = (await getPublicPosts()).find((item) => item.slug === slug)
  if (!post) return null
  const mapped = postToBlogPost(post)
  return { ...mapped, content: post.content?.en || post.content?.ar || post.content?.he || '' }
}

export async function getRelatedPosts(post: BlogPost, limit = 3): Promise<BlogPost[]> {
  const { posts } = await getPosts()
  const others = posts.filter((item) => item.slug !== post.slug)
  return [
    ...others.filter((item) => item.category === post.category),
    ...others.filter((item) => item.category !== post.category),
  ].slice(0, limit)
}
