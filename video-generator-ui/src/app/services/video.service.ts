import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  VideoProject,
  CreateVideoProjectRequest,
  GenerateTitlesResponse,
  GenerateScriptResponse,
  AiChatResponse
} from '../models/video.models';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class VideoService {
  private apiUrl = `${environment.apiUrl}/api/videos`;

  constructor(private http: HttpClient) {}

  getAll(userId = 'default'): Observable<VideoProject[]> {
    return this.http.get<VideoProject[]>(`${this.apiUrl}?userId=${userId}`);
  }

  getById(id: string): Observable<VideoProject> {
    return this.http.get<VideoProject>(`${this.apiUrl}/${id}`);
  }

  create(request: CreateVideoProjectRequest, userId = 'default'): Observable<VideoProject> {
    return this.http.post<VideoProject>(`${this.apiUrl}?userId=${userId}`, request);
  }

  update(id: string, request: Partial<CreateVideoProjectRequest>): Observable<VideoProject> {
    return this.http.put<VideoProject>(`${this.apiUrl}/${id}`, request);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  generatePreview(id: string): Observable<{ preview: string; projectId: string }> {
    return this.http.post<{ preview: string; projectId: string }>(`${this.apiUrl}/${id}/preview`, {});
  }

  startGeneration(id: string): Observable<VideoProject> {
    return this.http.post<VideoProject>(`${this.apiUrl}/${id}/generate`, {});
  }

  uploadToYouTube(id: string, data: { title: string; description: string; tags: string[]; privacyStatus: string }): Observable<{ videoId: string; videoUrl: string; status: string }> {
    return this.http.post<{ videoId: string; videoUrl: string; status: string }>(`${this.apiUrl}/${id}/upload-youtube`, { projectId: id, ...data });
  }

  getYouTubeAuthUrl(): Observable<{ authUrl: string }> {
    return this.http.get<{ authUrl: string }>(`${this.apiUrl}/youtube/auth-url`);
  }
}

@Injectable({ providedIn: 'root' })
export class AiService {
  private apiUrl = `${environment.apiUrl}/api/ai`;

  constructor(private http: HttpClient) {}

  generateTitles(topic: string, videoType = 'youtube', count = 5): Observable<GenerateTitlesResponse> {
    return this.http.post<GenerateTitlesResponse>(`${this.apiUrl}/generate-titles`, { topic, videoType, count });
  }

  generateScript(prompt: string, style: string, duration: string, videoType = 'youtube_short'): Observable<GenerateScriptResponse> {
    return this.http.post<GenerateScriptResponse>(`${this.apiUrl}/generate-script`, { prompt, style, duration, videoType });
  }

  generateTags(title: string, description: string): Observable<{ tags: string[] }> {
    return this.http.post<{ tags: string[] }>(`${this.apiUrl}/generate-tags`, { title, description });
  }

  chat(projectId: string, message: string, context = 'video_creation'): Observable<AiChatResponse> {
    return this.http.post<AiChatResponse>(`${this.apiUrl}/chat`, { projectId, message, context });
  }

  transformCharacter(projectId: string, sourceVideoUrl: string, targetStyle: string, characterDescription: string): Observable<{ transformationPlan: string; projectId: string }> {
    return this.http.post<{ transformationPlan: string; projectId: string }>(`${this.apiUrl}/transform-character`, {
      projectId, sourceVideoUrl, targetCharacterStyle: targetStyle, characterDescription
    });
  }

  generateThumbnail(projectId: string): Observable<{ thumbnailPrompt: string; projectId: string }> {
    return this.http.post<{ thumbnailPrompt: string; projectId: string }>(`${this.apiUrl}/generate-thumbnail`, { projectId });
  }
}
