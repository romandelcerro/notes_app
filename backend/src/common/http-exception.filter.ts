import { ExceptionFilter, Catch, ArgumentsHost, HttpException, Logger } from '@nestjs/common';
import type { Request, Response } from 'express';
import { I18nService } from './i18n/i18n.service.js';

interface ErrorBody {
  message?: string | string[];
  error?: string;
  statusCode?: number;
}

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly _logger = new Logger(HttpExceptionFilter.name);

  constructor(private readonly _i18n: I18nService) {}

  catch(exception: HttpException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse() as string | ErrorBody;
    const rawMessage =
      typeof exceptionResponse === 'string' ? exceptionResponse : exceptionResponse.message;

    const message = Array.isArray(rawMessage) ? rawMessage[0] : rawMessage;
    const messageStr = typeof message === 'string' ? message : 'Unknown error';

    const lang = this._resolveLang(request);
    const translatedMessage = this._i18n.translate(messageStr, lang);

    this._logger.error(`${request.method} ${request.url} → ${status} ${messageStr}`);

    response.status(status).json({
      statusCode: status,
      message: translatedMessage,
      translationKey: messageStr,
      error: typeof exceptionResponse === 'object' ? exceptionResponse.error : undefined,
    });
  }

  private _resolveLang(request: Request): string {
    const header = request.headers['accept-language'];
    if (!header) return 'en';
    const lang = header.split(',')[0].split('-')[0];
    return lang === 'en' || lang === 'es' ? lang : 'en';
  }
}
