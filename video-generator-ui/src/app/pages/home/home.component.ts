import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { VideoService } from '../../services/video.service';
import { VideoProject } from '../../models/video.models';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, MatCardModule, MatButtonModule, MatIconModule, MatChipsModule, MatProgressBarModule],
  template: `
    <div class="home-container">
      <!-- Hero Section -->
      <section class="hero">
        <div class="hero-content">
          <div class="hero-badge">
            <mat-icon>auto_awesome</mat-icon>
            <span>Powered by Google Gemini AI</span>
          </div>
          <h1 class="hero-title">
            Create <span class="gradient-text">Viral Videos</span><br/>
            with AI Magic
          </h1>
          <p class="hero-subtitle">
            Generate YouTube Shorts, long-form videos, transform characters, create viral titles,
            and upload directly to YouTube — all powered by Google Gemini AI.
          </p>
          <div class="hero-actions">
            <a mat-raised-button color="primary" routerLink="/create" class="cta-btn">
              <mat-icon>add_circle</mat-icon>
              Create Video Now
            </a>
            <a mat-stroked-button routerLink="/ai-tools" class="secondary-btn">
              <mat-icon>psychology</mat-icon>
              Explore AI Tools
            </a>
          </div>
        </div>
        <div class="hero-visual">
          <div class="video-mockup">
            <mat-icon class="play-icon">play_circle_filled</mat-icon>
            <div class="mockup-label">AI-Generated Video</div>
          </div>
        </div>
      </section>

      <!-- Features Grid -->
      <section class="features">
        <h2>Everything You Need to Go Viral</h2>
        <div class="features-grid">
          @for (feature of features; track feature.title) {
            <mat-card class="feature-card">
              <mat-card-content>
                <div class="feature-icon" [style.background]="feature.gradient">
                  <mat-icon>{{ feature.icon }}</mat-icon>
                </div>
                <h3>{{ feature.title }}</h3>
                <p>{{ feature.description }}</p>
              </mat-card-content>
            </mat-card>
          }
        </div>
      </section>

      <!-- Recent Projects -->
      @if (recentProjects().length > 0) {
        <section class="recent-projects">
          <div class="section-header">
            <h2>Recent Projects</h2>
            <a mat-button routerLink="/projects" color="primary">View All</a>
          </div>
          <div class="projects-grid">
            @for (project of recentProjects(); track project.id) {
              <mat-card class="project-card" [routerLink]="['/projects', project.id]">
                <div class="project-thumb">
                  <mat-icon class="thumb-icon">{{ getStatusIcon(project.status) }}</mat-icon>
                </div>
                <mat-card-content>
                  <h3>{{ project.title }}</h3>
                  <p>{{ project.style }} • {{ project.duration }}</p>
                  <mat-chip [class]="'status-chip ' + project.status.toLowerCase()">
                    {{ project.status }}
                  </mat-chip>
                </mat-card-content>
              </mat-card>
            }
          </div>
        </section>
      }

      <!-- Stats -->
      <section class="stats">
        @for (stat of stats; track stat.label) {
          <div class="stat-item">
            <mat-icon>{{ stat.icon }}</mat-icon>
            <div class="stat-value">{{ stat.value }}</div>
            <div class="stat-label">{{ stat.label }}</div>
          </div>
        }
      </section>
    </div>
  `,
  styles: [`
    .home-container { max-width: 1200px; margin: 0 auto; padding: 24px; }

    .hero {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 48px;
      align-items: center;
      padding: 48px 0;
    }
    .hero-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: rgba(233,69,96,0.1);
      border: 1px solid rgba(233,69,96,0.3);
      border-radius: 20px;
      padding: 6px 16px;
      color: #e94560;
      font-size: 0.85rem;
      margin-bottom: 24px;
    }
    .hero-title {
      font-size: 3rem;
      font-weight: 800;
      line-height: 1.2;
      margin: 0 0 16px;
    }
    .gradient-text {
      background: linear-gradient(135deg, #e94560, #0f3460);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    .hero-subtitle { font-size: 1.1rem; color: #888; margin-bottom: 32px; line-height: 1.6; }
    .hero-actions { display: flex; gap: 16px; flex-wrap: wrap; }
    .cta-btn { padding: 12px 24px !important; font-size: 1rem !important; }
    .secondary-btn { padding: 12px 24px !important; }

    .video-mockup {
      background: linear-gradient(135deg, #1a1a2e, #16213e);
      border-radius: 16px;
      height: 280px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      border: 1px solid rgba(233,69,96,0.3);
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    }
    .play-icon { font-size: 80px !important; width: 80px !important; height: 80px !important; color: #e94560; }
    .mockup-label { color: #888; margin-top: 12px; }

    .features { padding: 48px 0; text-align: center; }
    .features h2 { font-size: 2rem; font-weight: 700; margin-bottom: 32px; }
    .features-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; }
    .feature-card { text-align: center; padding: 8px; transition: transform 0.2s; }
    .feature-card:hover { transform: translateY(-4px); }
    .feature-icon {
      width: 60px; height: 60px;
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      margin: 0 auto 16px;
    }
    .feature-icon mat-icon { color: white; }
    .feature-card h3 { font-weight: 600; margin-bottom: 8px; }
    .feature-card p { color: #888; font-size: 0.9rem; }

    .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    .section-header h2 { font-size: 1.5rem; font-weight: 700; }
    .projects-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 16px; }
    .project-card { cursor: pointer; transition: transform 0.2s; }
    .project-card:hover { transform: translateY(-4px); }
    .project-thumb {
      height: 120px;
      background: linear-gradient(135deg, #1a1a2e, #16213e);
      display: flex; align-items: center; justify-content: center;
    }
    .thumb-icon { font-size: 48px !important; width: 48px !important; height: 48px !important; color: #e94560; }
    .status-chip { font-size: 0.75rem; }

    .stats {
      display: flex;
      justify-content: space-around;
      padding: 48px 0;
      background: linear-gradient(135deg, #1a1a2e, #16213e);
      border-radius: 16px;
      margin-top: 32px;
    }
    .stat-item { text-align: center; color: white; }
    .stat-item mat-icon { color: #e94560; font-size: 32px !important; width: 32px !important; height: 32px !important; }
    .stat-value { font-size: 2rem; font-weight: 700; }
    .stat-label { color: #888; }

    @media (max-width: 768px) {
      .hero { grid-template-columns: 1fr; }
      .hero-visual { display: none; }
      .hero-title { font-size: 2rem; }
    }
  `]
})
export class HomeComponent implements OnInit {
  private videoService = inject(VideoService);
  recentProjects = signal<VideoProject[]>([]);

  features = [
    { icon: 'auto_awesome', title: 'AI Script Generator', description: 'Generate engaging video scripts with Gemini AI', gradient: 'linear-gradient(135deg, #e94560, #c0392b)' },
    { icon: 'title', title: 'Viral Title Creator', description: 'SEO-optimized titles that drive clicks', gradient: 'linear-gradient(135deg, #9b59b6, #6c3483)' },
    { icon: 'face_retouching_natural', title: 'Character Transform', description: 'Convert characters to anime, cartoon, and more', gradient: 'linear-gradient(135deg, #3498db, #1a5276)' },
    { icon: 'upload', title: 'YouTube Upload', description: 'Direct upload to YouTube with optimized metadata', gradient: 'linear-gradient(135deg, #e74c3c, #c0392b)' },
    { icon: 'notifications_active', title: 'Real-time Notifications', description: 'Stay updated on your video generation progress', gradient: 'linear-gradient(135deg, #27ae60, #1e8449)' },
    { icon: 'preview', title: 'Preview Before Publish', description: 'Review storyboard before final generation', gradient: 'linear-gradient(135deg, #f39c12, #d68910)' }
  ];

  stats = [
    { icon: 'movie', value: '∞', label: 'Videos Created' },
    { icon: 'psychology', value: 'Gemini', label: 'AI Model' },
    { icon: 'speed', value: '< 1 min', label: 'Generation Time' },
    { icon: 'language', value: '50+', label: 'Languages' }
  ];

  ngOnInit(): void {
    this.videoService.getAll().subscribe({
      next: projects => this.recentProjects.set(projects.slice(0, 6)),
      error: () => this.recentProjects.set([])
    });
  }

  getStatusIcon(status: string): string {
    const icons: Record<string, string> = {
      Draft: 'edit',
      PreviewReady: 'preview',
      Ready: 'check_circle',
      Published: 'public',
      Failed: 'error',
      GeneratingFinal: 'hourglass_empty'
    };
    return icons[status] ?? 'video_file';
  }
}
