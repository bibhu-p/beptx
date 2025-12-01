import { TestResult, EnhancedReport, ChartConfig } from '../types';
import { writeFile } from '../utils/file-utils';
import { logger } from '../utils/logger';
import * as path from 'path';

/**
 * Generate HTML report
 */
export function generateHtmlReport(report: EnhancedReport, outputDir: string): void {
  const outputPath = path.join(outputDir, 'endpointx-report.html');
  const html = buildHtmlReport(report);

  writeFile(outputPath, html);
  logger.success(`HTML report saved to: ${outputPath}`);
}

/**
 * Build HTML report content
 */
function buildHtmlReport(report: EnhancedReport): string {
  const { summary, results, routes, metadata, charts, filteredResults } = report;

  const passRate = ((summary.passed / summary.total) * 100).toFixed(1);
  const failedTests = (filteredResults || results).filter((r) => !r.passed);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>EndpointX Test Report</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      padding: 2rem;
    }

    .container {
      max-width: 1400px;
      margin: 0 auto;
    }

    .header {
      background: white;
      border-radius: 12px;
      padding: 2rem;
      margin-bottom: 2rem;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
    }

    h1 {
      color: #667eea;
      font-size: 2.5rem;
      margin-bottom: 0.5rem;
    }

    .subtitle {
      color: #666;
      font-size: 1rem;
    }

    .stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
    }

    .stat-card {
      background: white;
      border-radius: 12px;
      padding: 1.5rem;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
    }

    .stat-label {
      color: #666;
      font-size: 0.875rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 0.5rem;
    }

    .stat-value {
      font-size: 2.5rem;
      font-weight: bold;
      color: #333;
    }

    .stat-value.success {
      color: #10b981;
    }

    .stat-value.error {
      color: #ef4444;
    }

    .stat-value.info {
      color: #667eea;
    }

    .charts-section {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
      gap: 2rem;
      margin-bottom: 2rem;
    }

    .chart-card {
      background: white;
      border-radius: 12px;
      padding: 2rem;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
    }

    .chart-title {
      font-size: 1.25rem;
      font-weight: bold;
      color: #333;
      margin-bottom: 1.5rem;
      text-align: center;
    }

    .chart-container {
      position: relative;
      height: 300px;
    }

    .routes-section {
      background: white;
      border-radius: 12px;
      padding: 2rem;
      margin-bottom: 2rem;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
    }

    h2 {
      color: #333;
      margin-bottom: 1.5rem;
      font-size: 1.5rem;
    }

    .route-item {
      border-left: 4px solid #667eea;
      padding: 1rem;
      margin-bottom: 1rem;
      background: #f9fafb;
      border-radius: 4px;
    }

    .route-item.failed {
      border-left-color: #ef4444;
    }

    .route-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
    }

    .route-path {
      font-weight: bold;
      color: #333;
    }

    .method {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: bold;
      margin-right: 0.5rem;
    }

    .method.GET { background: #10b981; color: white; }
    .method.POST { background: #3b82f6; color: white; }
    .method.PUT { background: #f59e0b; color: white; }
    .method.PATCH { background: #8b5cf6; color: white; }
    .method.DELETE { background: #ef4444; color: white; }

    .route-stats {
      color: #666;
      font-size: 0.875rem;
    }

    .badge {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: bold;
    }

    .badge.success {
      background: #d1fae5;
      color: #065f46;
    }

    .badge.error {
      background: #fee2e2;
      color: #991b1b;
    }

    .failures-section {
      background: white;
      border-radius: 12px;
      padding: 2rem;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
    }

    .failure-item {
      border: 1px solid #fee2e2;
      background: #fef2f2;
      border-radius: 8px;
      padding: 1rem;
      margin-bottom: 1rem;
    }

    .failure-header {
      font-weight: bold;
      color: #991b1b;
      margin-bottom: 0.5rem;
    }

    .failure-detail {
      color: #666;
      font-size: 0.875rem;
      margin-bottom: 0.25rem;
    }

    .code-block {
      background: #1f2937;
      color: #f3f4f6;
      padding: 1rem;
      border-radius: 4px;
      overflow-x: auto;
      font-family: 'Courier New', monospace;
      font-size: 0.875rem;
      margin-top: 0.5rem;
    }

    .progress-bar {
      width: 100%;
      height: 8px;
      background: #e5e7eb;
      border-radius: 4px;
      overflow: hidden;
      margin-top: 0.5rem;
    }

    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #10b981, #059669);
      transition: width 0.3s ease;
    }

    .footer {
      text-align: center;
      color: white;
      margin-top: 2rem;
      opacity: 0.8;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🚀 EndpointX Test Report</h1>
      <p class="subtitle">Generated on ${new Date(metadata.startTime).toLocaleString()}</p>
    </div>

    <div class="stats">
      <div class="stat-card">
        <div class="stat-label">Total Tests</div>
        <div class="stat-value info">${summary.total}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Passed</div>
        <div class="stat-value success">${summary.passed}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Failed</div>
        <div class="stat-value error">${summary.failed}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Pass Rate</div>
        <div class="stat-value">${passRate}%</div>
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${passRate}%"></div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Total Time</div>
        <div class="stat-value">${summary.totalTime}ms</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Routes Tested</div>
        <div class="stat-value">${routes.length}</div>
      </div>
    </div>

    ${charts && charts.length > 0 ? generateChartsHtml(charts) : ''}

    <div class="routes-section">
      <h2>Routes Summary</h2>
      ${generateRoutesSummaryHtml(summary.byRoute)}
    </div>

    ${failedTests.length > 0
      ? `
    <div class="failures-section">
      <h2>Failed Tests (${failedTests.length})</h2>
      ${generateFailuresHtml(failedTests)}
    </div>
    `
      : '<div class="routes-section"><h2>✅ All tests passed!</h2></div>'
    }

    <div class="footer">
      <p>Generated by EndpointX v${metadata.packageVersion} | Node ${metadata.nodeVersion}</p>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Generate routes summary HTML
 */
function generateRoutesSummaryHtml(byRoute: Map<string, any>): string {
  let html = '';

  for (const [_routeKey, routeSummary] of byRoute) {
    const { route, total, passed, failed } = routeSummary;
    const passRate = ((passed / total) * 100).toFixed(0);
    const hasFailed = failed > 0;

    html += `
      <div class="route-item ${hasFailed ? 'failed' : ''}">
        <div class="route-header">
          <div class="route-path">
            <span class="method ${route.method}">${route.method}</span>
            ${route.path}
          </div>
          <div>
            <span class="badge ${hasFailed ? 'error' : 'success'}">
              ${passed}/${total} passed (${passRate}%)
            </span>
          </div>
        </div>
        <div class="route-stats">
          Framework: ${route.framework} | File: ${route.filePath.split('/').pop()}
        </div>
      </div>
    `;
  }

  return html;
}

/**
 * Generate failures HTML
 */
function generateFailuresHtml(failedTests: TestResult[]): string {
  let html = '';

  for (const result of failedTests.slice(0, 20)) {
    // Show first 20 failures
    const { testCase, statusCode, failureReason, error } = result;

    html += `
      <div class="failure-item">
        <div class="failure-header">
          <span class="method ${testCase.method}">${testCase.method}</span>
          ${testCase.route.path} - ${testCase.name}
        </div>
        <div class="failure-detail">Type: ${testCase.type}</div>
        ${error ? `<div class="failure-detail">Error: ${error}</div>` : ''}
        ${statusCode ? `<div class="failure-detail">Status Code: ${statusCode}</div>` : ''}
        <div class="failure-detail">Reason: ${failureReason || 'Unknown'}</div>
        ${testCase.body
        ? `<div class="code-block">${JSON.stringify(testCase.body, null, 2)}</div>`
        : ''
      }
      </div>
    `;
  }

  if (failedTests.length > 20) {
    html += `<p style="color: #666; text-align: center;">... and ${failedTests.length - 20} more failures</p>`;
  }

  return html;
}

/**
 * Generate charts HTML section
 */
function generateChartsHtml(charts: ChartConfig[]): string {
  let html = '<div class="charts-section">';

  for (let i = 0; i < charts.length; i++) {
    const chart = charts[i];
    const chartId = `chart-${i}`;

    html += `
      <div class="chart-card">
        <div class="chart-title">${chart.title}</div>
        <div class="chart-container">
          <canvas id="${chartId}"></canvas>
        </div>
      </div>
    `;
  }

  html += '</div>';

  // Add script to initialize charts
  html += '<script>';
  for (let i = 0; i < charts.length; i++) {
    const chart = charts[i];
    const chartId = `chart-${i}`;

    html += `
      new Chart(document.getElementById('${chartId}'), {
        type: '${chart.type}',
        data: {
          labels: ${JSON.stringify(chart.labels)},
          datasets: ${JSON.stringify(chart.datasets)}
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom'
            }
          }
        }
      });
    `;
  }
  html += '</script>';

  return html;
}
