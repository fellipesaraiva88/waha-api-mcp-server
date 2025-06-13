# OpenAPI MCP Server

[![CI/CD Pipeline](https://github.com/yourusername/openapi-mcp-server/actions/workflows/ci.yml/badge.svg)](https://github.com/yourusername/openapi-mcp-server/actions/workflows/ci.yml)
[![npm version](https://badge.fury.io/js/openapi-mcp-server.svg)](https://badge.fury.io/js/openapi-mcp-server)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> **Talk to any OpenAPI (v3.1) compliant API through Claude Desktop!**

This is a Model Context Protocol (MCP) server that reads an OpenAPI specification file and exposes each API operation as a tool for Claude AI to use. It acts as a proxy for any API that has an OpenAPI v3.1 specification, allowing you to use Claude Desktop to easily interact with both local and remote server APIs.

## 🚀 Features

- **Automatic OpenAPI Parsing**: Automatically parses OpenAPI YAML files
- **Dynamic Tool Generation**: Generates MCP tools for each API operation
- **Parameter Handling**: Handles path parameters, query parameters, and request bodies
- **Live API Calls**: Makes real API calls when Claude uses the tools
- **Easy Integration**: Simple integration with Claude Desktop
- **Error Recovery**: Intelligent YAML error recovery and fixing
- **Authentication Support**: Built-in support for API key authentication

## 📦 Installation

### Quick Start with npx

```bash
npx openapi-mcp-server /path/to/your/openapi.yaml
```

### Global Installation

```bash
npm install -g openapi-mcp-server
```

### Local Development

```bash
# Clone the repository
git clone https://github.com/yourusername/openapi-mcp-server.git
cd openapi-mcp-server

# Install dependencies
npm install

# Run tests
npm test
```

## 🔧 Usage

### 1. Prepare Your OpenAPI Specification

Place your OpenAPI YAML file in the project directory or provide a path to it via environment variables.

### 2. Set Up Environment Variables (Optional)

```bash
# Create a .env file
echo "DEBUG=true" > .env
echo "OPENAPI_FILE=./path/to/your/openapi.yaml" >> .env
echo "HTTP_HEADERS_X_API_KEY=your_api_key_here" >> .env
```

### 3. Initialize with Claude Desktop

```bash
npm run init
```

### 4. Or Run the Server Manually

```bash
npm start
```

## ⚙️ Configuration

You can configure the server using environment variables:

- `DEBUG`: Set to `true` to enable debug logging (default: `false`)
- `OPENAPI_FILE`: Path to your OpenAPI YAML file (default: `./openapi.yaml`)
- `HTTP_HEADERS_X_API_KEY`: API key for authentication (optional)

## 🔄 How it Works

The server reads your OpenAPI specification file and:

1. **Extracts all paths and operations**
2. **Creates a tool for each operation** with appropriate input schemas
3. **When Claude calls a tool**, the server makes the corresponding API request
4. **The response is returned to Claude** for analysis

## 📋 Example

With an OpenAPI spec like:

```yaml
paths:
  /users:
    get:
      operationId: listUsers
      summary: List all users
      responses:
        '200':
          description: List of users
```

Claude can call the `listUsers` tool, and the server will make a GET request to `/users` on your behalf.

## 🧪 Testing

This project includes comprehensive unit and integration tests:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Test Coverage

- **Unit Tests**: Core functionality like OpenAPI parsing, validation, and URL building
- **Integration Tests**: End-to-end testing of OpenAPI file processing
- **Server Tests**: Verification of server configuration and dependencies

## 🚀 Development

### Prerequisites

- Node.js 18.x or higher
- npm 8.x or higher

### Setup

```bash
# Install dependencies
npm install

# Run tests
npm test

# Start development server
npm start
```

### Project Structure

```
openapi-mcp-server/
├── openapi-mcp.js          # Main server file
├── openapi.yaml            # Sample OpenAPI specification
├── package.json            # Project configuration
├── vitest.config.js        # Test configuration
├── test/                   # Test files
│   ├── utils.test.js       # Unit tests for utilities
│   ├── integration.test.js # Integration tests
│   └── server.test.js      # Server configuration tests
└── .github/
    └── workflows/
        └── ci.yml          # GitHub Actions CI/CD
```

## 🔒 Security

- API keys are handled securely through environment variables
- Input validation for all API parameters
- Error handling to prevent information leakage
- YAML parsing with error recovery

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Write tests for new features
- Follow the existing code style
- Update documentation as needed
- Ensure all tests pass before submitting

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Model Context Protocol](https://modelcontextprotocol.io/) for the MCP specification
- [OpenAPI Initiative](https://www.openapis.org/) for the OpenAPI specification
- [Anthropic](https://www.anthropic.com/) for Claude AI

## 📞 Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/yourusername/openapi-mcp-server/issues) page
2. Create a new issue if your problem isn't already reported
3. Provide as much detail as possible, including:
   - Your OpenAPI specification (sanitized)
   - Error messages
   - Environment details

---

**Made with ❤️ for the Claude AI community**