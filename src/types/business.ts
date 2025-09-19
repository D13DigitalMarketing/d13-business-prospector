export interface BusinessLocation {
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  latitude: number;
  longitude: number;
}

export interface ContactInfo {
  phone: string;
  email: string;
  website?: string;
}

export type WebsiteType =
  | 'none'
  | 'professional'
  | 'template'
  | 'facebook'
  | 'directory';
export type WebsiteQuality = 'excellent' | 'good' | 'poor' | 'none';

export interface WebPresenceAnalysis {
  hasWebsite: boolean;
  websiteType: WebsiteType;
  websiteQuality: WebsiteQuality;
  issues: string[];
  opportunities: string[];
}

export interface AddressInfo {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface CompanyInfo {
  name: string;
  legalName?: string;
  owner?: string;
  website?: string;
  foundingYear?: number;
}

export interface BusinessHours {
  [key: string]: string | undefined;
  monday?: string;
  tuesday?: string;
  wednesday?: string;
  thursday?: string;
  friday?: string;
  saturday?: string;
  sunday?: string;
}

export interface SocialMediaAccount {
  platform: string;
  url: string;
  handle?: string;
}

export interface BusinessFeatures {
  [key: string]: boolean | string | number | undefined;
}

export interface RatingInfo {
  average: number;
  count: number;
  source?: string;
}

export interface SEOConfig {
  title?: string;
  description?: string;
  keywords?: string[];
  localArea?: string;
}

export interface SchemaConfig {
  businessType: string;
  [key: string]: unknown;
}

export interface ServiceConfig {
  primary: string;
  categories: string[];
  descriptions?: Record<string, string>;
}

export interface BusinessConfig {
  company: CompanyInfo;
  contact: {
    phone: string;
    email: string;
    address: AddressInfo;
  };
  hours?: BusinessHours;
  socialMedia?: SocialMediaAccount[];
  features?: BusinessFeatures;
  rating?: RatingInfo;
  seo?: SEOConfig;
  schema?: SchemaConfig;
  services: ServiceConfig;
}

export interface BusinessProspect {
  id: string;
  name: string;
  category: string;
  location: BusinessLocation;
  contact: ContactInfo;
  rating: number;
  reviewCount: number;
  webPresence: WebPresenceAnalysis;
  opportunityScore: number;
  extractedAt: Date;
  templateConfig: BusinessConfig;
}
