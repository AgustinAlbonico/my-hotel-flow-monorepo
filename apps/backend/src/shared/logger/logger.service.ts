import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import { createLogger, format, transports, Logger } from 'winston';
import chalk from 'chalk';

@Injectable({ scope: 2 }) // Scope.TRANSIENT
export class LoggerService implements NestLoggerService {
  private logger: Logger;
  private context?: string;

  constructor(context?: string) {
    this.context = context;

    // Formato custom con colores y emojis
    const customFormat = format.printf(
      ({ timestamp, level, message, context, emoji, ...meta }) => {
        const ctx =
          context && typeof context === 'string'
            ? chalk.cyan(`[${context}]`)
            : '';
        const ts = typeof timestamp === 'string' ? chalk.gray(timestamp) : '';
        const levelFormatted = this.formatLevel(
          typeof level === 'string' ? level : 'info',
        );
        const emojiStr = emoji && typeof emoji === 'string' ? `${emoji} ` : '';

        let metaStr = '';
        if (Object.keys(meta).length > 0) {
          metaStr = '\n' + chalk.gray(JSON.stringify(meta, null, 2));
        }

        return `${ts} ${levelFormatted} ${ctx} ${emojiStr}${String(message)}${metaStr}`;
      },
    );

    this.logger = createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: format.combine(
        format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        format.errors({ stack: true }),
        customFormat,
      ),
      transports: [
        new transports.Console({
          format: format.combine(
            format.colorize({ all: false }), // Usamos chalk en lugar de colorize
            customFormat,
          ),
        }),
        // Archivo de logs para producción
        ...(process.env.NODE_ENV === 'production'
          ? [
              new transports.File({
                filename: 'logs/error.log',
                level: 'error',
                format: format.combine(format.uncolorize(), format.json()),
              }),
              new transports.File({
                filename: 'logs/combined.log',
                format: format.combine(format.uncolorize(), format.json()),
              }),
            ]
          : []),
      ],
    });
  }

  private formatLevel(level: string): string {
    switch (level) {
      case 'error':
        return chalk.red.bold('ERROR');
      case 'warn':
        return chalk.yellow.bold(' WARN');
      case 'info':
        return chalk.blue.bold(' INFO');
      case 'debug':
        return chalk.magenta.bold('DEBUG');
      case 'verbose':
        return chalk.gray.bold(' VERB');
      default:
        return level.toUpperCase();
    }
  }

  log(message: string, context?: string, emoji?: string) {
    this.logger.info(message, { context: context || this.context, emoji });
  }

  error(message: string, trace?: string, context?: string, emoji = '❌') {
    this.logger.error(message, {
      context: context || this.context,
      emoji,
      trace,
    });
  }

  warn(message: string, context?: string, emoji = '⚠️') {
    this.logger.warn(message, { context: context || this.context, emoji });
  }

  debug(message: string, context?: string, emoji = '🔍') {
    this.logger.debug(message, { context: context || this.context, emoji });
  }

  verbose(message: string, context?: string, emoji = '📝') {
    this.logger.verbose(message, { context: context || this.context, emoji });
  }

  // Métodos con emojis específicos
  success(message: string, context?: string) {
    this.log(message, context, '✅');
  }

  start(message: string, context?: string) {
    this.log(message, context, '🚀');
  }

  database(message: string, context?: string) {
    this.debug(message, context, '💾');
  }

  auth(message: string, context?: string) {
    this.log(message, context, '🔐');
  }

  security(message: string, context?: string) {
    this.warn(message, context, '🛡️');
  }

  http(message: string, context?: string) {
    this.log(message, context, '🌐');
  }

  user(message: string, context?: string) {
    this.log(message, context, '👤');
  }

  seed(message: string, context?: string) {
    this.log(message, context, '🌱');
  }

  cache(message: string, context?: string) {
    this.debug(message, context, '⚡');
  }

  api(message: string, context?: string) {
    this.log(message, context, '📡');
  }
}
