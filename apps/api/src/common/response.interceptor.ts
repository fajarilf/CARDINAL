import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Response } from 'express';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AppSuccessResponse } from './dto/app-success-response.dto';

type Wrapped<T> = AppSuccessResponse<T> | T;

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, Wrapped<T>> {
  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<Wrapped<T>> {
    const code = context.switchToHttp().getResponse<Response>().statusCode;

    return next.handle().pipe(
      map((data) => {
        // 204 must stay bodiless; nothing to wrap when a handler returns void
        if (code === 204 || data === undefined) return data;
        return { status: 'success', code, data };
      }),
    );
  }
}
