# 🚀 ReqFlow

**Automatic Real-World API Request Generator & Test Runner for Backend Developers**

ReqFlow automatically scans your backend routes, generates realistic test payloads (including edge cases and security tests), executes them against your API, and produces beautiful reports—all without writing a single test case manually.

## ✨ Features

- 🔍 **Automatic Route Discovery** - Scans Express, Fastify, and Next.js projects
- 🧠 **Intelligent Schema Inference** - Infers request schemas from your code
- 🎯 **Comprehensive Test Generation** - Creates 10+ test variations per route
- 🔒 **Security Testing** - Includes SQL injection and XSS attempts
- 🎲 **Fuzzing** - Random input generation to catch edge cases
- ⚡ **Parallel Execution** - Fast test runs with configurable concurrency
- 📊 **Beautiful Reports** - CLI tables, JSON, and HTML dashboards
- 🛠️ **Zero Configuration** - Works out of the box

## 📦 Installation

```bash
npm install -g reqflow
```

Or use with npx:

```bash
npx reqflow test ./src --url http://localhost:3000
```

## 🚀 Quick Start

### CLI Usage

**Run complete test suite:**
```bash
reqflow test ./src --url http://localhost:3000
```

**Scan routes only:**
```bash
reqflow scan ./src
```

**With custom options:**
```bash
reqflow test ./src \
  --url http://localhost:4000 \
  --variations 15 \
  --output cli,json,html \
  --verbose
```

### Programmatic Usage

```typescript
import ReqFlow from 'reqflow';

const reqflow = new ReqFlow({
  projectPath: './src',
  baseUrl: 'http://localhost:3000',
  testVariations: 10,
  outputFormat: ['cli', 'json', 'html'],
});

// Run complete flow
const report = await reqflow.execute();

// Or run step by step
await reqflow.scan();
reqflow.generate();
await reqflow.run();
reqflow.report();
```

## 📖 How It Works

1. **Scan** - Analyzes your codebase using AST parsing to find all API routes
2. **Infer** - Intelligently infers request schemas from variable names and patterns
3. **Generate** - Creates multiple test variations:
   - ✅ Valid requests
   - ❌ Missing required fields
   - ❌ Wrong data types
   - ❌ Empty strings & null values
   - ❌ SQL injection attempts
   - ❌ XSS attempts
   - 🎲 Fuzzed inputs
4. **Execute** - Runs all tests against your API
5. **Report** - Generates beautiful, actionable reports

## 🎯 Test Types Generated

For each route, ReqFlow automatically generates:

| Test Type | Description | Expected Result |
|-----------|-------------|-----------------|
| Valid Request | Properly formatted request with valid data | 2xx status |
| Missing Required | Request missing required fields | 4xx status |
| Wrong Type | Fields with incorrect data types | 4xx status |
| Empty String | Empty string values | 4xx status |
| Null Values | Null in required fields | 4xx status |
| Extra Fields | Unexpected additional fields | 2xx or 4xx |
| SQL Injection | SQL injection payloads | 4xx status |
| XSS Attempt | XSS attack payloads | 4xx status |
| Fuzzing | Random malformed data | Should not crash |

## 🔧 Configuration

Create a `reqflow.config.js` file in your project root:

```javascript
module.exports = {
  projectPath: './src',
  baseUrl: 'http://localhost:3000',
  frameworks: ['express', 'fastify', 'nextjs'],
  testVariations: 10,
  enableFuzzing: true,
  timeout: 5000,
  parallel: true,
  maxConcurrency: 10,
  outputFormat: ['cli', 'json', 'html'],
  outputDir: './reqflow-reports',
  headers: {
    'Authorization': 'Bearer your-token',
  },
};
```

## 📊 Reports

### CLI Report
Beautiful colored tables in your terminal with:
- Summary statistics
- Pass/fail breakdown by route
- Detailed failure information
- Security recommendations

### JSON Report
Structured data perfect for CI/CD integration:
```json
{
  "summary": {
    "total": 120,
    "passed": 115,
    "failed": 5,
    "passRate": "95.8%"
  },
  "results": [...]
}
```

### HTML Dashboard
Interactive, beautiful HTML report with:
- Statistics cards
- Route summaries
- Failure details
- Request/response visualization

## 🎨 Supported Frameworks

### Express
```javascript
app.get('/users/:id', (req, res) => {
  const { id } = req.params;
  const { email } = req.body;
  // ...
});
```

### Fastify
```javascript
fastify.post('/users', async (request, reply) => {
  const { email, name } = request.body;
  // ...
});
```

### Next.js (App Router)
```typescript
export async function POST(request: Request) {
  const { email } = await request.json();
  // ...
}
```

### Next.js (Pages Router)
```typescript
export default function handler(req, res) {
  const { email } = req.body;
  // ...
}
```

## 🧠 Schema Inference

ReqFlow intelligently infers data types from:

- **Variable names**: `email` → email type, `age` → number
- **Common patterns**: `isActive` → boolean, `createdAt` → date
- **Code analysis**: `req.body.email` → detects email field
- **URL parameters**: `/users/:id` → detects id parameter

## 🔒 Security Testing

Automatically tests for:

- **SQL Injection**: `' OR '1'='1`, `'; DROP TABLE users--`
- **XSS Attacks**: `<script>alert('XSS')</script>`
- **Path Traversal**: `../../../etc/passwd`
- **Malformed Input**: Special characters, null bytes, etc.

## 📝 CLI Options

```bash
reqflow test [options] [project-path]

Options:
  -u, --url <url>              API base URL (default: "http://localhost:3000")
  -f, --frameworks <list>      Frameworks to scan (default: "express,fastify,nextjs")
  -v, --variations <number>    Test variations per route (default: 10)
  --no-fuzzing                 Disable fuzzing tests
  --timeout <ms>               Request timeout (default: 5000)
  --sequential                 Run tests sequentially
  --concurrency <number>       Max concurrent requests (default: 10)
  -o, --output <formats>       Output formats (default: "cli,json,html")
  --output-dir <dir>           Output directory (default: "./reqflow-reports")
  --verbose                    Verbose logging
  --config <path>              Path to config file
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT

## 🙏 Acknowledgments

Built with:
- [@babel/parser](https://babeljs.io/) - AST parsing
- [axios](https://axios-http.com/) - HTTP client
- [commander](https://github.com/tj/commander.js) - CLI framework
- [chalk](https://github.com/chalk/chalk) - Terminal colors
- [cli-table3](https://github.com/cli-table/cli-table3) - Tables

---

**Made with ❤️ for backend developers who want to ship faster with confidence**
