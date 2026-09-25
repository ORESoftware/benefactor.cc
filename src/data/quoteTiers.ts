export const quoteTiers = [
  {
    id: 'diagnostic',
    name: 'Diagnostic Sprint',
    price: '$1,500',
    cadence: 'one-time',
    delivery: '1 week',
    description: 'Find the highest-leverage leaks before committing to a retainer.',
    includes: [
      'Search, conversion, automation, and lead-flow audit',
      'Measurement and attribution sanity check',
      'Prioritized 30-day opportunity map',
      '60-minute readout with owners and next steps',
    ],
  },
  {
    id: 'launch',
    name: 'Launch',
    price: '$3,000',
    cadence: '/ month',
    delivery: '1 active workstream',
    description: 'A focused delivery lane for a founder-led team that needs steady shipping.',
    includes: [
      'One active growth workstream at a time',
      'Landing-page, local SEO, or funnel improvements',
      'Lead routing and follow-up automation',
      'Monthly planning and performance review',
    ],
  },
  {
    id: 'build',
    name: 'Build',
    price: '$6,000',
    cadence: '/ month',
    delivery: '2 concurrent workstreams',
    description: 'Move acquisition and conversion forward together with biweekly delivery.',
    includes: [
      'Two concurrent growth workstreams',
      'Search, content, paid, lifecycle, and automation execution',
      'Biweekly shipping and experiment review',
      'Shared KPI and pipeline reporting',
    ],
  },
  {
    id: 'scale',
    name: 'Scale',
    price: '$12,000',
    cadence: '/ month',
    delivery: '3–4 concurrent workstreams',
    description: 'A multi-channel delivery pod for teams that already have signal and need throughput.',
    includes: [
      'Three to four concurrent workstreams',
      'Weekly shipping cadence',
      'Acquisition, CRO, lifecycle, automation, and analytics',
      'Priority response and executive growth review',
    ],
  },
  {
    id: 'embedded',
    name: 'Embedded',
    price: '$20,000',
    cadence: '/ month',
    delivery: 'embedded cross-functional pod',
    description: 'Operate as an embedded growth and delivery team with a custom operating cadence.',
    includes: [
      'Four or more coordinated workstreams',
      'Embedded strategy, engineering, creative, and automation support',
      'Weekly executive operating cadence',
      'Custom SLA, roadmap, and handoff model',
    ],
  },
] as const;

export type QuoteTierId = (typeof quoteTiers)[number]['id'];
