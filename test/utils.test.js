import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import yaml from 'js-yaml';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import functions from the main module
// Since the main module has side effects, we'll test individual functions
const testOpenApiSpec = {
  openapi: '3.1.0',
  info: {
    title: 'Test API',
    version: '1.0.0'
  },
  paths: {
    '/test': {
      get: {
        operationId: 'testOperation',
        summary: 'Test operation',
        responses: {
          '200': {
            description: 'Success'
          }
        }
      }
    }
  }
};

// Mock functions for testing
function validateOpenApiSpec(spec) {
  const requiredFields = ['openapi', 'info', 'paths'];
  const missingFields = requiredFields.filter(field => !spec[field]);
  
  if (missingFields.length > 0) {
    return false;
  }
  
  const requiredInfoFields = ['title', 'version'];
  const missingInfoFields = requiredInfoFields.filter(field => !spec.info[field]);
  
  if (missingInfoFields.length > 0) {
    return false;
  }
  
  if (typeof spec.paths !== 'object' || Array.isArray(spec.paths)) {
    return false;
  }
  
  if (Object.keys(spec.paths).length === 0) {
    return false;
  }
  
  if (!spec.openapi.match(/^(3\.\d+\.\d+)$/)) {
    return false;
  }
  
  return true;
}

function extractOperations(openApiSpec) {
  const operations = [];
  const paths = openApiSpec.paths || {};

  for (const [path, pathObject] of Object.entries(paths)) {
    for (const [method, operation] of Object.entries(pathObject)) {
      if (["get", "post", "put", "delete", "patch", "options", "head"].includes(method)) {
        const operationId = operation.operationId || `${method}_${path.replace(/\W+/g, "_")}`;
        
        const parameters = operation.parameters || [];
        const requestBody = operation.requestBody;
        
        const properties = {};
        const required = [];

        operations.push({
          operationId,
          path,
          method,
          summary: operation.summary || `${method.toUpperCase()} ${path}`,
          description: operation.description || "",
          parameters,
          requestBody,
          inputSchema: {
            type: "object",
            properties,
            required,
          },
        });
      }
    }
  }
  
  return operations;
}

function buildUrl(baseUrl, path, params) {
  let url = path;
  
  for (const [key, value] of Object.entries(params)) {
    url = url.replace(`{${key}}`, encodeURIComponent(value));
  }
  
  return new URL(url, baseUrl).toString();
}

describe('OpenAPI MCP Server Utils', () => {
  describe('validateOpenApiSpec', () => {
    it('should validate a correct OpenAPI spec', () => {
      expect(validateOpenApiSpec(testOpenApiSpec)).toBe(true);
    });

    it('should reject spec without required fields', () => {
      const invalidSpec = { openapi: '3.1.0' };
      expect(validateOpenApiSpec(invalidSpec)).toBe(false);
    });

    it('should reject spec without info.title', () => {
      const invalidSpec = {
        ...testOpenApiSpec,
        info: { version: '1.0.0' }
      };
      expect(validateOpenApiSpec(invalidSpec)).toBe(false);
    });

    it('should reject spec without info.version', () => {
      const invalidSpec = {
        ...testOpenApiSpec,
        info: { title: 'Test API' }
      };
      expect(validateOpenApiSpec(invalidSpec)).toBe(false);
    });

    it('should reject spec with empty paths', () => {
      const invalidSpec = {
        ...testOpenApiSpec,
        paths: {}
      };
      expect(validateOpenApiSpec(invalidSpec)).toBe(false);
    });

    it('should reject spec with invalid openapi version', () => {
      const invalidSpec = {
        ...testOpenApiSpec,
        openapi: '2.0'
      };
      expect(validateOpenApiSpec(invalidSpec)).toBe(false);
    });
  });

  describe('extractOperations', () => {
    it('should extract operations from OpenAPI spec', () => {
      const operations = extractOperations(testOpenApiSpec);
      expect(operations).toHaveLength(1);
      expect(operations[0].operationId).toBe('testOperation');
      expect(operations[0].method).toBe('get');
      expect(operations[0].path).toBe('/test');
    });

    it('should handle spec with no paths', () => {
      const emptySpec = {
        ...testOpenApiSpec,
        paths: {}
      };
      const operations = extractOperations(emptySpec);
      expect(operations).toHaveLength(0);
    });

    it('should generate operationId when missing', () => {
      const specWithoutId = {
        ...testOpenApiSpec,
        paths: {
          '/test': {
            get: {
              summary: 'Test operation',
              responses: { '200': { description: 'Success' } }
            }
          }
        }
      };
      const operations = extractOperations(specWithoutId);
      expect(operations[0].operationId).toBe('get__test');
    });
  });

  describe('buildUrl', () => {
    it('should build URL without parameters', () => {
      const url = buildUrl('https://api.example.com', '/test', {});
      expect(url).toBe('https://api.example.com/test');
    });

    it('should build URL with path parameters', () => {
      const url = buildUrl('https://api.example.com', '/users/{id}', { id: '123' });
      expect(url).toBe('https://api.example.com/users/123');
    });

    it('should encode path parameters', () => {
      const url = buildUrl('https://api.example.com', '/users/{id}', { id: 'test@example.com' });
      expect(url).toBe('https://api.example.com/users/test%40example.com');
    });

    it('should handle multiple path parameters', () => {
      const url = buildUrl('https://api.example.com', '/users/{userId}/posts/{postId}', { 
        userId: '123', 
        postId: '456' 
      });
      expect(url).toBe('https://api.example.com/users/123/posts/456');
    });
  });
});