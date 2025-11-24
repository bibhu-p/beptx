import { FieldDefinition } from '../types';

/**
 * Generate realistic data based on field type
 */
export function generateValidValue(field: FieldDefinition): any {
    switch (field.type) {
        case 'email':
            return generateEmail();
        case 'url':
            return generateUrl();
        case 'date':
            return generateDate();
        case 'boolean':
            return generateBoolean();
        case 'number':
            return generateNumber(field.min, field.max);
        case 'string':
            return generateString(field.minLength, field.maxLength);
        case 'array':
            return [];
        case 'object':
            return {};
        default:
            return generateString();
    }
}

/**
 * Generate invalid value for testing
 */
export function generateInvalidValue(field: FieldDefinition, invalidType: string): any {
    switch (invalidType) {
        case 'wrong-type':
            return generateWrongType(field.type);
        case 'empty-string':
            return '';
        case 'null':
            return null;
        case 'undefined':
            return undefined;
        case 'too-long':
            return generateString(1000, 2000);
        case 'too-short':
            return '';
        case 'negative':
            return -1;
        case 'zero':
            return 0;
        case 'invalid-format':
            return generateInvalidFormat(field.type);
        default:
            return null;
    }
}

/**
 * Generate email address
 */
function generateEmail(): string {
    const names = ['john', 'jane', 'test', 'user', 'admin', 'demo'];
    const domains = ['example.com', 'test.com', 'mail.com', 'email.com'];
    const name = names[Math.floor(Math.random() * names.length)];
    const domain = domains[Math.floor(Math.random() * domains.length)];
    return `${name}${Math.floor(Math.random() * 1000)}@${domain}`;
}

/**
 * Generate URL
 */
function generateUrl(): string {
    const protocols = ['http', 'https'];
    const domains = ['example.com', 'test.com', 'website.com'];
    const protocol = protocols[Math.floor(Math.random() * protocols.length)];
    const domain = domains[Math.floor(Math.random() * domains.length)];
    return `${protocol}://${domain}`;
}

/**
 * Generate date
 */
function generateDate(): string {
    const now = new Date();
    const randomDays = Math.floor(Math.random() * 365);
    now.setDate(now.getDate() - randomDays);
    return now.toISOString();
}

/**
 * Generate boolean
 */
function generateBoolean(): boolean {
    return Math.random() > 0.5;
}

/**
 * Generate number within range
 */
function generateNumber(min?: number, max?: number): number {
    const minVal = min ?? 1;
    const maxVal = max ?? 1000;
    return Math.floor(Math.random() * (maxVal - minVal + 1)) + minVal;
}

/**
 * Generate string within length constraints
 */
function generateString(minLength?: number, maxLength?: number): string {
    const words = [
        'test',
        'sample',
        'demo',
        'example',
        'data',
        'value',
        'content',
        'text',
        'message',
        'information',
    ];

    const min = minLength ?? 5;
    const max = maxLength ?? 50;
    const targetLength = Math.floor(Math.random() * (max - min + 1)) + min;

    let result = '';
    while (result.length < targetLength) {
        const word = words[Math.floor(Math.random() * words.length)];
        result += word + ' ';
    }

    return result.trim().substring(0, targetLength);
}

/**
 * Generate wrong type value
 */
function generateWrongType(expectedType: string): any {
    switch (expectedType) {
        case 'string':
        case 'email':
        case 'url':
            return 12345; // Number instead of string
        case 'number':
            return 'not a number'; // String instead of number
        case 'boolean':
            return 'true'; // String instead of boolean
        case 'array':
            return 'not an array'; // String instead of array
        case 'object':
            return 'not an object'; // String instead of object
        default:
            return null;
    }
}

/**
 * Generate invalid format for specific types
 */
function generateInvalidFormat(type: string): any {
    switch (type) {
        case 'email':
            return 'not-an-email';
        case 'url':
            return 'not-a-url';
        case 'date':
            return 'not-a-date';
        default:
            return 'invalid';
    }
}

/**
 * Generate SQL injection attempt
 */
export function generateSqlInjection(): string {
    const injections = [
        "' OR '1'='1",
        "'; DROP TABLE users--",
        "' UNION SELECT * FROM users--",
        "admin'--",
        "' OR 1=1--",
    ];
    return injections[Math.floor(Math.random() * injections.length)];
}

/**
 * Generate XSS attempt
 */
export function generateXssAttempt(): string {
    const xss = [
        '<script>alert("XSS")</script>',
        '<img src=x onerror=alert("XSS")>',
        '<svg onload=alert("XSS")>',
        'javascript:alert("XSS")',
        '<iframe src="javascript:alert(\'XSS\')">',
    ];
    return xss[Math.floor(Math.random() * xss.length)];
}

/**
 * Generate random fuzzing value
 */
export function generateFuzzValue(): any {
    const types = [
        () => '',
        () => ' ',
        () => '\n\t',
        () => '0',
        () => '-1',
        () => '999999999999',
        () => 'null',
        () => 'undefined',
        () => '[]',
        () => '{}',
        () => 'true',
        () => 'false',
        () => generateString(1000, 5000),
        () => '🔥💯✨',
        () => '../../../etc/passwd',
        () => '%00',
    ];

    const generator = types[Math.floor(Math.random() * types.length)];
    return generator();
}
