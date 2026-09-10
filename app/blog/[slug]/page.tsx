import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getPost, getRelatedPosts } from '@/lib/content/posts'
import { BlogArticle } from '@/components/blog-article'
import { getPublicMetadata } from '@/lib/content/metadata'
import { getRequestLocale } from '@/lib/i18n/request-locale'


export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const post = await getPost(slug)
  if (!post) return { title: 'Article not found | ALI FLEET' }

  const locale = await getRequestLocale()
  const title = locale === 'ar' ? post.titleAr : locale === 'he' ? post.titleHe : post.titleEn
  const description = locale === 'ar' ? post.excerptAr : locale === 'he' ? post.excerptHe : post.excerptEn
  return getPublicMetadata({
    entityType: 'blog',
    entityId: slug,
    locale,
    fallback: {
      title: `${title} | ALI FLEET`,
      description,
      path: `/blog/${slug}`,
      image: post.coverImage,
      type: 'article',
      publishedTime: post.publishedAt,
    },
  })
}

export default async function BlogArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const post = await getPost(slug)
  if (!post) notFound()

  const related = await getRelatedPosts(post)

  return <BlogArticle post={post} related={related} />
}
