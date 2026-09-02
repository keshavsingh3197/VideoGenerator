using Microsoft.AspNetCore.Mvc;
using System.IO.Compression;
using System.Text.Json;
using VideoGenerator.API.DTOs;
using VideoGenerator.API.Extensions;
using VideoGenerator.API.Services;

namespace VideoGenerator.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class VideosController : ControllerBase
{
    private readonly IVideoProjectService _videoService;
    private readonly IGeminiService _geminiService;
    private readonly IYouTubeService _youTubeService;
    private readonly ILogger<VideosController> _logger;

    public VideosController(
        IVideoProjectService videoService,
        IGeminiService geminiService,
        IYouTubeService youTubeService,
        ILogger<VideosController> logger)
    {
        _videoService = videoService;
        _geminiService = geminiService;
        _youTubeService = youTubeService;
        _logger = logger;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string userId = "default")
    {
        var projects = await _videoService.GetAllAsync(userId);
        return Ok(projects);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(string id)
    {
        var project = await _videoService.GetByIdAsync(id);
        if (project == null) return NotFound();
        return Ok(project);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateVideoProjectRequest request, [FromQuery] string userId = "default")
    {
        var project = await _videoService.CreateAsync(request, userId);
        return CreatedAtAction(nameof(GetById), new { id = project.Id }, project);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(string id, [FromBody] UpdateVideoProjectRequest request)
    {
        var project = await _videoService.UpdateAsync(id, request);
        if (project == null) return NotFound();
        return Ok(project);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        await _videoService.DeleteAsync(id);
        return NoContent();
    }

    [HttpPost("{id}/preview")]
    public async Task<IActionResult> GeneratePreview(string id)
    {
        try
        {
            var preview = await _videoService.GeneratePreviewAsync(id);
            return Ok(new { preview, projectId = id });
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating preview for {Id}", LogSanitizer.Sanitize(id));
            return StatusCode(500, new { error = "Failed to generate preview" });
        }
    }

    [HttpPost("{id}/generate")]
    public async Task<IActionResult> StartGeneration(string id)
    {
        var project = await _videoService.StartGenerationAsync(id);
        if (project == null) return NotFound();
        return Ok(project);
    }

    [HttpPost("{id}/upload-youtube")]
    public async Task<IActionResult> UploadToYouTube(string id, [FromBody] YouTubeUploadRequest request)
    {
        var project = await _videoService.GetByIdAsync(id);
        if (project == null) return NotFound();

        if (project.VideoUrl == null)
            return BadRequest(new { error = "Video must be generated before uploading" });

        var result = await _youTubeService.UploadVideoAsync(request, project.VideoUrl);
        return Ok(result);
    }

    [HttpGet("youtube/auth-url")]
    public async Task<IActionResult> GetYouTubeAuthUrl()
    {
        var url = await _youTubeService.GetAuthUrlAsync();
        return Ok(new { authUrl = url });
    }

    [HttpGet("{id}/download")]
    public async Task<IActionResult> Download(string id)
    {
        var project = await _videoService.GetByIdAsync(id);
        if (project == null) return NotFound();

        using var memoryStream = new MemoryStream();
        using (var archive = new ZipArchive(memoryStream, ZipArchiveMode.Create, leaveOpen: true))
        {
            var summaryEntry = archive.CreateEntry("project-summary.json", CompressionLevel.Fastest);
            await using var summaryStream = summaryEntry.Open();
            await using var writer = new StreamWriter(summaryStream);

            var summary = new
            {
                project.Id,
                project.Title,
                project.Description,
                project.Prompt,
                project.Style,
                project.Duration,
                project.AspectRatio,
                project.Resolution,
                project.Language,
                project.CharacterStyle,
                project.SourceContent,
                project.DistributionTargets,
                project.Tags,
                project.Status,
                project.PreviewUrl,
                project.VideoUrl,
                project.YouTubeUrl,
                project.CreatedAt,
                project.UpdatedAt
            };

            await writer.WriteAsync(JsonSerializer.Serialize(summary, new JsonSerializerOptions { WriteIndented = true }));
        }

        memoryStream.Position = 0;
        var fileName = $"{SanitizeFileName(project.Title)}-package.zip";
        return File(memoryStream.ToArray(), "application/zip", fileName);
    }

    [HttpPost("youtube/exchange-code")]
    public async Task<IActionResult> ExchangeYouTubeCode([FromBody] string code)
    {
        var success = await _youTubeService.ExchangeCodeAsync(code);
        return Ok(new { success });
    }

    private static string SanitizeFileName(string value)
    {
        foreach (var invalidChar in Path.GetInvalidFileNameChars())
        {
            value = value.Replace(invalidChar, '-');
        }

        return string.IsNullOrWhiteSpace(value) ? "video-project" : value.Trim();
    }
}
