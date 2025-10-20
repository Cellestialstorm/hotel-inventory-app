import winston from "winston";
import path from "path";

const logDir = path.resolve(__dirname, '../../logs')

const levels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
};

const colors = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'white',
};
winston.addColors(colors);

const level = () => {
    const env = process.env.NODE_ENV || 'development';
    return env === 'development' ? 'debug' : 'warn';
};

const timestampFormat = winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' });
const errorsFormat = winston.format.errors({ stack: true });

const consoleFormat = winston.format.combine(
    timestampFormat,
    winston.format.colorize({ all: true }),
    winston.format.printf(
        (info) => `${info.timestamp} ${info.level}: ${info.message}` +(info.stack ? `\n${info.stack}` : '')
    )
);

const fileFormat = winston.format.combine(
    timestampFormat,
    errorsFormat,
    winston.format.splat(),
    winston.format.json()
);

const transport = [
    new winston.transports.Console({
        level: process.env.NODE_ENV === 'development' ? 'info' : 'debug',
        format: consoleFormat,
    }),
    new winston.transports.File({
        filename: path.join(logDir, 'error.log'),
        level: 'error',
        format: fileFormat,
        maxsize: 5242880,
        maxFiles: 5,
        tailable: true,
    }),
    new winston.transports.File({
        filename: path.join(logDir, 'combined.log'),
        level: 'info',
        format: fileFormat,
        maxsize: 5242880,
        maxFiles: 5,
        tailable: true,
    }),
]

const logger = winston.createLogger({
    level: level(),
    levels: levels,
    format: fileFormat,
    transports: transport,
    exitOnError: false,
});

export const morganStream = {
    write: (message: string): void => {
        logger.info(message.trim());
    },
};

export default logger;