import { Contact } from './types';

export const mockContacts: Contact[] = [
  {
    id: '1',
    name: 'Sarah Chen',
    title: 'Product Manager',
    company: 'TechCorp Inc.',
    summary: 'Experienced product manager with a focus on AI/ML products. Previously led teams at major tech companies. Interested in mentorship and product strategy.',
    detailedSummary: `Product leader with 10+ years of experience building AI/ML products at scale. Currently leading the machine learning platform team at TechCorp, focusing on making AI accessible to enterprise customers.

Previously led product teams at major tech companies, where I launched several successful ML-powered features used by millions of users daily. I have a strong technical background (MS in Computer Science) combined with business acumen (MBA from Stanford).

I am passionate about mentoring aspiring product managers and sharing insights about building AI products responsibly. Regular speaker at product management conferences and active in various PM communities.`,
    imageUrl: '/placeholder-avatar.svg',
    email: 'sarah.chen@example.com',
    lastContact: '2024-03-15',
    introsSought: [
      {
        title: 'AI/ML Engineering Leaders',
        description: 'Looking to connect with technical leaders in AI/ML space, particularly those working on large language models and generative AI.',
      },
      {
        title: 'Enterprise SaaS Founders',
        description: 'Interested in meeting founders building enterprise SaaS products, especially those incorporating AI capabilities.',
      },
      {
        title: 'Product Leaders in AI Ethics',
        description: 'Seeking connections with product leaders focused on ethical AI development and responsible AI practices.',
      },
    ],
    reasonsToIntroduce: [
      {
        title: 'Product Management Mentorship',
        description: 'Experienced in mentoring early to mid-career PMs, particularly those transitioning into AI/ML product roles.',
      },
      {
        title: 'AI Product Strategy',
        description: 'Can provide guidance on AI product strategy, go-to-market planning, and building ML-powered features.',
      },
      {
        title: 'Speaking Engagements',
        description: 'Available for speaking engagements about product management, AI/ML products, and women in tech leadership.',
      },
    ],
  },
  {
    id: '2',
    name: 'Marcus Johnson',
    title: 'VP of Engineering',
    company: 'InnovateSoft',
    summary: 'Technical leader with 15+ years of experience in scaling engineering teams. Expert in distributed systems and cloud architecture.',
    detailedSummary: `Engineering leader with a track record of building and scaling high-performing engineering teams. Currently VP of Engineering at InnovateSoft, where I oversee a team of 150+ engineers across multiple product lines.

Specialized in distributed systems, cloud architecture, and engineering organization design. Led the technical transformation of InnovateSoft's platform from monolith to microservices, resulting in 99.99% uptime and 70% improvement in deployment frequency.

Strong advocate for engineering excellence, mentorship, and fostering inclusive engineering cultures. Regular contributor to engineering blogs and speaker at technical conferences.`,
    imageUrl: '/placeholder-avatar.svg',
    email: 'marcus.j@example.com',
    lastContact: '2024-03-10',
    introsSought: [
      {
        title: 'Engineering Leaders',
        description: 'Looking to connect with other VPs of Engineering and CTOs, particularly those scaling teams from 100 to 500+ engineers.',
      },
      {
        title: 'Cloud Architecture Experts',
        description: 'Interested in networking with architects experienced in large-scale distributed systems and cloud-native architectures.',
      },
      {
        title: 'DevOps Leaders',
        description: 'Seeking connections with leaders in DevOps and platform engineering to exchange best practices.',
      },
    ],
    reasonsToIntroduce: [
      {
        title: 'Engineering Leadership Mentorship',
        description: 'Can mentor engineering managers and directors transitioning to senior leadership roles.',
      },
      {
        title: 'Technical Architecture Review',
        description: 'Available for architecture reviews and consulting on scaling distributed systems.',
      },
      {
        title: 'Team Structure & Organization',
        description: 'Can advise on engineering org design, team structure, and scaling engineering culture.',
      },
    ],
  },
  {
    id: '3',
    name: 'Elena Rodriguez',
    title: 'Startup Founder',
    company: 'GreenTech Solutions',
    summary: 'Serial entrepreneur focused on sustainability and clean tech. Currently building solutions for renewable energy optimization.',
    detailedSummary: `Founder and CEO of GreenTech Solutions, where we are building AI-powered software for optimizing renewable energy systems. Previously founded and successfully exited CleanData (acquired by EnergyCorp for $50M).

Passionate about leveraging technology to accelerate the transition to sustainable energy. Our current focus is on developing machine learning models that improve solar and wind farm efficiency by 30-40%.

Active angel investor in climate tech startups, having invested in 15+ companies. Regular speaker at sustainability and tech conferences.`,
    imageUrl: '/placeholder-avatar.svg',
    email: 'elena@example.com',
    lastContact: '2024-03-01',
    introsSought: [
      {
        title: 'Climate Tech Investors',
        description: 'Looking to connect with VCs and angels focused on climate tech and sustainable energy investments.',
      },
      {
        title: 'Renewable Energy Experts',
        description: 'Seeking introductions to technical experts in solar and wind energy systems.',
      },
      {
        title: 'Enterprise Sales Leaders',
        description: 'Interested in meeting experienced enterprise sales leaders in the energy sector.',
      },
    ],
    reasonsToIntroduce: [
      {
        title: 'Startup Mentorship',
        description: 'Can mentor early-stage founders, particularly in climate tech and sustainability space.',
      },
      {
        title: 'Fundraising Strategy',
        description: 'Can advise on fundraising strategy and investor relationships in climate tech.',
      },
      {
        title: 'Climate Tech Connections',
        description: 'Access to network of climate tech investors, founders, and industry experts.',
      },
    ],
  },
  {
    id: '4',
    name: 'David Kim',
    title: 'Investment Director',
    company: 'Venture Capital Partners',
    summary: 'Experienced VC focusing on early-stage B2B SaaS investments. Previously founded and sold a marketing automation company.',
    detailedSummary: `Investment Director at Venture Capital Partners, leading our B2B SaaS investment strategy. Managing a portfolio of 20+ companies with $200M+ in investments. Previously founded MarketFlow (acquired by HubSpot).

Specialized in early-stage B2B SaaS investments, particularly in companies leveraging AI/ML, vertical SaaS, and developer tools. Strong focus on go-to-market strategy and helping portfolio companies scale from $1M to $10M+ ARR.

Active mentor in several accelerator programs and regular speaker on SaaS metrics, fundraising, and startup scaling.`,
    imageUrl: '/placeholder-avatar.svg',
    email: 'david.kim@example.com',
    lastContact: '2024-02-28',
    introsSought: [
      {
        title: 'B2B SaaS Founders',
        description: 'Always looking to meet founders building innovative B2B SaaS products, particularly in AI/ML, vertical SaaS, or developer tools.',
      },
      {
        title: 'Enterprise Sales Leaders',
        description: 'Interested in connecting with experienced enterprise sales leaders for portfolio company advisory roles.',
      },
      {
        title: 'Product Leaders',
        description: 'Seeking introductions to product leaders with experience scaling B2B products.',
      },
    ],
    reasonsToIntroduce: [
      {
        title: 'Fundraising Advice',
        description: 'Can provide guidance on fundraising strategy, pitch deck review, and investor introductions.',
      },
      {
        title: 'Go-to-Market Strategy',
        description: 'Experienced in B2B SaaS go-to-market strategy and scaling sales operations.',
      },
      {
        title: 'Board Member/Advisor',
        description: 'Available for board or advisory roles for B2B SaaS companies.',
      },
    ],
  },
]; 