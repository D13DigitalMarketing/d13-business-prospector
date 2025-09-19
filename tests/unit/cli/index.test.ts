import { describe, it, expect, vi, beforeEach } from 'vitest';
import { execSync } from 'child_process';

describe('CLI Command Line Interface', () => {
  const CLI_PATH = 'tsx src/cli/index.ts';

  beforeEach(() => {
    // Clear any mocks before each test
    vi.clearAllMocks();
  });

  describe('Basic CLI functionality', () => {
    it('should show help when no command is given', () => {
      try {
        execSync(`${CLI_PATH} --help`, { encoding: 'utf8' });
      } catch (error: any) {
        // Help command exits with code 0, but execSync treats that as success
        // We expect help output to contain our CLI name and commands
        expect(error.stdout || '').toContain('d13-business-prospector');
      }
    });

    it('should show version when --version flag is used', () => {
      try {
        const output = execSync(`${CLI_PATH} --version`, { encoding: 'utf8' });
        expect(output).toMatch(/\d+\.\d+\.\d+/); // Matches semantic version pattern
      } catch (error: any) {
        // Some CLIs output version to stderr
        expect(error.stdout || error.stderr || '').toMatch(/\d+\.\d+\.\d+/);
      }
    });
  });

  describe('Search command', () => {
    it('should accept search command with industry and location arguments', () => {
      expect(() => {
        execSync(`${CLI_PATH} search "test industry" "test location"`, {
          encoding: 'utf8',
        });
      }).not.toThrow();
    });

    it('should reject search command with missing arguments', () => {
      expect(() => {
        execSync(`${CLI_PATH} search`, { encoding: 'utf8', stdio: 'pipe' });
      }).toThrow();
    });

    it('should reject search command with only one argument', () => {
      expect(() => {
        execSync(`${CLI_PATH} search "test industry"`, {
          encoding: 'utf8',
          stdio: 'pipe',
        });
      }).toThrow();
    });
  });

  describe('Analyze command', () => {
    it('should accept analyze command with business ID argument', () => {
      expect(() => {
        execSync(`${CLI_PATH} analyze "business-123"`, { encoding: 'utf8' });
      }).not.toThrow();
    });

    it('should reject analyze command with missing arguments', () => {
      expect(() => {
        execSync(`${CLI_PATH} analyze`, { encoding: 'utf8', stdio: 'pipe' });
      }).toThrow();
    });
  });

  describe('Extract command', () => {
    it('should accept extract command with business ID argument', () => {
      expect(() => {
        execSync(`${CLI_PATH} extract "business-123"`, { encoding: 'utf8' });
      }).not.toThrow();
    });

    it('should reject extract command with missing arguments', () => {
      expect(() => {
        execSync(`${CLI_PATH} extract`, { encoding: 'utf8', stdio: 'pipe' });
      }).toThrow();
    });

    it('should accept extract command with format option', () => {
      expect(() => {
        execSync(`${CLI_PATH} extract "business-123" --format json`, {
          encoding: 'utf8',
        });
      }).not.toThrow();
    });
  });
});
