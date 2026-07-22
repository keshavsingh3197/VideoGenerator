import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent) },
  { path: 'projects', loadComponent: () => import('./pages/projects/projects.component').then(m => m.ProjectsComponent) },
  { path: 'projects/:id', loadComponent: () => import('./pages/project-detail/project-detail.component').then(m => m.ProjectDetailComponent) },
  { path: 'create', loadComponent: () => import('./pages/create-video/create-video.component').then(m => m.CreateVideoComponent) },
  { path: 'ai-tools', loadComponent: () => import('./pages/ai-tools/ai-tools.component').then(m => m.AiToolsComponent) },
  { path: '**', redirectTo: '' }
];
