import 'server-only'

import { createAdminClient } from '@/lib/supabase/server'

export type AdminDashboardSummary = {
  cars: { total: number; available: number; reserved: number; sold: number; incoming: number; value: number }
  products: { total: number; inStock: number; outOfStock: number }
  categories: { total: number; main: number; sub: number }
  blog: { total: number; published: number }
  orders: { total: number; pending: number; processing: number; completed: number; revenue: number; average: number }
  inquiries: { total: number; new: number; resolved: number }
  customers: number
  generatedAt: string
}

function countOf(result: { count: number | null; error: unknown }, label: string) {
  if (result.error) throw new Error(`dashboard_count_failed:${label}`)
  return result.count || 0
}

export async function getAdminDashboardSummary(): Promise<AdminDashboardSummary> {
  const admin = createAdminClient()
  const [
    carsResult,
    availableCars,
    reservedCars,
    soldCars,
    incomingCars,
    carValues,
    productsResult,
    inStockProducts,
    outOfStockProducts,
    categoriesResult,
    mainCategories,
    subCategories,
    blogResult,
    publishedBlog,
    ordersResult,
    pendingOrders,
    processingOrders,
    completedOrders,
    orderTotals,
    inquiriesResult,
    newInquiries,
    resolvedInquiries,
    profilesResult,
    membershipsResult,
  ] = await Promise.all([
    admin.from('cars').select('*', { count: 'exact', head: true }).is('archived_at', null).eq('published', true),
    admin.from('cars').select('*', { count: 'exact', head: true }).is('archived_at', null).eq('published', true).eq('status', 'available'),
    admin.from('cars').select('*', { count: 'exact', head: true }).is('archived_at', null).eq('published', true).eq('status', 'reserved'),
    admin.from('cars').select('*', { count: 'exact', head: true }).is('archived_at', null).eq('published', true).eq('status', 'sold'),
    admin.from('cars').select('*', { count: 'exact', head: true }).is('archived_at', null).eq('published', true).eq('status', 'incoming'),
    admin.from('cars').select('price_minor').is('archived_at', null).eq('published', true),
    admin.from('products').select('*', { count: 'exact', head: true }).is('archived_at', null).eq('published', true),
    admin.from('products').select('*', { count: 'exact', head: true }).is('archived_at', null).eq('published', true).gt('stock_quantity', 0),
    admin.from('products').select('*', { count: 'exact', head: true }).is('archived_at', null).eq('published', true).eq('stock_quantity', 0),
    admin.from('categories').select('*', { count: 'exact', head: true }).eq('is_active', true),
    admin.from('categories').select('*', { count: 'exact', head: true }).eq('is_active', true).is('parent_id', null),
    admin.from('categories').select('*', { count: 'exact', head: true }).eq('is_active', true).not('parent_id', 'is', null),
    admin.from('blog_posts').select('*', { count: 'exact', head: true }),
    admin.from('blog_posts').select('*', { count: 'exact', head: true }).eq('published', true),
    admin.from('orders').select('*', { count: 'exact', head: true }).is('archived_at', null),
    admin.from('orders').select('*', { count: 'exact', head: true }).is('archived_at', null).eq('status', 'pending'),
    admin.from('orders').select('*', { count: 'exact', head: true }).is('archived_at', null).eq('status', 'processing'),
    admin.from('orders').select('*', { count: 'exact', head: true }).is('archived_at', null).in('status', ['delivered', 'completed']),
    admin.from('orders').select('total_minor').is('archived_at', null).eq('payment_status', 'paid').neq('status', 'cancelled'),
    admin.from('inquiries').select('*', { count: 'exact', head: true }),
    admin.from('inquiries').select('*', { count: 'exact', head: true }).eq('status', 'new'),
    admin.from('inquiries').select('*', { count: 'exact', head: true }).eq('status', 'resolved'),
    admin.from('profiles').select('id'),
    admin.from('admin_memberships').select('user_id').eq('active', true),
  ])

  const countResults = [carsResult, availableCars, reservedCars, soldCars, incomingCars, productsResult, inStockProducts, outOfStockProducts, categoriesResult, mainCategories, subCategories, blogResult, publishedBlog, ordersResult, pendingOrders, processingOrders, completedOrders, inquiriesResult, newInquiries, resolvedInquiries]
  if (countResults.some((result) => result.error) || carValues.error || orderTotals.error || profilesResult.error || membershipsResult.error) {
    throw new Error('dashboard_summary_unavailable')
  }

  const totalRevenueMinor = (orderTotals.data || []).reduce((sum, order) => sum + order.total_minor, 0)
  const validOrderCount = orderTotals.data?.length || 0
  const adminIds = new Set((membershipsResult.data || []).map((membership) => membership.user_id))
  const customers = (profilesResult.data || []).filter((profile) => !adminIds.has(profile.id)).length

  return {
    cars: {
      total: countOf(carsResult, 'cars'),
      available: countOf(availableCars, 'available_cars'),
      reserved: countOf(reservedCars, 'reserved_cars'),
      sold: countOf(soldCars, 'sold_cars'),
      incoming: countOf(incomingCars, 'incoming_cars'),
      value: Math.round((carValues.data || []).reduce((sum, car) => sum + (car.price_minor || 0), 0) / 100),
    },
    products: { total: countOf(productsResult, 'products'), inStock: countOf(inStockProducts, 'in_stock'), outOfStock: countOf(outOfStockProducts, 'out_of_stock') },
    categories: { total: countOf(categoriesResult, 'categories'), main: countOf(mainCategories, 'main_categories'), sub: countOf(subCategories, 'sub_categories') },
    blog: { total: countOf(blogResult, 'blog'), published: countOf(publishedBlog, 'published_blog') },
    orders: {
      total: countOf(ordersResult, 'orders'),
      pending: countOf(pendingOrders, 'pending_orders'),
      processing: countOf(processingOrders, 'processing_orders'),
      completed: countOf(completedOrders, 'completed_orders'),
      revenue: Math.round(totalRevenueMinor / 100),
      average: validOrderCount ? Math.round(totalRevenueMinor / validOrderCount / 100) : 0,
    },
    inquiries: { total: countOf(inquiriesResult, 'inquiries'), new: countOf(newInquiries, 'new_inquiries'), resolved: countOf(resolvedInquiries, 'resolved_inquiries') },
    customers,
    generatedAt: new Date().toISOString(),
  }
}
