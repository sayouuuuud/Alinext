import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const email = (process.env.ADMIN_DEMO_EMAIL || 'admin@test.com').trim().toLowerCase()
const password = process.env.ADMIN_DEMO_PASSWORD

if (!url || !serviceRoleKey) throw new Error('Supabase environment variables are required')
if (process.env.ALLOW_DEMO_ADMIN !== 'true') throw new Error('Set ALLOW_DEMO_ADMIN=true for an explicit preview-only bootstrap')
if (!password) throw new Error('ADMIN_DEMO_PASSWORD must be passed at execution time')
if (process.env.VERCEL_ENV === 'production' || process.env.NODE_ENV === 'production') {
  throw new Error('Demo administrator bootstrap is blocked in production')
}

const supabase = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const { data: usersData, error: listError } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 })
if (listError) throw listError
let user = usersData.users.find((candidate) => candidate.email?.toLowerCase() === email)

if (!user) {
  const result = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { display_name: 'Demo Administrator', preferred_locale: 'ar' },
  })
  if (result.error) throw result.error
  user = result.data.user
} else {
  const result = await supabase.auth.admin.updateUserById(user.id, {
    password,
    email_confirm: true,
    user_metadata: { ...user.user_metadata, display_name: 'Demo Administrator', preferred_locale: 'ar' },
  })
  if (result.error) throw result.error
  user = result.data.user
}

const { error: membershipError } = await supabase.from('admin_memberships').upsert({
  user_id: user.id,
  role: 'owner',
  active: true,
  demo_only: true,
  must_change_password: true,
  mfa_required: true,
})
if (membershipError) throw membershipError

console.log(`Preview-only administrator ready: ${email}`)
