# 🚀 EndpointX

**Automatic Real-World API Request Generator & Test Runner for Backend Developers**

EndpointX automatically scans your backend routes, generates realistic test payloads (including edge cases and security tests), executes them against your API, and produces beautiful reports—all without writing a single test case manually.

## ✨ Features

- 🔍 **Automatic Route Discovery** - Scans Express, Fastify, and Next.js projects
- 🧠 **Intelligent Schema Inference** - Infers request schemas from your code
- 🎯 **Comprehensive Test Generation** - Creates 10+ test variations per route
- 🔒 **Security Testing** - Includes SQL injection and XSS attempts
- 🎲 **Fuzzing** - Random input generation to catch edge cases
- ⚡ **Parallel Execution** - Fast test runs with configurable concurrency
- 📊 **Advanced Analytics** - P50/P95/P99 response times, failure analysis
- 🎨 **Interactive Charts** - Chart.js powered visualizations
- 🔍 **Smart Filtering** - Filter by route, status, test type, framework
- 📈 **Multiple Export Formats** - CLI, JSON, HTML, Markdown, CSV
- 🛠️ **Zero Configuration** - Works out of the box

## 📦 Installation

```bash
npm install -g beptx
```

Or use with npx:

```bash
npx beptx test ./src --url http://localhost:3000
```

## 🚀 Quick Start

### CLI Usage

**Run complete test suite:**
```bash
beptx test ./src --url http://localhost:3000
```

**Scan routes only:**
```bash
beptx scan ./src
```

**With custom options:**
```bash
beptx test ./src \
  --url http://localhost:4000 \
  --variations 15 \
  --output cli,json,html \
  --verbose
```

### Programmatic Usage

```typescript
import EndpointX from 'beptx';

const beptx = new EndpointX({
  projectPath: './src',
  baseUrl: 'http://localhost:3000',
  testVariations: 10,
  outputFormat: ['cli', 'json', 'html'],
});

// Run complete flow
const report = await beptx.execute();

// Or run step by step
await beptx.scan();
beptx.generate();
await beptx.run();
beptx.report();
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

For each route, EndpointX automatically generates:

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

Create a `beptx.config.js` file in your project root:

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
  outputDir: './beptx-reports',
  headers: {
    'Authorization': 'Bearer your-token',
  },
};
```

## 📊 Advanced Reports & Analytics

EndpointX generates comprehensive reports with powerful filtering, analytics, and multiple export formats.

### Report Formats

#### CLI Report
Beautiful colored tables in your terminal with:
- Summary statistics with pass rates
- Pass/fail breakdown by route
- Detailed failure information
- Security recommendations
- Performance insights

#### JSON Report
Structured data perfect for CI/CD integration:
```json
{
  "summary": {
    "total": 120,
    "passed": 115,
    "failed": 5,
    "passRate": "95.8%"
  },
  "analytics": {
    "overall": {
      "avgResponseTime": 145,
      "p95ResponseTime": 320,
      "slowestRoute": "POST /api/users"
    }
  },
  "results": [...]
}
```

#### HTML Dashboard
Interactive, beautiful HTML report with:
- **Statistics cards** with visual progress bars
- **Interactive charts** (Chart.js powered):
  - Pass/fail pie chart
  - Response time bar chart
  - Test type distribution
  - Framework comparison
- **Route summaries** color-coded by status
- **Failure details** with request/response data
- **Analytics section** with performance metrics

#### Markdown Report (NEW!)
GitHub-flavored Markdown perfect for documentation:
- Summary statistics table
- Performance metrics (P50, P95, P99)
- Framework statistics
- Most common failures
- Routes summary with emoji indicators
- Failed test details with code blocks

#### CSV Export (NEW!)
Excel-compatible CSV for data analysis:
- All test results in tabular format
- Import into Excel, Google Sheets, or analytics tools
- Columns: Test ID, Route, Method, Framework, Status, Response Time, etc.

### Report Filtering & Analytics

Filter and analyze your test results:

```typescript
import { generateReports } from 'beptx';

generateReports({
  report: testReport,
  outputFormat: ['html', 'markdown', 'csv'],
  
  // Filter options
  filter: {
    status: 'failed',              // Show only failed tests
    testTypes: ['sql-injection'],  // Focus on security tests
    frameworks: ['express'],       // Filter by framework
    responseTimeMin: 1000,         // Slow responses only
    routePattern: '/api/users.*'   // Regex pattern matching
  },
  
  // Sorting
  sortBy: {
    field: 'responseTime',
    order: 'desc'                  // Slowest first
  },
  
  // Analytics
  analytics: true                  // Enable statistical analysis
});
```

### Analytics Features

EndpointX automatically calculates:

- **Response Time Percentiles**: P50, P95, P99
- **Performance Insights**: Slowest/fastest routes
- **Framework Statistics**: Compare Express vs Fastify vs Next.js
- **Test Type Breakdown**: Pass rates by test category
- **Failure Analysis**: Most common failure types
- **Route Statistics**: Per-route performance metrics

### Programmatic Report Generation

```typescript
import { 
  filterResults, 
  calculateAnalytics, 
  generateCharts 
} from 'beptx';

// Filter results
const failedTests = filterResults(results, {
  status: 'failed'
});

// Calculate analytics
const analytics = calculateAnalytics(results);
console.log(`P95 Response Time: ${analytics.overall.p95ResponseTime}ms`);

// Generate charts for custom dashboards
const charts = generateCharts(analytics);
```

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

EndpointX intelligently infers data types from:

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
beptx test [options] [project-path]

Options:
  -u, --url <url>              API base URL (default: "http://localhost:3000")
  -f, --frameworks <list>      Frameworks to scan (default: "express,fastify,nextjs")
  -v, --variations <number>    Test variations per route (default: 10)
  --no-fuzzing                 Disable fuzzing tests
  --timeout <ms>               Request timeout (default: 5000)
  --sequential                 Run tests sequentially
  --concurrency <number>       Max concurrent requests (default: 10)
  -o, --output <formats>       Output formats: cli,json,html,markdown,csv (default: "cli,json,html")
  --output-dir <dir>           Output directory (default: "./beptx-reports")
  --verbose                    Verbose logging
  --config <path>              Path to config file
  
Report Filtering (Coming Soon):
  --filter-status <status>     Filter by status: passed, failed, all
  --filter-route <pattern>     Filter by route pattern (regex)
  --filter-type <types>        Filter by test types (comma-separated)
  --sort-by <field>            Sort by: name, status, responseTime, timestamp
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
- [cli-table3](https://github.com/cli-table/cli-table3) - Tables
- [Chart.js](https://www.chartjs.org/) - Interactive charts

---

**Made with ❤️ for backend developers who want to ship faster with confidence**
