using VideoGenerator.API.Models;

namespace VideoGenerator.API.DTOs;

public record CreateVideoProjectRequest(
    string Title,
    string Description,
    string Prompt,
    string Style = "cinematic",
    string Duration = "60s",
    string AspectRatio = "16:9",
    string Resolution = "1080p",
    string Language = "en",
    string VoiceOver = "default",
    string BackgroundMusic = "none",
    string CharacterStyle = "none",
    string VideoType = "youtube_short",
    List<string>? Tags = null,
    AiGenerationConfig? AiConfig = null
);

public record UpdateVideoProjectRequest(
    string? Title,
    string? Description,
    string? Prompt,
    string? Style,
    string? Duration,
    string? AspectRatio,
    string? Resolution,
    string? Language,
    string? VoiceOver,
    string? BackgroundMusic,
    string? CharacterStyle,
    List<string>? Tags,
    AiGenerationConfig? AiConfig
);

public record VideoProjectResponse(
    string Id,
    string Title,
    string Description,
    string Prompt,
    string Style,
    string Duration,
    string AspectRatio,
    string Resolution,
    string Language,
    string VoiceOver,
    string BackgroundMusic,
    string CharacterStyle,
    string Status,
    string? PreviewUrl,
    string? VideoUrl,
    string? ThumbnailUrl,
    string? YouTubeVideoId,
    string? YouTubeUrl,
    List<string> Tags,
    AiGenerationConfig? AiConfig,
    DateTime CreatedAt,
    DateTime UpdatedAt
);

public record GenerateTitlesRequest(
    string Topic,
    string VideoType = "youtube",
    string Language = "en",
    int Count = 5
);

public record GenerateTitlesResponse(
    List<TitleSuggestion> Titles
);

public record TitleSuggestion(
    string Title,
    string Description,
    double SeoScore
);

public record GenerateScriptRequest(
    string Prompt,
    string Style,
    string Duration,
    string Language = "en",
    string VideoType = "youtube_short"
);

public record GenerateScriptResponse(
    string Script,
    List<string> SuggestedTitles,
    List<string> SuggestedTags,
    string EstimatedDuration
);

public record GeneratePreviewRequest(
    string ProjectId
);

public record CharacterTransformRequest(
    string ProjectId,
    string SourceVideoUrl,
    string TargetCharacterStyle,
    string CharacterDescription
);

public record YouTubeUploadRequest(
    string ProjectId,
    string Title,
    string Description,
    List<string> Tags,
    string PrivacyStatus = "public",
    string CategoryId = "22"
);

public record YouTubeUploadResponse(
    string VideoId,
    string VideoUrl,
    string Status
);

public record AiChatRequest(
    string ProjectId,
    string Message,
    string Context = "video_creation"
);

public record AiChatResponse(
    string Response,
    List<string>? Suggestions,
    Dictionary<string, string>? UpdatedConfig
);
