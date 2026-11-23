export interface LocalSeoCaseStudy {
  readonly slug: string;
  readonly title: string;
  readonly description: string;
  readonly industry: string;
  readonly industryPlural: string;
  readonly category: string;
  readonly tags: readonly string[];
  readonly story: string;
  readonly whyHeading: string;
  readonly stepsHeading: string;
  readonly steps: readonly string[];
  readonly measurement: string;
  readonly benefactorCopy: string;
}

export const localSeoCaseStudies: readonly LocalSeoCaseStudy[] = [
  {
    slug: 'plumbing-companies-local-seo-case-study',
    title: 'Local SEO Playbook for Plumbing Companies That Need More Service Calls',
    description:
      "Make emergency calls and replacement estimates easy to route. Use dispatcher outcomes to decide which plumbing services and towns to promote.",
    industry: 'plumbing company',
    industryPlural: 'plumbing companies',
    category: 'Local SEO Playbook',
    tags: ['plumbing-marketing', 'local-seo', 'google-maps', 'lead-generation'],
    story:
      "A homeowner with a leaking water heater wants two answers before calling. Does anyone cover this address, and can someone come today? A homeowner replacing a working heater can wait for a written estimate. Give each person a clear route from search to the right desk.",
    whyHeading:
      "Which plumbing calls can your dispatcher book?",
    stepsHeading:
      "Walk through an after-hours call",
    steps: [
      "Open the emergency repair page on a phone after dispatch closes. Can a caller see the towns you cover, the hours someone answers and what happens to a message?",
      "Put the dispatch number next to those details. On the installation page, offer an estimate request and explain what the estimator needs to know about the property.",
    ],
    measurement:
      "Ask dispatch to label calls by service, area and outcome. Count booked visits per in-area repair call. If a town sends plenty of calls but no bookings, check coverage and staffing before buying more traffic there.",
    benefactorCopy:
      "We align the Google Business Profile, service pages and call reporting with the jobs your dispatchers can accept. Bring your service map and a week of call outcomes to the review.",
  },
  {
    slug: 'pool-cleaning-companies-local-seo-case-study',
    title: 'Local SEO Playbook for Pool Cleaning Companies That Need Denser Routes',
    description:
      "Choose neighborhoods with room on an existing pool route and measure the drive time each new weekly account adds.",
    industry: 'pool cleaning company',
    industryPlural: 'pool cleaning companies',
    category: 'Local SEO Playbook',
    tags: ['pool-cleaning-marketing', 'local-seo', 'recurring-revenue', 'google-maps'],
    story:
      "A new weekly account two streets from an existing stop can use an open slot on Tuesday. The same account across town may need a different crew or an extra route day. Decide where you can take work before choosing which neighborhoods to promote.",
    whyHeading:
      "Where would one more pool stop pay off?",
    stepsHeading:
      "Build a page around an open route",
    steps: [
      "Mark your regular stops on a private map. Find a stretch with room for another pool, then name that service area and the available days on the weekly maintenance page.",
      "Give green-pool recovery its own inquiry option. Explain what a weekly visit includes so a homeowner can request either a one-time cleanup or an ongoing quote.",
    ],
    measurement:
      "For each new recurring stop, record the crew’s added drive minutes and whether the account is still active after a month. Review those figures alongside the number of inquiries from that area.",
    benefactorCopy:
      "Benefactor connects your service-area listings and quote form to route-level reporting. The owner can see which neighborhoods fill gaps in the schedule.",
  },
  {
    slug: 'roofing-companies-local-seo-case-study',
    title: 'Local SEO Playbook for Roofing Companies Facing Local Storm Demand',
    description:
      "Prepare a storm inspection page, give planned roof replacements their own estimate path, and check whether crews can meet demand.",
    industry: 'roofing company',
    industryPlural: 'roofing companies',
    category: 'Local SEO Playbook',
    tags: ['roofing-marketing', 'local-seo', 'google-maps', 'storm-damage'],
    story:
      "A homeowner who sees a ceiling stain after heavy rain needs to know how soon someone can inspect it. Someone budgeting for replacement wants examples of comparable roofs and an estimate. Putting both on the same waitlist makes it hard to give either caller a reliable answer.",
    whyHeading:
      "What happens to inspection requests after a storm?",
    stepsHeading:
      "Prepare the inspection page before the weather changes",
    steps: [
      "Publish the towns you cover, how to request an inspection and when the office can confirm a visit. Have one person update availability when the queue fills.",
      "Give planned replacements a separate estimate path. Use a completed project, with permission, to show the roof type, scope and what the estimate covered.",
    ],
    measurement:
      "Track requests, completed inspections and signed jobs by service. If requests rise while completed inspections stay flat, check appointment capacity and missed callbacks before expanding the campaign.",
    benefactorCopy:
      "We organize repair and replacement pages, listings and intake so your office can see which searches lead to inspections it can actually schedule.",
  },
  {
    slug: 'house-cleaning-companies-local-seo-case-study',
    title: 'Local SEO Playbook for House Cleaning Companies That Need Recurring Clients',
    description:
      "Write separate intake questions for recurring and move-out cleans, then follow a first visit through to the second booking.",
    industry: 'house cleaning company',
    industryPlural: 'house cleaning companies',
    category: 'Local SEO Playbook',
    tags: ['house-cleaning-marketing', 'local-seo', 'google-maps', 'recurring-clients'],
    story:
      "A move-out clean has a deadline and an empty property. A household looking for fortnightly help wants to know which chores repeat and whether a regular slot is available. Using one quote form for both hides the details the scheduler needs.",
    whyHeading:
      "Will the first clean lead to a second visit?",
    stepsHeading:
      "Follow a recurring-clean inquiry to its second booking",
    steps: [
      "Show the first-visit scope and the maintenance checklist side by side. Explain how the team handles extras such as inside the oven or refrigerator.",
      "Ask for neighborhood, home size and preferred frequency. Route move-outs to a separate deadline question so an urgent one-off job does not occupy a recurring slot by mistake.",
    ],
    measurement:
      "Count first cleans from recurring-service inquiries, then count how many of those households book a second visit. Ask the scheduler what prevented a rebooking before changing the page.",
    benefactorCopy:
      "Benefactor ties the service listing, scope and booking form together so the office can distinguish requests for regular help from one-off cleans.",
  },
  {
    slug: 'house-painters-local-seo-case-study',
    title: 'Local SEO Playbook for House Painters That Need Better Estimate Requests',
    description:
      "Use one completed painting project to explain prep and finish choices, then track the estimates that turn into signed jobs.",
    industry: 'house painting company',
    industryPlural: 'house painters',
    category: 'Local SEO Playbook',
    tags: ['house-painter-marketing', 'local-seo', 'estimate-requests', 'google-maps'],
    story:
      "A gallery of finished rooms can establish taste while leaving a buyer unsure whether you handle the prep their job needs. A cabinet repaint and a whole-house exterior call for different walkthroughs, even in the same neighborhood.",
    whyHeading:
      "What does a homeowner need before requesting a painting estimate?",
    stepsHeading:
      "Turn one completed job into an estimate guide",
    steps: [
      "With permission, select photos from one project. Caption the surface, the prep the crew did and the finish the owner chose. Include a before photo when it helps explain the work.",
      "Link the gallery from the matching service page. On the estimate form ask for the surface, approximate scope and desired timing so the estimator can prepare for the walkthrough.",
    ],
    measurement:
      "Compare requests, completed walkthroughs and accepted estimates by job type. If cabinet inquiries keep ending at the walkthrough, review what the page says about prep and scope with the estimator.",
    benefactorCopy:
      "We put relevant project evidence next to the estimate request and connect each request to its outcome. That gives the owner a way to decide which portfolio to expand.",
  },
  {
    slug: 'spas-local-seo-case-study',
    title: 'Local SEO Playbook for Spas That Need More Booked Appointments',
    description:
      "Follow a spa listing through service selection and booking. Check treatment names, room availability and completed first visits.",
    industry: 'spa',
    industryPlural: 'spas',
    category: 'Local SEO Playbook',
    tags: ['spa-marketing', 'local-seo', 'appointment-booking', 'reputation'],
    story:
      "Someone searching for a couples massage needs to find two available places at the same time. A gift buyer may need a voucher instead. Both can land on the same listing and get lost when its booking link opens a long, unfiltered menu.",
    whyHeading:
      "Can a first-time spa guest book the treatment they found?",
    stepsHeading:
      "Try booking one service from a phone",
    steps: [
      "Start on the public listing and choose a treatment. Check that the service name, duration and price match the booking screen. Explain any deposit and how far ahead guests should arrive.",
      "If a treatment needs two practitioners or a particular room, show how to confirm availability. Give gift buyers a separate link and explain how the recipient redeems it.",
    ],
    measurement:
      "Review completed first visits by treatment alongside booking starts. When starts rise and visits do not, try the path again for a busy Saturday and check whether suitable slots appear.",
    benefactorCopy:
      "Benefactor connects treatment pages to the right booking options and helps staff see which local searches lead to attended appointments.",
  },
  {
    slug: 'dentists-local-seo-case-study',
    title: 'Local SEO Playbook for Dentists That Need More New-Patient Demand',
    description:
      "Connect each office listing to the right appointment form and use front-desk questions to improve new-patient information.",
    industry: 'dental practice',
    industryPlural: 'dentists',
    category: 'Local SEO Playbook',
    tags: ['dentist-marketing', 'local-seo', 'new-patients', 'google-maps'],
    story:
      "A new patient looking for a routine exam needs practical details about location, payment and the next available appointment. A caller seeking urgent care needs to reach the practice promptly and know when someone answers.",
    whyHeading:
      "Can a new dental patient find the right appointment?",
    stepsHeading:
      "Check the path from the listing to the front desk",
    steps: [
      "Open the practice listing on a phone. Follow its appointment link and verify that a new patient can request the visit shown on the page at the correct office.",
      "Ask the front desk which coverage and scheduling questions recur. Publish the office’s verification process and phone hours. Direct clinical questions to the care team through its approved channel.",
    ],
    measurement:
      "Use aggregate counts of new-patient requests, appointments booked and visits attended. Keep patient names and clinical details out of campaign URLs and advertising reports.",
    benefactorCopy:
      "We help practices align listings, service information and appointment routing. The front desk can use aggregate outcomes to spot where interested callers lose their way.",
  },
  {
    slug: 'photographers-local-seo-case-study',
    title: 'Local SEO Playbook for Photographers That Need Better-Fit Bookings',
    description:
      "Match each local photography search to a relevant gallery, ask shoot-specific questions and track which inquiries become paid bookings.",
    industry: 'photography business',
    industryPlural: 'photographers',
    category: 'Local SEO Playbook',
    tags: ['photographer-marketing', 'local-seo', 'portfolio', 'booking-inquiries'],
    story:
      "A couple planning an indoor evening ceremony may love your outdoor portraits but still need to see how you handle a dim reception. A marketing manager booking headshots needs to know how many people you can schedule and what files they receive.",
    whyHeading:
      "Does your portfolio answer the question behind the inquiry?",
    stepsHeading:
      "Give one type of shoot its own booking path",
    steps: [
      "Choose a service you want to book. Publish a coherent gallery from a relevant shoot with the client’s permission, and explain the setting, deliverables and typical turnaround.",
      "For a wedding, ask for date and venue. For a team session, ask for headcount and delivery deadline. Link directly to that inquiry form from the gallery.",
    ],
    measurement:
      "Record the requested shoot type, date availability and whether a deposit was paid. If suitable inquiries arrive for dates already taken, clarify availability before changing the portfolio.",
    benefactorCopy:
      "Benefactor connects service-specific galleries to local search pages and inquiries so you can see which work attracts the commissions you want.",
  },
  {
    slug: 'pest-control-companies-local-seo-case-study',
    title: 'Local SEO Playbook for Pest Control Companies That Need Urgent Local Calls',
    description:
      "Build a local service page for one pest, route inspection requests to dispatch and check which service areas produce completed visits.",
    industry: 'pest control company',
    industryPlural: 'pest control companies',
    category: 'Local SEO Playbook',
    tags: ['pest-control-marketing', 'local-seo', 'google-maps', 'service-calls'],
    story:
      "A tenant who has spotted bed bugs and a property manager arranging recurring rodent inspections need different first conversations. A generic contact form sends both to a dispatcher with little idea what to schedule.",
    whyHeading:
      "Which pest searches can your team act on?",
    stepsHeading:
      "Build the intake path for one pest first",
    steps: [
      "Choose a pest your team serves frequently. On its service page explain your coverage area, what the initial inspection involves and when the office confirms an appointment.",
      "Ask for the property type, location and preferred callback time. Give recurring commercial inspections a separate route to the person who prepares those agreements.",
    ],
    measurement:
      "Track booked inspections, completed visits and recurring agreements by service area and pest category. If callers repeatedly fall outside your coverage, make that boundary visible next to the phone number.",
    benefactorCopy:
      "Benefactor connects pest-specific listings and pages with dispatch outcomes so the owner can choose which services to promote as the season changes.",
  },
];

export const localSeoCaseStudyBlogPosts = localSeoCaseStudies.map((caseStudy) => ({
  slug: caseStudy.slug,
  title: caseStudy.title,
  description: caseStudy.description,
  date: '2026-05-13',
  author: 'Benefactor Marketing',
  readTime: '1 min read',
  category: caseStudy.category,
  tags: caseStudy.tags,
}));

export function getLocalSeoCaseStudy(slug: string): LocalSeoCaseStudy {
  const caseStudy = localSeoCaseStudies.find((entry) => entry.slug === slug);

  if (!caseStudy) {
    throw new Error(`Unknown local SEO playbook slug: ${slug}`);
  }

  return caseStudy;
}
