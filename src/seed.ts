import { getPayload } from 'payload'
import config from '@payload-config'

const seed = async () => {
  const payload = await getPayload({ config })

  const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@ourmoon.org.uk'
  const adminPassword = process.env.SEED_ADMIN_PASSWORD

  if (!adminPassword) {
    throw new Error('SEED_ADMIN_PASSWORD env var is required')
  }

  // ─── Admin User ───────────────────────────────────────────────────────────
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

  // ─── Programme ───────────────────────────────────────────────────────────
  const programmes = await payload.find({ collection: 'programmes', limit: 1 })
  if (programmes.totalDocs === 0) {
    await payload.create({
      collection: 'programmes',
      data: {
        title: 'Young Leaders Programme',
        slug: 'young-leaders-programme',
        status: 'published',
        shortDescription:
          'A residential gap-year programme building academic, leadership and life skills in Zambia\'s brightest young people.',
        ageRange: '18–22 years',
        duration: '12 months',
        publishedDate: new Date().toISOString(),
      },
    })
    payload.logger.info('✅ Sample programme created')
  }

  // ─── Blog Post ────────────────────────────────────────────────────────────
  const blogPosts = await payload.find({ collection: 'blog-posts', limit: 1 })
  if (blogPosts.totalDocs === 0) {
    await payload.create({
      collection: 'blog-posts',
      data: {
        title: 'Why Education is the Most Powerful Tool for Change in Zambia',
        slug: 'why-education-is-the-most-powerful-tool',
        status: 'published',
        author: 'Our Moon Education Team',
        excerpt:
          'When a young person in Zambia receives quality education and mentorship, the ripple effect extends far beyond themselves — to their families, communities, and the nation.',
        publishedDate: new Date().toISOString(),
        tags: [{ tag: 'education' }, { tag: 'zambia' }, { tag: 'impact' }],
      },
    })
    payload.logger.info('✅ Sample blog post created')
  }

  // ─── Event ────────────────────────────────────────────────────────────────
  const events = await payload.find({ collection: 'events', limit: 1 })
  if (events.totalDocs === 0) {
    const nextMonth = new Date()
    nextMonth.setMonth(nextMonth.getMonth() + 1)
    await payload.create({
      collection: 'events',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: {
        title: 'Open Day: Discover Our Moon Education',
        slug: 'open-day-discover-our-moon',
        status: 'published',
        startDate: nextMonth.toISOString(),
        location: 'London, UK',
        isOnline: false,
        publishedDate: new Date().toISOString(),
      } as any,
    })
    payload.logger.info('✅ Sample event created')
  }

  // ─── Student Stories ─────────────────────────────────────────────────────
  const stories = await payload.find({ collection: 'student-stories', limit: 1 })
  if (stories.totalDocs === 0) {
    const storySeeds = [
      {
        studentName: 'Cathy',
        slug: 'cathy',
        shortQuote: "If I hadn't passed through Our Moon before coming to the United States, I wouldn't have the skills, knowledge, and discipline to thrive in a foreign country.",
        featured: true,
      },
      {
        studentName: 'Komani',
        slug: 'komani',
        shortQuote: 'Our Moon has helped me improve my time management skills, making it easier to juggle my workload with assignments.',
        featured: true,
      },
      {
        studentName: 'Quincy',
        slug: 'quincy',
        shortQuote: 'My hope is that I will be able to drive through sound and ethical policies that better our country.',
        featured: true,
      },
      {
        studentName: 'John',
        slug: 'john',
        shortQuote: 'My hope is that I can contribute to distributing affordable, clean and sustainable electricity across my country.',
        featured: true,
      },
    ]
    for (const story of storySeeds) {
      await payload.create({
        collection: 'student-stories',
        data: { ...story, status: 'published' },
      })
    }
    payload.logger.info('✅ Student stories created')
  }

  // ─── Team Members ─────────────────────────────────────────────────────────
  const teamMembers = await payload.find({ collection: 'team-members' as any, limit: 1 })
  if (teamMembers.totalDocs === 0) {
    const team = [
      // Zambia team
      {
        name: 'Justin Mushitu',
        role: 'Country Director',
        region: 'zambia' as const,
        order: 1,
        bio: "Justin leads Our Moon's operations in Zambia, managing partnerships, student welfare and programme delivery from the Chipansha campus.",
        status: 'published' as const,
      },
      {
        name: 'Ntasuwila Nambao',
        role: 'Programme Manager',
        region: 'zambia' as const,
        order: 2,
        bio: 'Ntasuwila coordinates the Young Leaders Programme, ensuring students receive the academic support and mentorship they need to thrive.',
        status: 'published' as const,
      },
      {
        name: 'Malama Mushitu',
        role: 'Student Welfare Officer',
        region: 'zambia' as const,
        order: 3,
        bio: 'Malama supports students through their personal development journeys, providing pastoral care and guidance throughout the programme.',
        status: 'published' as const,
      },
      // UK team
      {
        name: 'Helen Leale-Green',
        role: 'Executive Director & Co-Founder',
        region: 'uk' as const,
        order: 1,
        bio: "Helen co-founded Our Moon in 2014 and leads the organisation's strategy, fundraising, and partnerships from the UK.",
        status: 'published' as const,
      },
      {
        name: 'Richard Bowen',
        role: 'Co-Founder & Trustee',
        region: 'trustee' as const,
        order: 1,
        bio: 'Richard co-founded Our Moon alongside Helen, bringing expertise in international development and education policy.',
        status: 'published' as const,
      },
      {
        name: 'Alan Leale-Green',
        role: 'Trustee',
        region: 'trustee' as const,
        order: 2,
        bio: 'Alan provides strategic oversight and governance, ensuring Our Moon operates with the highest standards of accountability.',
        status: 'published' as const,
      },
      {
        name: 'Funmi Akinluyi',
        role: 'Trustee',
        region: 'trustee' as const,
        order: 3,
        bio: 'Funmi brings expertise in corporate partnerships and social enterprise, helping Our Moon grow its supporter base.',
        status: 'published' as const,
      },
      {
        name: 'Kim Polley',
        role: 'Trustee',
        region: 'trustee' as const,
        order: 4,
        bio: "Kim contributes her expertise in education policy and programme design to Our Moon's board.",
        status: 'published' as const,
      },
      {
        name: 'Dhruv Sarda',
        role: 'Trustee',
        region: 'trustee' as const,
        order: 5,
        bio: 'Dhruv supports Our Moon with expertise in finance and governance.',
        status: 'published' as const,
      },
    ]
    for (const member of team) {
      await payload.create({ collection: 'team-members' as any, data: member as any })
    }
    payload.logger.info('✅ Team members created')
  }

  // ─── Impact Stats ─────────────────────────────────────────────────────────
  const impactStats = await payload.find({ collection: 'impact-stats' as any, limit: 1 })
  if (impactStats.totalDocs === 0) {
    const stats = [
      { value: '200+', label: 'Young leaders trained', order: 1, status: 'published' as const },
      { value: '94%', label: 'Move to university or work', order: 2, status: 'published' as const },
      { value: '32', label: 'Global universities placed', order: 3, status: 'published' as const },
      { value: '10', label: 'Years on the ground in Zambia', order: 4, status: 'published' as const },
    ]
    for (const stat of stats) {
      await payload.create({ collection: 'impact-stats' as any, data: stat as any })
    }
    payload.logger.info('✅ Impact stats created')
  }

  // ─── Site Settings ────────────────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (payload.updateGlobal as any)({
    slug: 'site-settings',
    data: {
      siteName: 'OurMoon Education',
      tagline: 'Changing one life to change thousands',
      heroHeadline: 'Changing one life to change thousands.',
      heroSubheadline: "At Our Moon, we believe Africa's future leaders are well-educated, socially-conscious critical thinkers — proud of their heritage and ready to lead. We empower Zambia's brightest young people to meet their full potential.",
      heroVideoUrl: 'https://www.youtube.com/watch?v=yoRGCHuNj0Q',
      visionStatement: 'Social mobility that empowers African youth to drive change across the continent.',
      missionStatement: "To inspire, educate and unleash the potential of Zambia's young people to become future leaders.",
      whatWeDoCards: [
        {
          iconName: 'GraduationCap',
          iconColor: 'bg-teal text-white',
          title: 'Young Leaders Programme',
          description: 'A residential gap-year programme building academic, leadership and life skills.',
        },
        {
          iconName: 'Users',
          iconColor: 'bg-pink text-white',
          title: 'University Placement',
          description: 'Mentoring scholars into top universities at home and around the world.',
        },
        {
          iconName: 'Sparkles',
          iconColor: 'bg-lime text-teal-deep',
          title: 'Mentorship Network',
          description: 'Connecting alumni and industry leaders with the next generation of scholars.',
        },
        {
          iconName: 'Heart',
          iconColor: 'bg-blue text-white',
          title: 'Community Impact',
          description: 'Empowering returning scholars to drive change across their communities.',
        },
      ],
      navigation: [
        {
          label: 'Who We Are',
          children: [
            { label: 'About Us', href: '/who-we-are' },
            { label: 'Finance & Governance', href: '/who-we-are/finance-and-governance' },
          ],
        },
        {
          label: 'Our Work',
          children: [
            { label: 'Our Work', href: '/our-work' },
            { label: 'Impact', href: '/our-work/impact' },
            { label: 'Where We Work', href: '/our-work/where-we-work' },
          ],
        },
        {
          label: 'Programmes',
          children: [
            { label: 'All Programmes', href: '/our-programmes' },
            { label: 'Young Leaders', href: '/our-programmes/young-leaders-programme' },
            { label: 'Identity & Expression', href: '/our-programmes/identity-and-expression-programme' },
            { label: 'Postgraduate', href: '/our-programmes/post-graduate-programme' },
            { label: 'Alumni', href: '/our-programmes/alumni-programme' },
            { label: 'Value Added Volunteering', href: '/our-programmes/value-added-volunteering' },
          ],
        },
        {
          label: 'Get Involved',
          children: [
            { label: 'Ways to Help', href: '/get-involved' },
            { label: 'Donate', href: '/get-involved/donate' },
            { label: 'Gift of Choice', href: '/get-involved/donate/giftofchoice' },
            { label: 'Events', href: '/events' },
            { label: 'Partner With Us', href: '/get-involved/partner-with-us' },
          ],
        },
        { label: 'Blog', href: '/blog' },
        { label: 'Contact', href: '/get-in-touch' },
      ],
      donateUrl: '/get-involved/donate',
      footerMission: "Changing one life to change thousands. Empowering Zambia's brightest, most underserved young people to become tomorrow's leaders.",
      charityNumberUk: '1165083',
      charityNumberZambia: '101/0688/17',
      ukOffice: {
        address: 'The Coach House,\nHurstwood Lane,\nTunbridge Wells, Kent TN4 8YA',
        phone: '+44 (0)7720 287904',
        email: 'helen.leale-green@ourmoon.org.uk',
      },
      zambiaOffice: {
        address: 'Chipansha Village,\nChibombo District,\nCentral Province, Zambia',
        phone: '+260 972 221856',
        email: 'justin.mushitu@ourmoon.org.uk',
      },
      contactEmail: 'hello@ourmoon.org.uk',
      phone: '+44 (0)7720 287904',
      enthuseUrl: 'https://enthuse.com/donate/ourmoon',
      globalGivingUrl: 'https://globalgiving.org/projects/ourmoon',
      maecenataUrl: 'https://maecenata.de/donate/ourmoon',
      giftTiers: [
        { amount: '£25', title: 'Books & supplies', description: 'Equip a student with the textbooks and study materials they need for the year.' },
        { amount: '£50', title: 'A week of meals', description: 'Ensure a student on our residential campus is nourished and ready to learn.' },
        { amount: '£75', title: 'A month of meals', description: 'Four weeks of nutritious meals for one student on the Young Leaders Programme.' },
        { amount: '£150', title: 'University application support', description: 'Cover the cost of application materials, testing fees and guidance for one student.' },
        { amount: '£250', title: 'Sponsor a scholar', description: 'Make a meaningful contribution toward the full cost of one student\'s programme place.' },
        { amount: '£500', title: 'Full scholarship contribution', description: 'Cover a significant portion of the annual cost of supporting one of our students.' }
      ],
      bankTransfer: {
        accountName: 'Our Moon Education',
        sortCode: 'Please contact us',
        accountNumber: 'Please contact us',
        instructions: 'Please use your name as the reference.'
      },
      cheque: {
        payeeName: 'Our Moon Education',
        postalAddress: 'The Coach House, Hurstwood Lane, Tunbridge Wells, Kent TN4 8YA'
      },
    },
  })
  payload.logger.info('✅ Site settings seeded')

  payload.logger.info('🌙 Seed complete!')
  process.exit(0)
}

export const script = seed
