import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { AiService } from '../../services/video.service';
import { TitleSuggestion, GenerateScriptResponse } from '../../models/video.models';

@Component({
  selector: 'app-ai-tools',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatCardModule, MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatChipsModule, MatTabsModule, MatProgressSpinnerModule,
    MatProgressBarModule, MatSnackBarModule, MatDividerModule
  ],
  template: `
    <div class="tools-container">
      <div class="page-header">
        <h1><mat-icon>psychology</mat-icon> AI Tools</h1>
        <p>Powered by Google Gemini AI — your creative assistant</p>
      </div>

      <mat-tab-group>

        <!-- Title Generator -->
        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon>title</mat-icon> Title Generator
          </ng-template>
          <div class="tab-content">
            <mat-card class="tool-card">
              <mat-card-header>
                <mat-icon mat-card-avatar>title</mat-icon>
                <mat-card-title>Viral Title Generator</mat-card-title>
                <mat-card-subtitle>Generate SEO-optimized titles that drive clicks</mat-card-subtitle>
              </mat-card-header>
              <mat-card-content>
                <div class="tool-form">
                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Video Topic</mat-label>
                    <input matInput [(ngModel)]="titleTopic" placeholder="e.g., 'How to learn Python in 2025'">
                  </mat-form-field>
                  <div class="form-row">
                    <mat-form-field appearance="outline">
                      <mat-label>Video Type</mat-label>
                      <mat-select [(ngModel)]="titleVideoType">
                        <mat-option value="youtube">YouTube</mat-option>
                        <mat-option value="youtube_short">YouTube Short</mat-option>
                        <mat-option value="reel">Instagram Reel</mat-option>
                      </mat-select>
                    </mat-form-field>
                    <mat-form-field appearance="outline">
                      <mat-label>Count</mat-label>
                      <mat-select [(ngModel)]="titleCount">
                        <mat-option [value]="3">3 titles</mat-option>
                        <mat-option [value]="5">5 titles</mat-option>
                        <mat-option [value]="10">10 titles</mat-option>
                      </mat-select>
                    </mat-form-field>
                  </div>
                  <button mat-raised-button color="primary" (click)="generateTitles()" [disabled]="!titleTopic || generatingTitles()">
                    @if (generatingTitles()) { <mat-spinner diameter="20"></mat-spinner> }
                    @else { <mat-icon>auto_awesome</mat-icon> }
                    Generate Titles
                  </button>
                </div>

                @if (titleSuggestions().length > 0) {
                  <mat-divider class="divider"></mat-divider>
                  <h3>Generated Titles</h3>
                  <div class="results-list">
                    @for (t of titleSuggestions(); track t.title) {
                      <div class="result-item">
                        <div class="result-header">
                          <span class="result-text">{{ t.title }}</span>
                          <span class="seo-badge" [class.high]="t.seoScore >= 80">
                            SEO {{ t.seoScore }}
                          </span>
                        </div>
                        <p class="result-desc">{{ t.description }}</p>
                      </div>
                    }
                  </div>
                }
              </mat-card-content>
            </mat-card>
          </div>
        </mat-tab>

        <!-- Script Generator -->
        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon>description</mat-icon> Script Generator
          </ng-template>
          <div class="tab-content">
            <mat-card class="tool-card">
              <mat-card-header>
                <mat-icon mat-card-avatar>description</mat-icon>
                <mat-card-title>AI Script Generator</mat-card-title>
                <mat-card-subtitle>Create engaging video scripts with Gemini AI</mat-card-subtitle>
              </mat-card-header>
              <mat-card-content>
                <div class="tool-form">
                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Script Prompt</mat-label>
                    <textarea matInput [(ngModel)]="scriptPrompt" rows="3"
                      placeholder="Describe the video you want a script for..."></textarea>
                  </mat-form-field>
                  <div class="form-row">
                    <mat-form-field appearance="outline">
                      <mat-label>Style</mat-label>
                      <mat-select [(ngModel)]="scriptStyle">
                        <mat-option value="cinematic">Cinematic</mat-option>
                        <mat-option value="educational">Educational</mat-option>
                        <mat-option value="comedy">Comedy</mat-option>
                        <mat-option value="documentary">Documentary</mat-option>
                      </mat-select>
                    </mat-form-field>
                    <mat-form-field appearance="outline">
                      <mat-label>Duration</mat-label>
                      <mat-select [(ngModel)]="scriptDuration">
                        <mat-option value="60s">60 seconds</mat-option>
                        <mat-option value="3m">3 minutes</mat-option>
                        <mat-option value="5m">5 minutes</mat-option>
                        <mat-option value="10m">10 minutes</mat-option>
                      </mat-select>
                    </mat-form-field>
                  </div>
                  <button mat-raised-button color="primary" (click)="generateScript()" [disabled]="!scriptPrompt || generatingScript()">
                    @if (generatingScript()) { <mat-spinner diameter="20"></mat-spinner> }
                    @else { <mat-icon>auto_awesome</mat-icon> }
                    Generate Script
                  </button>
                </div>

                @if (generatedScript()) {
                  <mat-divider class="divider"></mat-divider>
                  <div class="script-result">
                    <div class="result-header-bar">
                      <h3>Generated Script</h3>
                      <span class="duration-badge">{{ generatedScript()!.estimatedDuration }}</span>
                    </div>
                    <pre class="script-text">{{ generatedScript()!.script }}</pre>
                    @if (generatedScript()!.suggestedTags.length > 0) {
                      <div class="tags-row">
                        <strong>Suggested Tags:</strong>
                        @for (tag of generatedScript()!.suggestedTags; track tag) {
                          <mat-chip>{{ tag }}</mat-chip>
                        }
                      </div>
                    }
                  </div>
                }
              </mat-card-content>
            </mat-card>
          </div>
        </mat-tab>

        <!-- Character Transform -->
        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon>face_retouching_natural</mat-icon> Character Transform
          </ng-template>
          <div class="tab-content">
            <mat-card class="tool-card">
              <mat-card-header>
                <mat-icon mat-card-avatar>face_retouching_natural</mat-icon>
                <mat-card-title>AI Character Transformation</mat-card-title>
                <mat-card-subtitle>Transform characters in your video to different artistic styles</mat-card-subtitle>
              </mat-card-header>
              <mat-card-content>
                <div class="tool-form">
                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Source Video URL or Description</mat-label>
                    <input matInput [(ngModel)]="sourceVideoUrl" placeholder="Enter video URL or describe the source...">
                  </mat-form-field>
                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Target Character Style</mat-label>
                    <mat-select [(ngModel)]="targetCharacterStyle">
                      <mat-option value="anime">Anime</mat-option>
                      <mat-option value="cartoon">Cartoon</mat-option>
                      <mat-option value="pixel-art">Pixel Art</mat-option>
                      <mat-option value="claymation">Claymation</mat-option>
                      <mat-option value="watercolor">Watercolor</mat-option>
                      <mat-option value="oil-painting">Oil Painting</mat-option>
                      <mat-option value="comic-book">Comic Book</mat-option>
                      <mat-option value="cyberpunk">Cyberpunk</mat-option>
                    </mat-select>
                  </mat-form-field>
                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Character Description</mat-label>
                    <textarea matInput [(ngModel)]="characterDescription" rows="2"
                      placeholder="Describe the characters to transform..."></textarea>
                  </mat-form-field>
                  <button mat-raised-button color="primary" (click)="transformCharacter()" [disabled]="!sourceVideoUrl || transforming()">
                    @if (transforming()) { <mat-spinner diameter="20"></mat-spinner> }
                    @else { <mat-icon>auto_fix_high</mat-icon> }
                    Generate Transformation Plan
                  </button>
                </div>

                @if (transformationPlan()) {
                  <mat-divider class="divider"></mat-divider>
                  <h3>Transformation Plan</h3>
                  <div class="transform-result">
                    <p>{{ transformationPlan() }}</p>
                  </div>
                }
              </mat-card-content>
            </mat-card>
          </div>
        </mat-tab>

        <!-- Tag Generator -->
        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon>label</mat-icon> Tag Generator
          </ng-template>
          <div class="tab-content">
            <mat-card class="tool-card">
              <mat-card-header>
                <mat-icon mat-card-avatar>label</mat-icon>
                <mat-card-title>AI Tag Generator</mat-card-title>
                <mat-card-subtitle>Generate relevant YouTube tags for maximum reach</mat-card-subtitle>
              </mat-card-header>
              <mat-card-content>
                <div class="tool-form">
                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Video Title</mat-label>
                    <input matInput [(ngModel)]="tagTitle" placeholder="Your video title">
                  </mat-form-field>
                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Video Description</mat-label>
                    <textarea matInput [(ngModel)]="tagDescription" rows="2"
                      placeholder="Brief description of your video..."></textarea>
                  </mat-form-field>
                  <button mat-raised-button color="primary" (click)="generateTags()" [disabled]="!tagTitle || generatingTags()">
                    @if (generatingTags()) { <mat-spinner diameter="20"></mat-spinner> }
                    @else { <mat-icon>auto_awesome</mat-icon> }
                    Generate Tags
                  </button>
                </div>

                @if (generatedTags().length > 0) {
                  <mat-divider class="divider"></mat-divider>
                  <h3>Generated Tags ({{ generatedTags().length }})</h3>
                  <div class="tags-row">
                    @for (tag of generatedTags(); track tag) {
                      <mat-chip>{{ tag }}</mat-chip>
                    }
                  </div>
                }
              </mat-card-content>
            </mat-card>
          </div>
        </mat-tab>

      </mat-tab-group>
    </div>
  `,
  styles: [`
    .tools-container { max-width: 900px; margin: 0 auto; padding: 24px; }
    .page-header { margin-bottom: 32px; }
    .page-header h1 { font-size: 2rem; font-weight: 700; display: flex; align-items: center; gap: 12px; }
    .page-header p { color: #888; }
    .tab-content { padding: 24px 0; }
    .tool-card { }
    .tool-form { display: flex; flex-direction: column; gap: 16px; }
    .full-width { width: 100%; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .divider { margin: 24px 0 !important; }

    .results-list { display: flex; flex-direction: column; gap: 12px; }
    .result-item { background: rgba(255,255,255,0.03); border-radius: 8px; padding: 16px; border: 1px solid rgba(255,255,255,0.08); }
    .result-header { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-bottom: 8px; }
    .result-text { font-weight: 600; flex: 1; }
    .result-desc { color: #888; font-size: 0.85rem; margin: 0; }
    .seo-badge { background: rgba(255,152,0,0.2); color: #ff9800; padding: 4px 10px; border-radius: 4px; font-size: 0.8rem; font-weight: 600; white-space: nowrap; }
    .seo-badge.high { background: rgba(76,175,80,0.2); color: #4caf50; }

    .script-result { }
    .result-header-bar { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
    .result-header-bar h3 { margin: 0; }
    .duration-badge { background: rgba(33,150,243,0.2); color: #2196f3; padding: 4px 12px; border-radius: 12px; font-size: 0.85rem; }
    .script-text { white-space: pre-wrap; font-family: monospace; font-size: 0.85rem; background: rgba(0,0,0,0.2); padding: 16px; border-radius: 8px; max-height: 400px; overflow-y: auto; }

    .transform-result { background: rgba(255,255,255,0.03); border-radius: 8px; padding: 16px; }
    .transform-result p { white-space: pre-wrap; line-height: 1.6; }

    .tags-row { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
    .tags-row strong { margin-right: 4px; }
  `]
})
export class AiToolsComponent {
  private aiService = inject(AiService);
  private snackBar = inject(MatSnackBar);

  // Title generator
  titleTopic = '';
  titleVideoType = 'youtube';
  titleCount = 5;
  generatingTitles = signal(false);
  titleSuggestions = signal<TitleSuggestion[]>([]);

  // Script generator
  scriptPrompt = '';
  scriptStyle = 'cinematic';
  scriptDuration = '60s';
  generatingScript = signal(false);
  generatedScript = signal<GenerateScriptResponse | null>(null);

  // Character transform
  sourceVideoUrl = '';
  targetCharacterStyle = 'anime';
  characterDescription = '';
  transforming = signal(false);
  transformationPlan = signal<string | null>(null);

  // Tag generator
  tagTitle = '';
  tagDescription = '';
  generatingTags = signal(false);
  generatedTags = signal<string[]>([]);

  generateTitles(): void {
    this.generatingTitles.set(true);
    this.aiService.generateTitles(this.titleTopic, this.titleVideoType, this.titleCount).subscribe({
      next: res => { this.titleSuggestions.set(res.titles); this.generatingTitles.set(false); },
      error: () => { this.generatingTitles.set(false); this.snackBar.open('Error generating titles', 'Dismiss', { duration: 3000 }); }
    });
  }

  generateScript(): void {
    this.generatingScript.set(true);
    this.aiService.generateScript(this.scriptPrompt, this.scriptStyle, this.scriptDuration).subscribe({
      next: res => { this.generatedScript.set(res); this.generatingScript.set(false); },
      error: () => { this.generatingScript.set(false); }
    });
  }

  transformCharacter(): void {
    this.transforming.set(true);
    this.aiService.transformCharacter('', this.sourceVideoUrl, this.targetCharacterStyle, this.characterDescription).subscribe({
      next: res => { this.transformationPlan.set(res.transformationPlan); this.transforming.set(false); },
      error: () => { this.transforming.set(false); }
    });
  }

  generateTags(): void {
    this.generatingTags.set(true);
    this.aiService.generateTags(this.tagTitle, this.tagDescription).subscribe({
      next: res => { this.generatedTags.set(res.tags); this.generatingTags.set(false); },
      error: () => { this.generatingTags.set(false); }
    });
  }
}
