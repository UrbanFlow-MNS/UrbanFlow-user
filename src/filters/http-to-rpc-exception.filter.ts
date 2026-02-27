import { ArgumentsHost, Catch, HttpException } from '@nestjs/common';
import { BaseRpcExceptionFilter } from '@nestjs/microservices';
import { throwError } from 'rxjs';

@Catch(HttpException)
export class HttpToRpcExceptionFilter extends BaseRpcExceptionFilter {
    catch(exception: HttpException, host: ArgumentsHost) {
        const response = exception.getResponse() as any;
        return throwError(() => ({
            statusCode: exception.getStatus(),
            message: typeof response === 'string' ? response : response.message,
        }));
    }
}
