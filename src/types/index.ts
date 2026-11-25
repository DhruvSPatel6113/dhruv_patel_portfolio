export interface ProjectItem {
  id: string;
  title: string;
  subtitle: string;
  category: 'systems' | 'simulation' | 'iot' | 'automation' | 'finance' | 'fullstack';
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
  cameraFocus: {
    position: [number, number, number];
    target: [number, number, number];
  };
  themeColor: string;
}

export interface OffScreenInterest {
  title: string;
  category: string;
  tagline: string;
  details: string;
  badge: string;
  icon: string;
}

export interface PortfolioData {
  profile: {
    name: string;
    tagline: string;
    subline: string;
    college: string;
    gradYear: string;
    email: string;
    github: string;
    linkedin: string;
    location: string;
  };
  chapters: ChapterStory[];
  projects: ProjectItem[];
  offScreen: OffScreenInterest[];
}
