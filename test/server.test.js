import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('OpenAPI MCP Server', () => {
  it('should have main server file', () => {
    const serverPath = path.join(__dirname, '..', 'openapi-mcp.js');
    expect(fs.existsSync(serverPath)).toBe(true);
  });

  it('should have package.json with correct configuration', () => {
    const packagePath = path.join(__dirname, '..', 'package.json');
    expect(fs.existsSync(packagePath)).toBe(true);
    
    const packageContent = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    expect(packageContent.name).toBe('openapi-mcp-server');
    expect(packageContent.type).toBe('module');
    expect(packageContent.bin).toBeDefined();
    expect(packageContent.scripts.test).toBeDefined();
  });

  it('should have OpenAPI spec file', () => {
    const openApiPath = path.join(__dirname, '..', 'openapi.yaml');
    expect(fs.existsSync(openApiPath)).toBe(true);
  });

  it('should have required dependencies', () => {
    const packagePath = path.join(__dirname, '..', 'package.json');
    const packageContent = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    
    const requiredDeps = [
      '@modelcontextprotocol/sdk',
      'chalk',
      'dotenv',
      'undici',
      'js-yaml'
    ];
    
    requiredDeps.forEach(dep => {
      expect(packageContent.dependencies[dep]).toBeDefined();
    });
  });

  it('should have test configuration', () => {
    const vitestConfigPath = path.join(__dirname, '..', 'vitest.config.js');
    expect(fs.existsSync(vitestConfigPath)).toBe(true);
  });
});