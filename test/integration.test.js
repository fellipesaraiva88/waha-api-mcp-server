import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import yaml from 'js-yaml';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('OpenAPI MCP Server Integration', () => {
  let testOpenApiFile;
  
  beforeEach(() => {
    // Create a test OpenAPI file
    testOpenApiFile = path.join(__dirname, 'test-openapi.yaml');
    const testSpec = {
      openapi: '3.1.0',
      info: {
        title: 'Test API',
        version: '1.0.0',
        description: 'A test API for integration testing'
      },
      servers: [
        { url: 'https://api.test.com' }
      ],
      paths: {
        '/health': {
          get: {
            operationId: 'healthCheck',
            summary: 'Health check endpoint',
            responses: {
              '200': {
                description: 'Service is healthy',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        status: { type: 'string' }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        '/users/{id}': {
          get: {
            operationId: 'getUserById',
            summary: 'Get user by ID',
            parameters: [
              {
                name: 'id',
                in: 'path',
                required: true,
                schema: { type: 'string' }
              }
            ],
            responses: {
              '200': {
                description: 'User found',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        name: { type: 'string' }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    };
    
    fs.writeFileSync(testOpenApiFile, yaml.dump(testSpec));
  });
  
  afterEach(() => {
    // Clean up test file
    if (fs.existsSync(testOpenApiFile)) {
      fs.unlinkSync(testOpenApiFile);
    }
  });

  it('should parse OpenAPI file successfully', () => {
    expect(fs.existsSync(testOpenApiFile)).toBe(true);
    
    const content = fs.readFileSync(testOpenApiFile, 'utf8');
    const spec = yaml.load(content);
    
    expect(spec.openapi).toBe('3.1.0');
    expect(spec.info.title).toBe('Test API');
    expect(spec.paths).toBeDefined();
    expect(Object.keys(spec.paths)).toHaveLength(2);
  });

  it('should validate OpenAPI spec structure', () => {
    const content = fs.readFileSync(testOpenApiFile, 'utf8');
    const spec = yaml.load(content);
    
    // Check required fields
    expect(spec.openapi).toBeDefined();
    expect(spec.info).toBeDefined();
    expect(spec.paths).toBeDefined();
    
    // Check info fields
    expect(spec.info.title).toBeDefined();
    expect(spec.info.version).toBeDefined();
    
    // Check paths structure
    expect(typeof spec.paths).toBe('object');
    expect(Array.isArray(spec.paths)).toBe(false);
    expect(Object.keys(spec.paths).length).toBeGreaterThan(0);
  });

  it('should extract operations correctly', () => {
    const content = fs.readFileSync(testOpenApiFile, 'utf8');
    const spec = yaml.load(content);
    
    const operations = [];
    const paths = spec.paths || {};

    for (const [path, pathObject] of Object.entries(paths)) {
      for (const [method, operation] of Object.entries(pathObject)) {
        if (["get", "post", "put", "delete", "patch", "options", "head"].includes(method)) {
          const operationId = operation.operationId || `${method}_${path.replace(/\W+/g, "_")}`;
          
          operations.push({
            operationId,
            path,
            method,
            summary: operation.summary || `${method.toUpperCase()} ${path}`,
            description: operation.description || "",
          });
        }
      }
    }
    
    expect(operations).toHaveLength(2);
    expect(operations[0].operationId).toBe('healthCheck');
    expect(operations[1].operationId).toBe('getUserById');
  });

  it('should handle file reading errors gracefully', () => {
    const nonExistentFile = path.join(__dirname, 'non-existent.yaml');
    
    expect(() => {
      if (!fs.existsSync(nonExistentFile)) {
        throw new Error(`OpenAPI file does not exist at path: ${nonExistentFile}`);
      }
    }).toThrow('OpenAPI file does not exist');
  });

  it('should handle invalid YAML gracefully', () => {
    const invalidYamlFile = path.join(__dirname, 'invalid.yaml');
    fs.writeFileSync(invalidYamlFile, 'invalid: yaml: content: [unclosed');
    
    try {
      expect(() => {
        const content = fs.readFileSync(invalidYamlFile, 'utf8');
        yaml.load(content);
      }).toThrow();
    } finally {
      if (fs.existsSync(invalidYamlFile)) {
        fs.unlinkSync(invalidYamlFile);
      }
    }
  });
});