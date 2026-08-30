export interface ServiceLandingPage {
  readonly country: string;
  readonly countryLabel: string;
  readonly service: string;
  readonly serviceLabel: string;
  readonly illustrationSrc: string;
  readonly illustrationAlt: string;
  readonly pageTitle: string;
  readonly metaDescription: string;
  readonly heroTitle: string;
  readonly heroDescription: string;
  readonly audience: string;
  readonly outcome: string;
  readonly stats: readonly Readonly<{ value: string; label: string }>[];
  readonly pillars: readonly Readonly<{ title: string; description: string }>[];
  readonly advantages: readonly string[];
}

export const serviceLandingPages: readonly ServiceLandingPage[] = [
  {
    country: 'usa',
    countryLabel: 'USA',
    service: 'plumbing',
    serviceLabel: 'Plumbing',
    illustrationSrc: '/service-illustrations/plumbing-fantasy.png',
    illustrationAlt:
      'Fantasy-style illustration of a plumber studying a drafting board with glowing planning overlays.',
    pageTitle: 'Plumbing Marketing Services in the USA',
    metaDescription:
      'Benefactor builds plumbing marketing systems in the USA with local SEO, paid search, lead routing, and follow-up automation for service businesses that need booked jobs, not empty clicks.',
    heroTitle: 'Plumbing marketing for USA operators who need booked jobs, not just traffic.',
    heroDescription:
      'We help plumbing businesses win more emergency calls, quote requests, and repeat service work by tightening local search visibility, paid acquisition, and lead follow-up.',
    audience: 'Built for owner-led plumbing shops and multi-location service teams across the USA.',
    outcome: 'Focused on higher-intent calls, cleaner dispatch handoffs, and less wasted spend.',
    stats: [
      { value: 'Local SEO', label: 'Map pack and service-area visibility' },
      { value: 'Call Ads', label: 'High-intent paid search campaigns' },
      { value: 'Automation', label: 'Fast follow-up on every booked lead' },
    ],
    pillars: [
      {
        title: 'Service-area landing pages',
        description:
          'We build pages around real neighborhoods, job types, and urgency-based search behavior so your best-fit traffic lands on the right offer immediately.',
      },
      {
        title: 'Call-first paid search',
        description:
          'Campaigns are structured around emergency intent, repair keywords, and dispatch-ready conversions instead of broad clicks that waste technician time.',
      },
      {
        title: 'Lead routing and reactivation',
        description:
          'Form fills, missed calls, and estimate requests trigger the next step automatically so sales opportunities do not die in the gap between office staff and field crews.',
      },
    ],
    advantages: [
      'Rank for city + service combinations that actually drive revenue',
      'Match search intent to drain, water heater, leak, and emergency offers',
      'Automate estimate follow-up for unbooked leads',
      'Report on jobs, not vanity traffic metrics',
    ],
  },
  {
    country: 'india',
    countryLabel: 'India',
    service: 'nail-salon',
    serviceLabel: 'Nail Salon',
    illustrationSrc: '/service-illustrations/nail-salon-fantasy.png',
    illustrationAlt:
      'Fantasy-style illustration of a nail artist reviewing a beauty strategy board in an elegant studio.',
    pageTitle: 'Nail Salon Marketing Services in India',
    metaDescription:
      'Benefactor helps nail salons in India grow bookings with local discovery, Instagram-ready campaigns, retention offers, and appointment automation that keeps chairs full.',
    heroTitle: 'Nail salon marketing in India that turns attention into recurring appointments.',
    heroDescription:
      'We help salons grow beyond walk-ins by combining local discovery, aesthetic creative, and retention systems that keep premium services booked week after week.',
    audience: 'Designed for independent salons, beauty studios, and premium nail bars in India.',
    outcome: 'Better appointment volume, stronger retention, and clearer offer positioning.',
    stats: [
      { value: 'Discovery', label: 'Local search and map visibility' },
      { value: 'Creative', label: 'Short-form visuals that drive bookings' },
      { value: 'Retention', label: 'Automated reminders and comeback offers' },
    ],
    pillars: [
      {
        title: 'Offer design for premium services',
        description:
          'We shape service menus and seasonal campaigns around margin, repeatability, and the styles clients already share and search for online.',
      },
      {
        title: 'Social and search working together',
        description:
          'From Instagram creative to location-based search campaigns, we align the promise, booking flow, and salon experience into one system.',
      },
      {
        title: 'Repeat-booking automation',
        description:
          'Reminders, post-visit follow-up, and loyalty hooks bring clients back for fills, new sets, and add-on services without constant manual outreach.',
      },
    ],
    advantages: [
      'Promote bridal, seasonal, and signature nail offers with clearer positioning',
      'Reduce drop-off between discovery, DMs, and confirmed appointment slots',
      'Encourage repeat bookings with timed reminders and comeback campaigns',
      'Show which services and channels produce the highest-value clients',
    ],
  },
  {
    country: 'russia',
    countryLabel: 'Russia',
    service: 'electrical',
    serviceLabel: 'Electrical',
    illustrationSrc: '/service-illustrations/electrical-fantasy.png',
    illustrationAlt:
      'Fantasy-style illustration of an electrician on a ladder with a clipboard and glowing schematic lines.',
    pageTitle: 'Electrical Marketing Services in Russia',
    metaDescription:
      'Benefactor helps electrical businesses in Russia capture more qualified inquiries with local search, service landing pages, quote workflows, and automation that supports growth.',
    heroTitle: 'Electrical marketing in Russia built for trust, urgency, and cleaner quote flow.',
    heroDescription:
      'We position electricians around reliability, safety, and speed so more homeowners and businesses choose your team when demand is immediate and trust matters most.',
    audience: 'For independent electricians, commercial service teams, and regional trade operators in Russia.',
    outcome: 'More qualified inquiries, better quote conversion, and stronger local credibility.',
    stats: [
      { value: 'Trust', label: 'Credibility-focused messaging' },
      { value: 'Intent', label: 'Search campaigns around urgent needs' },
      { value: 'Workflow', label: 'Quote follow-up without manual chase' },
    ],
    pillars: [
      {
        title: 'High-intent service architecture',
        description:
          'We structure pages around installs, repairs, inspections, and emergency work so visitors immediately see the right path for their need.',
      },
      {
        title: 'Message-market alignment',
        description:
          'Safety, certification, response time, and commercial readiness are translated into offers and copy that reduce hesitation before contact.',
      },
      {
        title: 'Sales-support automation',
        description:
          'Estimate requests, callbacks, and repeat-service reminders are routed and tracked so every inquiry has a next step.',
      },
    ],
    advantages: [
      'Build region-specific pages that support local search demand',
      'Improve win rate on repair and installation quote requests',
      'Create urgency without sounding generic or low-trust',
      'Track which lead sources become real electrical jobs',
    ],
  },
  {
    country: 'russia',
    countryLabel: 'Russia',
    service: 'carpentry',
    serviceLabel: 'Carpentry',
    illustrationSrc: '/service-illustrations/carpentry-fantasy.png',
    illustrationAlt:
      'Fantasy-style illustration of a carpenter reviewing plans beside a custom wood project.',
    pageTitle: 'Carpentry Marketing Services in Russia',
    metaDescription:
      'Benefactor helps carpentry businesses in Russia market custom work, renovation projects, and local craftsmanship through stronger positioning, search visibility, and lead automation.',
    heroTitle: 'Carpentry marketing in Russia that sells craftsmanship without slowing down the workshop.',
    heroDescription:
      'We help carpenters and woodworking teams present custom quality clearly online, attract better-fit projects, and streamline how inquiries turn into scoped work.',
    audience: 'For carpenters, millwork shops, renovation specialists, and custom furniture teams in Russia.',
    outcome: 'Stronger positioning, better-fit inbound leads, and faster quote movement.',
    stats: [
      { value: 'Positioning', label: 'Differentiate custom work from commodity shops' },
      { value: 'Portfolio', label: 'Project pages that support search and trust' },
      { value: 'Pipeline', label: 'Inquiry handling that keeps jobs moving' },
    ],
    pillars: [
      {
        title: 'Project-led content strategy',
        description:
          'We turn finished work into landing pages and portfolio assets that show quality, process, and specialization in a way that drives inquiry.',
      },
      {
        title: 'Offer clarity by job type',
        description:
          'Custom cabinetry, trim, renovation carpentry, and furniture work each get dedicated positioning so visitors know you fit their project.',
      },
      {
        title: 'Lead qualification workflows',
        description:
          'Forms, reminders, and intake sequencing help your team separate budget shoppers from serious projects without drowning in back-and-forth.',
      },
    ],
    advantages: [
      'Package craftsmanship in language that converts online',
      'Use project examples to rank for higher-intent searches',
      'Pre-qualify project scope before the estimate conversation',
      'Keep follow-up moving while the team stays focused on delivery',
    ],
  },
  {
    country: 'usa',
    countryLabel: 'USA',
    service: 'legal',
    serviceLabel: 'Legal',
    illustrationSrc: '/service-illustrations/legal-fantasy.png',
    illustrationAlt:
      'Fantasy-style illustration of an attorney strategist reviewing a case board in a law library war room.',
    pageTitle: 'Legal Marketing Services in the USA',
    metaDescription:
      'Benefactor builds legal marketing systems in the USA with local SEO, trust-based paid search, intake routing, and conversion-focused service pages for firms that need better case flow.',
    heroTitle: 'Legal marketing for USA firms that want stronger intake, sharper positioning, and more qualified matters.',
    heroDescription:
      'We help law firms tighten search visibility, paid acquisition, and intake operations so the right prospects reach the right practice area faster.',
    audience: 'Built for solo attorneys, boutique firms, and growth-minded practice groups across the USA.',
    outcome: 'Higher-quality consultations, clearer case-type positioning, and better intake follow-through.',
    stats: [
      { value: 'Visibility', label: 'Practice-area and geo-intent search coverage' },
      { value: 'Intake', label: 'Better routing for consultations and callbacks' },
      { value: 'Trust', label: 'Messaging built around credibility and clarity' },
    ],
    pillars: [
      {
        title: 'Practice-area landing pages',
        description:
          'We build service pages that align legal search intent with the matter types you actually want more of, rather than generic firm-level copy.',
      },
      {
        title: 'Paid search with stricter qualification',
        description:
          'Campaigns are narrowed around practice area, urgency, and location so spend concentrates on prospects more likely to book and convert.',
      },
      {
        title: 'Intake system improvements',
        description:
          'Call handling, form logic, and follow-up automation ensure inquiries do not stall before the consult is set.',
      },
    ],
    advantages: [
      'Rank and convert around the matters your firm wants most',
      'Reduce wasted paid spend from broad legal keywords',
      'Support intake teams with better routing and response speed',
      'Measure performance by consultations and retained matters',
    ],
  },
  {
    country: 'usa',
    countryLabel: 'USA',
    service: 'medical',
    serviceLabel: 'Medical',
    illustrationSrc: '/service-illustrations/medical-fantasy.png',
    illustrationAlt:
      'Fantasy-style illustration of a medical professional reviewing patient-flow and growth diagrams.',
    pageTitle: 'Medical Marketing Services in the USA',
    metaDescription:
      'Benefactor helps medical practices in the USA grow patient demand with service-line pages, local search, compliant acquisition systems, and automation that improves follow-up.',
    heroTitle: 'Medical marketing in the USA for practices that need steady patient demand and cleaner follow-up.',
    heroDescription:
      'We help medical brands and clinics build patient acquisition systems that balance clarity, trust, and operational efficiency across search, paid, and conversion flow.',
    audience: 'For clinics, specialty practices, and provider groups in the USA.',
    outcome: 'More qualified appointments, clearer service-line positioning, and less admin drag.',
    stats: [
      { value: 'Patients', label: 'Service-line demand generation' },
      { value: 'Trust', label: 'Credibility-focused acquisition flows' },
      { value: 'Ops', label: 'Follow-up automation for admin teams' },
    ],
    pillars: [
      {
        title: 'Service-line growth pages',
        description:
          'We create pages around actual treatment intent, provider trust signals, and next-step clarity so the patient journey feels simpler from the first click.',
      },
      {
        title: 'Paid and organic channel alignment',
        description:
          'Search campaigns, local discovery, and high-intent content all reinforce the same conversion path instead of competing for attention.',
      },
      {
        title: 'Scheduling and nurture automation',
        description:
          'Lead forms, callbacks, and reminder flows are connected so more prospective patients actually make it to the booked visit.',
      },
    ],
    advantages: [
      'Clarify messaging around procedures, specialties, and patient needs',
      'Support local search visibility with stronger service architecture',
      'Improve follow-up between inquiry and booked appointment',
      'Give operators reporting that reflects patient flow, not just clicks',
    ],
  },
  {
    country: 'usa',
    countryLabel: 'USA',
    service: 'dentist',
    serviceLabel: 'Dentist',
    illustrationSrc: '/service-illustrations/dentist-fantasy.png',
    illustrationAlt:
      'Fantasy-style illustration of a dental specialist reviewing treatment and growth diagrams in a premium clinic.',
    pageTitle: 'Dental Marketing Services in the USA',
    metaDescription:
      'Benefactor helps dentists in the USA grow patient acquisition with local search, offer design, paid search, and automated recall systems that increase booking efficiency.',
    heroTitle: 'Dental marketing in the USA that fills chairs with better-fit patients.',
    heroDescription:
      'We help dental practices generate more appointments for high-value services while tightening recall, reactivation, and new-patient intake.',
    audience: 'Built for general dentists, cosmetic practices, and multi-location dental groups in the USA.',
    outcome: 'More new-patient flow, stronger recall, and better visibility for priority treatments.',
    stats: [
      { value: 'Recall', label: 'Reactivation and patient return systems' },
      { value: 'Search', label: 'Local intent and high-value treatment demand' },
      { value: 'Booking', label: 'Cleaner conversion flow from click to chair' },
    ],
    pillars: [
      {
        title: 'Treatment-focused growth strategy',
        description:
          'We separate hygiene, implants, cosmetic services, and emergency care so marketing speaks to the exact need instead of lumping every patient into one path.',
      },
      {
        title: 'New-patient acquisition',
        description:
          'Paid search, local SEO, and landing pages are tuned around the procedures and insurance-related queries most likely to convert in your market.',
      },
      {
        title: 'Retention and recall automation',
        description:
          'Missed appointments, overdue hygiene, and past-treatment reactivation can all be nudged automatically so your schedule stays healthier over time.',
      },
    ],
    advantages: [
      'Drive better patient volume for priority procedures and locations',
      'Reduce friction between ad click, inquiry, and confirmed appointment',
      'Use automated recall to protect recurring revenue',
      'Track performance by booked visits and treatment demand',
    ],
  },
];
