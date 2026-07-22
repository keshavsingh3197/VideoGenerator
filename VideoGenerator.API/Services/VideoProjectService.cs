using VideoGenerator.API.Configuration;
using VideoGenerator.API.DTOs;
using VideoGenerator.API.Models;
using VideoGenerator.API.Repositories;

namespace VideoGenerator.API.Services;

public interface IVideoProjectService
{
    Task<List<VideoProjectResponse>> GetAllAsync(string userId);
    Task<VideoProjectResponse?> GetByIdAsync(string id);
    Task<VideoProjectResponse> CreateAsync(CreateVideoProjectRequest request, string userId);
    Task<VideoProjectResponse?> UpdateAsync(string id, UpdateVideoProjectRequest request);
    Task DeleteAsync(string id);
    Task<string> GeneratePreviewAsync(string projectId);
    Task<VideoProjectResponse?> StartGenerationAsync(string projectId);
}

public class VideoProjectService : IVideoProjectService
{
    private readonly IVideoProjectRepository _repository;
    private readonly IGeminiService _geminiService;
    private readonly INotificationService _notificationService;
    private readonly ILogger<VideoProjectService> _logger;

    public VideoProjectService(
        IVideoProjectRepository repository,
        IGeminiService geminiService,
        INotificationService notificationService,
        ILogger<VideoProjectService> logger)
    {
        _repository = repository;
        _geminiService = geminiService;
        _notificationService = notificationService;
        _logger = logger;
    }

    public async Task<List<VideoProjectResponse>> GetAllAsync(string userId)
    {
        var projects = await _repository.GetAllAsync(userId);
        return projects.Select(MapToResponse).ToList();
    }

    public async Task<VideoProjectResponse?> GetByIdAsync(string id)
    {
        var project = await _repository.GetByIdAsync(id);
        return project != null ? MapToResponse(project) : null;
    }

    public async Task<VideoProjectResponse> CreateAsync(CreateVideoProjectRequest request, string userId)
    {
        var project = new VideoProject
        {
            Title = request.Title,
            Description = request.Description,
            Prompt = request.Prompt,
            Style = request.Style,
            Duration = request.Duration,
            AspectRatio = request.AspectRatio,
            Resolution = request.Resolution,
            Language = request.Language,
            VoiceOver = request.VoiceOver,
            BackgroundMusic = request.BackgroundMusic,
            CharacterStyle = request.CharacterStyle,
            Tags = request.Tags ?? new List<string>(),
            UserId = userId,
            AiConfig = request.AiConfig ?? new AiGenerationConfig { VideoType = request.VideoType },
            Status = VideoStatus.Draft
        };

        var created = await _repository.CreateAsync(project);

        await _notificationService.SendAsync(new Notification
        {
            UserId = userId,
            Title = "Project Created",
            Message = $"Video project '{project.Title}' has been created successfully.",
            Type = NotificationType.Success,
            ProjectId = created.Id
        });

        return MapToResponse(created);
    }

    public async Task<VideoProjectResponse?> UpdateAsync(string id, UpdateVideoProjectRequest request)
    {
        var existing = await _repository.GetByIdAsync(id);
        if (existing == null) return null;

        if (request.Title != null) existing.Title = request.Title;
        if (request.Description != null) existing.Description = request.Description;
        if (request.Prompt != null) existing.Prompt = request.Prompt;
        if (request.Style != null) existing.Style = request.Style;
        if (request.Duration != null) existing.Duration = request.Duration;
        if (request.AspectRatio != null) existing.AspectRatio = request.AspectRatio;
        if (request.Resolution != null) existing.Resolution = request.Resolution;
        if (request.Language != null) existing.Language = request.Language;
        if (request.VoiceOver != null) existing.VoiceOver = request.VoiceOver;
        if (request.BackgroundMusic != null) existing.BackgroundMusic = request.BackgroundMusic;
        if (request.CharacterStyle != null) existing.CharacterStyle = request.CharacterStyle;
        if (request.Tags != null) existing.Tags = request.Tags;
        if (request.AiConfig != null) existing.AiConfig = request.AiConfig;

        await _repository.UpdateAsync(id, existing);
        return MapToResponse(existing);
    }

    public async Task DeleteAsync(string id)
    {
        await _repository.DeleteAsync(id);
    }

    public async Task<string> GeneratePreviewAsync(string projectId)
    {
        var project = await _repository.GetByIdAsync(projectId);
        if (project == null) throw new KeyNotFoundException($"Project {projectId} not found");

        await _repository.UpdateStatusAsync(projectId, VideoStatus.GeneratingPreview);

        try
        {
            var previewData = await _geminiService.GenerateVideoPreviewAsync(project);

            var update = new UpdateDefinition { PreviewData = previewData };
            project.Status = VideoStatus.PreviewReady;
            project.PreviewUrl = $"/api/videos/{projectId}/preview";
            await _repository.UpdateAsync(projectId, project);

            await _notificationService.SendAsync(new Notification
            {
                UserId = project.UserId,
                Title = "Preview Ready",
                Message = $"Preview for '{project.Title}' is ready! Review and approve to generate the final video.",
                Type = NotificationType.VideoReady,
                ProjectId = projectId
            });

            return previewData;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to generate preview for project {ProjectId}", projectId.Replace(Environment.NewLine, string.Empty));
            await _repository.UpdateStatusAsync(projectId, VideoStatus.Failed);
            throw;
        }
    }

    public async Task<VideoProjectResponse?> StartGenerationAsync(string projectId)
    {
        var project = await _repository.GetByIdAsync(projectId);
        if (project == null) return null;

        await _repository.UpdateStatusAsync(projectId, VideoStatus.GeneratingFinal);

        await _notificationService.SendAsync(new Notification
        {
            UserId = project.UserId,
            Title = "Video Generation Started",
            Message = $"Generating final video for '{project.Title}'...",
            Type = NotificationType.AiProcessing,
            ProjectId = projectId
        });

        // Simulate async video generation (in production, this would call a video AI API)
        _ = Task.Run(async () =>
        {
            await Task.Delay(TimeSpan.FromSeconds(5));
            project.Status = VideoStatus.Ready;
            project.VideoUrl = $"/api/videos/{projectId}/download";
            await _repository.UpdateAsync(projectId, project);

            await _notificationService.SendAsync(new Notification
            {
                UserId = project.UserId,
                Title = "Video Ready!",
                Message = $"Your video '{project.Title}' is ready to download or upload to YouTube.",
                Type = NotificationType.VideoReady,
                ProjectId = projectId,
                ActionUrl = $"/projects/{projectId}"
            });
        });

        project = await _repository.GetByIdAsync(projectId);
        return project != null ? MapToResponse(project) : null;
    }

    private static VideoProjectResponse MapToResponse(VideoProject p) => new(
        p.Id!,
        p.Title,
        p.Description,
        p.Prompt,
        p.Style,
        p.Duration,
        p.AspectRatio,
        p.Resolution,
        p.Language,
        p.VoiceOver,
        p.BackgroundMusic,
        p.CharacterStyle,
        p.Status.ToString(),
        p.PreviewUrl,
        p.VideoUrl,
        p.ThumbnailUrl,
        p.YouTubeVideoId,
        p.YouTubeUrl,
        p.Tags,
        p.AiConfig,
        p.CreatedAt,
        p.UpdatedAt
    );

    private record UpdateDefinition { public string? PreviewData { get; init; } }
}
