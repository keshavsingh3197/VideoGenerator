using Microsoft.AspNetCore.Mvc;
using VideoGenerator.API.DTOs;
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
            _logger.LogError(ex, "Error generating preview for {Id}", id);
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

    [HttpPost("youtube/exchange-code")]
    public async Task<IActionResult> ExchangeYouTubeCode([FromBody] string code)
    {
        var success = await _youTubeService.ExchangeCodeAsync(code);
        return Ok(new { success });
    }
}
