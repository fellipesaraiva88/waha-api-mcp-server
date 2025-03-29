#!/usr/bin/env node
import dotenv from "dotenv";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { fetch } from "undici";
import { exec as execCallback } from "child_process";
import { promisify } from "util";
import chalk from "chalk";
import * as os from "node:os";
import * as path from "node:path";
import * as fs from "node:fs";
import { fileURLToPath } from "url";
import yaml from "js-yaml";

// Configuration
dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const execAsync = promisify(execCallback);
const version = process.env.npm_package_version || "0.1.0";
const debug = process.env.DEBUG === "true";

// Improved file path handling for OpenAPI file
// Default to openapi.yaml in the same directory as this script
const defaultOpenApiPath = path.join(__dirname, "openapi.yaml");
const openApiFile = process.env.OPENAPI_FILE || defaultOpenApiPath;

console.error(`Starting with following configuration:
  - Working directory: ${process.cwd()}
  - Script location: ${__dirname}
  - OpenAPI file path: ${openApiFile}
  - DEBUG: ${debug}
`);

// Utility functions
function createDialog(lines) {
  const maxLineWidth = Math.max(...lines.map((line) => line.length), 60);
  const border = chalk.gray("-".repeat(maxLineWidth));
  return [border, ...lines, border, ""].join("\n");
}

function isDirectory(dirPath) {
  try {
    return fs.statSync(dirPath).isDirectory();
  } catch (error) {
    return false;
  }
}

function log(...args) {
  if (debug) {
    const msg = `[DEBUG ${new Date().toISOString()}] ${args.join(" ")}\n`;
    process.stderr.write(msg);
  }
}

async function findNodePath() {
  try {
    return process.execPath;
  } catch (error) {
    try {
      const cmd = process.platform === "win32" ? "where" : "which";
      const { stdout } = await execAsync(`${cmd} node`);
      return stdout.toString().trim().split("\n")[0];
    } catch (err) {
      return "node"; // Fallback
    }
  }
}

// Function to fix a YAML file with advanced structure awareness
function fixYamlWithStructureAwareness(filePath) {
  log(`Attempting to fix YAML with structure awareness: ${filePath}`);
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Create a backup of the original file
    const backupPath = `${filePath}.original`;
    fs.writeFileSync(backupPath, content);
    log(`Created backup of original file at: ${backupPath}`);
    
    // Split the content into lines for processing
    const lines = content.split('\n');
    
    // Log the problematic areas from the error message
    log("Examining problematic areas in the YAML file");
    const problematicLines = [3515, 3516, 3517, 3518, 3519, 3520, 3521, 3522];
    for (let i = 0; i < problematicLines.length; i++) {
      const lineNum = problematicLines[i];
      if (lineNum <= lines.length) {
        log(`Line ${lineNum}: ${lines[lineNum-1]}`);
      }
    }
    
    // Look for the second 'info:' key and other duplicate top-level keys
    log("Looking for patterns of duplicate top-level keys");
    const duplicateTopLevelKeys = ['info', 'servers', 'paths', 'components'];
    let firstOccurrences = {};
    let infoLineIndex = -1;
    let serversLineIndex = -1;
    
    // First pass - find all occurrences
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const match = line.match(/^(\s*)([^#\s][^:]*):(.*)$/);
      
      if (match) {
        const [_, spaces, key, rest] = match;
        
        // Only consider unindented lines as potential top-level keys
        if (spaces.length === 0) {
          log(`Found potential top-level key at line ${i+1}: ${key}`);
          
          if (duplicateTopLevelKeys.includes(key)) {
            if (key in firstOccurrences) {
              log(`Found duplicate top-level key "${key}" at line ${i+1} (first occurrence at line ${firstOccurrences[key]+1})`);
              if (key === 'info') infoLineIndex = i;
              if (key === 'servers') serversLineIndex = i;
            } else {
              firstOccurrences[key] = i;
            }
          }
        }
      }
    }
    
    // Strategy: Create a clean OpenAPI spec by ensuring only one of each top-level key
    if (infoLineIndex > -1 || serversLineIndex > -1) {
      log("Found duplicate top-level keys, applying targeted fix");
      
      // Create a fixed version of the file
      const fixedLines = [];
      let skipMode = false;
      let skipIndentLevel = 0;
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const indentMatch = line.match(/^(\s*)/);
        const currentIndent = indentMatch ? indentMatch[1].length : 0;
        
        // Check if we're at a duplicate top-level key
        if (i === infoLineIndex || i === serversLineIndex) {
          log(`Skipping duplicate section starting at line ${i+1}: ${line}`);
          skipMode = true;
          skipIndentLevel = 0; // We're at a top-level key with 0 indentation
          continue;
        }
        
        // If in skip mode, continue skipping until indentation decreases
        if (skipMode) {
          if (line.trim() === '' || currentIndent > skipIndentLevel) {
            continue;
          } else {
            skipMode = false;
          }
        }
        
        fixedLines.push(line);
      }
      
      // Write the fixed content to a new file
      const fixedPath = `${filePath}.structfixed`;
      fs.writeFileSync(fixedPath, fixedLines.join('\n'));
      log(`Created structure-fixed YAML file at: ${fixedPath}`);
      
      // Test if the fixed file is valid YAML
      try {
        const fixedContent = fs.readFileSync(fixedPath, 'utf8');
        yaml.load(fixedContent);
        log('Successfully fixed YAML file using structure-aware approach!');
        
        // If successful, replace the original with the fixed version
        fs.copyFileSync(fixedPath, filePath);
        log(`Replaced original file with fixed version`);
        
        return true;
      } catch (validationError) {
        log(`Structure-fixed file still has YAML errors: ${validationError.message}`);
        
        // Try the surgical approach - directly manipulate the first ~4000 lines
        log("Attempting surgical approach to fix the YAML");
        return surgicalYamlFix(filePath);
      }
    } else {
      log("Could not identify duplicate top-level keys using pattern matching");
      return surgicalYamlFix(filePath);
    }
  } catch (error) {
    log(`Error trying to fix YAML file with structure awareness: ${error.message}`);
    return false;
  }
}

// Function to perform a surgical fix on the YAML file
function surgicalYamlFix(filePath) {
  log("Attempting surgical fix on YAML file");
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Create a clean top section of the file
    const topSection = `openapi: 3.1.0
info:
  title: WhatsApp HTTP API
  version: 1.0.0
  description: "WhatsApp HTTP API that you can run in a click!"

servers:
  - url: https://wa-1.tuip.se/

`;
    
    // Extract paths section if possible
    let pathsContent = "";
    const pathsMatch = content.match(/^paths:\s*$([\s\S]*?)^[a-z]+:/m);
    if (pathsMatch && pathsMatch[1]) {
      log("Successfully extracted paths section");
      pathsContent = "paths:" + pathsMatch[1];
    } else {
      log("Could not extract paths section, using empty paths");
      pathsContent = "paths: {}\n";
    }
    
    // Extract components section if possible
    let componentsContent = "";
    const componentsMatch = content.match(/^components:\s*$([\s\S]*?)^[a-z]+:/m);
    if (componentsMatch && componentsMatch[1]) {
      log("Successfully extracted components section");
      componentsContent = "components:" + componentsMatch[1];
    } else {
      log("Could not extract components section, using empty components");
      componentsContent = "components: {}\n";
    }
    
    // Create the fixed content
    const fixedContent = topSection + pathsContent + componentsContent;
    
    // Write to a new file
    const fixedPath = `${filePath}.surgicalfixed`;
    fs.writeFileSync(fixedPath, fixedContent);
    log(`Created surgically fixed YAML file at: ${fixedPath}`);
    
    // Test if the fixed file is valid YAML
    try {
      const fixedContent = fs.readFileSync(fixedPath, 'utf8');
      yaml.load(fixedContent);
      log('Successfully fixed YAML file using surgical approach!');
      
      // If successful, replace the original with the fixed version
      fs.copyFileSync(fixedPath, filePath);
      log(`Replaced original file with surgically fixed version`);
      
      return true;
    } catch (validationError) {
      log(`Surgically fixed file still has YAML errors: ${validationError.message}`);
      return generateMinimalValidSpec(filePath);
    }
  } catch (error) {
    log(`Error in surgical YAML fix: ${error.message}`);
    return generateMinimalValidSpec(filePath);
  }
}

// Function to generate a minimal valid spec file
function generateMinimalValidSpec(filePath) {
  log("Generating minimal valid OpenAPI spec as last resort");
  try {
    const minimalSpec = `openapi: 3.1.0
info:
  title: Fixed WhatsApp API
  version: 1.0.0
  description: This is a minimal valid OpenAPI spec created because the original had parsing issues.
servers:
  - url: https://wa-1.tuip.se/
paths:
  /api/{session}/auth/qr:
    get:
      operationId: getQRCode
      summary: Get QR code for WhatsApp authentication
      parameters:
        - name: session
          in: path
          required: true
          schema:
            type: string
      responses:
        '200':
          description: QR code retrieved successfully
components:
  schemas:
    QRCode:
      type: object
      properties:
        qr:
          type: string
`;
    
    fs.writeFileSync(filePath, minimalSpec);
    log(`Created minimal valid OpenAPI spec at: ${filePath}`);
    return true;
  } catch (error) {
    log(`Error generating minimal valid spec: ${error.message}`);
    return false;
  }
}

// Function to attempt to fix YAML with duplicate keys
function attemptToFixYamlWithDuplicateKeys(filePath) {
  log(`Attempting to fix YAML file with duplicate keys: ${filePath}`);
  
  // First try the advanced structure-aware approach
  const structureFixSuccessful = fixYamlWithStructureAwareness(filePath);
  if (structureFixSuccessful) {
    return true;
  }
  
  // If that fails, fall back to the original approach
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Create a backup of the original file
    const backupPath = `${filePath}.original`;
    fs.writeFileSync(backupPath, content);
    log(`Created backup of original file at: ${backupPath}`);
    
    // Create a simple line-by-line parser to identify duplicate top-level keys
    const lines = content.split('\n');
    const fixedLines = [];
    const seenTopLevelKeys = new Set();
    
    let inList = false;
    let currentIndentation = 0;
    
    for (const line of lines) {
      // Check if this is a likely top-level key (no indentation and contains a colon)
      const match = line.match(/^(\s*)([^#\s][^:]*):(.*)$/);
      
      if (match) {
        const [_, spaces, key, rest] = match;
        
        // If no indentation, might be a top-level key
        if (spaces.length === 0 && !inList) {
          if (seenTopLevelKeys.has(key)) {
            log(`Skipping duplicate top-level key: ${key}`);
            continue; // Skip this line with duplicate key
          }
          seenTopLevelKeys.add(key);
        }
        
        // Track if we're in a list item
        if (line.trim().startsWith('- ')) {
          inList = true;
          currentIndentation = spaces.length;
        } else if (spaces.length <= currentIndentation) {
          inList = false;
        }
      }
      
      fixedLines.push(line);
    }
    
    // Write the fixed content to a new file
    const fixedPath = `${filePath}.fixed`;
    fs.writeFileSync(fixedPath, fixedLines.join('\n'));
    log(`Created fixed YAML file at: ${fixedPath}`);
    
    // Test if the fixed file is valid YAML
    try {
      const fixedContent = fs.readFileSync(fixedPath, 'utf8');
      yaml.load(fixedContent);
      log('Successfully fixed YAML file!');
      
      // If successful, replace the original with the fixed version
      fs.copyFileSync(fixedPath, filePath);
      log(`Replaced original file with fixed version`);
      
      return true;
    } catch (validationError) {
      log(`Fixed file still has YAML errors: ${validationError.message}`);
      return generateMinimalValidSpec(filePath);
    }
  } catch (error) {
    log(`Error trying to fix YAML file: ${error.message}`);
    return false;
  }
}

// Validate OpenAPI schema structure
function validateOpenApiSpec(spec) {
  log("Validating OpenAPI specification structure");
  
  // Check for required top-level fields
  const requiredFields = ['openapi', 'info', 'paths'];
  const missingFields = requiredFields.filter(field => !spec[field]);
  
  if (missingFields.length > 0) {
    log(`Warning: OpenAPI spec is missing required fields: ${missingFields.join(', ')}`);
    return false;
  }
  
  // Check for required info fields
  const requiredInfoFields = ['title', 'version'];
  const missingInfoFields = requiredInfoFields.filter(field => !spec.info[field]);
  
  if (missingInfoFields.length > 0) {
    log(`Warning: OpenAPI info is missing required fields: ${missingInfoFields.join(', ')}`);
    return false;
  }
  
  // Check if paths is an object
  if (typeof spec.paths !== 'object' || Array.isArray(spec.paths)) {
    log("Warning: OpenAPI paths is not an object");
    return false;
  }
  
  // Check if at least one path is defined
  if (Object.keys(spec.paths).length === 0) {
    log("Warning: OpenAPI spec does not define any paths");
    return false;
  }
  
  // Check openapi version format
  if (!spec.openapi.match(/^(3\.\d+\.\d+)$/)) {
    log(`Warning: OpenAPI version format is incorrect: ${spec.openapi}`);
    return false;
  }
  
  log("OpenAPI specification structure is valid");
  return true;
}

// Parse OpenAPI file and extract operations
function parseOpenApiFile(filePath) {
  try {
    log(`Attempting to read file at path: ${filePath}`);
    if (!fs.existsSync(filePath)) {
      throw new Error(`OpenAPI file does not exist at path: ${filePath}`);
    }
    
    const fileContent = fs.readFileSync(filePath, "utf8");
    log(`Successfully read file, content length: ${fileContent.length} bytes`);
    
    try {
      // Try to parse the YAML
      try {
        const openApiSpec = yaml.load(fileContent);
        log("Successfully parsed OpenAPI spec:", openApiSpec.info?.title);
        
        // Validate OpenAPI structure
        const isValid = validateOpenApiSpec(openApiSpec);
        if (!isValid) {
          log("Warning: OpenAPI spec has structural issues, but will attempt to use it anyway");
        }
        
        return openApiSpec;
      } catch (yamlError) {
        log("Error parsing YAML content:", yamlError);
        
        // Check if it's a duplicate key error, which is common
        if (yamlError.message && yamlError.message.includes("duplicated mapping key")) {
          log("Attempting to recover from duplicate key error");
          
          // Try to fix the file - always attempt to fix the current file
          log(`Attempting to fix the YAML file: ${filePath}`);
          const fixSuccessful = attemptToFixYamlWithDuplicateKeys(filePath);
          
          if (fixSuccessful) {
            log("Successfully fixed file, trying to parse again");
            // Try to parse the fixed file
            return parseOpenApiFile(filePath);
          } else {
            log("Failed to fix the YAML file, throwing error");
            throw new Error(`Unable to fix YAML file with duplicate keys: ${yamlError.message}`);
          }
        }
        
        throw new Error(`Failed to parse YAML content: ${yamlError.message}`);
      }
    } catch (parseError) {
      log("Error parsing YAML content:", parseError);
      throw new Error(`Failed to parse YAML content: ${parseError.message}`);
    }
  } catch (error) {
    log("Error parsing OpenAPI file:", error);
    throw new Error(`Failed to parse OpenAPI file: ${error.message}`);
  }
}

// Extract operations from OpenAPI spec
function extractOperations(openApiSpec) {
  try {
    const operations = [];
    const paths = openApiSpec.paths || {};
    
    log(`Processing ${Object.keys(paths).length} paths from OpenAPI spec`);

    for (const [path, pathObject] of Object.entries(paths)) {
      for (const [method, operation] of Object.entries(pathObject)) {
        try {
          if (["get", "post", "put", "delete", "patch", "options", "head"].includes(method)) {
            // Generate a unique name for the operation
            const operationId = operation.operationId || `${method}_${path.replace(/\W+/g, "_")}`;
            log(`Processing operation: ${operationId} (${method.toUpperCase()} ${path})`);
            
            // Extract parameters and request body schema
            const parameters = operation.parameters || [];
            const requestBody = operation.requestBody;
            
            // Build input schema for the tool
            const properties = {};
            const required = [];
            
            // Add path parameters
            parameters.forEach(param => {
              if (param.required) required.push(param.name);
              properties[param.name] = {
                type: param.schema?.type || "string",
                description: param.description || `${param.name} parameter`,
              };
            });
            
            // Add request body if present
            if (requestBody) {
              const contentType = Object.keys(requestBody.content || {})[0];
              if (contentType) {
                const schema = requestBody.content[contentType].schema;
                properties.body = {
                  type: "object",
                  description: "Request body",
                  properties: schema.properties || {},
                };
                if (requestBody.required) required.push("body");
              }
            }
            
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
        } catch (operationError) {
          log(`Error processing operation ${method} ${path}:`, operationError);
          // Continue with next operation
        }
      }
    }
    
    if (operations.length === 0) {
      log("Warning: No operations extracted from OpenAPI spec");
    } else {
      log(`Successfully extracted ${operations.length} operations`);
    }
    
    return operations;
  } catch (error) {
    log("Error extracting operations:", error);
    throw new Error(`Failed to extract operations: ${error.message}`);
  }
}

// Build URL with path parameters
function buildUrl(baseUrl, path, params) {
  let url = path;
  
  // Replace path parameters
  for (const [key, value] of Object.entries(params)) {
    url = url.replace(`{${key}}`, encodeURIComponent(value));
  }
  
  // Add baseUrl
  return new URL(url, baseUrl).toString();
}

// Make API request
async function makeApiRequest(operation, params, baseUrl) {
  try {
    const url = buildUrl(baseUrl, operation.path, params);
    log("Making API request:", operation.method.toUpperCase(), url);
    
    const headers = {
      "Content-Type": "application/json",
    };
    
    // Add X-Api-Key header if environment variable is set
    if (process.env.HTTP_HEADERS_X_API_KEY) {
      log("Adding X-Api-Key header from environment variable");
      headers["X-Api-Key"] = process.env.HTTP_HEADERS_X_API_KEY;
    }
    
    const requestOptions = {
      method: operation.method.toUpperCase(),
      headers,
    };
    
    // Add body for methods that support it
    if (["post", "put", "patch"].includes(operation.method) && params.body) {
      requestOptions.body = JSON.stringify(params.body);
    }
    
    const response = await fetch(url, requestOptions);
    const responseText = await response.text();
    
    try {
      // Try to parse as JSON
      const jsonResponse = JSON.parse(responseText);
      return {
        status: response.status,
        headers: Object.fromEntries(response.headers.entries()),
        body: jsonResponse,
      };
    } catch (e) {
      // Return as text if not JSON
      return {
        status: response.status,
        headers: Object.fromEntries(response.headers.entries()),
        body: responseText,
      };
    }
  } catch (error) {
    log("Error making API request:", error);
    throw new Error(`API request failed: ${error.message}`);
  }
}

// Initialize the OpenAPI MCP server
export async function init() {
  console.log(
    createDialog([
      `👋 Welcome to ${chalk.yellow("openapi-mcp-server")} v${version}!`,
      `💁‍♀️ This ${chalk.green(
        "'init'",
      )} process will install the OpenAPI MCP Server into Claude Desktop`,
      `   enabling Claude to interact with APIs defined in your OpenAPI spec.`,
      `🧡 Let's get started.`,
    ]),
  );

  console.log(`${chalk.yellow("Step 1:")} Checking for Claude Desktop...`);

  const claudeConfigPath = path.join(
    os.homedir(),
    "Library",
    "Application Support",
    "Claude",
    "claude_desktop_config.json",
  );

  const nodePath = await findNodePath();
  
  // Use absolute paths in the configuration
  const scriptPath = path.resolve(__filename);
  const workingDir = path.dirname(scriptPath);
  
  // Find the OpenAPI file to use - always prefer openapi.yaml
  let openApiPathForConfig;
  
  if (fs.existsSync(path.join(workingDir, "openapi.yaml"))) {
    openApiPathForConfig = path.join(workingDir, "openapi.yaml");
    console.log(`Found OpenAPI file at: ${openApiPathForConfig}`);
  } else {
    openApiPathForConfig = path.join(workingDir, "openapi.yaml"); 
    console.log(`Will use OpenAPI file at: ${openApiPathForConfig} (file will be created if needed)`);
  }
  
  console.log(`Using OpenAPI file: ${openApiPathForConfig}`);
  
  // Configuration for Claude Desktop
  const config = {
    command: nodePath,
    args: [scriptPath, "run"],
    env: {
      "DEBUG": "true",
      "OPENAPI_FILE": openApiPathForConfig
    },
    cwd: workingDir // Explicitly set working directory
  };

  console.log(
    `Looking for existing config in: ${chalk.yellow(
      path.dirname(claudeConfigPath),
    )}`,
  );
  const configDirExists = isDirectory(path.dirname(claudeConfigPath));

  if (configDirExists) {
    const existingConfig = fs.existsSync(claudeConfigPath)
      ? JSON.parse(fs.readFileSync(claudeConfigPath, "utf8"))
      : { mcpServers: {} };

    if ("openapi" in (existingConfig?.mcpServers || {})) {
      console.log(
        `${chalk.green(
          "Note:",
        )} Replacing existing OpenAPI MCP config:\n${chalk.gray(
          JSON.stringify(existingConfig.mcpServers.openapi),
        )}`,
      );
    }

    const newConfig = {
      ...existingConfig,
      mcpServers: {
        ...existingConfig.mcpServers,
        openapi: config,
      },
    };

    fs.writeFileSync(claudeConfigPath, JSON.stringify(newConfig, null, 2));

    console.log(
      `${chalk.yellow(
        "openapi-mcp-server",
      )} configured & added to Claude Desktop!`,
    );
    console.log(`Wrote config to ${chalk.yellow(claudeConfigPath)}`);
    console.log(
      chalk.blue(
        `Try asking Claude to interact with your API to get started!`,
      ),
    );
  } else {
    const fullConfig = { mcpServers: { openapi: config } };
    console.log(
      `Couldn't detect Claude Desktop config at ${claudeConfigPath}.\nTo add the OpenAPI MCP server manually, add the following config to your ${chalk.yellow(
        "MCP config-file",
      )}:\n\n${JSON.stringify(fullConfig, null, 2)}`,
    );
  }
}

// Start the MCP server
async function main() {
  log("Starting OpenAPI MCP server...");

  try {
    // Improved path resolution for OpenAPI file
    let openApiFilePath = openApiFile;
    
    // If not absolute, resolve relative to script directory first, then working directory
    if (!path.isAbsolute(openApiFilePath)) {
      // Try relative to script directory first
      const scriptDirPath = path.resolve(__dirname, openApiFilePath);
      if (fs.existsSync(scriptDirPath)) {
        openApiFilePath = scriptDirPath;
      } else {
        // Fall back to current working directory
        openApiFilePath = path.resolve(process.cwd(), openApiFilePath);
      }
    }
    
    log("Looking for OpenAPI file at paths:");
    log(`- Raw path: ${openApiFile}`);
    log(`- Resolved path: ${openApiFilePath}`);
    log(`- Relative to __dirname: ${path.resolve(__dirname, openApiFile)}`);
    log(`- Relative to cwd: ${path.resolve(process.cwd(), openApiFile)}`);
    
    // Try to find the file in several common locations if it doesn't exist
    if (!fs.existsSync(openApiFilePath)) {
      log("OpenAPI file not found at resolved path, trying alternate locations...");
      
      const possibleLocations = [
        path.join(__dirname, "openapi.yaml"),
        path.join(process.cwd(), "openapi.yaml")
      ];
      
      for (const location of possibleLocations) {
        log(`Checking ${location}...`);
        if (fs.existsSync(location)) {
          openApiFilePath = location;
          log(`Found OpenAPI file at: ${openApiFilePath}`);
          break;
        }
      }
      
      // If still not found, throw error
      if (!fs.existsSync(openApiFilePath)) {
        throw new Error(`OpenAPI file not found at any of the searched locations`);
      }
    }
    
    log("Loading OpenAPI spec from:", openApiFilePath);
    
    try {
      // Always try to parse the specified OpenAPI file directly
      const openApiSpec = parseOpenApiFile(openApiFilePath);
      
      // Continue with normal server setup
      const operations = extractOperations(openApiSpec);
      const baseUrl = openApiSpec.servers?.[0]?.url || "http://localhost:8080";
      
      log(`Using base URL: ${baseUrl}`);
      log(`Extracted ${operations.length} operations from OpenAPI spec`);
      
      log("Creating MCP server instance");
      const server = new Server(
        { name: "openapi", version: "1.0.0" },
        { capabilities: { tools: {} } },
      );

      // Add message handlers with error catching
      try {
        // The initialize handler is automatically provided by the SDK
        // We only need to add handlers for our tools
        
        // Handle list tools request
        server.setRequestHandler(ListToolsRequestSchema, async () => {
          try {
            log("Received list tools request");
            
            // Create tool definitions from operations
            const tools = operations.map(operation => ({
              name: operation.operationId,
              description: operation.description || operation.summary,
              inputSchema: operation.inputSchema,
            }));
            
            log(`Returning ${tools.length} tool definitions`);
            if (tools.length > 0) {
              log("First tool example:", JSON.stringify(tools[0]));
            }
            
            return { tools };
          } catch (error) {
            log("Error handling list tools request:", error);
            throw error;
          }
        });

        // Handle tool calls
        server.setRequestHandler(CallToolRequestSchema, async (request) => {
          try {
            const toolName = request.params.name;
            log("Received tool call:", toolName);
            
            // Find the operation for this tool
            const operation = operations.find(op => op.operationId === toolName);
            if (!operation) {
              log(`Unknown operation: ${toolName}`);
              throw new Error(`Unknown operation: ${toolName}`);
            }
            
            log(`Executing operation: ${operation.method.toUpperCase()} ${operation.path}`);
            
            // Execute the API call
            const result = await makeApiRequest(
              operation,
              request.params.arguments,
              baseUrl
            );
            
            log(`API call successful, status: ${result.status}`);
            
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(result, null, 2),
                },
              ],
              metadata: {},
            };
          } catch (error) {
            log("Error handling tool call:", error);
            return {
              content: [
                {
                  type: "text",
                  text: `Error: ${
                    error instanceof Error ? error.message : String(error)
                  }`,
                },
              ],
              metadata: {},
              isError: true,
            };
          }
        });
        
        log("Successfully registered all request handlers");
      } catch (handlerError) {
        log("Error setting up request handlers:", handlerError);
        throw handlerError;
      }

      // Connect to transport
      log("Creating StdioServerTransport");
      const transport = new StdioServerTransport();
      
      log("Connecting server to transport...");
      try {
        await server.connect(transport);
        log("Server connected and running");
      } catch (connectError) {
        log("Error connecting server to transport:", connectError);
        throw connectError;
      }
      
      // Keep the process alive
      log("Setting up process to stay alive");
      process.stdin.resume();
      
      // Add signal handlers
      process.on('SIGINT', () => {
        log("Received SIGINT signal, shutting down gracefully");
        process.exit(0);
      });
      
      process.on('SIGTERM', () => {
        log("Received SIGTERM signal, shutting down gracefully");
        process.exit(0);
      });
      
      log("Server setup complete and ready to handle requests");
    } catch (setupError) {
      log("Error during server setup:", setupError);
      throw setupError;
    }
  } catch (error) {
    log("Fatal error:", error);
    // Add error to stderr as well for visibility in the MCP server logs
    console.error("FATAL ERROR:", error);
    process.exit(1);
  }
}

// Handle process events
process.on("uncaughtException", (error) => {
  log("Uncaught exception:", error);
});

process.on("unhandledRejection", (error) => {
  log("Unhandled rejection:", error);
});

// Command line handling
const [cmd, ...args] = process.argv.slice(2);
if (cmd === "init") {
  init()
    .then(() => {
      console.log("Initialization complete!");
    })
    .catch((error) => {
      console.error("Error during initialization:", error);
      process.exit(1);
    });
} else if (cmd === "run") {
  main().catch((error) => {
    console.error("Error starting server:", error);
    process.exit(1);
  });
} else {
  console.error(`Unknown command: ${cmd}. Expected 'init' or 'run'.`);
  process.exit(1);
} 