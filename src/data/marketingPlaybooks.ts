export interface MarketingPlaybook {
  readonly slug: string;
  readonly title: string;
  readonly description: string;
  readonly category: string;
  readonly outcome: string;
  readonly steps: readonly { readonly title: string; readonly actions: readonly string[] }[];
  readonly measures: readonly string[];
  readonly avoid: string;
  readonly source?: { readonly title: string; readonly url: string };
}

export const marketingPlaybooks: readonly MarketingPlaybook[] = [
  {
    slug: 'seo-content-that-earns-qualified-demand',
    title: 'SEO & Content That Earn Qualified Demand',
    description: 'Build service pages, useful content, and a technically sound site around the searches that lead to sales conversations.',
    category: 'SEO & Content',
    outcome: 'A focused search program that connects useful pages to qualified inquiries, rather than publishing for traffic alone.',
    steps: [
      { title: 'Days 1–30: map demand and repair the foundation', actions: [
        'Interview sales and support. Group real customer questions by problem, service, location, and buying stage.',
        'Audit indexing, internal links, mobile usability, and conversion paths. Establish a baseline in Search Console and your CRM.',
        'Choose the first three commercial pages based on relevance to the business, available proof, and the ability to serve new customers.',
      ] },
      { title: 'Days 31–60: publish and connect', actions: [
        'Build each service page around a clear offer, specific customer needs, authentic examples, and one next step.',
        'Publish supporting explanations and comparison guides that answer the questions people ask before requesting a quote.',
        'Link supporting content to the relevant service page. Assign an owner to each page and record when its facts were verified.',
      ] },
      { title: 'Days 61–90: improve the pages that produce opportunity', actions: [
        'Review queries and landing pages alongside qualified inquiries. Improve unclear titles, missing answers, and weak calls to action.',
        'Refresh useful pages before expanding the publishing calendar. Consolidate overlapping pages when they serve the same need.',
        'Prioritize the next topic from customer feedback and conversion evidence, then repeat the cycle.',
      ] },
    ],
    measures: ['Relevant non-brand search impressions and clicks', 'Qualified inquiries by landing page', 'Inquiry-to-opportunity conversion and influenced revenue'],
    avoid: 'Avoid mass-produced pages, unsupported claims, and treating rankings or traffic as a substitute for customer outcomes.',
  },
  {
    slug: 'aeo-ai-answer-visibility',
    title: 'AEO: Make Your Expertise Easier to Find in AI Answers',
    description: 'Turn customer questions into clear, verifiable answers and track how your business appears across answer engines.',
    category: 'AEO & AI Visibility',
    outcome: 'A maintained library of useful answers and a repeatable way to observe AI visibility. Placement in any answer engine remains outside your control.',
    steps: [
      { title: 'Days 1–30: establish the questions and baseline', actions: [
        'Collect questions from sales calls, support tickets, and on-site search. Separate factual questions from comparisons and purchase decisions.',
        'Record a fixed set of prompts, engines, dates, cited URLs, and competitor mentions so later observations are comparable.',
        'Check that core pages are accessible, indexable, and contain the important information as text. Verify company and service facts.',
      ] },
      { title: 'Days 31–60: publish answers with evidence', actions: [
        'Give each important question a concise answer followed by context, examples, limitations, and primary references where appropriate.',
        'Identify the author or reviewer and link to relevant expertise. Keep business information consistent across your site and owned profiles.',
        'Use applicable structured data only when it accurately describes visible content. Google does not require special AI markup for its search AI features.',
      ] },
      { title: 'Days 61–90: observe, refresh, and connect to demand', actions: [
        'Repeat the baseline prompts, log changes in cited pages, and investigate inaccuracies. A single answer is an observation, not a stable ranking.',
        'Update unclear or outdated answers and connect them to a useful service, comparison, or contact page.',
        'Review identifiable referral traffic and qualified inquiries. Keep manual visibility observations separate from conversion attribution.',
      ] },
    ],
    measures: ['Citations and accurate mentions across a documented prompt set', 'Identifiable answer-engine referrals', 'Qualified inquiries from those referrals, where attribution is available'],
    avoid: 'Avoid guaranteed AI placement, invented citations, and reporting prompt mentions as proven revenue. Google includes its AI search appearances in overall Web search reporting.',
    source: { title: 'Google Search Central: AI features and your website', url: 'https://developers.google.com/search/docs/appearance/ai-features' },
  },
  {
    slug: 'paid-ads-from-click-to-customer',
    title: 'Paid Ads: From Click to Qualified Customer',
    description: 'Launch search and social campaigns with a clear offer, controlled tests, landing pages, and feedback from actual sales outcomes.',
    category: 'Paid Ads',
    outcome: 'A campaign system that makes spend, lead quality, and sales outcomes visible enough to guide the next investment.',
    steps: [
      { title: 'Days 1–30: define the economics and instrument the funnel', actions: [
        'Choose one offer and audience. Set an approved test budget, acquisition-cost target, service area, and capacity limit.',
        'Build a matching landing page with proof, qualification questions, and a clear booking or quote action.',
        'Validate form, booking, and call measurement. Connect source information to the CRM and identify who owns lead follow-up.',
      ] },
      { title: 'Days 31–60: launch controlled creative and audience tests', actions: [
        'For search, separate buying intent from research and maintain negative keywords. For social, test a small set of distinct messages and formats.',
        'Change one major variable at a time and log the hypothesis, spend cap, and decision criteria before the test starts.',
        'Review search terms, placements, landing-page behavior, and sales feedback each week. Exclude clear mismatches promptly.',
      ] },
      { title: 'Days 61–90: scale what survives the sales process', actions: [
        'Compare campaigns by qualified leads, booked appointments, and closed business; keep platform-reported and CRM results separate.',
        'Increase budgets in controlled increments only when performance, fulfillment capacity, and follow-up can support the increase.',
        'Refresh creative and improve the landing page when returns weaken. Stop tests that reach their agreed limit without useful evidence.',
      ] },
    ],
    measures: ['Spend and cost per qualified lead', 'Booked appointments, show rate, and close rate', 'Customer acquisition cost and contribution after ad spend'],
    avoid: 'Avoid scaling on cheap clicks or form fills alone, unapproved spend, and comparing channels without accounting for attribution differences.',
  },
  {
    slug: 'social-media-publishing-and-community',
    title: 'Social Media: Publish, Engage, and Build Demand',
    description: 'Turn expertise into a consistent publishing calendar, community conversations, and a measurable path to inquiry.',
    category: 'Social Media',
    outcome: 'A sustainable publishing and response routine that builds recognition and helps the right people take the next step.',
    steps: [
      { title: 'Days 1–30: choose the audience and production rhythm', actions: [
        'Select the channels where your customers already spend time. Define useful themes: customer questions, demonstrations, process, and authentic proof.',
        'Create a four-week calendar with a named writer, designer, reviewer, and publisher. Match the cadence to real production capacity.',
        'Agree on permissions for customer photos and stories. Document how comments, inquiries, and sensitive questions reach the right owner.',
      ] },
      { title: 'Days 31–60: ship content and join the conversation', actions: [
        'Batch original posts, short videos, and demonstrations. Adapt the format and opening to each channel rather than copying every post verbatim.',
        'Use clear captions and accessible visuals. Link to an appropriate landing page with campaign tags when there is a natural next step.',
        'Respond to relevant comments and direct inquiries. Record recurring objections and questions for the next content batch.',
      ] },
      { title: 'Days 61–90: improve the series that earn useful responses', actions: [
        'Compare topics by saves, substantive replies, qualified visits, and inquiries rather than follower growth alone.',
        'Repeat strong formats with fresh examples, retire weak ones, and feed audience questions into sales material and the website.',
        'Review the production workload and response time monthly so consistency does not depend on last-minute heroics.',
      ] },
    ],
    measures: ['Publishing consistency and response time', 'Useful engagement and tagged site visits', 'Qualified inquiries and assisted opportunities'],
    avoid: 'Avoid bought engagement, unauthorized customer stories, and a calendar built only around announcements about yourself.',
  },
  {
    slug: 'email-marketing-nurture-and-retention',
    title: 'Email Marketing: Nurture, Convert, and Retain',
    description: 'Build useful welcome, inquiry follow-up, and retention sequences with segmentation, consent, and clear sales handoffs.',
    category: 'Email Marketing',
    outcome: 'A maintained email program that helps interested prospects decide and gives existing customers a reason to return.',
    steps: [
      { title: 'Days 1–30: organize the audience and handoffs', actions: [
        'Audit how contacts joined the list, their preferences, and suppression records. Separate prospects, active customers, and inactive customers.',
        'Check sender authentication and test delivery, links, forms, and unsubscribe behavior before launching a sequence.',
        'Map the customer journey and name the owner who receives replies, handles qualified inquiries, and resolves service questions.',
      ] },
      { title: 'Days 31–60: launch useful sequences', actions: [
        'Write a welcome sequence that delivers the promised resource, answers common questions, and offers one relevant next step.',
        'Create inquiry follow-up that preserves context and ends when the person replies, books, opts out, or no longer needs the message.',
        'Add customer onboarding and timely maintenance or renewal reminders. Match timing and content to the actual service relationship.',
      ] },
      { title: 'Days 61–90: refine relevance and retention', actions: [
        'Test one meaningful variable at a time: subject, offer, timing, or call to action. Use conversions and replies to judge the result.',
        'Review unsubscribes, complaints, bounces, and inactive segments. Honor suppression across campaigns and pause weak sequences.',
        'Connect campaign activity to bookings, repeat purchases, and retained customers, then refresh the content that supports those outcomes.',
      ] },
    ],
    measures: ['Delivery, bounces, unsubscribes, and complaints', 'Replies, qualified clicks, and booked conversations', 'Repeat purchases, renewals, and attributed revenue'],
    avoid: 'Avoid purchased lists, sending after opt-out, and relying on open rates as the main proof of interest.',
  },
];
