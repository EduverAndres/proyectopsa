import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
  success: boolean;
  statusCode: number;
  message?: string;
  data: T;
  timestamp: string;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, Response<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<Response<T>> {
    const ctx = context.switchToHttp();
    const response = ctx.getResponse();
    
    return next.handle().pipe(
      map(data => ({
        success: true,
        statusCode: response.statusCode,
        message: this.getSuccessMessage(context, response.statusCode),
        data,
        timestamp: new Date().toISOString(),
      })),
    );
  }

  private getSuccessMessage(context: ExecutionContext, statusCode: number): string {
    const request = context.switchToHttp().getRequest();
    const method = request.method;

    switch (method) {
      case 'POST':
        return statusCode === 201 ? 'Recurso creado exitosamente' : 'Operación completada';
      case 'PUT':
      case 'PATCH':
        return 'Recurso actualizado exitosamente';
      case 'DELETE':
        return 'Recurso eliminado exitosamente';
      case 'GET':
      default:
        return 'Operación exitosa';
    }
  }
}