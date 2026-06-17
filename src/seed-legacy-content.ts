import { getPayload } from 'payload'
import configPromise from './payload.config'

async function seedLegacyContent() {
  const payload = await getPayload({ config: configPromise })

  console.log('Seeding legacy programmes...')

  const programmes = [
    { title: 'Young Leaders Programme', slug: 'young-leaders-programme' },
    { title: 'Identity & Expression Programme', slug: 'identity-and-expression-programme' },
    { title: 'Post-Graduate Programme', slug: 'post-graduate-programme' },
    { title: 'Alumni Programme', slug: 'alumni-programme' },
    { title: 'Value Added Volunteering', slug: 'value-added-volunteering' },
  ]

  for (const prog of programmes) {
    const existing = await payload.find({
      collection: 'programmes',
      where: { slug: { equals: prog.slug } },
    })

    if (existing.totalDocs === 0) {
      await payload.create({
        collection: 'programmes',
        data: {
          title: prog.title,
          slug: prog.slug,
          status: 'published',
          publishedDate: new Date().toISOString(),
          shortDescription: `Information about the ${prog.title}.`,
          description: {
            root: {
              type: 'root',
              children: [
                {
                  type: 'paragraph',
                  children: [{ text: `Welcome to the ${prog.title}. Stay tuned for more details!`, type: 'text' }],
                },
              ],
              direction: 'ltr',
              format: 'left',
              indent: 0,
              version: 1,
            },
          },
        },
      })
      console.log(`Created programme: ${prog.title}`)
    } else {
      console.log(`Programme already exists: ${prog.title}`)
    }
  }

  console.log('Seeding legacy events...')
  const events = [
    { title: 'Upcoming Open Day', slug: 'upcoming-open-day', startDate: new Date().toISOString() },
  ]

  for (const event of events) {
    const existing = await payload.find({
      collection: 'events',
      where: { slug: { equals: event.slug } },
    })

    if (existing.totalDocs === 0) {
      await payload.create({
        collection: 'events',
        data: {
          title: event.title,
          slug: event.slug,
          status: 'published',
          publishedDate: new Date().toISOString(),
          startDate: event.startDate,
          eventType: 'online',
          description: {
            root: {
              type: 'root',
              children: [
                {
                  type: 'paragraph',
                  children: [{ text: 'Join us for our upcoming event!', type: 'text' }],
                },
              ],
              direction: 'ltr',
              format: 'left',
              indent: 0,
              version: 1,
            },
          },
        },
      })
      console.log(`Created event: ${event.title}`)
    } else {
      console.log(`Event already exists: ${event.title}`)
    }
  }

  console.log('Seeding student stories...')
  const stories = [
    { title: 'Alumni Spotlight: John Doe', slug: 'alumni-spotlight-john-doe', studentName: 'John Doe', studentRole: 'Alumnus', status: 'published' as const },
    { title: 'A Day in the Life: Jane Smith', slug: 'day-in-the-life-jane-smith', studentName: 'Jane Smith', studentRole: 'Student', status: 'published' as const },
  ]

  for (const story of stories) {
    const existing = await payload.find({
      collection: 'student-stories',
      where: { slug: { equals: story.slug } },
    })

    if (existing.totalDocs === 0) {
      await payload.create({
        collection: 'student-stories',
        data: {
          title: story.title,
          slug: story.slug,
          status: story.status,
          publishedDate: new Date().toISOString(),
          studentName: story.studentName,
          studentRole: story.studentRole,
          story: {
            root: {
              type: 'root',
              children: [
                {
                  type: 'paragraph',
                  children: [{ text: `Read about ${story.studentName}'s journey.`, type: 'text' }],
                },
              ],
              direction: 'ltr',
              format: 'left',
              indent: 0,
              version: 1,
            },
          },
        },
      })
      console.log(`Created student story: ${story.title}`)
    } else {
      console.log(`Student story already exists: ${story.title}`)
    }
  }

  console.log('Finished seeding legacy content!')
  process.exit(0)
}

seedLegacyContent().catch((err) => {
  console.error('Seed error:', err)
  process.exit(1)
})
