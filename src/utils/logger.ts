
export enum LogLevel {
    ERROR = 0,
    WARN = 1,
    INFO = 2,
    DEBUG = 3,
}

class Logger {
    private level: LogLevel = LogLevel.INFO;

    setLevel(level: LogLevel) {
        this.level = level;
    }

    setVerbose(verbose: boolean) {
        this.level = verbose ? LogLevel.DEBUG : LogLevel.INFO;
    }

    error(message: string, ...args: any[]) {
        if (this.level >= LogLevel.ERROR) {
            console.error('✗', message, ...args);
        }
    }

    warn(message: string, ...args: any[]) {
        if (this.level >= LogLevel.WARN) {
            console.warn('⚠', message, ...args);
        }
    }

    info(message: string, ...args: any[]) {
        if (this.level >= LogLevel.INFO) {
            console.log('ℹ', message, ...args);
        }
    }

    success(message: string, ...args: any[]) {
        if (this.level >= LogLevel.INFO) {
            console.log('✓', message, ...args);
        }
    }

    debug(message: string, ...args: any[]) {
        if (this.level >= LogLevel.DEBUG) {
            console.log('⚙', message, ...args);
        }
    }

    log(message: string, ...args: any[]) {
        console.log(message, ...args);
    }
}

export const logger = new Logger();
