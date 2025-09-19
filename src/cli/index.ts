#!/usr/bin/env node

import { Command } from 'commander';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get package.json for version info
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJsonPath = join(__dirname, '../../package.json');
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));

const program = new Command();

program
  .name('d13-business-prospector')
  .description(
    'TypeScript CLI tool for finding businesses without professional websites and extracting their data for sales prospecting'
  )
  .version(packageJson.version);

// Search command
program
  .command('search')
  .description('Find businesses by industry and location')
  .argument('<industry>', 'Industry to search for (e.g., "cleaning services")')
  .argument('<location>', 'Location to search in (e.g., "Tampa, FL")')
  .action((industry: string, location: string) => {
    console.log(`Searching for "${industry}" businesses in "${location}"`);
    console.log('Search functionality not yet implemented.');
  });

// Analyze command
program
  .command('analyze')
  .description('Analyze web presence of a specific business')
  .argument('<businessId>', 'Business ID to analyze')
  .action((businessId: string) => {
    console.log(`Analyzing business: ${businessId}`);
    console.log('Analysis functionality not yet implemented.');
  });

// Extract command
program
  .command('extract')
  .description('Extract detailed data from a business')
  .argument('<businessId>', 'Business ID to extract data from')
  .option('-f, --format <format>', 'Output format (json, csv)', 'json')
  .action((businessId: string, options: { format: string }) => {
    console.log(`Extracting data from business: ${businessId}`);
    console.log(`Output format: ${options.format}`);
    console.log('Extract functionality not yet implemented.');
  });

// Parse command line arguments
program.parse(process.argv);

// If no arguments provided, show help
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
