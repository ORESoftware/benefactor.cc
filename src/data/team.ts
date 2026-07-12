export interface TeamMember {
  id: string;
  name: string;
  role: string;
  specialty: string;
  location: string;
  image: string;
  profileUrl?: string;
}

export const teamMembers: TeamMember[] = [
  {
    id: 'alex',
    name: 'Alex Mills',
    role: 'Operations & Systems Lead',
    specialty: 'IT & Systems',
    location: 'Austin, TX',
    image: '/team/alex-mills.jpg',
    profileUrl: 'https://linkedin.com/in/alexanderdmills',
  },
  {
    id: 'katie',
    name: 'Kate Muntyan',
    role: 'B2B Growth Strategist',
    specialty: 'Strategy',
    location: 'Moscow, Russia',
    image: '/team/katie-muntyan.jpg',
    profileUrl: 'https://www.linkedin.com/in/ekaterina-muntian',
  },
  {
    id: 'vinayak',
    name: 'Vinayak Pandey',
    role: 'SEO Strategist',
    specialty: 'SEO',
    location: 'Varanasi, India',
    image: '/team/vinayak-pandey.png',
    profileUrl: 'https://www.linkedin.com/in/vinayak-pandey-88a7541b2/',
  },
  {
    id: 'jacob',
    name: 'Jacob Highley',
    role: 'SEO Strategist',
    specialty: 'SEO',
    location: 'Idaho, USA',
    image: '/team/jacob-highley.png',
    profileUrl: 'https://www.linkedin.com/in/jacob-highley-445b1215b/',
  },
  {
    id: 'catherine',
    name: 'Catherine Jacobs',
    role: 'Brand & Communications Strategist',
    specialty: 'Design & PR',
    location: 'London, UK',
    image: '/team/catherine-jacobs.png',
    profileUrl: 'https://www.linkedin.com/in/ekaterina-muntian',
  },
  {
    id: 'marcus',
    name: 'Marcus Gerlach',
    role: 'Search & AI Visibility Strategist',
    specialty: 'SEO · AEO · Growth Strategy',
    location: 'Munich, Germany',
    image: '/team/marcus-gerlach.jpg',
    profileUrl: 'https://linkedin.com/in/alexanderdmills',
  },
  {
    id: 'elijah',
    name: 'Elijah Gizzarelli',
    role: 'Marketing Specialist',
    specialty: 'Ads & Business Development',
    location: 'Providence, RI',
    image: '/team/elijah-gizzarelli.jpeg',
    profileUrl: 'https://www.linkedin.com/in/elijah-jon-gizzarelli-b39a87154/',
  },
  {
    id: 'lucia',
    name: 'Lucia Balzano',
    role: 'Social Media Specialist',
    specialty: 'Social Visibility',
    location: 'Miami, FL',
    image: '/team/lucia-balzano.jpeg',
    profileUrl: 'https://www.linkedin.com/in/lucia-balzano1/',
  },
  {
    id: 'brian',
    name: 'Brian Park',
    role: 'Product & UI/UX Designer',
    specialty: 'Design',
    location: 'San Francisco, CA',
    image: '/team/brian-park.jpg',
    profileUrl: 'https://www.linkedin.com/in/bpark415/',
  },
];
