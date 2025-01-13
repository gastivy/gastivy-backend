import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class SuccessResponseInterceptor<T> implements NestInterceptor<T, any> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const response = context.switchToHttp().getResponse();
    return next.handle().pipe(
      map((data) => {
        if (data.pagination) {
          return {
            code: response.statusCode,
            message: 'Success',
            data: data.data,
            pagination: data.pagination,
          };
        }
        return {
          code: response.statusCode,
          message: 'Success',
          data: data,
        };
      }),
    );
  }
}
