#!/usr/bin/env tsx

/**
 * Next.js Package Verification Script
 * 
 * This script performs comprehensive pre-flight checks to ensure all Next.js
 * dependencies are properly installed before starting the development server.
 * It prevents the "Next.js package not found" Turbopack error.
 */

import { existsSync } from 'fs';
import { join } from 'path';

const RED = '\x1b[0;31m';
const GREEN = '\x1b[0;32m';
const YELLOW = '\x1b[1;33m';
const BLUE = '\x1b[0;34m';
const NC = '\x1b[0m'; // No Color

interface PackageCheck {
  name: string;
  critical: boolean;
  minVersion?: string;
  description: string;
}

interface PackageInfo {
  version?: string;
  exists: boolean;
}

const REQUIRED_PACKAGES: PackageCheck[] = [
  {
    name: 'next',
    critical: true,
    minVersion: '15.0.0',
    description: 'Next.js core framework'
  },
  {
    name: 'react',
    critical: true,
    minVersion: '19.0.0',
    description: 'React library'
  },
  {
    name: 'react-dom',
    critical: true,
    minVersion: '19.0.0',
    description: 'React DOM rendering'
  },
  {
    name: 'typescript',
    critical: true,
    minVersion: '5.0.0',
    description: 'TypeScript compiler'
  },
  {
    name: 'tailwindcss',
    critical: true,
    description: 'Tailwind CSS framework'
  },
  {
    name: '@tailwindcss/postcss',
    critical: true,
    description: 'Tailwind CSS PostCSS plugin'
  },
  {
    name: 'better-auth',
    critical: true,
    description: 'Authentication library'
  },
  {
    name: 'drizzle-orm',
    critical: true,
    description: 'Database ORM'
  }
];

function getPackageInfo(packageName: string): PackageInfo {
  try {
    const packagePath = join(process.cwd(), 'node_modules', packageName, 'package.json');
    
    if (!existsSync(packagePath)) {
      return { exists: false };
    }
    
    const packageJson = require(packagePath);
    return {
      exists: true,
      version: packageJson.version
    };
  } catch (error) {
    return { exists: false };
  }
}

function compareVersions(current: string, required: string): boolean {
  const parseVersion = (v: string) => v.split('.').map(n => parseInt(n, 10));
  const currentParts = parseVersion(current);
  const requiredParts = parseVersion(required);
  
  for (let i = 0; i < Math.max(currentParts.length, requiredParts.length); i++) {
    const currentPart = currentParts[i] || 0;
    const requiredPart = requiredParts[i] || 0;
    
    if (currentPart > requiredPart) return true;
    if (currentPart < requiredPart) return false;
  }
  
  return true;
}

function checkNodeModulesExists(): boolean {
  const nodeModulesPath = join(process.cwd(), 'node_modules');
  return existsSync(nodeModulesPath);
}

function checkPackageLockExists(): boolean {
  const packageLockPath = join(process.cwd(), 'package-lock.json');
  return existsSync(packageLockPath);
}

async function verifyNextjsSetup(silent: boolean = false): Promise<boolean> {
  if (!silent) {
    console.log(`${BLUE}🔍 Verifying Next.js packages...${NC}\n`);
  }

  let hasErrors = false;
  let hasCriticalErrors = false;

  // Check if node_modules exists
  if (!checkNodeModulesExists()) {
    console.error(`${RED}❌ node_modules directory not found!${NC}`);
    console.error(`${YELLOW}   Run 'npm install' to install dependencies${NC}\n`);
    return false;
  }

  // Check if package-lock.json exists
  if (!checkPackageLockExists()) {
    console.warn(`${YELLOW}⚠️  package-lock.json not found${NC}`);
    console.warn(`${YELLOW}   This may cause dependency version inconsistencies${NC}\n`);
  }

  // Check each required package
  const results: Array<{
    package: PackageCheck;
    info: PackageInfo;
    passed: boolean;
    message: string;
  }> = [];

  for (const pkg of REQUIRED_PACKAGES) {
    const info = getPackageInfo(pkg.name);
    let passed = info.exists;
    let message = '';

    if (!info.exists) {
      message = 'Not installed';
      hasErrors = true;
      if (pkg.critical) {
        hasCriticalErrors = true;
      }
    } else if (pkg.minVersion && info.version) {
      if (!compareVersions(info.version, pkg.minVersion)) {
        passed = false;
        message = `Version ${info.version} < required ${pkg.minVersion}`;
        hasErrors = true;
        if (pkg.critical) {
          hasCriticalErrors = true;
        }
      } else {
        message = `v${info.version}`;
      }
    } else {
      message = info.version ? `v${info.version}` : 'Installed';
    }

    results.push({ package: pkg, info, passed, message });
  }

  // Display results
  if (!silent) {
    console.log(`${BLUE}Package Status:${NC}`);
    console.log('─'.repeat(60));
    
    for (const result of results) {
      const icon = result.passed ? '✅' : (result.package.critical ? '❌' : '⚠️');
      const color = result.passed ? GREEN : (result.package.critical ? RED : YELLOW);
      const status = result.passed ? 'OK' : 'MISSING';
      
      console.log(
        `${icon} ${color}${result.package.name.padEnd(25)}${NC} ` +
        `${result.message.padEnd(20)} ` +
        `${result.package.description}`
      );
    }
    
    console.log('─'.repeat(60));
  }

  // Summary and recommendations
  if (hasCriticalErrors) {
    console.error(`\n${RED}❌ Critical Next.js packages are missing!${NC}`);
    console.error(`${RED}   Turbopack will fail to start without these packages.${NC}`);
    console.error(`\n${YELLOW}🔧 To fix this issue:${NC}`);
    console.error(`   1. Run: ${GREEN}npm install${NC}`);
    console.error(`   2. If errors persist, try: ${GREEN}rm -rf node_modules package-lock.json && npm install${NC}`);
    console.error(`   3. Then run: ${GREEN}npm run dev${NC}\n`);
    return false;
  } else if (hasErrors) {
    console.warn(`\n${YELLOW}⚠️  Some optional packages are missing${NC}`);
    console.warn(`   Run 'npm install' to ensure all dependencies are installed\n`);
    return true; // Non-critical errors don't block startup
  } else {
    if (!silent) {
      console.log(`\n${GREEN}✅ All Next.js packages are properly installed!${NC}\n`);
    }
    return true;
  }
}

// Quick check function for use in scripts
async function quickNextjsCheck(): Promise<boolean> {
  // Only check critical packages
  const criticalPackages = ['next', 'react', 'react-dom'];
  
  if (!checkNodeModulesExists()) {
    return false;
  }
  
  for (const pkgName of criticalPackages) {
    const info = getPackageInfo(pkgName);
    if (!info.exists) {
      return false;
    }
  }
  
  return true;
}

// Run verification if called directly
if (require.main === module) {
  verifyNextjsSetup()
    .then(result => {
      process.exit(result ? 0 : 1);
    })
    .catch(error => {
      console.error(`${RED}❌ Verification failed:${NC}`, error);
      process.exit(1);
    });
}

export { verifyNextjsSetup, quickNextjsCheck };