import { Component, OnInit, signal, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { debounceTime, distinctUntilChanged, filter } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
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
import * as XLSX from 'xlsx';
import { VideoService, AiService } from '../../services/video.service';
import {
  VIDEO_STYLES, VIDEO_DURATIONS, ASPECT_RATIOS, CHARACTER_STYLES,
  TitleSuggestion, GenerateScriptResponse, AiIntegrationStatus
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

      <form [formGroup]="basicForm" class="wizard-form">
      <mat-stepper linear #stepper class="create-stepper" [selectedIndex]="currentStep()">

        <!-- Step 1: Source Input -->
        <mat-step [stepControl]="basicForm" label="Source">
          <div class="step-content">
            <h2>Start with source text</h2>
            <p class="step-help">Paste notes, upload text, or write a rough brief. AI will generate the rest.</p>

            <div class="ai-status-banner" [class.connected]="aiIntegrationStatus()?.isConfigured" [class.fallback]="!aiIntegrationStatus()?.isConfigured">
              <div class="status-main">
                <mat-icon>{{ aiIntegrationStatus()?.isConfigured ? 'verified' : 'warning_amber' }}</mat-icon>
                <div>
                  <strong>{{ aiIntegrationStatus()?.provider || 'AI Status' }}</strong>
                  <p>
                    {{ checkingAiStatus() ? 'Checking AI connection...' : (aiIntegrationStatus()?.message || 'Checking AI integration...') }}
                  </p>
                  @if (lastAiStatusCheckAt()) {
                    <small class="status-meta">Last checked: {{ lastAiStatusCheckAt() }}</small>
                  }
                </div>
              </div>
              <div class="status-actions">
                <button mat-icon-button type="button" aria-label="Recheck AI status" (click)="refreshAiStatus()" [disabled]="checkingAiStatus()">
                  @if (checkingAiStatus()) {
                    <mat-spinner diameter="20"></mat-spinner>
                  } @else {
                    <mat-icon>refresh</mat-icon>
                  }
                </button>
                @if (!aiIntegrationStatus()?.isConfigured) {
                  <button mat-stroked-button type="button" (click)="toggleAiConfigHelp()">
                    <mat-icon>settings</mat-icon>
                    Configure AI
                  </button>
                }
              </div>
            </div>

            @if (showAiConfigHelp()) {
              <div class="ai-config-help">
                <h4><mat-icon>build_circle</mat-icon> Configure Gemini</h4>
                <p>Add Gemini API key in backend settings and restart API:</p>
                <code>VideoGenerator.API/appsettings.Development.json -> Gemini:ApiKey</code>
                <p>When configured, this banner will switch to live AI mode automatically.</p>
              </div>
            }

            <div class="source-import-section">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Source Text or Notes</mat-label>
                <textarea matInput formControlName="sourceContent" rows="7"
                  placeholder="Paste a script draft, blog post, briefing note, or transcript here..."></textarea>
                <mat-hint>Upload a text file or paste content. AI will turn it into a video plan.</mat-hint>
              </mat-form-field>

              <div class="import-actions">
                <label class="file-import-button">
                  <input type="file" accept=".txt,.md,.csv,.json,.xlsx,.xls,text/plain,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel" (change)="handleSourceFile($event)" />
                  <span><mat-icon>upload_file</mat-icon> Import File</span>
                </label>
                @if (importedFileName()) {
                  <span class="imported-file">{{ importedFileName() }}</span>
                }
                <button mat-stroked-button type="button" (click)="analyzeSource(true)" [disabled]="analyzingSource()">
                  @if (analyzingSource()) { <mat-spinner diameter="18"></mat-spinner> }
                  @else { <mat-icon>auto_awesome</mat-icon> }
                  AI Analyze Source
                </button>
              </div>

              @if (analysisSummary().length > 0) {
                <div class="analysis-panel">
                  <div class="analysis-header">
                    <h3><mat-icon>psychology</mat-icon> AI Recommendations</h3>
                    <span class="analysis-model">{{ recommendedModelLabel() }}</span>
                  </div>
                  <p>{{ analysisSummary() }}</p>
                  <div class="analysis-chips">
                    @for (platform of recommendedPlatforms(); track platform) {
                      <mat-chip>{{ platform }}</mat-chip>
                    }
                  </div>
                </div>
              }
            </div>

            <div class="step-actions">
              <button mat-raised-button color="primary" matStepperNext [disabled]="basicForm.invalid">
                Next <mat-icon>arrow_forward</mat-icon>
              </button>
            </div>
          </div>
        </mat-step>

        <!-- Step 2: AI Suggestions -->
        <mat-step label="AI Suggestions">
          <div class="step-content">
            <h2>Choose the AI-generated options you want to keep</h2>
            <p class="step-help">The source drives these suggestions automatically, but you can still override anything here.</p>

            <div class="form-row">
              <mat-form-field appearance="outline">
                <mat-label>Video Title</mat-label>
                <mat-select formControlName="title">
                  @if (titleSuggestions().length === 0) {
                    <mat-option [value]="basicForm.value.title || ''">{{ basicForm.value.title || 'Use your own title' }}</mat-option>
                  }
                  @for (s of titleSuggestions(); track s.title) {
                    <mat-option [value]="s.title">{{ s.title }}</mat-option>
                  }
                </mat-select>
                <mat-hint>Pick one of the AI suggestions or keep your own title.</mat-hint>
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Video Type</mat-label>
                <mat-select formControlName="videoType">
                  <mat-option value="youtube_short">YouTube Short</mat-option>
                  <mat-option value="youtube_long">YouTube Long-form</mat-option>
                  <mat-option value="reel">Instagram Reel</mat-option>
                  <mat-option value="tiktok">TikTok</mat-option>
                </mat-select>
              </mat-form-field>
            </div>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Video Prompt / Plan</mat-label>
              <textarea matInput formControlName="prompt" rows="4"
                placeholder="AI will build this from your source, but you can tweak it here..."></textarea>
              <mat-hint>Use this as the working prompt for generation.</mat-hint>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Description (for YouTube)</mat-label>
              <textarea matInput formControlName="description" rows="3"
                placeholder="Video description for YouTube SEO..."></textarea>
              <div class="description-actions" style="margin-top:8px; display:flex; gap:8px; justify-content:flex-end;">
                <button mat-stroked-button type="button" (click)="generateDescription()" [disabled]="generatingDescription()">
                  @if (generatingDescription()) { <mat-spinner diameter="18"></mat-spinner> }
                  @else { <mat-icon>auto_fix_high</mat-icon> }
                  AI Generate Description
                </button>
                <button mat-stroked-button type="button" (click)="generateTags()" [disabled]="generatingTags()">
                  @if (generatingTags()) { <mat-spinner diameter="18"></mat-spinner> }
                  @else { <mat-icon>local_offer</mat-icon> }
                  AI Generate Tags
                </button>
              </div>
            </mat-form-field>

            @if (tagSuggestions().length > 0) {
              <div class="tag-suggestions">
                <strong>Suggested Tags:</strong>
                <div style="margin-top:8px; display:flex; gap:8px; flex-wrap:wrap;">
                  @for (t of tagSuggestions(); track t) {
                    <mat-chip (click)="toggleTag(t)" [class.selected]="selectedTags().includes(t)">{{ t }}</mat-chip>
                  }
                </div>
              </div>
            }

            <div class="form-row">
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
              <mat-form-field appearance="outline">
                <mat-label>AI Model</mat-label>
                <mat-select [(ngModel)]="config.model" [ngModelOptions]="{ standalone: true }">
                  @for (m of aiModels; track m.value) {
                    <mat-option [value]="m.value">{{ m.label }}</mat-option>
                  }
                </mat-select>
                <mat-hint>{{ recommendedModelHint() }}</mat-hint>
              </mat-form-field>
            </div>

            <div class="target-platforms">
              <h3><mat-icon>public</mat-icon> Distribution Targets</h3>
              <p>Pick the channels you want the AI to optimize for.</p>
              <div class="target-chip-grid">
                @for (platform of distributionTargets; track platform.value) {
                  <mat-chip (click)="toggleDistributionTarget(platform.value)" [class.selected]="selectedDistributionTargets().includes(platform.value)">
                    {{ platform.label }}
                  </mat-chip>
                }
              </div>
            </div>

            @if (analysisSummary().length > 0) {
              <div class="analysis-panel">
                <div class="analysis-header">
                  <h3><mat-icon>psychology</mat-icon> AI Recommendations</h3>
                  <span class="analysis-model">{{ recommendedModelLabel() }}</span>
                </div>
                <p>{{ analysisSummary() }}</p>
                <div class="analysis-chips">
                  @for (platform of recommendedPlatforms(); track platform) {
                    <mat-chip>{{ platform }}</mat-chip>
                  }
                </div>
              </div>
            }

            <div class="step-actions">
              <button mat-button matStepperPrevious>Back</button>
              <button mat-raised-button color="primary" matStepperNext [disabled]="!basicForm.value.title">
                Next <mat-icon>arrow_forward</mat-icon>
              </button>
            </div>
          </div>
        </mat-step>

        <!-- Step 3: Visual Style -->
        <mat-step label="Visual Style">
          <div class="step-content">
            <h2>Choose your visual style</h2>

            <div class="form-row">
              <mat-form-field appearance="outline">
                <mat-label>Style</mat-label>
                <mat-select [(ngModel)]="config.style" [ngModelOptions]="{ standalone: true }">
                  @for (s of styles; track s.value) {
                    <mat-option [value]="s.value">{{ s.label }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Duration</mat-label>
                <mat-select [(ngModel)]="config.duration" [ngModelOptions]="{ standalone: true }">
                  @for (d of durations; track d.value) {
                    <mat-option [value]="d.value">{{ d.label }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>
            </div>

            <div class="form-row">
              <mat-form-field appearance="outline">
                <mat-label>Aspect Ratio</mat-label>
                <mat-select [(ngModel)]="config.aspectRatio" [ngModelOptions]="{ standalone: true }">
                  @for (a of aspectRatios; track a.value) {
                    <mat-option [value]="a.value">{{ a.label }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Resolution</mat-label>
                <mat-select [(ngModel)]="config.resolution" [ngModelOptions]="{ standalone: true }">
                  <mat-option value="720p">720p HD</mat-option>
                  <mat-option value="1080p">1080p Full HD</mat-option>
                  <mat-option value="4k">4K Ultra HD</mat-option>
                </mat-select>
              </mat-form-field>
            </div>

            <div class="form-row">
              <mat-form-field appearance="outline">
                <mat-label>AI Model</mat-label>
                <mat-select [(ngModel)]="config.model" [ngModelOptions]="{ standalone: true }">
                  @for (m of aiModels; track m.value) {
                    <mat-option [value]="m.value">{{ m.label }}</mat-option>
                  }
                </mat-select>
                <mat-hint>{{ recommendedModelHint() }}</mat-hint>
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Character Style (AI Transform)</mat-label>
                <mat-select [(ngModel)]="config.characterStyle" [ngModelOptions]="{ standalone: true }">
                  @for (c of characterStyles; track c.value) {
                    <mat-option [value]="c.value">{{ c.label }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>
            </div>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Character Style Notes</mat-label>
              <input matInput value="Transform on-screen characters to a different artistic style" disabled>
              <mat-hint>This setting is kept under AI Transform.</mat-hint>
            </mat-form-field>

            <div class="step-actions">
              <button mat-button matStepperPrevious>Back</button>
              <button mat-raised-button color="primary" matStepperNext>
                Next <mat-icon>arrow_forward</mat-icon>
              </button>
            </div>
          </div>
        </mat-step>

        <!-- Step 4: AI Script -->
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

        <!-- Step 5: Preview & Confirm -->
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
                  <div class="preview-item">
                    <label>AI Model</label>
                    <span>{{ recommendedModelLabel() }}</span>
                  </div>
                </div>
                <div class="preview-prompt">
                  <label>Prompt</label>
                  <p>{{ basicForm.value.prompt || basicForm.value.sourceContent }}</p>
                </div>
                @if (selectedDistributionTargets().length > 0) {
                  <div class="preview-targets">
                    <label>Targets</label>
                    <div class="target-chip-grid">
                      @for (platform of selectedDistributionTargets(); track platform) {
                        <mat-chip>{{ platform }}</mat-chip>
                      }
                    </div>
                  </div>
                }
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
      </form>
    </div>
  `,
  styles: [`
    .create-container { max-width: 800px; margin: 0 auto; padding: 24px; }
    .page-header { margin-bottom: 32px; }
    .page-header h1 { font-size: 2rem; font-weight: 700; display: flex; align-items: center; gap: 12px; }
    .page-header p { color: #888; }
    .wizard-form { display: block; }
    .create-stepper { background: transparent; }
    .step-content { padding: 24px 0; display: flex; flex-direction: column; gap: 20px; }
    .step-content h2 { font-size: 1.4rem; font-weight: 600; margin: 0; }
    .full-width { width: 100%; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .step-actions { display: flex; gap: 12px; justify-content: flex-end; margin-top: 8px; }
    .step-help { margin: 0; color: #9fa4b0; }

    .ai-status-banner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 14px;
      border-radius: 12px;
      padding: 12px 14px;
      border: 1px solid rgba(255,255,255,0.1);
      background: rgba(255,255,255,0.03);
    }
    .ai-status-banner.connected {
      border-color: rgba(76,175,80,0.45);
      background: rgba(76,175,80,0.1);
    }
    .ai-status-banner.fallback {
      border-color: rgba(255,193,7,0.45);
      background: rgba(255,193,7,0.08);
    }
    .status-main { display: flex; align-items: flex-start; gap: 10px; }
    .status-main mat-icon { margin-top: 2px; }
    .status-main p { margin: 4px 0 0; font-size: 0.86rem; color: #c3c8d1; }
    .status-meta { display: block; margin-top: 4px; font-size: 0.75rem; color: #9fa4b0; }
    .status-actions { display: flex; align-items: center; gap: 8px; }

    .ai-config-help {
      border: 1px dashed rgba(255,193,7,0.5);
      background: rgba(255,193,7,0.06);
      border-radius: 12px;
      padding: 12px 14px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .ai-config-help h4 { margin: 0; display: flex; align-items: center; gap: 8px; }
    .ai-config-help p { margin: 0; color: #c3c8d1; }
    .ai-config-help code {
      display: inline-block;
      padding: 6px 8px;
      border-radius: 8px;
      background: rgba(0,0,0,0.25);
      color: #ffd978;
      font-size: 0.82rem;
    }

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

    .tag-suggestions mat-chip, .tag-suggestions .mat-mdc-chip {
      cursor: pointer;
    }
    .tag-suggestions mat-chip.selected, .tag-suggestions .mat-mdc-chip.selected {
      background: rgba(233,69,96,0.9); color: white;
    }

    .config-preview mat-card-content { padding: 16px; }
    .preview-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 16px; }
    .preview-item { display: flex; flex-direction: column; gap: 4px; }
    .preview-item label { font-size: 0.75rem; color: #888; text-transform: uppercase; }
    .preview-item span { font-weight: 600; }
    .preview-prompt label { font-size: 0.75rem; color: #888; text-transform: uppercase; display: block; margin-bottom: 4px; }
    .preview-prompt p { margin: 0; color: #ccc; }
    .source-import-section, .target-platforms {
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 14px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .import-actions { display: flex; flex-wrap: wrap; gap: 12px; align-items: center; }
    .file-import-button {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 14px;
      border-radius: 10px;
      border: 1px dashed rgba(255,255,255,0.2);
      cursor: pointer;
      background: rgba(255,255,255,0.03);
    }
    .file-import-button input { display: none; }
    .file-import-button span { display: inline-flex; align-items: center; gap: 6px; }
    .imported-file { color: #9bd0ff; font-size: 0.85rem; }
    .analysis-panel {
      background: linear-gradient(135deg, rgba(233,69,96,0.12), rgba(255,255,255,0.04));
      border: 1px solid rgba(233,69,96,0.22);
      border-radius: 12px;
      padding: 14px;
    }
    .analysis-header { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
    .analysis-header h3 { margin: 0; display: flex; align-items: center; gap: 8px; }
    .analysis-model { background: rgba(255,255,255,0.08); padding: 4px 10px; border-radius: 999px; font-size: 0.8rem; }
    .analysis-panel p { margin: 10px 0 0; color: #d6d6d6; }
    .analysis-chips, .target-chip-grid { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
    .target-platforms h3 { margin: 0; display: flex; align-items: center; gap: 8px; }
    .target-platforms p { margin: 0; color: #9c9c9c; }
    .target-chip-grid mat-chip.selected, .target-chip-grid .mat-mdc-chip.selected {
      background: rgba(233,69,96,0.92);
      color: white;
    }
  `]
})
export class CreateVideoComponent implements OnInit {
  private videoService = inject(VideoService);
  private aiService = inject(AiService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private fb = inject(FormBuilder);
  private destroyRef = inject(DestroyRef);

  distributionTargets = [
    { value: 'youtube', label: 'YouTube' },
    { value: 'youtube_shorts', label: 'YouTube Shorts' },
    { value: 'linkedin', label: 'LinkedIn' },
    { value: 'instagram_reel', label: 'Instagram Reels' },
    { value: 'tiktok', label: 'TikTok' },
    { value: 'facebook', label: 'Facebook' },
    { value: 'x', label: 'X / Twitter' }
  ];

  aiModels = [
    { value: 'gemini-2.0-flash-lite', label: '3.5 Flash-Lite', hint: 'Fastest planning and rough drafts' },
    { value: 'gemini-2.0-flash', label: '3.6 Flash', hint: 'Balanced for most short and medium videos' },
    { value: 'gemini-2.0-pro', label: '3.1 Pro', hint: 'Best for deeper reasoning and long-form content' }
  ];

  styles = VIDEO_STYLES;
  durations = VIDEO_DURATIONS;
  aspectRatios = ASPECT_RATIOS;
  characterStyles = CHARACTER_STYLES;

  basicForm = this.fb.group({
    title: [''],
    prompt: [''],
    sourceContent: ['', Validators.required],
    description: [''],
    tags: this.fb.control([] as any),
    videoType: ['youtube_short'],
    language: ['en']
  });

  config = {
    style: 'cinematic',
    duration: '60s',
    aspectRatio: '16:9',
    resolution: '1080p',
    characterStyle: 'none',
    model: 'gemini-2.0-flash'
  };

  currentStep = signal(0);
  titleSuggestions = signal<TitleSuggestion[]>([]);
  generatingTitles = signal(false);
  analyzingSource = signal(false);
  descriptionSuggestions = signal<string[]>([]);
  generatingDescription = signal(false);
  tagSuggestions = signal<string[]>([]);
  generatingTags = signal(false);
  generatingScript = signal(false);
  creating = signal(false);
  generatedScript = signal<GenerateScriptResponse | null>(null);
  selectedTags = signal<string[]>([]);
  recommendedPlatforms = signal<string[]>([]);
  selectedDistributionTargets = signal<string[]>([]);
  analysisSummary = signal('');
  importedFileName = signal<string | null>(null);
  recommendedModelLabel = signal('3.6 Flash');
  recommendedModelHint = signal('Balanced default for most video workflows');
  aiIntegrationStatus = signal<AiIntegrationStatus | null>(null);
  showAiConfigHelp = signal(false);
  checkingAiStatus = signal(false);
  lastAiStatusCheckAt = signal<string>('');
  private aiStatusRetryCount = 0;
  private readonly maxAiStatusRetries = 4;

  constructor() {
    this.basicForm.controls.sourceContent.valueChanges
      .pipe(
        debounceTime(700),
        distinctUntilChanged(),
        filter(value => !!value && value.trim().length >= 20),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => this.analyzeSource(false));
  }

  ngOnInit(): void {
    this.loadAiIntegrationStatus();
  }

  toggleAiConfigHelp(): void {
    this.showAiConfigHelp.set(!this.showAiConfigHelp());
  }

  refreshAiStatus(): void {
    this.aiStatusRetryCount = 0;
    this.loadAiIntegrationStatus();
  }

  loadAiIntegrationStatus(): void {
    this.checkingAiStatus.set(true);
    this.aiService.getIntegrationStatus().subscribe({
      next: status => {
        this.aiIntegrationStatus.set(status);
        this.showAiConfigHelp.set(!status.isConfigured);
        this.aiStatusRetryCount = 0;
        this.checkingAiStatus.set(false);
        this.lastAiStatusCheckAt.set(this.formatNowTime());
      },
      error: () => {
        this.aiIntegrationStatus.set({
          provider: 'Google Gemini',
          isConfigured: false,
          mode: 'fallback',
          model: this.config.model,
          message: 'Could not reach AI status endpoint. Using fallback suggestions.'
        });
        this.showAiConfigHelp.set(true);
        this.checkingAiStatus.set(false);
        this.lastAiStatusCheckAt.set(this.formatNowTime());

        if (this.aiStatusRetryCount < this.maxAiStatusRetries) {
          this.aiStatusRetryCount += 1;
          const backoffMs = this.aiStatusRetryCount * 2000;
          setTimeout(() => this.loadAiIntegrationStatus(), backoffMs);
        }
      }
    });
  }

  private formatNowTime(): string {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }

  handleSourceFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const extension = file.name.split('.').pop()?.toLowerCase() ?? '';

    if (extension === 'xlsx' || extension === 'xls') {
      const reader = new FileReader();
      reader.onload = () => {
        const buffer = reader.result as ArrayBuffer;
        const workbook = XLSX.read(buffer, { type: 'array' });
        const text = this.convertWorkbookToSourceText(workbook, file.name);
        this.basicForm.patchValue({ sourceContent: text });
        this.importedFileName.set(file.name);
        this.snackBar.open(`Imported ${file.name}`, 'Dismiss', { duration: 2500 });
        input.value = '';
      };
      reader.onerror = () => this.snackBar.open('Could not read the selected spreadsheet', 'Dismiss', { duration: 3000 });
      reader.readAsArrayBuffer(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? '');
      this.basicForm.patchValue({ sourceContent: text });
      this.importedFileName.set(file.name);
      this.snackBar.open(`Imported ${file.name}`, 'Dismiss', { duration: 2500 });
      input.value = '';
    };
    reader.onerror = () => this.snackBar.open('Could not read the selected file', 'Dismiss', { duration: 3000 });
    reader.readAsText(file);
  }

  analyzeSource(showToast = true): void {
    const source = this.getSourceText();
    if (!source) {
      if (showToast) {
        this.snackBar.open('Paste text or import a file first', 'Dismiss', { duration: 3000 });
      }
      return;
    }

    this.analyzingSource.set(true);
    const localFallback = this.buildLocalSuggestions(source);
    this.titleSuggestions.set(localFallback.titles);
    this.tagSuggestions.set(localFallback.tags);
    this.analysisSummary.set(localFallback.summary);
    this.recommendedModelLabel.set(localFallback.modelLabel);
    this.recommendedModelHint.set(localFallback.modelHint);
    this.config.model = localFallback.modelValue;
    this.recommendedPlatforms.set(localFallback.platforms);
    this.selectedDistributionTargets.set(localFallback.platforms);

    const videoType = this.basicForm.value.videoType ?? 'youtube_short';
    this.aiService.generateScript(source, this.config.style, this.config.duration, videoType).subscribe({
      next: res => {
        this.generatedScript.set(res);
        this.titleSuggestions.set(
          (res.suggestedTitles ?? []).map((title, index) => ({
            title,
            description: 'AI-generated from your source',
            seoScore: Math.max(72, 96 - index * 4)
          }))
        );
        this.tagSuggestions.set(res.suggestedTags ?? []);

        const recommendation = this.buildRecommendation(source, res);
        this.analysisSummary.set(recommendation.summary);
        this.recommendedModelLabel.set(recommendation.modelLabel);
        this.recommendedModelHint.set(recommendation.modelHint);
        this.config.model = recommendation.modelValue;
        this.recommendedPlatforms.set(recommendation.platforms);
        this.selectedDistributionTargets.set(recommendation.platforms);

        if (!this.basicForm.value.title && res.suggestedTitles.length > 0) {
          this.basicForm.patchValue({ title: res.suggestedTitles[0] });
        }

        if (!this.basicForm.value.description) {
          this.basicForm.patchValue({ description: res.script.substring(0, 800) });
        }

        this.analyzingSource.set(false);
        if (showToast) {
          this.snackBar.open('AI source analysis ready', 'Dismiss', { duration: 3000 });
        }
      },
      error: () => {
        this.analyzingSource.set(false);
        if (showToast) {
          this.snackBar.open('Using local suggestions because the AI service is unavailable', 'Dismiss', { duration: 3000 });
        }
      }
    });
  }

  generateTitles(): void {
    const topic = this.getSourceText() || this.basicForm.value.title || 'video content';
    this.generatingTitles.set(true);
    this.aiService.generateTitles(topic, this.basicForm.value.videoType ?? 'youtube').subscribe({
      next: res => { this.titleSuggestions.set(res.titles); this.generatingTitles.set(false); },
      error: () => { this.generatingTitles.set(false); this.snackBar.open('Could not generate titles', 'Dismiss', { duration: 3000 }); }
    });
  }

  generateDescription(): void {
    const prompt = this.getSourceText();
    if (!prompt) {
      this.snackBar.open('Please enter a prompt or idea first', 'Dismiss', { duration: 3000 });
      return;
    }
    this.generatingDescription.set(true);
    // Reuse generateScript to get contextual AI output and derive a description snippet
    this.aiService.generateScript(prompt, this.config.style, this.config.duration, this.basicForm.value.videoType ?? 'youtube_short')
      .subscribe({
        next: res => {
          // create a short description from the generated script (first 2 paragraphs / 300 chars)
          const snip = (res.script || '').split('\n\n').filter(p => p.trim().length > 0).slice(0,2).join('\n\n');
          const desc = snip ? snip.substring(0, 800) : (prompt.substring(0, 800));
          this.basicForm.patchValue({ description: desc });
          // accept suggested tags from response if present
          if (res.suggestedTags && res.suggestedTags.length) {
            this.tagSuggestions.set(res.suggestedTags);
          }
          this.generatingDescription.set(false);
        },
        error: () => { this.generatingDescription.set(false); this.snackBar.open('Could not generate description', 'Dismiss', { duration: 3000 }); }
      });
  }

  generateTags(): void {
    const title = this.basicForm.value.title || '';
    const description = this.basicForm.value.description || this.getSourceText() || '';
    if (!title && !description) {
      this.snackBar.open('Please provide a title or description/prompt first', 'Dismiss', { duration: 3000 });
      return;
    }
    this.generatingTags.set(true);
    this.aiService.generateTags(title, description).subscribe({
      next: res => {
        this.tagSuggestions.set(res.tags ?? []);
        this.generatingTags.set(false);
      },
      error: () => { this.generatingTags.set(false); this.snackBar.open('Could not generate tags', 'Dismiss', { duration: 3000 }); }
    });
  }

  toggleTag(tag: string): void {
    const current = this.selectedTags();
    const idx = current.indexOf(tag);
    if (idx === -1) {
      this.selectedTags.set([...current, tag]);
    } else {
      const copy = [...current]; copy.splice(idx, 1); this.selectedTags.set(copy);
    }
    this.basicForm.patchValue({ tags: this.selectedTags() });
  }

  toggleDistributionTarget(target: string): void {
    const current = this.selectedDistributionTargets();
    const index = current.indexOf(target);

    if (index === -1) {
      this.selectedDistributionTargets.set([...current, target]);
      return;
    }

    const next = [...current];
    next.splice(index, 1);
    this.selectedDistributionTargets.set(next);
  }

  selectTitle(title: string): void {
    this.basicForm.patchValue({ title });
  }

  generateScript(): void {
    const source = this.getSourceText();
    if (!source) return;
    this.generatingScript.set(true);
    this.aiService.generateScript(
      source,
      this.config.style,
      this.config.duration,
      this.basicForm.value.videoType ?? 'youtube_short'
    ).subscribe({
      next: res => {
        this.generatedScript.set(res);
        this.titleSuggestions.set(
          (res.suggestedTitles ?? []).map((title, index) => ({
            title,
            description: 'AI-generated from your source',
            seoScore: Math.max(72, 96 - index * 4)
          }))
        );
        this.tagSuggestions.set(res.suggestedTags ?? []);
        this.generatingScript.set(false);
      },
      error: () => { this.generatingScript.set(false); }
    });
  }

  createProject(): void {
    if (this.basicForm.invalid) return;
    this.creating.set(true);
    const v = this.basicForm.value;
    const sourceContent = this.getSourceText();
    if (!sourceContent) {
      this.creating.set(false);
      this.snackBar.open('Add a prompt or imported source before creating the project', 'Dismiss', { duration: 3000 });
      return;
    }
    const prompt = v.prompt || sourceContent || v.description || v.title || '';
    this.videoService.create({
      title: v.title!,
      prompt,
      description: v.description ?? '',
      tags: this.selectedTags(),
      sourceContent: sourceContent || undefined,
      distributionTargets: this.selectedDistributionTargets(),
      videoType: v.videoType ?? 'youtube_short',
      language: v.language ?? 'en',
      ...this.config,
      aiConfig: {
        model: this.config.model,
        temperature: 0.7,
        maxTokens: 2048,
        useVoiceOver: true,
        addSubtitles: true,
        subtitleLanguage: v.language ?? 'en',
        videoType: v.videoType ?? 'youtube_short'
      }
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

  private getSourceText(): string {
    return (this.basicForm.value.sourceContent || this.basicForm.value.prompt || '').trim();
  }

  private convertWorkbookToSourceText(workbook: XLSX.WorkBook, fileName: string): string {
    const sheetChunks: string[] = [`Workbook: ${fileName}`, `Sheets: ${workbook.SheetNames.length}`];

    workbook.SheetNames.forEach((sheetName, index) => {
      const sheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });
      sheetChunks.push(`\nSheet ${index + 1}: ${sheetName}`);

      if (rows.length === 0) {
        sheetChunks.push('No data rows found.');
        return;
      }

      const columns = Object.keys(rows[0] ?? {});
      if (columns.length > 0) {
        sheetChunks.push(`Columns: ${columns.join(' | ')}`);
      }

      rows.slice(0, 20).forEach((row, rowIndex) => {
        const parts = columns.length > 0
          ? columns.map(column => `${column}=${this.normalizeSheetValue(row[column])}`)
          : Object.entries(row).map(([key, value]) => `${key}=${this.normalizeSheetValue(value)}`);
        sheetChunks.push(`Row ${rowIndex + 1}: ${parts.join('; ')}`);
      });

      if (rows.length > 20) {
        sheetChunks.push(`... ${rows.length - 20} more rows omitted from ${sheetName}`);
      }
    });

    return sheetChunks.join('\n');
  }

  private normalizeSheetValue(value: unknown): string {
    if (value === null || value === undefined || value === '') {
      return '(empty)';
    }

    if (typeof value === 'object') {
      try {
        return JSON.stringify(value);
      } catch {
        return String(value);
      }
    }

    return String(value).replace(/\s+/g, ' ').trim();
  }

  private buildRecommendation(source: string, response: GenerateScriptResponse): { summary: string; modelLabel: string; modelHint: string; modelValue: string; platforms: string[] } {
    const isShortForm = this.basicForm.value.videoType === 'youtube_short' || this.config.duration === '15s' || this.config.duration === '30s' || this.config.duration === '60s';
    const isProfessional = /business|linkedin|leadership|strategy|case study|tutorial|education|career|productivity|finance/i.test(source);
    const isCreative = /viral|trend|funny|entertainment|music|story|gaming|fashion|lifestyle/i.test(source);

    const platforms = new Set<string>();
    if (isShortForm || isCreative) {
      platforms.add('youtube_shorts');
      platforms.add('instagram_reel');
      platforms.add('tiktok');
    }
    if (isProfessional) {
      platforms.add('linkedin');
      platforms.add('youtube');
    }
    if (platforms.size === 0) {
      platforms.add('youtube');
      platforms.add('linkedin');
    }

    let modelLabel = '3.6 Flash';
    let modelHint = 'Balanced default for fast AI planning and script generation';
    let modelValue = 'gemini-2.0-flash';

    if (isProfessional || response.suggestedTitles.length > 2) {
      modelLabel = '3.1 Pro';
      modelHint = 'Better for deeper reasoning, long-form scripts, and multi-platform planning';
      modelValue = 'gemini-2.0-pro';
    } else if (source.length < 400) {
      modelLabel = '3.5 Flash-Lite';
      modelHint = 'Fastest option for short drafts and quick iterations';
      modelValue = 'gemini-2.0-flash-lite';
    }

    const summary = isProfessional
      ? 'AI suggests a professional-first rollout with LinkedIn and YouTube, plus a polished script structure.'
      : isShortForm
        ? 'AI suggests a short-form rollout optimized for vertical platforms and fast retention.'
        : 'AI suggests a multi-platform rollout that can be adapted across video and social channels.';

    return {
      summary,
      modelLabel,
      modelHint,
      modelValue,
      platforms: [...platforms]
    };
  }

  private buildLocalSuggestions(source: string): { titles: TitleSuggestion[]; tags: string[]; summary: string; modelLabel: string; modelHint: string; modelValue: string; platforms: string[] } {
    const normalized = source.toLowerCase();
    const keywords = this.extractKeywords(source);
    const leadKeyword = keywords[0] ?? 'video';
    const secondaryKeyword = keywords[1] ?? 'guide';
    const isSpreadsheetLike = /sheet|row|column|table|report|data|analysis|inventory|sales/i.test(source);
    const isShortForm = /short|reel|tiktok|youtube short|viral|quick/i.test(source);
    const isProfessional = /business|linkedin|strategy|report|dashboard|case study|tutorial|training|education/i.test(source);

    const titles = [
      `${this.toTitleCase(leadKeyword)} ${isSpreadsheetLike ? 'Insights' : 'Guide'} for 2025`,
      `How to Turn ${this.toTitleCase(leadKeyword)} Into ${this.toTitleCase(secondaryKeyword)}`,
      `${this.toTitleCase(leadKeyword)}: The Fastest Way to Get Results`
    ].map((title, index) => ({
      title,
      description: 'Auto-generated from your imported source',
      seoScore: 92 - index * 6
    }));

    const tags = Array.from(new Set([
      leadKeyword,
      secondaryKeyword,
      ...(isSpreadsheetLike ? ['data', 'workflow', 'report'] : []),
      ...(isShortForm ? ['shorts', 'viral', 'quick'] : []),
      ...(isProfessional ? ['linkedin', 'strategy', 'business'] : []),
      'ai',
      'video'
    ])).slice(0, 10);

    const platforms = new Set<string>();
    if (isShortForm) {
      platforms.add('youtube_shorts');
      platforms.add('instagram_reel');
      platforms.add('tiktok');
    } else if (isProfessional || isSpreadsheetLike) {
      platforms.add('linkedin');
      platforms.add('youtube');
    } else {
      platforms.add('youtube');
      platforms.add('linkedin');
    }

    let modelLabel = '3.6 Flash';
    let modelHint = 'Balanced default for fast source analysis';
    let modelValue = 'gemini-2.0-flash';
    if (source.length < 350) {
      modelLabel = '3.5 Flash-Lite';
      modelHint = 'Fastest option for quick source drafts';
      modelValue = 'gemini-2.0-flash-lite';
    } else if (isProfessional || isSpreadsheetLike) {
      modelLabel = '3.1 Pro';
      modelHint = 'Better for richer reasoning and structured source breakdowns';
      modelValue = 'gemini-2.0-pro';
    }

    const summary = isSpreadsheetLike
      ? 'AI suggests turning the workbook into a structured data story, with a professional rollout on LinkedIn and YouTube.'
      : isShortForm
        ? 'AI suggests a short-form rollout optimized for fast retention and vertical platforms.'
        : 'AI suggests a multi-platform rollout based on the source content.';

    return {
      titles,
      tags,
      summary,
      modelLabel,
      modelHint,
      modelValue,
      platforms: [...platforms]
    };
  }

  private extractKeywords(source: string): string[] {
    const stopWords = new Set([
      'the', 'and', 'for', 'with', 'from', 'that', 'this', 'your', 'you', 'are', 'was', 'were', 'have', 'has',
      'not', 'can', 'will', 'into', 'about', 'what', 'when', 'where', 'how', 'why', 'sheet', 'row', 'rows',
      'column', 'columns', 'data', 'file', 'text', 'notes', 'workbook', 'imported'
    ]);

    return source
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, ' ')
      .split(/\s+/)
      .map(word => word.trim())
      .filter(word => word.length >= 4 && !stopWords.has(word))
      .filter((word, index, array) => array.indexOf(word) === index)
      .slice(0, 8);
  }

  private toTitleCase(value: string): string {
    return value
      .split(/\s+/)
      .filter(Boolean)
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }
}
