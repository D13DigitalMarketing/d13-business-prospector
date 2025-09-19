# D13 Business Prospector

A TypeScript CLI tool for finding businesses without professional websites and extracting their data for sales prospecting.

## 🎯 Purpose

The D13 Business Prospector helps sales teams and agencies identify high-opportunity business prospects by:

- **Finding businesses** by industry and location (e.g., "accountants in Tampa, FL")
- **Analyzing web presence** to identify businesses with poor or no websites
- **Scoring opportunities** based on ratings, reviews, and web presence quality
- **Extracting business data** for use in sales outreach and demo creation

## 🚀 Quick Start

```bash
# Search for prospects
npm run cli search "restaurants" "Austin, TX"

# Analyze a specific business
npm run cli analyze business-id-123

# Extract detailed data
npm run cli extract business-id-123 --format json

# Batch processing
npm run cli batch prospects.txt
```

## 📋 Features

### ✅ Core Functionality (Phase 1)
- Business search by industry + location
- Web presence analysis and quality scoring
- Opportunity scoring algorithm
- Data extraction from Google Maps, Facebook, Yelp
- Export to JSON/CSV formats

### 🔮 Future Enhancements
- Demo website generation
- Email template creation
- CRM integration
- Automated outreach tools

## 🏗️ Project Structure

```
src/
├── cli/                    # CLI interface and commands
├── core/                   # Core business logic
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

## 🛠️ Technology Stack

- **TypeScript 5+** with strict mode (NO JavaScript files)
- **Node.js 20+** LTS
- **Vitest** for testing (TDD approach)
- **Commander.js** for CLI interface
- **Zod** for schema validation
- **Playwright** for web scraping
- **Axios** for HTTP requests

## 📊 Development Approach

### Test-Driven Development (TDD)
Every feature follows the Red-Green-Refactor cycle:
1. **Red**: Write failing tests first
2. **Green**: Write minimal code to pass tests
3. **Refactor**: Improve code while keeping tests green

### Issue-Driven Development
- Every feature starts with a GitHub issue
- One branch per issue: `feat/issue-[number]-[description]`
- PRs must reference issues: "Fixes #[number]"
- Issues closed only after PR is merged

## 🧪 Quality Standards

- **80% minimum test coverage** (100% for critical business logic)
- **TypeScript strict mode** with no `any` types
- **ESLint + Prettier** for code quality
- **Pre-commit hooks** ensure standards

## 📈 Getting Started

1. **Clone the repository**
   ```bash
   git clone https://github.com/D13DigitalMarketing/d13-business-prospector.git
   cd d13-business-prospector
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run tests**
   ```bash
   npm test
   ```

4. **Start development**
   ```bash
   npm run dev
   ```

## 📝 Available Scripts

```bash
# Development
npm run dev          # Run CLI in development mode
npm run test         # Run all tests
npm run test:watch   # Run tests in watch mode
npm run coverage     # Generate coverage report

# Building
npm run build        # Compile TypeScript
npm run typecheck    # Type checking only
npm run lint         # ESLint checking
npm run format       # Prettier formatting

# CLI Commands
npm run cli search "accountants" "Tampa, FL"
npm run cli analyze business-id-123
npm run cli extract business-id-123 --format json
```

## 🤝 Contributing

1. **Check existing issues** or create a new one
2. **Create a branch** from main: `feat/issue-[number]-[description]`
3. **Follow TDD**: Write tests first, then implementation
4. **Ensure quality**: All tests pass, linting clean, 80%+ coverage
5. **Create PR** with "Fixes #[number]" in description

## 📚 Documentation

- **[CLAUDE.md](./CLAUDE.md)** - Development guidelines and standards
- **[Issues](https://github.com/D13DigitalMarketing/d13-business-prospector/issues)** - Feature roadmap and bug reports
- **[.github/ISSUE_TEMPLATE/](./.github/ISSUE_TEMPLATE/)** - Issue templates for consistency

## 🔐 Environment Variables

```bash
# Optional API keys (for enhanced functionality)
GOOGLE_PLACES_API_KEY=your_key_here
YELP_API_KEY=your_key_here

# Development settings
NODE_ENV=development
LOG_LEVEL=debug
```

## ⚖️ Data Collection Ethics

This tool only collects publicly available information:
- ✅ Public business directories (Google Maps, Yelp)
- ✅ Published business information
- ✅ Aggregated review statistics
- ❌ Personal customer information
- ❌ Private communications
- ❌ Copyrighted content

## 📄 License

MIT License - see [LICENSE](./LICENSE) for details.

---

**Built with ❤️ by the D13 Digital Marketing team**
