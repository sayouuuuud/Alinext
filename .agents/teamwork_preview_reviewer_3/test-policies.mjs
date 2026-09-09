import {
  getPrivacyPolicy,
  getTermsPolicy,
  getReturnPolicy,
} from '../../lib/wp/policies.ts'

async function checkPolicies() {
  const privacy = await getPrivacyPolicy()
  console.log('Privacy ar length:', privacy.ar?.content?.length, 'title:', privacy.ar?.title)
  console.log('Privacy en length:', privacy.en?.content?.length, 'title:', privacy.en?.title)
  console.log('Privacy he length:', privacy.he?.content?.length, 'title:', privacy.he?.title)

  const terms = await getTermsPolicy()
  console.log('Terms ar length:', terms.ar?.content?.length, 'title:', terms.ar?.title)
  console.log('Terms en length:', terms.en?.content?.length, 'title:', terms.en?.title)
  console.log('Terms he length:', terms.he?.content?.length, 'title:', terms.he?.title)

  const ret = await getReturnPolicy()
  console.log('Return ar length:', ret.ar?.content?.length, 'title:', ret.ar?.title)
  console.log('Return en length:', ret.en?.content?.length, 'title:', ret.en?.title)
  console.log('Return he length:', ret.he?.content?.length, 'title:', ret.he?.title)
}

checkPolicies().catch(console.error)
