import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { VideoService } from '../../services/video.service';
import { VideoProject } from '../../models/video.models';

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [
    CommonModule, RouterModule, MatCardModule, MatButtonModule, MatIconModule,
    MatChipsModule, MatProgressBarModule, MatMenuModule, MatSnackBarModule, MatDialogModule
  ],
  template: `
    <div class="projects-container">
      <div class="page-header">
        <div>
          <h1>My Projects</h1>
          <p>Manage your video generation projects</p>
        </div>
        <a mat-raised-button color="primary" routerLink="/create">
          <mat-icon>add</mat-icon> New Project
        </a>
      </div>

      @if (loading()) {
        <div class="loading-state">
          <mat-progress-bar mode="indeterminate"></mat-progress-bar>
        </div>
      } @else if (projects().length === 0) {
        <div class="empty-state">
          <mat-icon>video_library</mat-icon>
          <h2>No projects yet</h2>
          <p>Create your first AI-powered video project</p>
          <a mat-raised-button color="primary" routerLink="/create">
            <mat-icon>add</mat-icon> Create Video
          </a>
        </div>
      } @else {
        <div class="projects-grid">
          @for (project of projects(); track project.id) {
            <mat-card class="project-card">
              <div class="card-thumb" [class]="'thumb-' + getThumbClass(project.style)">
                <mat-icon class="thumb-icon">{{ getStatusIcon(project.status) }}</mat-icon>
                @if (project.status === 'GeneratingFinal' || project.status === 'GeneratingPreview') {
                  <div class="generating-overlay">
                    <span>Generating...</span>
                    <mat-progress-bar mode="indeterminate" color="warn"></mat-progress-bar>
                  </div>
                }
              </div>
              <mat-card-content>
                <div class="card-header">
                  <h3>{{ project.title }}</h3>
                  <button mat-icon-button [matMenuTriggerFor]="projectMenu">
                    <mat-icon>more_vert</mat-icon>
                  </button>
                  <mat-menu #projectMenu="matMenu">
                    <a mat-menu-item [routerLink]="['/projects', project.id]">
                      <mat-icon>visibility</mat-icon> View Details
                    </a>
                    @if (project.status === 'Draft' || project.status === 'PreviewReady') {
                      <button mat-menu-item (click)="startGeneration(project)">
                        <mat-icon>play_arrow</mat-icon> Generate Video
                      </button>
                    }
                    @if (project.status === 'Ready') {
                      <a mat-menu-item [routerLink]="['/projects', project.id]">
                        <mat-icon>upload</mat-icon> Upload to YouTube
                      </a>
                    }
                    <button mat-menu-item class="delete-item" (click)="deleteProject(project.id)">
                      <mat-icon>delete</mat-icon> Delete
                    </button>
                  </mat-menu>
                </div>
                <p class="project-desc">{{ project.description || project.prompt }}</p>
                <div class="project-meta">
                  <span>{{ project.style }}</span>
                  <span>{{ project.duration }}</span>
                  <span>{{ project.aspectRatio }}</span>
                </div>
                <div class="project-footer">
                  <mat-chip [class]="'status-' + project.status.toLowerCase()">
                    <mat-icon matChipTrailingIcon>{{ getStatusIcon(project.status) }}</mat-icon>
                    {{ formatStatus(project.status) }}
                  </mat-chip>
                  <span class="date">{{ project.createdAt | date:'MMM d' }}</span>
                </div>
              </mat-card-content>
            </mat-card>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .projects-container { max-width: 1200px; margin: 0 auto; padding: 24px; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; }
    .page-header h1 { font-size: 2rem; font-weight: 700; margin: 0; }
    .page-header p { color: #888; margin: 4px 0 0; }

    .empty-state {
      text-align: center; padding: 80px 20px;
      display: flex; flex-direction: column; align-items: center; gap: 16px;
    }
    .empty-state mat-icon { font-size: 64px !important; width: 64px !important; height: 64px !important; color: #888; }
    .empty-state h2 { font-size: 1.5rem; }
    .empty-state p { color: #888; }

    .projects-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; }
    .project-card { overflow: hidden; transition: transform 0.2s, box-shadow 0.2s; }
    .project-card:hover { transform: translateY(-4px); box-shadow: 0 8px 30px rgba(0,0,0,0.2); }

    .card-thumb {
      height: 160px; display: flex; align-items: center; justify-content: center;
      position: relative; overflow: hidden;
    }
    .thumb-cinematic { background: linear-gradient(135deg, #1a1a2e, #16213e); }
    .thumb-anime { background: linear-gradient(135deg, #ff6b9d, #c0392b); }
    .thumb-cartoon { background: linear-gradient(135deg, #f39c12, #e67e22); }
    .thumb-realistic { background: linear-gradient(135deg, #2c3e50, #34495e); }
    .thumb-default { background: linear-gradient(135deg, #0f3460, #e94560); }
    .thumb-icon { font-size: 56px !important; width: 56px !important; height: 56px !important; color: rgba(255,255,255,0.6); }

    .generating-overlay {
      position: absolute; bottom: 0; left: 0; right: 0;
      background: rgba(0,0,0,0.7); padding: 8px;
      display: flex; flex-direction: column; gap: 4px;
      font-size: 0.8rem; color: white; text-align: center;
    }

    .card-header { display: flex; align-items: center; }
    .card-header h3 { flex: 1; margin: 0; font-size: 1rem; font-weight: 600; }
    .project-desc { color: #888; font-size: 0.85rem; margin: 4px 0 8px; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
    .project-meta { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 8px; }
    .project-meta span { background: rgba(255,255,255,0.05); border-radius: 4px; padding: 2px 8px; font-size: 0.75rem; color: #888; }
    .project-footer { display: flex; justify-content: space-between; align-items: center; }
    .date { font-size: 0.75rem; color: #888; }
    .delete-item { color: #f44336; }

    .status-ready { background: rgba(76,175,80,0.2) !important; color: #4caf50 !important; }
    .status-published { background: rgba(33,150,243,0.2) !important; color: #2196f3 !important; }
    .status-failed { background: rgba(244,67,54,0.2) !important; color: #f44336 !important; }
    .status-draft { background: rgba(158,158,158,0.2) !important; color: #9e9e9e !important; }
    .status-previewready { background: rgba(255,152,0,0.2) !important; color: #ff9800 !important; }
  `]
})
export class ProjectsComponent implements OnInit {
  private videoService = inject(VideoService);
  private snackBar = inject(MatSnackBar);

  projects = signal<VideoProject[]>([]);
  loading = signal(true);

  ngOnInit(): void {
    this.loadProjects();
  }

  loadProjects(): void {
    this.loading.set(true);
    this.videoService.getAll().subscribe({
      next: p => { this.projects.set(p); this.loading.set(false); },
      error: () => { this.loading.set(false); }
    });
  }

  startGeneration(project: VideoProject): void {
    this.videoService.startGeneration(project.id).subscribe({
      next: () => {
        this.snackBar.open('Video generation started!', 'Dismiss', { duration: 3000 });
        this.loadProjects();
      }
    });
  }

  deleteProject(id: string): void {
    if (confirm('Delete this project?')) {
      this.videoService.delete(id).subscribe(() => this.loadProjects());
    }
  }

  getStatusIcon(status: string): string {
    const icons: Record<string, string> = {
      Draft: 'edit_note', Configuring: 'settings', GeneratingPreview: 'hourglass_empty',
      PreviewReady: 'preview', GeneratingFinal: 'movie_filter', Ready: 'check_circle',
      Uploading: 'cloud_upload', Published: 'public', Failed: 'error'
    };
    return icons[status] ?? 'video_file';
  }

  getThumbClass(style: string): string {
    return ['cinematic', 'anime', 'cartoon', 'realistic'].includes(style) ? style : 'default';
  }

  formatStatus(status: string): string {
    return status.replace(/([A-Z])/g, ' $1').trim();
  }
}
