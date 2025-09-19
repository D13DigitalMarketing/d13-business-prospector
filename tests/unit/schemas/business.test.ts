import { describe, it, expect } from 'vitest';
import {
  BusinessProspectSchema,
  WebPresenceAnalysisSchema,
  ContactInfoSchema,
  BusinessLocationSchema,
} from '../../../src/schemas/business.js';
import type {
  BusinessProspect,
  WebPresenceAnalysis,
  ContactInfo,
  BusinessLocation,
} from '../../../src/types/business.js';

describe('Business Schema Validation', () => {
  describe('BusinessLocationSchema', () => {
    it('should validate a valid business location', () => {
      const validLocation: BusinessLocation = {
        address: '123 Main St',
        city: 'Tampa',
        state: 'FL',
        zipCode: '33601',
        country: 'USA',
        latitude: 27.9506,
        longitude: -82.4572,
      };

      expect(() => BusinessLocationSchema.parse(validLocation)).not.toThrow();
    });

    it('should reject invalid latitude', () => {
      const invalidLocation = {
        address: '123 Main St',
        city: 'Tampa',
        state: 'FL',
        zipCode: '33601',
        country: 'USA',
        latitude: 91, // Invalid: > 90
        longitude: -82.4572,
      };

      expect(() => BusinessLocationSchema.parse(invalidLocation)).toThrow();
    });

    it('should reject invalid longitude', () => {
      const invalidLocation = {
        address: '123 Main St',
        city: 'Tampa',
        state: 'FL',
        zipCode: '33601',
        country: 'USA',
        latitude: 27.9506,
        longitude: -181, // Invalid: < -180
      };

      expect(() => BusinessLocationSchema.parse(invalidLocation)).toThrow();
    });

    it('should require all mandatory fields', () => {
      const incompleteLocation = {
        address: '123 Main St',
        city: 'Tampa',
        // Missing state, zipCode, country, latitude, longitude
      };

      expect(() => BusinessLocationSchema.parse(incompleteLocation)).toThrow();
    });
  });

  describe('ContactInfoSchema', () => {
    it('should validate contact info with valid phone number', () => {
      const validContact: ContactInfo = {
        phone: '+1-813-555-0123',
        email: 'info@example.com',
        website: 'https://example.com',
      };

      expect(() => ContactInfoSchema.parse(validContact)).not.toThrow();
    });

    it('should validate contact info with E.164 phone format', () => {
      const validContact = {
        phone: '+18135550123',
        email: 'info@example.com',
        website: 'https://example.com',
      };

      expect(() => ContactInfoSchema.parse(validContact)).not.toThrow();
    });

    it('should reject invalid phone number format', () => {
      const invalidContact = {
        phone: '813-555-0123', // Missing country code
        email: 'info@example.com',
        website: 'https://example.com',
      };

      expect(() => ContactInfoSchema.parse(invalidContact)).toThrow();
    });

    it('should reject invalid email format', () => {
      const invalidContact = {
        phone: '+1-813-555-0123',
        email: 'invalid-email',
        website: 'https://example.com',
      };

      expect(() => ContactInfoSchema.parse(invalidContact)).toThrow();
    });

    it('should reject invalid URL format', () => {
      const invalidContact = {
        phone: '+1-813-555-0123',
        email: 'info@example.com',
        website: 'not-a-url',
      };

      expect(() => ContactInfoSchema.parse(invalidContact)).toThrow();
    });

    it('should allow optional website field', () => {
      const validContact = {
        phone: '+1-813-555-0123',
        email: 'info@example.com',
      };

      expect(() => ContactInfoSchema.parse(validContact)).not.toThrow();
    });
  });

  describe('WebPresenceAnalysisSchema', () => {
    it('should validate complete web presence analysis', () => {
      const validAnalysis: WebPresenceAnalysis = {
        hasWebsite: true,
        websiteType: 'professional',
        websiteQuality: 'good',
        issues: ['slow loading', 'mobile unfriendly'],
        opportunities: ['SEO optimization', 'social media integration'],
      };

      expect(() =>
        WebPresenceAnalysisSchema.parse(validAnalysis)
      ).not.toThrow();
    });

    it('should validate analysis with no website', () => {
      const validAnalysis = {
        hasWebsite: false,
        websiteType: 'none' as const,
        websiteQuality: 'none' as const,
        issues: [],
        opportunities: ['professional website', 'online presence'],
      };

      expect(() =>
        WebPresenceAnalysisSchema.parse(validAnalysis)
      ).not.toThrow();
    });

    it('should reject invalid website type', () => {
      const invalidAnalysis = {
        hasWebsite: true,
        websiteType: 'invalid-type',
        websiteQuality: 'good',
        issues: [],
        opportunities: [],
      };

      expect(() => WebPresenceAnalysisSchema.parse(invalidAnalysis)).toThrow();
    });

    it('should reject invalid website quality', () => {
      const invalidAnalysis = {
        hasWebsite: true,
        websiteType: 'professional',
        websiteQuality: 'invalid-quality',
        issues: [],
        opportunities: [],
      };

      expect(() => WebPresenceAnalysisSchema.parse(invalidAnalysis)).toThrow();
    });
  });

  describe('BusinessProspectSchema', () => {
    it('should validate complete business prospect', () => {
      const validProspect: BusinessProspect = {
        id: 'prospect-123',
        name: 'Tampa Cleaning Services',
        category: 'Cleaning Services',
        location: {
          address: '123 Main St',
          city: 'Tampa',
          state: 'FL',
          zipCode: '33601',
          country: 'USA',
          latitude: 27.9506,
          longitude: -82.4572,
        },
        contact: {
          phone: '+1-813-555-0123',
          email: 'info@tampacleaning.com',
          website: 'https://tampacleaning.com',
        },
        rating: 4.5,
        reviewCount: 127,
        webPresence: {
          hasWebsite: true,
          websiteType: 'template',
          websiteQuality: 'poor',
          issues: ['outdated design', 'no mobile optimization'],
          opportunities: ['modern redesign', 'SEO optimization'],
        },
        opportunityScore: 85,
        extractedAt: new Date('2024-09-18T22:30:00Z'),
        templateConfig: {
          company: {
            name: 'Tampa Cleaning Services',
            website: 'https://tampacleaning.com',
          },
          contact: {
            phone: '+1-813-555-0123',
            email: 'info@tampacleaning.com',
            address: {
              street: '123 Main St',
              city: 'Tampa',
              state: 'FL',
              zipCode: '33601',
              country: 'USA',
            },
          },
          services: {
            primary: 'Residential Cleaning',
            categories: ['residential', 'commercial'],
          },
        },
      };

      expect(() => BusinessProspectSchema.parse(validProspect)).not.toThrow();
    });

    it('should reject negative rating', () => {
      const invalidProspect = {
        id: 'prospect-123',
        name: 'Tampa Cleaning Services',
        category: 'Cleaning Services',
        location: {
          address: '123 Main St',
          city: 'Tampa',
          state: 'FL',
          zipCode: '33601',
          country: 'USA',
          latitude: 27.9506,
          longitude: -82.4572,
        },
        contact: {
          phone: '+1-813-555-0123',
          email: 'info@tampacleaning.com',
        },
        rating: -1, // Invalid: negative rating
        reviewCount: 127,
        webPresence: {
          hasWebsite: false,
          websiteType: 'none',
          websiteQuality: 'none',
          issues: [],
          opportunities: [],
        },
        opportunityScore: 85,
        extractedAt: new Date(),
        templateConfig: {
          company: { name: 'Test' },
          contact: {
            phone: '+1-813-555-0123',
            email: 'test@example.com',
            address: {
              street: '123 Main St',
              city: 'Tampa',
              state: 'FL',
              zipCode: '33601',
              country: 'USA',
            },
          },
          services: {
            primary: 'Cleaning',
            categories: ['residential'],
          },
        },
      };

      expect(() => BusinessProspectSchema.parse(invalidProspect)).toThrow();
    });

    it('should reject rating above 5', () => {
      const invalidProspect = {
        id: 'prospect-123',
        name: 'Tampa Cleaning Services',
        category: 'Cleaning Services',
        location: {
          address: '123 Main St',
          city: 'Tampa',
          state: 'FL',
          zipCode: '33601',
          country: 'USA',
          latitude: 27.9506,
          longitude: -82.4572,
        },
        contact: {
          phone: '+1-813-555-0123',
          email: 'info@tampacleaning.com',
        },
        rating: 6, // Invalid: > 5
        reviewCount: 127,
        webPresence: {
          hasWebsite: false,
          websiteType: 'none',
          websiteQuality: 'none',
          issues: [],
          opportunities: [],
        },
        opportunityScore: 85,
        extractedAt: new Date(),
        templateConfig: {
          company: { name: 'Test' },
          contact: {
            phone: '+1-813-555-0123',
            email: 'test@example.com',
            address: {
              street: '123 Main St',
              city: 'Tampa',
              state: 'FL',
              zipCode: '33601',
              country: 'USA',
            },
          },
          services: {
            primary: 'Cleaning',
            categories: ['residential'],
          },
        },
      };

      expect(() => BusinessProspectSchema.parse(invalidProspect)).toThrow();
    });

    it('should reject negative review count', () => {
      const invalidProspect = {
        id: 'prospect-123',
        name: 'Tampa Cleaning Services',
        category: 'Cleaning Services',
        location: {
          address: '123 Main St',
          city: 'Tampa',
          state: 'FL',
          zipCode: '33601',
          country: 'USA',
          latitude: 27.9506,
          longitude: -82.4572,
        },
        contact: {
          phone: '+1-813-555-0123',
          email: 'info@tampacleaning.com',
        },
        rating: 4.5,
        reviewCount: -5, // Invalid: negative count
        webPresence: {
          hasWebsite: false,
          websiteType: 'none',
          websiteQuality: 'none',
          issues: [],
          opportunities: [],
        },
        opportunityScore: 85,
        extractedAt: new Date(),
        templateConfig: {
          company: { name: 'Test' },
          contact: {
            phone: '+1-813-555-0123',
            email: 'test@example.com',
            address: {
              street: '123 Main St',
              city: 'Tampa',
              state: 'FL',
              zipCode: '33601',
              country: 'USA',
            },
          },
          services: {
            primary: 'Cleaning',
            categories: ['residential'],
          },
        },
      };

      expect(() => BusinessProspectSchema.parse(invalidProspect)).toThrow();
    });

    it('should reject invalid opportunity score', () => {
      const invalidProspect = {
        id: 'prospect-123',
        name: 'Tampa Cleaning Services',
        category: 'Cleaning Services',
        location: {
          address: '123 Main St',
          city: 'Tampa',
          state: 'FL',
          zipCode: '33601',
          country: 'USA',
          latitude: 27.9506,
          longitude: -82.4572,
        },
        contact: {
          phone: '+1-813-555-0123',
          email: 'info@tampacleaning.com',
        },
        rating: 4.5,
        reviewCount: 127,
        webPresence: {
          hasWebsite: false,
          websiteType: 'none',
          websiteQuality: 'none',
          issues: [],
          opportunities: [],
        },
        opportunityScore: 150, // Invalid: > 100
        extractedAt: new Date(),
        templateConfig: {
          company: { name: 'Test' },
          contact: {
            phone: '+1-813-555-0123',
            email: 'test@example.com',
            address: {
              street: '123 Main St',
              city: 'Tampa',
              state: 'FL',
              zipCode: '33601',
              country: 'USA',
            },
          },
          services: {
            primary: 'Cleaning',
            categories: ['residential'],
          },
        },
      };

      expect(() => BusinessProspectSchema.parse(invalidProspect)).toThrow();
    });

    it('should reject empty or invalid id', () => {
      const invalidProspect = {
        id: '', // Invalid: empty string
        name: 'Tampa Cleaning Services',
        category: 'Cleaning Services',
        location: {
          address: '123 Main St',
          city: 'Tampa',
          state: 'FL',
          zipCode: '33601',
          country: 'USA',
          latitude: 27.9506,
          longitude: -82.4572,
        },
        contact: {
          phone: '+1-813-555-0123',
          email: 'info@tampacleaning.com',
        },
        rating: 4.5,
        reviewCount: 127,
        webPresence: {
          hasWebsite: false,
          websiteType: 'none',
          websiteQuality: 'none',
          issues: [],
          opportunities: [],
        },
        opportunityScore: 85,
        extractedAt: new Date(),
        templateConfig: {
          company: { name: 'Test' },
          contact: {
            phone: '+1-813-555-0123',
            email: 'test@example.com',
            address: {
              street: '123 Main St',
              city: 'Tampa',
              state: 'FL',
              zipCode: '33601',
              country: 'USA',
            },
          },
          services: {
            primary: 'Cleaning',
            categories: ['residential'],
          },
        },
      };

      expect(() => BusinessProspectSchema.parse(invalidProspect)).toThrow();
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle null values gracefully', () => {
      expect(() => BusinessProspectSchema.parse(null)).toThrow();
    });

    it('should handle undefined values gracefully', () => {
      expect(() => BusinessProspectSchema.parse(undefined)).toThrow();
    });

    it('should handle empty objects gracefully', () => {
      expect(() => BusinessProspectSchema.parse({})).toThrow();
    });

    it('should handle malformed date strings', () => {
      const invalidProspect = {
        id: 'prospect-123',
        name: 'Tampa Cleaning Services',
        category: 'Cleaning Services',
        location: {
          address: '123 Main St',
          city: 'Tampa',
          state: 'FL',
          zipCode: '33601',
          country: 'USA',
          latitude: 27.9506,
          longitude: -82.4572,
        },
        contact: {
          phone: '+1-813-555-0123',
          email: 'info@tampacleaning.com',
        },
        rating: 4.5,
        reviewCount: 127,
        webPresence: {
          hasWebsite: false,
          websiteType: 'none',
          websiteQuality: 'none',
          issues: [],
          opportunities: [],
        },
        opportunityScore: 85,
        extractedAt: 'invalid-date-string',
        templateConfig: {
          company: { name: 'Test' },
          contact: {
            phone: '+1-813-555-0123',
            email: 'test@example.com',
            address: {
              street: '123 Main St',
              city: 'Tampa',
              state: 'FL',
              zipCode: '33601',
              country: 'USA',
            },
          },
          services: {
            primary: 'Cleaning',
            categories: ['residential'],
          },
        },
      };

      expect(() => BusinessProspectSchema.parse(invalidProspect)).toThrow();
    });
  });
});
