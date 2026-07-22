import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import * as signalR from '@microsoft/signalr';
import { Notification, NotificationsResponse } from '../models/video.models';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private apiUrl = `${environment.apiUrl}/api/notifications`;
  private hubConnection: signalR.HubConnection | null = null;

  notifications = signal<Notification[]>([]);
  unreadCount = signal<number>(0);

  constructor(private http: HttpClient) {}

  connect(userId = 'default'): void {
    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(`${environment.apiUrl}/hubs/notifications`)
      .withAutomaticReconnect()
      .build();

    this.hubConnection.on('ReceiveNotification', (notification: Notification) => {
      this.notifications.update(n => [notification, ...n]);
      this.unreadCount.update(c => c + 1);
    });

    this.hubConnection.start()
      .then(() => this.hubConnection!.invoke('JoinUserGroup', userId))
      .catch(err => console.warn('SignalR connection failed:', err));
  }

  disconnect(): void {
    this.hubConnection?.stop();
  }

  loadNotifications(userId = 'default'): void {
    this.http.get<NotificationsResponse>(`${this.apiUrl}?userId=${userId}`)
      .subscribe(res => {
        this.notifications.set(res.notifications);
        this.unreadCount.set(Number(res.unreadCount));
      });
  }

  markAsRead(id: string): void {
    this.http.put(`${this.apiUrl}/${id}/read`, {}).subscribe(() => {
      this.notifications.update(notifications =>
        notifications.map(n => n.id === id ? { ...n, isRead: true } : n)
      );
      this.unreadCount.update(c => Math.max(0, c - 1));
    });
  }

  markAllAsRead(userId = 'default'): void {
    this.http.put(`${this.apiUrl}/mark-all-read?userId=${userId}`, {}).subscribe(() => {
      this.notifications.update(notifications =>
        notifications.map(n => ({ ...n, isRead: true }))
      );
      this.unreadCount.set(0);
    });
  }
}
