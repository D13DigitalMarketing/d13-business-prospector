import { z } from 'zod';

// Validation helpers
const phoneRegex =
  /^\+[1-9]\d{1,14}$|^\+[1-9]-\d{3}-\d{3}-\d{4}$|^\+[1-9]\d{10}$/;
const urlRegex = /^https?:\/\/.+/;

// Location schema with geographic coordinate validation
export const BusinessLocationSchema = z.object({
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(2, 'State must be at least 2 characters'),
  zipCode: z.string().min(5, 'Zip code must be at least 5 characters'),
  country: z.string().min(2, 'Country must be at least 2 characters'),
  latitude: z.number().min(-90).max(90, 'Latitude must be between -90 and 90'),
  longitude: z
    .number()
    .min(-180)
    .max(180, 'Longitude must be between -180 and 180'),
});

// Contact info schema with E.164 phone validation
export const ContactInfoSchema = z.object({
  phone: z
    .string()
    .regex(phoneRegex, 'Phone must be in E.164 format (e.g., +1-813-555-0123)'),
  email: z.string().email('Invalid email format'),
  website: z.string().regex(urlRegex, 'Website must be a valid URL').optional(),
});

// Web presence analysis schema
export const WebPresenceAnalysisSchema = z.object({
  hasWebsite: z.boolean(),
  websiteType: z.enum([
    'none',
    'professional',
    'template',
    'facebook',
    'directory',
  ]),
  websiteQuality: z.enum(['excellent', 'good', 'poor', 'none']),
  issues: z.array(z.string()),
  opportunities: z.array(z.string()),
});

// Address info schema for template config
export const AddressInfoSchema = z.object({
  street: z.string().min(1, 'Street is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(2, 'State must be at least 2 characters'),
  zipCode: z.string().min(5, 'Zip code must be at least 5 characters'),
  country: z.string().min(2, 'Country must be at least 2 characters'),
});

// Company info schema
export const CompanyInfoSchema = z.object({
  name: z.string().min(1, 'Company name is required'),
  legalName: z.string().optional(),
  owner: z.string().optional(),
  website: z.string().regex(urlRegex, 'Website must be a valid URL').optional(),
  foundingYear: z
    .number()
    .int()
    .min(1800)
    .max(new Date().getFullYear())
    .optional(),
});

// Business hours schema
export const BusinessHoursSchema = z
  .object({
    monday: z.string().optional(),
    tuesday: z.string().optional(),
    wednesday: z.string().optional(),
    thursday: z.string().optional(),
    friday: z.string().optional(),
    saturday: z.string().optional(),
    sunday: z.string().optional(),
  })
  .catchall(z.string().optional());

// Social media account schema
export const SocialMediaAccountSchema = z.object({
  platform: z.string().min(1, 'Platform is required'),
  url: z.string().regex(urlRegex, 'Social media URL must be valid'),
  handle: z.string().optional(),
});

// Business features schema (flexible object)
export const BusinessFeaturesSchema = z.record(
  z.union([z.boolean(), z.string(), z.number()])
);

// Rating info schema
export const RatingInfoSchema = z.object({
  average: z.number().min(0).max(5, 'Rating must be between 0 and 5'),
  count: z.number().int().min(0, 'Rating count must be non-negative'),
  source: z.string().optional(),
});

// SEO config schema
export const SEOConfigSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  keywords: z.array(z.string()).optional(),
  localArea: z.string().optional(),
});

// Schema config schema
export const SchemaConfigSchema = z
  .object({
    businessType: z.string().min(1, 'Business type is required'),
  })
  .catchall(z.unknown());

// Service config schema
export const ServiceConfigSchema = z.object({
  primary: z.string().min(1, 'Primary service is required'),
  categories: z
    .array(z.string().min(1))
    .min(1, 'At least one service category is required'),
  descriptions: z.record(z.string()).optional(),
});

// Business config schema for template integration
export const BusinessConfigSchema = z.object({
  company: CompanyInfoSchema,
  contact: z.object({
    phone: z.string().regex(phoneRegex, 'Phone must be in E.164 format'),
    email: z.string().email('Invalid email format'),
    address: AddressInfoSchema,
  }),
  hours: BusinessHoursSchema.optional(),
  socialMedia: z.array(SocialMediaAccountSchema).optional(),
  features: BusinessFeaturesSchema.optional(),
  rating: RatingInfoSchema.optional(),
  seo: SEOConfigSchema.optional(),
  schema: SchemaConfigSchema.optional(),
  services: ServiceConfigSchema,
});

// Main business prospect schema
export const BusinessProspectSchema = z.object({
  id: z.string().min(1, 'ID is required'),
  name: z.string().min(1, 'Business name is required'),
  category: z.string().min(1, 'Category is required'),
  location: BusinessLocationSchema,
  contact: ContactInfoSchema,
  rating: z.number().min(0).max(5, 'Rating must be between 0 and 5'),
  reviewCount: z.number().int().min(0, 'Review count must be non-negative'),
  webPresence: WebPresenceAnalysisSchema,
  opportunityScore: z
    .number()
    .min(0)
    .max(100, 'Opportunity score must be between 0 and 100'),
  extractedAt: z.date(),
  templateConfig: BusinessConfigSchema,
});

// Type inference from schemas
export type BusinessLocation = z.infer<typeof BusinessLocationSchema>;
export type ContactInfo = z.infer<typeof ContactInfoSchema>;
export type WebPresenceAnalysis = z.infer<typeof WebPresenceAnalysisSchema>;
export type AddressInfo = z.infer<typeof AddressInfoSchema>;
export type CompanyInfo = z.infer<typeof CompanyInfoSchema>;
export type BusinessHours = z.infer<typeof BusinessHoursSchema>;
export type SocialMediaAccount = z.infer<typeof SocialMediaAccountSchema>;
export type BusinessFeatures = z.infer<typeof BusinessFeaturesSchema>;
export type RatingInfo = z.infer<typeof RatingInfoSchema>;
export type SEOConfig = z.infer<typeof SEOConfigSchema>;
export type SchemaConfig = z.infer<typeof SchemaConfigSchema>;
export type ServiceConfig = z.infer<typeof ServiceConfigSchema>;
export type BusinessConfig = z.infer<typeof BusinessConfigSchema>;
export type BusinessProspect = z.infer<typeof BusinessProspectSchema>;
