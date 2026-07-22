using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace VideoGenerator.API.Models;

public class Notification
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? Id { get; set; }

    public string UserId { get; set; } = "default";
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public NotificationType Type { get; set; } = NotificationType.Info;
    public bool IsRead { get; set; } = false;
    public string? ProjectId { get; set; }
    public string? ActionUrl { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public enum NotificationType
{
    Info,
    Success,
    Warning,
    Error,
    VideoReady,
    UploadComplete,
    AiProcessing
}
