import { Injectable, ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  /**
   * Obtiene el identificador único para el throttling
   * Prioriza el user ID si está autenticado, sino usa la IP
   */
  protected async getTracker(req: Record<string, any>): Promise<string> {
    const userId = req.user?.id;
    
    // Obtención robusta de IP considerando proxies y diferentes configuraciones
    const ip = req.ip || 
               req.connection?.remoteAddress || 
               req.socket?.remoteAddress ||
               req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
               req.headers['x-real-ip'] ||
               'unknown';
    
    // Validar que userId sea válido antes de usarlo
    return (userId && typeof userId === 'number') ? `user-${userId}` : `ip-${ip}`;
  }

  /**
   * Genera una clave personalizada para el throttling
   * Incluye el nombre de la clase y método para mayor granularidad
   */
  protected generateKey(
    context: ExecutionContext,
    suffix: string,
    name: string,
  ): string {
    const handler = context.getHandler().name;
    const className = context.getClass().name;
    
    return `${className}-${handler}-${suffix}-${name}`;
  }
}