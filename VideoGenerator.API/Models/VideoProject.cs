using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace VideoGenerator.API.Models;

public class VideoProject
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? Id { get; set; }

    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Prompt { get; set; } = string.Empty;
    public string Style { get; set; } = "cinematic";
    public string Duration { get; set; } = "60s";
    public string AspectRatio { get; set; } = "16:9";
    public string Resolution { get; set; } = "1080p";
    public string Language { get; set; } = "en";
    public string VoiceOver { get; set; } = "default";
    public string BackgroundMusic { get; set; } = "none";
    public string CharacterStyle { get; set; } = "none";
    public VideoStatus Status { get; set; } = VideoStatus.Draft;
    public string? PreviewUrl { get; set; }
    public string? VideoUrl { get; set; }
    public string? ThumbnailUrl { get; set; }
    public string? YouTubeVideoId { get; set; }
    public string? YouTubeUrl { get; set; }
    public List<string> Tags { get; set; } = new();
    public string UserId { get; set; } = "default";
    public AiGenerationConfig? AiConfig { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

public class AiGenerationConfig
{
    public string Model { get; set; } = "gemini-2.0-flash";
    public double Temperature { get; set; } = 0.7;
    public int MaxTokens { get; set; } = 2048;
    public bool UseVoiceOver { get; set; } = true;
    public bool AddSubtitles { get; set; } = true;
    public string SubtitleLanguage { get; set; } = "en";
    public string VideoType { get; set; } = "youtube_short";
}

public enum VideoStatus
{
    Draft,
    Configuring,
    GeneratingPreview,
    PreviewReady,
    GeneratingFinal,
    Ready,
    Uploading,
    Published,
    Failed
}
