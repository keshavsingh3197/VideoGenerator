import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { NotificationService } from '../../services/notification.service';
import { NotificationType } from '../../models/video.models';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule, RouterModule, MatToolbarModule, MatButtonModule,
    MatIconModule, MatBadgeModule, MatMenuModule, MatDividerModule
  ],
  template: `
    <mat-toolbar class="app-toolbar">
      <a routerLink="/" class="brand">
        <mat-icon>movie_creation</mat-icon>
        <span>VideoGen AI</span>
      </a>

      <nav class="nav-links">
        <a mat-button routerLink="/projects" routerLinkActive="active">
          <mat-icon>video_library</mat-icon> Projects
        </a>
        <a mat-button routerLink="/create" routerLinkActive="active">
          <mat-icon>add_circle</mat-icon> Create
        </a>
        <a mat-button routerLink="/ai-tools" routerLinkActive="active">
          <mat-icon>psychology</mat-icon> AI Tools
        </a>
      </nav>

      <span class="spacer"></span>

      <button mat-icon-button [matMenuTriggerFor]="notifMenu" class="notif-btn">
        <mat-icon
          [matBadge]="notifService.unreadCount() > 0 ? notifService.unreadCount().toString() : ''"
          matBadgeColor="warn"
          [matBadgeHidden]="notifService.unreadCount() === 0">
          notifications
        </mat-icon>
      </button>

      <mat-menu #notifMenu="matMenu" class="notification-menu">
        <div class="notif-header" (click)="$event.stopPropagation()">
          <span>Notifications</span>
          <button mat-button color="primary" (click)="markAllRead()">Mark all read</button>
        </div>
        <mat-divider></mat-divider>
        @if (notifService.notifications().length === 0) {
          <div class="no-notifications">No notifications</div>
        }
        @for (n of notifService.notifications().slice(0, 8); track n.id) {
          <button mat-menu-item [class.unread]="!n.isRead" (click)="markRead(n.id)">
            <mat-icon [class]="'notif-icon ' + getNotifClass(n.type)">{{ getNotifIcon(n.type) }}</mat-icon>
            <div class="notif-content">
              <div class="notif-title">{{ n.title }}</div>
              <div class="notif-msg">{{ n.message }}</div>
            </div>
          </button>
        }
      </mat-menu>
    </mat-toolbar>
  `,
  styles: [`
    .app-toolbar {
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
      color: white;
      box-shadow: 0 2px 20px rgba(0,0,0,0.4);
      position: fixed;
      top: 0;
      z-index: 100;
      width: 100%;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 8px;
      text-decoration: none;
      color: white;
      font-size: 1.3rem;
      font-weight: 700;
      background: linear-gradient(90deg, #e94560, #0f3460);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    .brand mat-icon { color: #e94560; }
    .nav-links { display: flex; gap: 4px; margin-left: 24px; }
    .nav-links a { color: rgba(255,255,255,0.8); font-weight: 500; }
    .nav-links a.active { color: #e94560; }
    .spacer { flex: 1; }
    .notif-btn { color: white; }
    .notif-header {
      padding: 8px 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-weight: 600;
    }
    .no-notifications { padding: 16px; text-align: center; color: #888; }
    .unread { background: rgba(233, 69, 96, 0.05); }
    .notif-icon { margin-right: 8px; }
    .notif-icon.success { color: #4caf50; }
    .notif-icon.error { color: #f44336; }
    .notif-icon.info { color: #2196f3; }
    .notif-icon.warning { color: #ff9800; }
    .notif-content { display: flex; flex-direction: column; }
    .notif-title { font-weight: 600; font-size: 0.9rem; }
    .notif-msg { font-size: 0.8rem; color: #888; white-space: normal; max-width: 260px; }
  `]
})
export class HeaderComponent implements OnInit {
  notifService = inject(NotificationService);

  ngOnInit(): void {
    this.notifService.connect();
    this.notifService.loadNotifications();
  }

  markRead(id: string): void {
    this.notifService.markAsRead(id);
  }

  markAllRead(): void {
    this.notifService.markAllAsRead();
  }

  getNotifIcon(type: NotificationType): string {
    const icons: Record<NotificationType, string> = {
      Info: 'info',
      Success: 'check_circle',
      Warning: 'warning',
      Error: 'error',
      VideoReady: 'videocam',
      UploadComplete: 'cloud_done',
      AiProcessing: 'psychology'
    };
    return icons[type] ?? 'notifications';
  }

  getNotifClass(type: NotificationType): string {
    const classes: Record<NotificationType, string> = {
      Info: 'info',
      Success: 'success',
      Warning: 'warning',
      Error: 'error',
      VideoReady: 'success',
      UploadComplete: 'success',
      AiProcessing: 'info'
    };
    return classes[type] ?? 'info';
  }
}
