/**
 * Format data as a table with borders and proper alignment
 */
export function formatTable(headers: string[], rows: (string | number)[][]): string {
    // Convert all values to strings and calculate column widths
    const stringRows = rows.map((row) => row.map((cell) => String(cell)));
    const allRows = [headers, ...stringRows];

    // Calculate max width for each column
    const columnWidths = headers.map((_, colIndex) => {
        return Math.max(
            ...allRows.map((row) => (row[colIndex] ? String(row[colIndex]).length : 0))
        );
    });

    // Helper to pad a string to a specific width
    const pad = (str: string, width: number): string => {
        return str + ' '.repeat(Math.max(0, width - str.length));
    };

    // Helper to create a horizontal border
    const createBorder = (char: string): string => {
        return '+' + columnWidths.map((width) => char.repeat(width + 2)).join('+') + '+';
    };

    // Helper to create a row
    const createRow = (row: string[]): string => {
        return (
            '|' +
            row.map((cell, i) => ' ' + pad(cell || '', columnWidths[i]) + ' ').join('|') +
            '|'
        );
    };

    // Build the table
    const lines: string[] = [];

    // Top border
    lines.push(createBorder('-'));

    // Header row
    lines.push(createRow(headers));

    // Header separator
    lines.push(createBorder('-'));

    // Data rows
    for (const row of stringRows) {
        lines.push(createRow(row));
    }

    // Bottom border
    lines.push(createBorder('-'));

    return lines.join('\n');
}
