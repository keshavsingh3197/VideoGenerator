using Microsoft.AspNetCore.Mvc;
using VideoGenerator.API.Services;

namespace VideoGenerator.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class NotificationsController : ControllerBase
{
    private readonly INotificationService _notificationService;

    public NotificationsController(INotificationService notificationService)
    {
        _notificationService = notificationService;
    }

    [HttpGet]
    public async Task<IActionResult> GetNotifications([FromQuery] string userId = "default", [FromQuery] int limit = 50)
    {
        var notifications = await _notificationService.GetUserNotificationsAsync(userId, limit);
        var unreadCount = await _notificationService.GetUnreadCountAsync(userId);
        return Ok(new { notifications, unreadCount });
    }

    [HttpGet("unread-count")]
    public async Task<IActionResult> GetUnreadCount([FromQuery] string userId = "default")
    {
        var count = await _notificationService.GetUnreadCountAsync(userId);
        return Ok(new { count });
    }

    [HttpPut("{id}/read")]
    public async Task<IActionResult> MarkAsRead(string id)
    {
        await _notificationService.MarkAsReadAsync(id);
        return NoContent();
    }

    [HttpPut("mark-all-read")]
    public async Task<IActionResult> MarkAllAsRead([FromQuery] string userId = "default")
    {
        await _notificationService.MarkAllAsReadAsync(userId);
        return NoContent();
    }
}
