/**
 * Simple custom spinner implementation using native Node.js
 */
export class Spinner {
    public text: string;
    private interval: NodeJS.Timeout | null = null;
    private frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
    private currentFrame = 0;
    private isSpinning = false;

    constructor(options: { text: string }) {
        this.text = options.text;
    }

    start(): this {
        if (this.isSpinning) return this;

        this.isSpinning = true;
        this.currentFrame = 0;

        // Hide cursor
        process.stdout.write('\x1B[?25l');

        this.interval = setInterval(() => {
            const frame = this.frames[this.currentFrame];
            process.stdout.write(`\r${frame} ${this.text}`);
            this.currentFrame = (this.currentFrame + 1) % this.frames.length;
        }, 80);

        return this;
    }

    success(message?: string): void {
        this.stop();
        const msg = message || this.text;
        process.stdout.write(`\r✓ ${msg}\n`);
        // Show cursor
        process.stdout.write('\x1B[?25h');
    }

    error(message?: string): void {
        this.stop();
        const msg = message || this.text;
        process.stdout.write(`\r✗ ${msg}\n`);
        // Show cursor
        process.stdout.write('\x1B[?25h');
    }

    stop(): void {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
        this.isSpinning = false;
        process.stdout.write('\r\x1B[K'); // Clear line
    }
}

export function createSpinner(options: { text: string }): Spinner {
    return new Spinner(options);
}
