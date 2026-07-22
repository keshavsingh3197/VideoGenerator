using Microsoft.AspNetCore.Mvc;
using VideoGenerator.API.DTOs;
using VideoGenerator.API.Services;

namespace VideoGenerator.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AiController : ControllerBase
{
    private readonly IGeminiService _geminiService;
    private readonly IVideoProjectService _videoService;
    private readonly ILogger<AiController> _logger;

    public AiController(IGeminiService geminiService, IVideoProjectService videoService, ILogger<AiController> logger)
    {
        _geminiService = geminiService;
        _videoService = videoService;
        _logger = logger;
    }

    [HttpPost("generate-titles")]
    public async Task<IActionResult> GenerateTitles([FromBody] GenerateTitlesRequest request)
    {
        var result = await _geminiService.GenerateTitlesAsync(request);
        return Ok(result);
    }

    [HttpPost("generate-script")]
    public async Task<IActionResult> GenerateScript([FromBody] GenerateScriptRequest request)
    {
        var result = await _geminiService.GenerateScriptAsync(request);
        return Ok(result);
    }

    [HttpPost("generate-tags")]
    public async Task<IActionResult> GenerateTags([FromBody] GenerateTagsRequest request)
    {
        var tags = await _geminiService.GenerateTagsAsync(request.Title, request.Description);
        return Ok(new { tags });
    }

    [HttpPost("chat")]
    public async Task<IActionResult> Chat([FromBody] AiChatRequest request)
    {
        var projectContext = !string.IsNullOrEmpty(request.ProjectId)
            ? await _videoService.GetByIdAsync(request.ProjectId)
            : null;

        // Convert VideoProjectResponse to VideoProject for context (simplified)
        var result = await _geminiService.ChatAsync(request, null);
        return Ok(result);
    }

    [HttpPost("transform-character")]
    public async Task<IActionResult> TransformCharacter([FromBody] CharacterTransformRequest request)
    {
        var result = await _geminiService.TransformCharacterStyleAsync(
            request.SourceVideoUrl,
            request.TargetCharacterStyle,
            request.CharacterDescription
        );
        return Ok(new { transformationPlan = result, projectId = request.ProjectId });
    }

    [HttpPost("generate-thumbnail")]
    public async Task<IActionResult> GenerateThumbnail([FromBody] GenerateThumbnailRequest request)
    {
        var project = await _videoService.GetByIdAsync(request.ProjectId);
        if (project == null) return NotFound();

        // Map response back to VideoProject model for Gemini service
        var videoProject = new Models.VideoProject
        {
            Id = project.Id,
            Title = project.Title,
            Description = project.Description,
            Style = project.Style
        };

        var thumbnailPrompt = await _geminiService.GenerateThumbnailAsync(videoProject);
        return Ok(new { thumbnailPrompt, projectId = request.ProjectId });
    }
}

public record GenerateTagsRequest(string Title, string Description);
public record GenerateThumbnailRequest(string ProjectId);
