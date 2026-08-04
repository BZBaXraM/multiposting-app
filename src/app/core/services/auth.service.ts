import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { AuthRequest, SignInRequest } from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);

  // The live API returns the JWT as a raw string with Content-Type: text/plain (not JSON) —
  // responseType must be 'text' or Angular's default JSON parser silently turns the 200 into
  // an HttpErrorResponse.
  signIn(req: SignInRequest) {
    return this.http.post('https://multiposting-fm82.onrender.com/api/Auth/sign-in', req, {
      observe: 'response',
      responseType: 'text',
    });
  }

  signUp(req: AuthRequest) {
    return this.http.post('https://multiposting-fm82.onrender.com/api/Auth/sign-up', req, {
      observe: 'response',
      responseType: 'text',
    });
  }
}
