import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { VideoService, AiService } from '../../services/video.service';
import { VideoProject } from '../../models/video.models';

@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [
    CommonModule, RouterModule, FormsModule,
    MatCardModule, MatButtonModule, MatIconModule, MatChipsModule,
    MatTabsModule, MatProgressBarModule, MatProgressSpinnerModule,
    MatFormFieldModule, MatInputModule, MatSnackBarModule, MatDividerModule
  ],
  template: `
    <div class="detail-container">
      @if (loading()) {
        <mat-progress-bar mode="indeterminate"></mat-progress-bar>
      } @else if (project()) {
        <div class="detail-header">
          <div>
            <a mat-button routerLink="/projects"><mat-icon>arrow_back</mat-icon> Back</a>
            <h1>{{ project()!.title }}</h1>
            <div class="status-row">
              <mat-chip [class]="'status-' + project()!.status.toLowerCase()">
                {{ formatStatus(project()!.status) }}
              </mat-chip>
              <span class="date">Created {{ project()!.createdAt | date:'medium' }}</span>
            </div>
          </div>
          <div class="header-actions">
            @if (project()!.status === 'Draft' || project()!.status === 'PreviewReady') {
              <button mat-raised-button color="primary" (click)="startGeneration()" [disabled]="processing()">
                <mat-icon>play_arrow</mat-icon> Generate Video
              </button>
            }
            @if (project()!.status === 'Ready') {
              <button mat-raised-button color="warn" (click)="uploadToYouTube()">
                <mat-icon>upload</mat-icon> Upload to YouTube
              </button>
            }
          </div>
        </div>

        @if (project()!.status === 'GeneratingFinal' || project()!.status === 'GeneratingPreview') {
          <div class="generating-banner">
            <mat-progress-bar mode="indeterminate" color="accent"></mat-progress-bar>
            <p><mat-icon>hourglass_empty</mat-icon> {{ formatStatus(project()!.status) }}... This may take a moment.</p>
          </div>
        }

        <mat-tab-group>
          <!-- Overview Tab -->
          <mat-tab label="Overview">
            <div class="tab-content">
              <div class="info-grid">
                <mat-card>
                  <mat-card-content>
                    <div class="info-row"><label>Style</label><span>{{ project()!.style }}</span></div>
                    <mat-divider></mat-divider>
                    <div class="info-row"><label>Duration</label><span>{{ project()!.duration }}</span></div>
                    <mat-divider></mat-divider>
                    <div class="info-row"><label>Aspect Ratio</label><span>{{ project()!.aspectRatio }}</span></div>
                    <mat-divider></mat-divider>
                    <div class="info-row"><label>Resolution</label><span>{{ project()!.resolution }}</span></div>
                    <mat-divider></mat-divider>
                    <div class="info-row"><label>Character Style</label><span>{{ project()!.characterStyle }}</span></div>
                    <mat-divider></mat-divider>
                    <div class="info-row"><label>Language</label><span>{{ project()!.language }}</span></div>
                  </mat-card-content>
                </mat-card>

                <mat-card>
                  <mat-card-header><mat-card-title>Prompt</mat-card-title></mat-card-header>
                  <mat-card-content>
                    <p class="prompt-text">{{ project()!.prompt }}</p>
                    @if (project()!.description) {
                      <p class="desc-text">{{ project()!.description }}</p>
                    }
                  </mat-card-content>
                </mat-card>
              </div>

              @if (project()!.tags?.length > 0) {
                <div class="tags-section">
                  <label>Tags</label>
                  <div class="tags-row">
                    @for (tag of project()!.tags; track tag) {
                      <mat-chip>{{ tag }}</mat-chip>
                    }
                  </div>
                </div>
              }

              @if (project()!.youTubeUrl) {
                <mat-card class="youtube-card">
                  <mat-card-content>
                    <mat-icon color="warn">smart_display</mat-icon>
                    <a [href]="project()!.youTubeUrl" target="_blank">{{ project()!.youTubeUrl }}</a>
                  </mat-card-content>
                </mat-card>
              }
            </div>
          </mat-tab>

          <!-- Preview Tab -->
          <mat-tab label="Preview">
            <div class="tab-content">
              @if (project()!.status === 'Draft') {
                <div class="empty-preview">
                  <mat-icon>preview</mat-icon>
                  <p>Generate a preview to see your video storyboard</p>
                  <button mat-raised-button color="primary" (click)="generatePreview()">
                    <mat-icon>auto_awesome</mat-icon> Generate Preview
                  </button>
                </div>
              } @else if (previewData()) {
                <mat-card class="preview-card">
                  <mat-card-header><mat-card-title>AI Video Storyboard</mat-card-title></mat-card-header>
                  <mat-card-content>
                    <pre class="preview-content">{{ previewData() }}</pre>
                  </mat-card-content>
                </mat-card>
              }
            </div>
          </mat-tab>

          <!-- AI Chat Tab -->
          <mat-tab label="AI Assistant">
            <div class="tab-content">
              <div class="chat-container">
                <div class="chat-messages">
                  @for (msg of chatMessages(); track $index) {
                    <div class="message" [class.user]="msg.isUser" [class.ai]="!msg.isUser">
                      <mat-icon>{{ msg.isUser ? 'person' : 'psychology' }}</mat-icon>
                      <div class="message-content">{{ msg.text }}</div>
                    </div>
                  }
                </div>
                <div class="chat-input">
                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Ask AI for help with your video...</mat-label>
                    <input matInput [(ngModel)]="chatInput" (keyup.enter)="sendChat()" placeholder="How can I improve this video?">
                  </mat-form-field>
                  <button mat-icon-button color="primary" (click)="sendChat()" [disabled]="!chatInput || chatting()">
                    @if (chatting()) { <mat-spinner diameter="24"></mat-spinner> }
                    @else { <mat-icon>send</mat-icon> }
                  </button>
                </div>
              </div>
            </div>
          </mat-tab>
        </mat-tab-group>
      }
    </div>
  `,
  styles: [`
    .detail-container { max-width: 1000px; margin: 0 auto; padding: 24px; }
    .detail-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
    .detail-header h1 { font-size: 1.8rem; font-weight: 700; margin: 8px 0; }
    .status-row { display: flex; align-items: center; gap: 12px; }
    .date { font-size: 0.85rem; color: #888; }
    .header-actions { display: flex; gap: 12px; }
    .generating-banner { padding: 12px; background: rgba(255,152,0,0.1); border-radius: 8px; margin-bottom: 16px; }
    .generating-banner p { display: flex; align-items: center; gap: 8px; margin: 8px 0 0; color: #ff9800; }

    .tab-content { padding: 24px 0; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
    .info-row { display: flex; justify-content: space-between; padding: 10px 0; }
    .info-row label { color: #888; font-size: 0.85rem; }
    .info-row span { font-weight: 500; }
    .prompt-text { color: #ccc; line-height: 1.6; }
    .desc-text { color: #888; font-size: 0.9rem; margin-top: 8px; }
    .tags-section { margin-bottom: 16px; }
    .tags-section label { display: block; color: #888; margin-bottom: 8px; font-size: 0.85rem; }
    .tags-row { display: flex; flex-wrap: wrap; gap: 8px; }
    .youtube-card { background: rgba(255,0,0,0.05) !important; border: 1px solid rgba(255,0,0,0.2) !important; }
    .youtube-card mat-card-content { display: flex; align-items: center; gap: 12px; }

    .empty-preview { text-align: center; padding: 60px 20px; display: flex; flex-direction: column; align-items: center; gap: 16px; }
    .empty-preview mat-icon { font-size: 64px !important; width: 64px !important; height: 64px !important; color: #888; }
    .preview-card pre.preview-content { white-space: pre-wrap; font-family: monospace; font-size: 0.85rem; max-height: 400px; overflow-y: auto; }

    .chat-container { display: flex; flex-direction: column; height: 500px; }
    .chat-messages { flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 12px; }
    .message { display: flex; gap: 12px; align-items: flex-start; }
    .message.user { flex-direction: row-reverse; }
    .message-content { background: rgba(255,255,255,0.05); padding: 12px; border-radius: 12px; max-width: 80%; }
    .message.user .message-content { background: rgba(233,69,96,0.15); }
    .chat-input { display: flex; align-items: center; gap: 8px; padding: 16px 0; }
    .full-width { width: 100%; }

    .status-draft { background: rgba(158,158,158,0.2) !important; color: #9e9e9e !important; }
    .status-previewready { background: rgba(255,152,0,0.2) !important; color: #ff9800 !important; }
    .status-ready { background: rgba(76,175,80,0.2) !important; color: #4caf50 !important; }
    .status-published { background: rgba(33,150,243,0.2) !important; color: #2196f3 !important; }
    .status-failed { background: rgba(244,67,54,0.2) !important; color: #f44336 !important; }
  `]
})
export class ProjectDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private videoService = inject(VideoService);
  private aiService = inject(AiService);
  private snackBar = inject(MatSnackBar);

  project = signal<VideoProject | null>(null);
  loading = signal(true);
  processing = signal(false);
  previewData = signal<string | null>(null);
  chatMessages = signal<{ text: string; isUser: boolean }[]>([]);
  chatInput = '';
  chatting = signal(false);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.loadProject(id);
  }

  loadProject(id: string): void {
    this.videoService.getById(id).subscribe({
      next: p => { this.project.set(p); this.loading.set(false); },
      error: () => { this.loading.set(false); this.router.navigate(['/projects']); }
    });
  }

  generatePreview(): void {
    const id = this.project()?.id;
    if (!id) return;
    this.processing.set(true);
    this.videoService.generatePreview(id).subscribe({
      next: res => { this.previewData.set(res.preview); this.processing.set(false); this.loadProject(id); },
      error: () => { this.processing.set(false); }
    });
  }

  startGeneration(): void {
    const id = this.project()?.id;
    if (!id) return;
    this.processing.set(true);
    this.videoService.startGeneration(id).subscribe({
      next: p => { this.project.set(p); this.processing.set(false); this.snackBar.open('Generation started!', 'Dismiss', { duration: 3000 }); },
      error: () => { this.processing.set(false); }
    });
  }

  uploadToYouTube(): void {
    const p = this.project();
    if (!p) return;
    this.videoService.uploadToYouTube(p.id, {
      title: p.title, description: p.description, tags: p.tags, privacyStatus: 'public'
    }).subscribe({
      next: res => {
        this.snackBar.open(`Uploaded! YouTube ID: ${res.videoId}`, 'Dismiss', { duration: 5000 });
        this.loadProject(p.id);
      }
    });
  }

  sendChat(): void {
    if (!this.chatInput.trim()) return;
    const message = this.chatInput;
    this.chatInput = '';
    this.chatMessages.update(m => [...m, { text: message, isUser: true }]);
    this.chatting.set(true);
    this.aiService.chat(this.project()?.id ?? '', message).subscribe({
      next: res => {
        this.chatMessages.update(m => [...m, { text: res.response, isUser: false }]);
        this.chatting.set(false);
      },
      error: () => { this.chatting.set(false); }
    });
  }

  formatStatus(status: string): string {
    return status.replace(/([A-Z])/g, ' $1').trim();
  }
}
