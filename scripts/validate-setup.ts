#!/usr/bin/env tsx

/**
 * FantasyBlock Setup Validation Script
 * 
 * This script validates that all deployment requirements are met
 */

import { existsSync } from 'fs';
import { join } from 'path';

const RED = '\033[0;31m';
const GREEN = '\033[0;32m';
const YELLOW = '\033[1;33m';
const BLUE = '\033[0;34m';
const NC = '\033[0m'; // No Color

interface ValidationResult {
  passed: boolean;
  message: string;
  critical?: boolean;
}

const validations: { [key: string]: () => ValidationResult } = {
  'Environment Template': () => ({
    passed: existsSync('.env.example'),
    message: '.env.example file exists',
    critical: true
  }),

  'Vercel Configuration': () => ({
    passed: existsSync('vercel.json'),
    message: 'vercel.json configuration exists',
    critical: true
  }),

  'Development Setup Script': () => ({
    passed: existsSync('dev-setup.sh'),
    message: 'dev-setup.sh script exists',
    critical: false
  }),

  'Deployment Documentation': () => ({
    passed: existsSync('DEPLOYMENT.md'),
    message: 'DEPLOYMENT.md documentation exists',
    critical: false
  }),

  'Database Seeding Script': () => ({
    passed: existsSync('scripts/seed-development.ts'),
    message: 'Database seeding script exists',
    critical: false
  }),

  'Package.json Scripts': () => {
    try {
      const pkg = require('../package.json');
      const requiredScripts = [
        'dev', 'build', 'start', 'db:push', 'setup:dev', 'db:seed'
      ];
      const missingScripts = requiredScripts.filter(script => !pkg.scripts[script]);
      
      return {
        passed: missingScripts.length === 0,
        message: missingScripts.length === 0 
          ? 'All required npm scripts present'
          : `Missing scripts: ${missingScripts.join(', ')}`,
        critical: true
      };
    } catch {
      return {
        passed: false,
        message: 'Could not read package.json',
        critical: true
      };
    }
  },

  'TypeScript Configuration': () => ({
    passed: existsSync('tsconfig.json'),
    message: 'TypeScript configuration exists',
    critical: true
  }),

  'Next.js Configuration': () => ({
    passed: existsSync('next.config.ts'),
    message: 'Next.js configuration exists',
    critical: true
  }),

  'Database Configuration': () => ({
    passed: existsSync('drizzle.config.ts'),
    message: 'Drizzle database configuration exists',
    critical: true
  }),

  'Authentication Configuration': () => ({
    passed: existsSync('better-auth.config.ts'),
    message: 'Better Auth configuration exists',
    critical: true
  }),

  'FantasyBlock Pages': () => {
    const pages = [
      'app/page.tsx',
      'app/draft-setup/page.tsx',
      'app/draft-room/page.tsx',
      'app/league-setup/page.tsx'
    ];
    const missingPages = pages.filter(page => !existsSync(page));
    
    return {
      passed: missingPages.length === 0,
      message: missingPages.length === 0
        ? 'All FantasyBlock pages exist'
        : `Missing pages: ${missingPages.join(', ')}`,
      critical: true
    };
  }
};

async function validateSetup() {
  console.log(`${BLUE}🔍 Validating FantasyBlock deployment setup...${NC}\n`);

  const results: { [key: string]: ValidationResult } = {};
  let criticalFailures = 0;
  let totalFailures = 0;

  // Run all validations
  for (const [name, validation] of Object.entries(validations)) {
    try {
      results[name] = validation();
      
      if (!results[name].passed) {
        totalFailures++;
        if (results[name].critical) {
          criticalFailures++;
        }
      }
    } catch (error) {
      results[name] = {
        passed: false,
        message: `Validation failed: ${error}`,
        critical: true
      };
      criticalFailures++;
      totalFailures++;
    }
  }

  // Display results
  for (const [name, result] of Object.entries(results)) {
    const icon = result.passed ? '✅' : (result.critical ? '❌' : '⚠️');
    const color = result.passed ? GREEN : (result.critical ? RED : YELLOW);
    console.log(`${icon} ${color}${name}:${NC} ${result.message}`);
  }

  console.log('');

  // Summary
  if (criticalFailures === 0 && totalFailures === 0) {
    console.log(`${GREEN}🎉 All validations passed! FantasyBlock is ready for deployment.${NC}`);
    console.log('');
    console.log(`${BLUE}Next steps:${NC}`);
    console.log('1. Set up your database (PostgreSQL)');
    console.log('2. Copy .env.example to .env.local and configure');
    console.log('3. Run: npm run setup:dev');
    console.log('4. Deploy to Vercel: vercel --prod');
    console.log('');
  } else if (criticalFailures === 0) {
    console.log(`${YELLOW}⚠️  Setup is functional but some optional features are missing.${NC}`);
    console.log(`${totalFailures} non-critical issues found.`);
    console.log('');
  } else {
    console.log(`${RED}❌ Setup validation failed!${NC}`);
    console.log(`${criticalFailures} critical issues and ${totalFailures - criticalFailures} other issues found.`);
    console.log('Please fix critical issues before deploying.');
    console.log('');
    process.exit(1);
  }

  // Environment check reminder
  console.log(`${BLUE}💡 Remember to set these environment variables:${NC}`);
  console.log('   • DATABASE_URL (PostgreSQL connection string)');
  console.log('   • BETTER_AUTH_SECRET (32-character secret)');
  console.log('   • NEXT_PUBLIC_APP_URL (your domain)');
  console.log('   • AUTUMN_SECRET_KEY (payment provider key)');
  console.log('');
}

// Run validation if called directly
if (require.main === module) {
  validateSetup()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(`${RED}❌ Validation script failed:${NC}`, error);
      process.exit(1);
    });
}

export { validateSetup };