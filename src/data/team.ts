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
    role: 'Operations Specialist',
    specialty: 'IT & Systems',
    location: 'Austin, TX',
    image: '/team/alex-mills.jpg',
  },
  {
    id: 'katie',
    name: 'Kate Muntyan',
    role: 'Marketing Specialist',
    specialty: 'Strategy',
    location: 'Moscow, Russia',
    image: '/team/katie-muntyan.jpg',
  },
  {
    id: 'vinayak',
    name: 'Vinayak Pandey',
    role: 'Marketing Specialist',
    specialty: 'SEO',
    location: 'North India',
    image: '/team/vinayak-pandey.png',
  },
  {
    id: 'jacob',
    name: 'Jacob Highley',
    role: 'Marketing Specialist',
    specialty: 'SEO',
    location: 'Idaho, USA',
    image: '/team/jacob-highley.png',
  },
  {
    id: 'catherine',
    name: 'Catherine Jacobs',
    role: 'Marketing Specialist',
    specialty: 'Design & PR',
    location: 'London, UK',
    image: '/team/catherine-jacobs.png',
  },
  {
    id: 'marcus',
    name: 'Marcus Gerlach',
    role: 'Marketing Specialist',
    specialty: 'SEO, AEO & Strategy',
    location: 'Munich, Germany',
    image: '/team/marcus-gerlach.jpg',
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
    location: 'Remote',
    image: '/team/lucia-balzano.jpeg',
  },
];
