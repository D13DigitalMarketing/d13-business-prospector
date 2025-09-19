# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project: D13 Business Prospector CLI Tool

### Purpose
A TypeScript CLI tool for finding businesses without professional websites and extracting their data for sales prospecting. This tool focuses on discovering high-opportunity prospects in specific industries and locations. **The extracted business data is specifically formatted to populate D13 Digital's business presence website templates**, enabling rapid deployment of professional websites for prospective clients.

**Template Integration**: Data output is structured to match the `BusinessConfig` interface used in D13's website templates (e.g., [CleaningServiceTemplate](https://github.com/D13DigitalMarketing/CleaningServiceTemplate)), allowing seamless population of business information, contact details, hours, services, and local SEO data.

## 🚫 STRICT DEVELOPMENT RULES - Never Break These

### 0. FEATURE BRANCH WORKFLOW - ALWAYS REQUIRED

- **ALWAYS** create a feature branch before starting ANY work
- Branch naming: `feat/issue-[number]-[brief-description]`
- **NEVER** work directly on main branch
- Example: `git checkout -b feat/issue-1-initialize-typescript-cli`
- **CRITICAL**: Start every task by creating the proper branch first

### 1. NO JAVASCRIPT - TYPESCRIPT ONLY

- **NEVER** write JavaScript files (.js) in this project
- **ALWAYS** use TypeScript (.ts) files exclusively
- TypeScript strict mode is enabled and must remain enabled
- No `any` types without documented justification
- All functions and variables must have explicit types

### 2. TEST-DRIVEN DEVELOPMENT (TDD) REQUIRED

- **ALWAYS** write tests FIRST, then implementation
- Red → Green → Refactor cycle for every feature
- Minimum 80% code coverage required
- Critical business logic requires 100% coverage
- Every PR must include tests for new functionality
- Tests must pass before any merge

### 3. ISSUE-DRIVEN DEVELOPMENT WORKFLOW

- **EVERY** feature starts with a GitHub issue
- Issues must have clear acceptance criteria and test requirements
- One branch per issue: `feat/issue-[number]-[brief-description]`
- PRs must reference issue: "Fixes #[number]"
- Issues only closed after PR is merged and verified

### 4. PULL REQUEST WORKFLOW - MANDATORY

- **EVERY** completed feature MUST have a pull request
- **ALWAYS** use GitHub CLI: `gh pr create` with proper title and body
- **REQUIRED**: Include "Fixes #[number]" to auto-close issues
- **REQUIRED**: Include test plan with checkboxes in PR description
- **REQUIRED**: All tests must pass before PR creation
- Never merge without a PR - even for small changes

## 📋 Core Functionality (Focused Scope)

### What We ARE Building
- **Business Search Engine**: Find businesses by industry + location
- **Web Presence Analyzer**: Detect businesses with poor/no websites
- **Opportunity Scorer**: Rank prospects by potential value
- **Data Extractor**: Scrape comprehensive business information
- **Export System**: Output data in usable formats (JSON, CSV)

### What We Are NOT Building (Phase 1)
- Demo website generation
- Email template creation
- CRM integration
- Hosting/deployment tools
- Customer management features

## 🎯 Template Integration & Data Output

### Target Template Compatibility
This prospector tool is designed to extract and format business data for D13 Digital's website templates:

- **Primary Template**: [CleaningServiceTemplate](https://github.com/D13DigitalMarketing/CleaningServiceTemplate)
- **Output Format**: TypeScript `BusinessConfig` interface compatibility
- **Use Case**: Rapid website deployment for prospects with poor/no web presence

### Required Data Extraction Fields
The tool must extract data to populate these template sections:

```typescript
interface BusinessConfig {
  company: {
    name: string;
    legalName?: string;
    owner?: string;
    website?: string;
    foundingYear?: number;
  };
  contact: {
    phone: string;
    email: string;
    address: AddressInfo;
  };
  hours: BusinessHours;
  socialMedia: SocialMediaAccount[];
  features: BusinessFeatures;
  rating: RatingInfo;
  seo: SEOConfig;
  schema: SchemaConfig;
  services: ServiceConfig;
}
```

### Data Mapping Priority
1. **Essential**: Company name, phone, address, primary service
2. **High Priority**: Business hours, rating/reviews, social media
3. **SEO Critical**: Service keywords, local area, business type
4. **Optional**: Website quality analysis, owner info, certifications

## 🏗️ Architecture Overview

### Project Structure
```
src/
├── cli/                    # CLI interface and commands
│   ├── index.ts           # Main CLI entry point
│   └── commands/          # Individual CLI commands
│       ├── search.ts      # Find businesses
│       ├── analyze.ts     # Analyze web presence
│       └── extract.ts     # Extract detailed data
├── core/                  # Core business logic
│   ├── prospector/        # Business search and discovery
│   ├── analyzer/          # Web presence analysis
│   ├── extractor/         # Data scraping and extraction
│   └── scorer/            # Opportunity scoring
├── types/                 # TypeScript type definitions
├── schemas/               # Zod validation schemas
└── utils/                 # Shared utilities

tests/
├── unit/                  # Unit tests (mirrors src structure)
├── integration/           # Integration tests for CLI commands
├── fixtures/              # Test data and mock responses
└── helpers/               # Test utilities and helpers
```

### Technology Stack
- **TypeScript** 5+ with strict mode
- **Node.js** 20+ LTS
- **Vitest** for testing framework
- **Commander.js** for CLI interface
- **Zod** for schema validation
- **Playwright** for web scraping
- **Axios** for HTTP requests

## 📊 Data Collection Ethics

### Acceptable Data Sources
- Public business directories (Google Maps, Yelp)
- Published business information on websites
- Aggregated review statistics and ratings
- Public social media business profiles
- Business registration databases

### Prohibited Data Collection
- Personal customer information or PII
- Private customer reviews or messages
- Email addresses for spam purposes
- Non-public social media posts
- Any copyrighted content

### Rate Limiting & Respect
- Always respect robots.txt files
- Implement proper rate limiting for all APIs
- Use official APIs when available
- Cache results to minimize repeat requests

## 🧪 Testing Standards

### Test Coverage Requirements
- **Overall minimum**: 80% line coverage
- **Core business logic**: 100% coverage required
- **Data validation**: 100% coverage required
- **CLI commands**: Integration tests required

### Test Organization
```typescript
// Example test structure
describe('BusinessProspector', () => {
  describe('searchByIndustry', () => {
    it('should return businesses for valid industry/location', async () => {
      // Test implementation
    });

    it('should handle invalid location gracefully', async () => {
      // Error handling test
    });

    it('should respect rate limiting', async () => {
      // Rate limiting test
    });
  });
});
```

### Test Data Management
- Use fixtures for consistent test data
- Mock external API responses
- Test edge cases and error conditions
- Verify data validation schemas

## 🔄 Development Workflow

### For Each Issue/Feature

1. **Create GitHub Issue**
   - Clear description and acceptance criteria
   - List specific test cases to implement
   - Estimate complexity and dependencies

2. **Create Feature Branch**
   ```bash
   git checkout main
   git pull origin main
   git checkout -b feat/issue-[number]-[description]
   ```

3. **TDD Implementation**
   - Write failing tests first (Red)
   - Implement minimal code to pass (Green)
   - Refactor and optimize (Refactor)
   - Repeat until feature complete

4. **Create Pull Request**
   - Push feature branch: `git push -u origin feat/issue-[number]-[description]`
   - Create PR: `gh pr create --title "feat: descriptive title" --body "..."`
   - **ALWAYS** reference issue: "Fixes #[number]" in PR body
   - Include comprehensive test coverage report
   - Include test plan with checkboxes
   - Verify all checks pass before requesting review
   - **REQUIRED**: Every feature must have a linked PR

   **PR Body Template**:
   ```markdown
   ## Summary
   Brief description of changes made

   ## Changes Made
   - ✅ Item 1 completed
   - ✅ Item 2 completed

   ## Test plan
   - [x] Tests pass
   - [x] TypeScript compiles
   - [x] Linting passes
   - [x] Feature works as expected

   ## Fixes #[issue-number]

   🤖 Generated with [Claude Code](https://claude.ai/code)
   ```

5. **Merge and Close**
   - Merge PR after all checks pass
   - Verify issue is auto-closed by "Fixes #[number]"
   - Delete feature branch after merge

### Git Commit Standards
```bash
# Good commit messages
feat: implement Google Maps business search
test: add unit tests for opportunity scorer
fix: handle rate limiting in web scraper
refactor: extract validation logic to schema

# Bad commit messages
fix stuff
update
working on feature
```

## 🚀 Build and Development Commands

### Development
```bash
npm run dev          # Run CLI in development mode
npm run test         # Run all tests
npm run test:watch   # Run tests in watch mode
npm run test:ui      # Open Vitest UI
npm run coverage     # Generate coverage report
```

### Building
```bash
npm run build        # Compile TypeScript
npm run typecheck    # Type checking only
npm run lint         # ESLint checking
npm run format       # Prettier formatting
```

### CLI Usage (Development)
```bash
npm run cli search "accountants" "Tampa, FL"
npm run cli analyze business-id-123
npm run cli extract business-id-123 --format json
```

## 📈 Data Models

### Core Business Data Structure (Template-Compatible)
```typescript
interface BusinessProspect {
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

  // Template-ready configuration
  templateConfig: BusinessConfig;  // Ready for D13 template deployment
}

interface WebPresenceAnalysis {
  hasWebsite: boolean;
  websiteType: 'none' | 'professional' | 'template' | 'facebook' | 'directory';
  websiteQuality: 'excellent' | 'good' | 'poor' | 'none';
  issues: string[];
  opportunities: string[];
}

// Template-compatible business configuration (matches D13 templates)
interface BusinessConfig {
  company: CompanyInfo;
  contact: ContactInfo;
  hours: BusinessHours;
  socialMedia: SocialMediaAccount[];
  features: BusinessFeatures;
  rating: RatingInfo;
  seo: SEOConfig;
  schema: SchemaConfig;
  services: ServiceConfig;
}
```

### Validation Requirements
- All data must pass Zod schema validation
- Phone numbers must follow E.164 format
- URLs must be valid and accessible
- Geographic coordinates must be valid

## 🎯 Quality Gates

### Pre-Commit Requirements
- TypeScript compilation passes
- All tests pass
- ESLint checks pass
- Prettier formatting applied
- No `console.log` statements in production code

### Pre-Merge Requirements
- Code review completed (if team member available)
- Test coverage meets minimum requirements
- Integration tests pass
- Documentation updated for new features

## 📝 Issue Templates and Labels

### Issue Types
- `feat`: New feature implementation
- `bug`: Bug fixes and error handling
- `test`: Test coverage improvements
- `refactor`: Code improvement without behavior change
- `docs`: Documentation updates

### Priority Labels
- `priority-high`: Critical path features
- `priority-medium`: Standard features
- `priority-low`: Nice-to-have enhancements

### Component Labels
- `component-cli`: CLI interface changes
- `component-scraper`: Web scraping functionality
- `component-analyzer`: Web presence analysis
- `component-data`: Data models and validation

## 🔧 Common Debugging Commands

### Useful Development Commands
```bash
# Debug CLI with verbose output
DEBUG=* npm run cli search "test query" "location"

# Run specific test file
npm run test -- search.test.ts

# Generate coverage for specific file
npm run coverage -- --reporter=html core/prospector/

# Check TypeScript issues
npm run typecheck

# Lint specific files
npx eslint src/core/prospector/
```

### Environment Variables
```bash
# Optional API keys (for enhanced functionality)
GOOGLE_PLACES_API_KEY=your_key_here
YELP_API_KEY=your_key_here

# Development settings
NODE_ENV=development
LOG_LEVEL=debug
```

## 🚨 Important Reminders

1. **No JavaScript**: This is a TypeScript-only project
2. **Tests First**: Always write tests before implementation
3. **Issue-Driven**: Every feature needs a GitHub issue
4. **Data Ethics**: Only collect publicly available information
5. **Rate Limiting**: Respect external services and APIs
6. **Type Safety**: Use strict TypeScript throughout
7. **Focused Scope**: Build prospecting tools, not website generators

---

*This file should be updated as the project evolves. All contributors must read and follow these guidelines.*