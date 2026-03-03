#!/usr/bin/env node
/**
 * CLI interface for the JSON component notation parser.
 * 
 * Usage:
 *   npx components-json build <input> --out <dir>
 *   npx components-json watch <input> --out <dir>
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Simple argument parser
interface CliArgs {
  command: 'build' | 'watch' | 'help' | 'version';
  input?: string;
  output?: string;
  prefix?: string;
  elementPrefix?: string;
  minify?: boolean;
}

function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = { command: 'help' };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];

    if (arg === 'build' || arg === 'watch') {
      args.command = arg;
    } else if (arg === '--out' || arg === '-o') {
      args.output = argv[++i];
    } else if (arg === '--prefix' || arg === '-p') {
      args.prefix = argv[++i];
    } else if (arg === '--element-prefix' || arg === '-e') {
      args.elementPrefix = argv[++i];
    } else if (arg === '--minify' || arg === '-m') {
      args.minify = true;
    } else if (arg === '--help' || arg === '-h') {
      args.command = 'help';
    } else if (arg === '--version' || arg === '-v') {
      args.command = 'version';
    } else if (!arg.startsWith('-') && !args.input) {
      args.input = arg;
    }
  }

  return args;
}

function showHelp(): void {
  console.log(`
components-json - JSON Component Notation Parser

Usage:
  components-json build <input> [options]
  components-json watch <input> [options]

Commands:
  build    Parse and generate output files once
  watch    Watch input file for changes and rebuild

Options:
  --out, -o <dir>        Output directory (default: ./dist)
  --prefix, -p <prefix>  CSS class prefix (default: none)
  --element-prefix, -e   Custom element tag prefix (default: cj)
  --minify, -m           Minify output
  --help, -h             Show this help
  --version, -v          Show version

Examples:
  components-json build button.json --out ./dist
  components-json build button.json -o ./dist -p btn -m
`);
}

function showVersion(): void {
  const pkgPath = path.join(__dirname, '..', 'package.json');
  if (fs.existsSync(pkgPath)) {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    console.log(`components-json v${pkg.version}`);
  } else {
    console.log('components-json v0.1.0');
  }
}

async function build(inputPath: string, outputDir: string, options: { prefix?: string; elementPrefix?: string; minify?: boolean }): Promise<void> {
  // Dynamic import for ES modules
  const { generatePackage } = await import('./parser.js');

  const absoluteInput = path.resolve(process.cwd(), inputPath);
  const absoluteOutput = path.resolve(process.cwd(), outputDir);

  console.log(`Building: ${inputPath} → ${outputDir}`);

  try {
    const result = generatePackage(absoluteInput, absoluteOutput, {
      baseDir: process.cwd(),
      classPrefix: options.prefix,
      elementPrefix: options.elementPrefix,
      minify: options.minify,
    });

    console.log(`\n✓ Generated ${result.output.name} component:`);
    console.log(`  - ${result.output.meta.allowedElements.join(', ')} element`);
    
    if (result.output.meta.variants.length > 0) {
      console.log(`  - Variants: ${result.output.meta.variants.join(', ')}`);
    }
    
    if (result.output.meta.slots.length > 0) {
      console.log(`  - Slots: ${result.output.meta.slots.join(', ')}`);
    }

    console.log(`\nFiles written:`);
    result.files.forEach((f: string) => {
      const relative = path.relative(process.cwd(), f);
      console.log(`  ${relative}`);
    });
  } catch (error) {
    console.error(`\n✗ Build failed: ${(error as Error).message}`);
    process.exit(1);
  }
}

async function watch(inputPath: string, outputDir: string, options: { prefix?: string; elementPrefix?: string; minify?: boolean }): Promise<void> {
  const absoluteInput = path.resolve(process.cwd(), inputPath);

  console.log(`Watching: ${inputPath}`);
  console.log('Press Ctrl+C to stop\n');

  // Initial build
  await build(inputPath, outputDir, options);

  // Watch for changes
  let lastMtime = fs.statSync(absoluteInput).mtime.getTime();

  fs.watch(absoluteInput, async (eventType) => {
    if (eventType === 'change') {
      const currentMtime = fs.statSync(absoluteInput).mtime.getTime();
      if (currentMtime > lastMtime) {
        lastMtime = currentMtime;
        console.log('\n--- File changed, rebuilding ---\n');
        await build(inputPath, outputDir, options);
      }
    }
  });
}

// Main entry point
async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  switch (args.command) {
    case 'help':
      showHelp();
      break;

    case 'version':
      showVersion();
      break;

    case 'build':
      if (!args.input) {
        console.error('Error: No input file specified');
        console.log('Run `components-json --help` for usage');
        process.exit(1);
      }
      await build(args.input, args.output || './dist', {
        prefix: args.prefix,
        elementPrefix: args.elementPrefix,
        minify: args.minify,
      });
      break;

    case 'watch':
      if (!args.input) {
        console.error('Error: No input file specified');
        console.log('Run `components-json --help` for usage');
        process.exit(1);
      }
      await watch(args.input, args.output || './dist', {
        prefix: args.prefix,
        elementPrefix: args.elementPrefix,
        minify: args.minify,
      });
      break;
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
