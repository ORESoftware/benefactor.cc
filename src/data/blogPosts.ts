export interface BlogPostMeta {
  slug: string;
  title: string;
  description: string;
  date: string;
  author: string;
  readTime: string;
  category: string;
  tags: string[];
}

export const blogPosts: BlogPostMeta[] = [
  {
    slug: 'founder-led-b2b-sites-that-stop-leaking-pipeline',
    title: 'How Founder-Led B2B Sites Stop Leaking Pipeline',
    description:
      'A practical guide to fixing the common gaps between traffic, messaging, qualification, and follow-up so a B2B site starts producing real sales conversations.',
    date: '2026-04-21',
    author: 'Benefactor Marketing',
    readTime: '6 min read',
    category: 'B2B Growth',
    tags: ['b2b-marketing', 'conversion', 'website-strategy', 'pipeline'],
  },
  {
    slug: 'search-intent-mapping-for-lower-cac',
    title: 'Search Intent Mapping for Lower CAC',
    description:
      'Why most teams overspend on search, how to restructure content and paid search around intent, and what to measure if you want lower acquisition cost.',
    date: '2026-04-20',
    author: 'Benefactor Marketing',
    readTime: '7 min read',
    category: 'Search Strategy',
    tags: ['seo', 'sem', 'customer-acquisition', 'intent'],
  },
  {
    slug: 'automation-that-makes-marketing-more-human',
    title: 'Automation That Makes Marketing More Human',
    description:
      'The best automation does not feel robotic. It reduces lag, preserves context, and helps teams follow up at the right moment with the right message.',
    date: '2026-04-19',
    author: 'Benefactor Marketing',
    readTime: '8 min read',
    category: 'Automation',
    tags: ['automation', 'crm', 'lifecycle-marketing', 'operations'],
  },
];

export function getBlogPostMeta(slug: string): BlogPostMeta {
  const post = blogPosts.find((entry) => entry.slug === slug);

  if (!post) {
    throw new Error(`Unknown blog post slug: ${slug}`);
  }

  return post;
}
