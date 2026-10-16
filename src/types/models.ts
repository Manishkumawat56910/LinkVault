export interface UserProfile {
  uid: string;
  name?: string;
  email: string;
  username: string;
  bio?: string;
  avatarUrl?: string;
  theme: 'light' | 'dark' | 'gradient';
  buttonStyle: 'rounded' | 'square' | 'outline' | 'shadow';
  backgroundColor?: string;
  backgroundImage?: string;
  socialLinks?: { platform: string; url: string }[];
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Link {
  id?: string;
  userId: string;
  title: string;
  url: string;
  icon?: string;
  isActive: boolean;
  order: number;
  clickCount: number;
  thumbnail?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Click {
  id?: string;
  linkId: string;
  userId: string;
  country?: string;
  city?: string;
  device?: string;
  browser?: string;
  referrer?: string;
  clickedAt: string;
}

export interface AnalyticsStats {
  totalClicks: number;
  byDate: Record<string, number>;
  byLink: Record<string, number>;
  byDevice: Record<string, number>;
  byBrowser: Record<string, number>;
  byCountry: Record<string, number>;
  byCity: Record<string, number>;
  byReferrer: Record<string, number>;
}

export interface AnalyticsClick extends Click {
  linkTitle: string;
}

export interface AnalyticsData {
  stats: AnalyticsStats;
  clicks: AnalyticsClick[];
}
