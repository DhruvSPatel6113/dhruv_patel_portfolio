export interface HeroContent {
  statusBadge: string;
  name: string;
  headline: string;
  subheadline: string;
  primaryCtaLabel: string;
  primaryCtaTarget: string;
  secondaryCtaLabel: string;
  secondaryCtaTarget: string;
  githubUrl: string;
  resumeUrl?: string;
  highlights: string[];
}

export interface ResearchItem {
  id: string;
  title: string;
  venue: string;
  date: string;
  status: 'Accepted' | 'Published' | 'Under Review' | 'Preprint';
  authors: string[];
  abstract: string;
  metrics: string[];
  hardwareStack: string[];
  softwareStack: string[];
  paperUrl?: string;
  codeUrl?: string;
}

export interface ExperienceItem {
  id: string;
  type: 'work' | 'achievement' | 'club';
  role: string;
  organization: string;
  period: string;
  location: string;
  summary: string;
  highlights: string[];
  badge?: string;
}

export interface ProjectItem {
  id: string;
  title: string;
  subtitle: string;
  category: 'edge-ai' | 'iot' | 'automation' | 'systems' | 'fullstack' | 'simulation' | 'finance';
  tags: string[];
  summary: string;
  story: string;
  metrics: string[];
  githubUrl?: string;
  demoUrl?: string;
  featured: boolean;
  modelType?: 'code' | 'circuit' | 'chip' | 'robot' | 'chart';
}

export interface ChapterStory {
  id: number;
  actTitle: string;
  heading: string;
  tagline: string;
  location: string;
  timeframe: string;
  narrativeText: string[];
  milestones: string[];
  themeColor: string;
}

export interface BeyondItem {
  id: string;
  title: string;
  category: 'sport' | 'music' | 'travel' | 'other';
  tagline: string;
  details: string;
  badge: string;
  icon: string;
}

export interface ContactContent {
  badge: string;
  heading: string;
  description: string;
  email: string;
  location: string;
  githubUrl: string;
  linkedinUrl: string;
}

export interface PortfolioData {
  profile: {
    name: string;
    college: string;
    cgpa: string;
    gradYear: string;
    email: string;
    github: string;
    linkedin: string;
    location: string;
  };
  hero: HeroContent;
  chapters: ChapterStory[];
  research: ResearchItem[];
  experiences: ExperienceItem[];
  projects: ProjectItem[];
  beyond: BeyondItem[];
  contact: ContactContent;
}
