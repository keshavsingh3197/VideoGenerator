import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatStepperModule } from '@angular/material/stepper';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatSliderModule } from '@angular/material/slider';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { ENTER, COMMA } from '@angular/cdk/keycodes';
import { VideoService, AiService } from '../../services/video.service';
import {
  VIDEO_STYLES, VIDEO_DURATIONS, ASPECT_RATIOS, CHARACTER_STYLES,
  TitleSuggestion, GenerateScriptResponse
} from '../../models/video.models';

@Component({
  selector: 'app-create-video',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule,
    MatStepperModule, MatFormFieldModule, MatInputModule, MatSelectModule,
    MatButtonModule, MatIconModule, MatChipsModule, MatSliderModule,
    MatSlideToggleModule, MatProgressSpinnerModule, MatSnackBarModule, MatCardModule
  ],
  template: `
    <div class="create-container">
      <div class="page-header">
        <h1><mat-icon>movie_creation</mat-icon> Create New Video</h1>
        <p>Configure your AI-powered video in a few steps</p>
      </div>

      <mat-stepper linear #stepper class="create-stepper" [selectedIndex]="currentStep()">

        <!-- Step 1: Basic Info -->
        <mat-step [stepControl]="basicForm" label="Basic Info">
          <form [formGroup]="basicForm" class="step-content">
            <h2>What's your video about?</h2>

            <div class="ai-prompt-section">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Video Title</mat-label>
                <input matInput formControlName="title" placeholder="Enter a catchy title...">
                <mat-hint>Or let AI generate titles for you</mat-hint>
              </mat-form-field>

              <button mat-stroked-button type="button" (click)="generateTitles()" [disabled]="generatingTitles()">
                @if (generatingTitles()) { <mat-spinner diameter="20"></mat-spinner> }
                @else { <mat-icon>auto_awesome</mat-icon> }
                AI Generate Titles
              </button>
            </div>

            @if (titleSuggestions().length > 0) {
              <div class="suggestions-panel">
                <h3><mat-icon>lightbulb</mat-icon> AI Suggested Titles</h3>
                @for (s of titleSuggestions(); track s.title) {
                  <div class="suggestion-item" (click)="selectTitle(s.title)">
                    <div class="suggestion-text">{{ s.title }}</div>
                    <div class="suggestion-meta">
                      <span class="seo-score" [class.good]="s.seoScore >= 80">SEO: {{ s.seoScore }}</span>
                      <span class="suggestion-desc">{{ s.description }}</span>
                    </div>
                  </div>
                }
              </div>
            }

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Video Prompt / Idea</mat-label>
              <textarea matInput formControlName="prompt" rows="4"
                placeholder="Describe what you want in your video... e.g., 'A cinematic tour of Tokyo at night with upbeat music'"></textarea>
              <mat-hint>The more detailed, the better the AI output</mat-hint>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Description (for YouTube)</mat-label>
              <textarea matInput formControlName="description" rows="3"
                placeholder="Video description for YouTube SEO..."></textarea>
            </mat-form-field>

            <div class="form-row">
              <mat-form-field appearance="outline">
                <mat-label>Video Type</mat-label>
                <mat-select formControlName="videoType">
                  <mat-option value="youtube_short">YouTube Short</mat-option>
                  <mat-option value="youtube_long">YouTube Long-form</mat-option>
                  <mat-option value="reel">Instagram Reel</mat-option>
                  <mat-option value="tiktok">TikTok</mat-option>
                </mat-select>
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Language</mat-label>
                <mat-select formControlName="language">
                  <mat-option value="en">English</mat-option>
                  <mat-option value="es">Spanish</mat-option>
                  <mat-option value="fr">French</mat-option>
                  <mat-option value="de">German</mat-option>
                  <mat-option value="ja">Japanese</mat-option>
                  <mat-option value="hi">Hindi</mat-option>
                </mat-select>
              </mat-form-field>
            </div>

            <div class="step-actions">
              <button mat-raised-button color="primary" matStepperNext [disabled]="basicForm.invalid">
                Next <mat-icon>arrow_forward</mat-icon>
              </button>
            </div>
          </form>
        </mat-step>

        <!-- Step 2: Visual Style -->
        <mat-step label="Visual Style">
          <div class="step-content">
            <h2>Choose your visual style</h2>

            <div class="form-row">
              <mat-form-field appearance="outline">
                <mat-label>Style</mat-label>
                <mat-select [(ngModel)]="config.style">
                  @for (s of styles; track s.value) {
                    <mat-option [value]="s.value">{{ s.label }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Duration</mat-label>
                <mat-select [(ngModel)]="config.duration">
                  @for (d of durations; track d.value) {
                    <mat-option [value]="d.value">{{ d.label }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>
            </div>

            <div class="form-row">
              <mat-form-field appearance="outline">
                <mat-label>Aspect Ratio</mat-label>
                <mat-select [(ngModel)]="config.aspectRatio">
                  @for (a of aspectRatios; track a.value) {
                    <mat-option [value]="a.value">{{ a.label }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Resolution</mat-label>
                <mat-select [(ngModel)]="config.resolution">
                  <mat-option value="720p">720p HD</mat-option>
                  <mat-option value="1080p">1080p Full HD</mat-option>
                  <mat-option value="4k">4K Ultra HD</mat-option>
                </mat-select>
              </mat-form-field>
            </div>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Character Style (AI Transform)</mat-label>
              <mat-select [(ngModel)]="config.characterStyle">
                @for (c of characterStyles; track c.value) {
                  <mat-option [value]="c.value">{{ c.label }}</mat-option>
                }
              </mat-select>
              <mat-hint>Transform on-screen characters to a different artistic style</mat-hint>
            </mat-form-field>

            <div class="step-actions">
              <button mat-button matStepperPrevious>Back</button>
              <button mat-raised-button color="primary" matStepperNext>
                Next <mat-icon>arrow_forward</mat-icon>
              </button>
            </div>
          </div>
        </mat-step>

        <!-- Step 3: AI Script -->
        <mat-step label="AI Script">
          <div class="step-content">
            <h2>Generate your script with AI</h2>

            <button mat-raised-button color="accent" (click)="generateScript()" [disabled]="generatingScript()">
              @if (generatingScript()) { <mat-spinner diameter="20"></mat-spinner> }
              @else { <mat-icon>psychology</mat-icon> }
              Generate Script with Gemini AI
            </button>

            @if (generatedScript()) {
              <mat-card class="script-card">
                <mat-card-header>
                  <mat-card-title>Generated Script</mat-card-title>
                  <mat-card-subtitle>Estimated: {{ generatedScript()!.estimatedDuration }}</mat-card-subtitle>
                </mat-card-header>
                <mat-card-content>
                  <pre class="script-content">{{ generatedScript()!.script }}</pre>
                  @if (generatedScript()!.suggestedTags.length > 0) {
                    <div class="suggested-tags">
                      <strong>Suggested Tags:</strong>
                      @for (tag of generatedScript()!.suggestedTags; track tag) {
                        <mat-chip>{{ tag }}</mat-chip>
                      }
                    </div>
                  }
                </mat-card-content>
              </mat-card>
            }

            <div class="step-actions">
              <button mat-button matStepperPrevious>Back</button>
              <button mat-raised-button color="primary" matStepperNext>
                Next <mat-icon>arrow_forward</mat-icon>
              </button>
            </div>
          </div>
        </mat-step>

        <!-- Step 4: Preview & Confirm -->
        <mat-step label="Preview">
          <div class="step-content">
            <h2>Review your configuration</h2>
            <mat-card class="config-preview">
              <mat-card-content>
                <div class="preview-grid">
                  <div class="preview-item">
                    <label>Title</label>
                    <span>{{ basicForm.value.title }}</span>
                  </div>
                  <div class="preview-item">
                    <label>Style</label>
                    <span>{{ config.style }}</span>
                  </div>
                  <div class="preview-item">
                    <label>Duration</label>
                    <span>{{ config.duration }}</span>
                  </div>
                  <div class="preview-item">
                    <label>Aspect Ratio</label>
                    <span>{{ config.aspectRatio }}</span>
                  </div>
                  <div class="preview-item">
                    <label>Resolution</label>
                    <span>{{ config.resolution }}</span>
                  </div>
                  <div class="preview-item">
                    <label>Character Style</label>
                    <span>{{ config.characterStyle }}</span>
                  </div>
                </div>
                <div class="preview-prompt">
                  <label>Prompt</label>
                  <p>{{ basicForm.value.prompt }}</p>
                </div>
              </mat-card-content>
            </mat-card>

            <div class="step-actions">
              <button mat-button matStepperPrevious>Back</button>
              <button mat-raised-button color="primary" (click)="createProject()" [disabled]="creating()">
                @if (creating()) { <mat-spinner diameter="20"></mat-spinner> }
                @else { <mat-icon>rocket_launch</mat-icon> }
                Create & Generate Preview
              </button>
            </div>
          </div>
        </mat-step>

      </mat-stepper>
    </div>
  `,
  styles: [`
    .create-container { max-width: 800px; margin: 0 auto; padding: 24px; }
    .page-header { margin-bottom: 32px; }
    .page-header h1 { font-size: 2rem; font-weight: 700; display: flex; align-items: center; gap: 12px; }
    .page-header p { color: #888; }
    .create-stepper { background: transparent; }
    .step-content { padding: 24px 0; display: flex; flex-direction: column; gap: 20px; }
    .step-content h2 { font-size: 1.4rem; font-weight: 600; margin: 0; }
    .full-width { width: 100%; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .step-actions { display: flex; gap: 12px; justify-content: flex-end; margin-top: 8px; }

    .ai-prompt-section { display: flex; gap: 12px; align-items: flex-start; }
    .ai-prompt-section mat-form-field { flex: 1; }

    .suggestions-panel {
      background: rgba(233,69,96,0.05);
      border: 1px solid rgba(233,69,96,0.2);
      border-radius: 12px; padding: 16px;
    }
    .suggestions-panel h3 { display: flex; align-items: center; gap: 8px; margin: 0 0 12px; font-size: 1rem; color: #e94560; }
    .suggestion-item {
      padding: 12px; border-radius: 8px; cursor: pointer;
      transition: background 0.2s; margin-bottom: 8px;
      border: 1px solid transparent;
    }
    .suggestion-item:hover { background: rgba(233,69,96,0.1); border-color: rgba(233,69,96,0.3); }
    .suggestion-text { font-weight: 600; margin-bottom: 4px; }
    .suggestion-meta { display: flex; gap: 12px; align-items: center; }
    .seo-score { background: rgba(255,152,0,0.2); color: #ff9800; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 600; }
    .seo-score.good { background: rgba(76,175,80,0.2); color: #4caf50; }
    .suggestion-desc { color: #888; font-size: 0.8rem; }

    .script-card { margin-top: 16px; }
    .script-content { white-space: pre-wrap; font-family: monospace; font-size: 0.85rem; background: rgba(0,0,0,0.2); padding: 16px; border-radius: 8px; max-height: 300px; overflow-y: auto; }
    .suggested-tags { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; align-items: center; }

    .config-preview mat-card-content { padding: 16px; }
    .preview-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 16px; }
    .preview-item { display: flex; flex-direction: column; gap: 4px; }
    .preview-item label { font-size: 0.75rem; color: #888; text-transform: uppercase; }
    .preview-item span { font-weight: 600; }
    .preview-prompt label { font-size: 0.75rem; color: #888; text-transform: uppercase; display: block; margin-bottom: 4px; }
    .preview-prompt p { margin: 0; color: #ccc; }
  `]
})
export class CreateVideoComponent {
  private videoService = inject(VideoService);
  private aiService = inject(AiService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private fb = inject(FormBuilder);

  styles = VIDEO_STYLES;
  durations = VIDEO_DURATIONS;
  aspectRatios = ASPECT_RATIOS;
  characterStyles = CHARACTER_STYLES;

  basicForm = this.fb.group({
    title: ['', Validators.required],
    prompt: ['', Validators.required],
    description: [''],
    videoType: ['youtube_short'],
    language: ['en']
  });

  config = {
    style: 'cinematic',
    duration: '60s',
    aspectRatio: '16:9',
    resolution: '1080p',
    characterStyle: 'none'
  };

  currentStep = signal(0);
  titleSuggestions = signal<TitleSuggestion[]>([]);
  generatingTitles = signal(false);
  generatingScript = signal(false);
  creating = signal(false);
  generatedScript = signal<GenerateScriptResponse | null>(null);

  generateTitles(): void {
    const topic = this.basicForm.value.prompt || this.basicForm.value.title || 'video content';
    this.generatingTitles.set(true);
    this.aiService.generateTitles(topic, this.basicForm.value.videoType ?? 'youtube').subscribe({
      next: res => { this.titleSuggestions.set(res.titles); this.generatingTitles.set(false); },
      error: () => { this.generatingTitles.set(false); this.snackBar.open('Could not generate titles', 'Dismiss', { duration: 3000 }); }
    });
  }

  selectTitle(title: string): void {
    this.basicForm.patchValue({ title });
  }

  generateScript(): void {
    if (!this.basicForm.value.prompt) return;
    this.generatingScript.set(true);
    this.aiService.generateScript(
      this.basicForm.value.prompt!,
      this.config.style,
      this.config.duration,
      this.basicForm.value.videoType ?? 'youtube_short'
    ).subscribe({
      next: res => { this.generatedScript.set(res); this.generatingScript.set(false); },
      error: () => { this.generatingScript.set(false); }
    });
  }

  createProject(): void {
    if (this.basicForm.invalid) return;
    this.creating.set(true);
    const v = this.basicForm.value;
    this.videoService.create({
      title: v.title!,
      prompt: v.prompt!,
      description: v.description ?? '',
      videoType: v.videoType ?? 'youtube_short',
      language: v.language ?? 'en',
      ...this.config
    }).subscribe({
      next: project => {
        this.snackBar.open('Project created! Generating preview...', 'Dismiss', { duration: 3000 });
        // Auto-generate preview
        this.videoService.generatePreview(project.id).subscribe({
          next: () => this.router.navigate(['/projects', project.id]),
          error: () => this.router.navigate(['/projects', project.id])
        });
      },
      error: () => { this.creating.set(false); this.snackBar.open('Failed to create project', 'Dismiss', { duration: 3000 }); }
    });
  }
}
