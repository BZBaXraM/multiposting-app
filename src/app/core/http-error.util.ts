import { HttpErrorResponse } from '@angular/common/http';
import { ApiExceptionBody } from './models/api.models';

/** Formats any error thrown by HttpClient into a single human-readable line. */
export function describeHttpError(err: unknown): string {
  if (!(err instanceof HttpErrorResponse)) {
    return err instanceof Error ? err.message : String(err);
  }

  if (err.status === 0) {
    return 'Network/CORS error — the API could not be reached (see console for details).';
  }

  const body = err.error;

  // FluentValidation-style array: [{ propertyName, errorMessage }, ...]
  if (Array.isArray(body)) {
    const messages = body
      .map((item) =>
        item && typeof item === 'object' && typeof item['errorMessage'] === 'string'
          ? item['errorMessage']
          : null,
      )
      .filter((m): m is string => !!m);
    if (messages.length) {
      return messages.join('; ');
    }
  }

  if (body && typeof body === 'object') {
    const apiError = body as ApiExceptionBody;
    if (apiError.Message) {
      return `${apiError.Message}${apiError.ExceptionType ? ` [${apiError.ExceptionType}]` : ''}`;
    }
    if ('errors' in body && body['errors'] && typeof body['errors'] === 'object') {
      const errors = body['errors'] as Record<string, string[]>;
      return Object.entries(errors)
        .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
        .join('; ');
    }
    if ('title' in body && typeof body['title'] === 'string') {
      return body['title'] as string;
    }
  }

  return `${err.status} ${err.statusText}`;
}

/** Best-effort attempt to pull an access token out of an unknown sign-in/sign-up response body. */
export function extractToken(body: unknown): string | null {
  if (typeof body === 'string' && body.length > 0) {
    return body;
  }
  if (body && typeof body === 'object') {
    const candidates = ['accessToken', 'AccessToken', 'token', 'Token', 'jwt', 'access_token'];
    for (const key of candidates) {
      const value = (body as Record<string, unknown>)[key];
      if (typeof value === 'string' && value.length > 0) {
        return value;
      }
    }
  }
  return null;
}
