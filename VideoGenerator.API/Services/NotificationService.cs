using Microsoft.AspNetCore.SignalR;
using VideoGenerator.API.Hubs;
using VideoGenerator.API.Models;
using VideoGenerator.API.Repositories;

namespace VideoGenerator.API.Services;

public interface INotificationService
{
    Task SendAsync(Notification notification);
    Task<List<Notification>> GetUserNotificationsAsync(string userId, int limit = 50);
    Task<long> GetUnreadCountAsync(string userId);
    Task MarkAsReadAsync(string id);
    Task MarkAllAsReadAsync(string userId);
}

public class NotificationService : INotificationService
{
    private readonly INotificationRepository _repository;
    private readonly IHubContext<NotificationHub> _hubContext;
    private readonly ILogger<NotificationService> _logger;

    public NotificationService(
        INotificationRepository repository,
        IHubContext<NotificationHub> hubContext,
        ILogger<NotificationService> logger)
    {
        _repository = repository;
        _hubContext = hubContext;
        _logger = logger;
    }

    public async Task SendAsync(Notification notification)
    {
        var saved = await _repository.CreateAsync(notification);

        try
        {
            await _hubContext.Clients.Group(notification.UserId)
                .SendAsync("ReceiveNotification", new
                {
                    id = saved.Id,
                    title = saved.Title,
                    message = saved.Message,
                    type = saved.Type.ToString(),
                    projectId = saved.ProjectId,
                    actionUrl = saved.ActionUrl,
                    createdAt = saved.CreatedAt
                });
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to send real-time notification");
        }
    }

    public async Task<List<Notification>> GetUserNotificationsAsync(string userId, int limit = 50)
    {
        return await _repository.GetByUserIdAsync(userId, limit);
    }

    public async Task<long> GetUnreadCountAsync(string userId)
    {
        return await _repository.GetUnreadCountAsync(userId);
    }

    public async Task MarkAsReadAsync(string id)
    {
        await _repository.MarkAsReadAsync(id);
    }

    public async Task MarkAllAsReadAsync(string userId)
    {
        await _repository.MarkAllAsReadAsync(userId);
    }
}
