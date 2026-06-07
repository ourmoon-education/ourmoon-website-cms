import { getPayload } from 'payload'
import config from '@payload-config'

const seed = async () => {
  const payload = await getPayload({ config })

  const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@ourmoon.org.uk'
  const adminPassword = process.env.SEED_ADMIN_PASSWORD

  if (!adminPassword) {
    throw new Error('SEED_ADMIN_PASSWORD env var is required')
  }

  // Create admin user
  const existing = await payload.find({
    collection: 'users',
    where: { email: { equals: adminEmail } },
  })

  if (existing.totalDocs === 0) {
    await payload.create({
      collection: 'users',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: { email: adminEmail, password: adminPassword, role: 'admin' } as any,
    })
    payload.logger.info(`✅ Admin user created: ${adminEmail}`)
  } else {
    payload.logger.info(`ℹ️ Admin user already exists: ${adminEmail}`)
  }

  // Seed a Programme
  const programmes = await payload.find({ collection: 'programmes', limit: 1 })
  if (programmes.totalDocs === 0) {
    await payload.create({
      collection: 'programmes',
      data: {
        title: 'Young Scientists: Introduction to Space',
        slug: 'young-scientists-introduction-to-space',
        status: 'published',
        shortDescription:
          'An exciting 6-week programme exploring our solar system, stars, and the science of space exploration.',
        ageRange: '8–12 years',
        duration: '6 weeks · 2 hours per session',
        publishedDate: new Date().toISOString(),
      },
    })
    payload.logger.info('✅ Sample programme created')
  }

  // Seed a Blog Post
  const blogPosts = await payload.find({ collection: 'blog-posts', limit: 1 })
  if (blogPosts.totalDocs === 0) {
    await payload.create({
      collection: 'blog-posts',
      data: {
        title: 'Why Space Education Matters for Every Child',
        slug: 'why-space-education-matters',
        status: 'published',
        author: 'OurMoon Education Team',
        excerpt:
          'Space science isn\'t just for future astronauts — it teaches critical thinking, maths, and wonder that benefit every young learner.',
        publishedDate: new Date().toISOString(),
        tags: [{ tag: 'education' }, { tag: 'space' }, { tag: 'stem' }],
      },
    })
    payload.logger.info('✅ Sample blog post created')
  }

  // Seed an Event
  const events = await payload.find({ collection: 'events', limit: 1 })
  if (events.totalDocs === 0) {
    const nextMonth = new Date()
    nextMonth.setMonth(nextMonth.getMonth() + 1)
    await payload.create({
      collection: 'events',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: {
        title: 'Open Day: Discover OurMoon Education',
        slug: 'open-day-discover-ourmoon',
        status: 'published',
        startDate: nextMonth.toISOString(),
        location: 'OurMoon Learning Centre, London',
        isOnline: false,
        registrationLink: 'https://ourmoon.org.uk/events/open-day',
        publishedDate: new Date().toISOString(),
      } as any,
    })
    payload.logger.info('✅ Sample event created')
  }

  // Seed a Student Story
  const stories = await payload.find({ collection: 'student-stories', limit: 1 })
  if (stories.totalDocs === 0) {
    await payload.create({
      collection: 'student-stories',
      data: {
        studentName: 'Amara T.',
        status: 'published',
        featured: true,
        shortQuote:
          "OurMoon didn't just teach me about space — it taught me how to think like a scientist.",
      },
    })
    payload.logger.info('✅ Sample student story created')
  }

  // Seed Site Settings
  await payload.updateGlobal({
    slug: 'site-settings',
    data: {
      siteName: 'OurMoon Education',
      tagline: 'Inspiring the next generation of scientists',
      contactEmail: 'hello@ourmoon.org.uk',
      heroHeadline: 'Where Curiosity Meets the Stars',
      heroSubheadline: 'Engaging science education for young minds aged 7–18.',
    },
  })
  payload.logger.info('✅ Site settings seeded')

  payload.logger.info('🌙 Seed complete!')
  process.exit(0)
}

void seed()
