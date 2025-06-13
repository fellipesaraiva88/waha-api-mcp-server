# Contributing to OpenAPI MCP Server

Thank you for your interest in contributing to OpenAPI MCP Server! This document provides guidelines and information for contributors.

## 🚀 Getting Started

### Prerequisites

- Node.js 18.x or higher
- npm 8.x or higher
- Git

### Development Setup

1. **Fork the repository**
   ```bash
   # Fork on GitHub, then clone your fork
   git clone https://github.com/yourusername/openapi-mcp-server.git
   cd openapi-mcp-server
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run tests to ensure everything works**
   ```bash
   npm test
   ```

4. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

## 🧪 Testing

We maintain high test coverage. Please ensure your contributions include appropriate tests.

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Test Structure

- `test/utils.test.js` - Unit tests for utility functions
- `test/integration.test.js` - Integration tests
- `test/server.test.js` - Server configuration tests

### Writing Tests

- Use Vitest for testing framework
- Follow the existing test patterns
- Include both positive and negative test cases
- Test edge cases and error conditions

## 📝 Code Style

### General Guidelines

- Use ES6+ features and modules
- Follow existing code formatting
- Use meaningful variable and function names
- Add comments for complex logic
- Keep functions small and focused

### File Structure

```
openapi-mcp-server/
├── openapi-mcp.js          # Main server implementation
├── test/                   # Test files
├── .github/workflows/      # CI/CD workflows
└── docs/                   # Documentation
```

## 🔧 Development Workflow

### 1. Issue First

- Check existing issues before creating new ones
- For new features, create an issue to discuss the approach
- Reference the issue number in your commits

### 2. Branch Naming

Use descriptive branch names:
- `feature/add-authentication`
- `bugfix/fix-yaml-parsing`
- `docs/update-readme`

### 3. Commit Messages

Follow conventional commit format:
```
type(scope): description

[optional body]

[optional footer]
```

Examples:
- `feat: add support for OAuth authentication`
- `fix: resolve YAML parsing error with duplicate keys`
- `docs: update installation instructions`
- `test: add integration tests for API calls`

### 4. Pull Request Process

1. **Update your branch**
   ```bash
   git checkout main
   git pull upstream main
   git checkout your-feature-branch
   git rebase main
   ```

2. **Run tests and ensure they pass**
   ```bash
   npm test
   ```

3. **Create a pull request**
   - Use a clear, descriptive title
   - Reference any related issues
   - Describe what changes were made and why
   - Include screenshots for UI changes

4. **Address review feedback**
   - Make requested changes
   - Push updates to your branch
   - Respond to reviewer comments

## 🐛 Bug Reports

When reporting bugs, please include:

1. **Environment information**
   - Node.js version
   - npm version
   - Operating system

2. **Steps to reproduce**
   - Clear, numbered steps
   - Expected vs actual behavior
   - Error messages (if any)

3. **OpenAPI specification**
   - Sanitized version of your OpenAPI spec
   - Relevant portions that cause the issue

4. **Logs**
   - Debug logs (set `DEBUG=true`)
   - Error stack traces

## ✨ Feature Requests

For new features:

1. **Check existing issues** to avoid duplicates
2. **Describe the use case** - what problem does it solve?
3. **Propose a solution** - how should it work?
4. **Consider alternatives** - are there other approaches?

## 📚 Documentation

Help improve our documentation:

- Fix typos and grammar
- Add examples and use cases
- Improve clarity and organization
- Update outdated information

## 🔒 Security

If you discover a security vulnerability:

1. **Do not** create a public issue
2. Email the maintainers directly
3. Provide detailed information about the vulnerability
4. Allow time for the issue to be addressed before disclosure

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

## 🙏 Recognition

Contributors will be recognized in:
- README.md contributors section
- Release notes for significant contributions
- GitHub contributors page

## 📞 Getting Help

- Create an issue for bugs or feature requests
- Join discussions in existing issues
- Check the documentation first

Thank you for contributing to OpenAPI MCP Server! 🎉