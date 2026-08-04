import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { CreateProjectRequest, Project } from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class ProjectService {
  private readonly http = inject(HttpClient);

  /** GET /api/Project with no id returns the caller's own project (one per account). */
  getMine() {
    return this.http.get<Project>('https://multiposting-fm82.onrender.com/api/Project');
  }

  create(req: CreateProjectRequest) {
    return this.http.post<Project>('https://multiposting-fm82.onrender.com/api/Project', req);
  }

  remove(projectId: string, userAssetId?: string) {
    let params = new HttpParams().set('ProjectId', projectId);
    if (userAssetId) {
      params = params.set('UserAssetId', userAssetId);
    }
    return this.http.delete<unknown>('/api/Project', { params });
  }
}
