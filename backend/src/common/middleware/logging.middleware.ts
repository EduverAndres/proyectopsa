// ===========================================
// src/common/middleware/logging.middleware.ts (CORREGIDO)
// ===========================================
import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggingMiddleware implements NestMiddleware {
  private readonly logger = new Logger(LoggingMiddleware.name);

  use(req: Request, res: Response, next: NextFunction) {
    const startTime = Date.now();
    const { method, originalUrl, ip } = req;
    const userAgent = req.get('User-Agent') || '';

    // Log de la request entrante
    this.logger.log(`Incoming Request: ${method} ${originalUrl} - ${ip} - ${userAgent}`);

    // Capturar el método original end
    const originalEnd = res.end.bind(res);

    // Override del método end para capturar la respuesta
    res.end = function(chunk?: any, encoding?: BufferEncoding | (() => void), cb?: () => void) {
      const duration = Date.now() - startTime;
      const { statusCode } = res;
      const contentLength = res.get('Content-Length') || '0';

      // Log de la respuesta
      const logLevel = statusCode >= 400 ? 'warn' : 'log';
      const logger = new Logger(LoggingMiddleware.name);
      
      logger[logLevel](
        `Response: ${method} ${originalUrl} - ${statusCode} - ${contentLength}bytes - ${duration}ms`
      );

      // Llamar al método original con los argumentos correctos
      if (typeof encoding === 'function') {
        return originalEnd(chunk, encoding);
      }
      return originalEnd(chunk, encoding, cb);
    };

    next();
  }
}

