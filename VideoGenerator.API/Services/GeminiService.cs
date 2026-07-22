using System.Net.Http.Json;
using System.Text.Json;
using VideoGenerator.API.Configuration;
using VideoGenerator.API.DTOs;
using VideoGenerator.API.Models;

namespace VideoGenerator.API.Services;

public interface IGeminiService
{
    Task<GenerateTitlesResponse> GenerateTitlesAsync(GenerateTitlesRequest request);
    Task<GenerateScriptResponse> GenerateScriptAsync(GenerateScriptRequest request);
    Task<string> GenerateVideoPreviewAsync(VideoProject project);
    Task<AiChatResponse> ChatAsync(AiChatRequest request, VideoProject? projectContext);
    Task<List<string>> GenerateTagsAsync(string title, string description);
    Task<string> TransformCharacterStyleAsync(string videoUrl, string targetStyle, string description);
    Task<string> GenerateThumbnailAsync(VideoProject project);
}

public class GeminiService : IGeminiService
{
    private readonly HttpClient _httpClient;
    private readonly GeminiSettings _settings;
    private readonly ILogger<GeminiService> _logger;

    public GeminiService(IHttpClientFactory httpClientFactory, GeminiSettings settings, ILogger<GeminiService> logger)
    {
        _httpClient = httpClientFactory.CreateClient("Gemini");
        _settings = settings;
        _logger = logger;
    }

    public async Task<GenerateTitlesResponse> GenerateTitlesAsync(GenerateTitlesRequest request)
    {
        var prompt = $"Generate {request.Count} SEO-optimized {request.VideoType} video titles for the topic: \"{request.Topic}\"\n" +
                     $"Language: {request.Language}\n\n" +
                     "For each title, provide:\n" +
                     "1. The title text (compelling, click-worthy, under 70 characters for YouTube)\n" +
                     "2. A brief description of why this title works\n" +
                     "3. An SEO score from 0-100\n\n" +
                     "Return as JSON array with format:\n" +
                     "[{\"title\": \"...\", \"description\": \"...\", \"seoScore\": 85}]\n\n" +
                     "Focus on:\n- High CTR potential\n- Including relevant keywords\n- Creating curiosity or urgency";

        var response = await CallGeminiAsync(prompt, _settings.DefaultModel);

        try
        {
            var jsonStart = response.IndexOf('[');
            var jsonEnd = response.LastIndexOf(']') + 1;
            if (jsonStart >= 0 && jsonEnd > jsonStart)
            {
                var jsonStr = response[jsonStart..jsonEnd];
                var titles = JsonSerializer.Deserialize<List<TitleSuggestionRaw>>(jsonStr, JsonOptions) ?? new();
                return new GenerateTitlesResponse(
                    titles.Select(t => new TitleSuggestion(t.Title, t.Description, t.SeoScore)).ToList()
                );
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to parse Gemini titles response, using fallback");
        }

        return new GenerateTitlesResponse(new List<TitleSuggestion>
        {
            new($"Top 10 Things About {request.Topic}", "Listicle format with high engagement", 78),
            new($"{request.Topic} - Complete Guide 2025", "Comprehensive guide format", 82),
            new($"How to Master {request.Topic} in 60 Seconds", "Quick tutorial format", 88)
        });
    }

    public async Task<GenerateScriptResponse> GenerateScriptAsync(GenerateScriptRequest request)
    {
        var prompt = $"Create a complete video script for a {request.VideoType} based on this prompt:\n" +
                     $"\"{request.Prompt}\"\n\n" +
                     $"Style: {request.Style}\nDuration: {request.Duration}\nLanguage: {request.Language}\n\n" +
                     "Return as JSON with this format:\n" +
                     "{\"script\": \"Full script with [SCENE], [VOICEOVER], [ACTION] markers...\", " +
                     "\"suggestedTitles\": [\"Title 1\", \"Title 2\"], " +
                     "\"suggestedTags\": [\"tag1\", \"tag2\"], " +
                     "\"estimatedDuration\": \"45-60 seconds\"}\n\n" +
                     "Include hook in first 3 seconds and call to action at end.";

        var response = await CallGeminiAsync(prompt, _settings.DefaultModel);

        try
        {
            var jsonStart = response.IndexOf('{');
            var jsonEnd = response.LastIndexOf('}') + 1;
            if (jsonStart >= 0 && jsonEnd > jsonStart)
            {
                var jsonStr = response[jsonStart..jsonEnd];
                var raw = JsonSerializer.Deserialize<GenerateScriptRaw>(jsonStr, JsonOptions);
                if (raw != null)
                {
                    return new GenerateScriptResponse(
                        raw.Script,
                        raw.SuggestedTitles,
                        raw.SuggestedTags,
                        raw.EstimatedDuration
                    );
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to parse script response");
        }

        return new GenerateScriptResponse(
            response,
            new List<string> { $"Video about {request.Prompt}" },
            new List<string> { "viral", "trending", "2025" },
            request.Duration
        );
    }

    public async Task<string> GenerateVideoPreviewAsync(VideoProject project)
    {
        var prompt = $"Describe a detailed storyboard/preview for a video:\n" +
                     $"Title: {project.Title}\nPrompt: {project.Prompt}\nStyle: {project.Style}\n" +
                     $"Duration: {project.Duration}\nCharacter Style: {project.CharacterStyle}\n\n" +
                     "Provide a scene-by-scene breakdown as JSON:\n" +
                     "{\"scenes\": [{\"timestamp\": \"0:00-0:05\", \"visual\": \"...\", \"audio\": \"...\", \"text\": \"...\"}], " +
                     "\"thumbnailDescription\": \"...\", \"moodBoard\": \"...\"}";

        return await CallGeminiAsync(prompt, _settings.DefaultModel);
    }

    public async Task<AiChatResponse> ChatAsync(AiChatRequest request, VideoProject? projectContext)
    {
        var contextInfo = projectContext != null
            ? $"Current project: Title={projectContext.Title}, Style={projectContext.Style}, Status={projectContext.Status}"
            : "No project context.";

        var prompt = $"You are an AI assistant for a video creation platform.\n{contextInfo}\n" +
                     $"Context: {request.Context}\nUser message: {request.Message}\n\n" +
                     "Respond helpfully. Return as JSON:\n" +
                     "{\"response\": \"...\", \"suggestions\": [\"...\"], \"updatedConfig\": null}";

        var response = await CallGeminiAsync(prompt, _settings.DefaultModel);

        try
        {
            var jsonStart = response.IndexOf('{');
            var jsonEnd = response.LastIndexOf('}') + 1;
            if (jsonStart >= 0 && jsonEnd > jsonStart)
            {
                var jsonStr = response[jsonStart..jsonEnd];
                var raw = JsonSerializer.Deserialize<AiChatRaw>(jsonStr, JsonOptions);
                if (raw != null)
                {
                    return new AiChatResponse(raw.Response, raw.Suggestions, raw.UpdatedConfig);
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to parse chat response");
        }

        return new AiChatResponse(response, null, null);
    }

    public async Task<List<string>> GenerateTagsAsync(string title, string description)
    {
        var prompt = $"Generate 15 relevant YouTube tags for a video titled: \"{title}\"\n" +
                     $"Description: {description}\n\n" +
                     "Return only a JSON array of strings: [\"tag1\", \"tag2\", ...]\n" +
                     "Tags should be relevant, mix broad and specific, include trending keywords.";

        var response = await CallGeminiAsync(prompt, _settings.DefaultModel);

        try
        {
            var jsonStart = response.IndexOf('[');
            var jsonEnd = response.LastIndexOf(']') + 1;
            if (jsonStart >= 0 && jsonEnd > jsonStart)
            {
                return JsonSerializer.Deserialize<List<string>>(response[jsonStart..jsonEnd], JsonOptions) ?? new();
            }
        }
        catch { }

        return new List<string> { "viral", "trending", "youtube", "shorts", title.ToLower() };
    }

    public async Task<string> TransformCharacterStyleAsync(string videoUrl, string targetStyle, string description)
    {
        var prompt = $"Describe how to transform characters in a video to {targetStyle} style.\n" +
                     $"Character description: {description}\nSource video: {videoUrl}\n\n" +
                     "Provide detailed instructions for AI-based character transformation including:\n" +
                     "- Character appearance changes\n- Style-specific features\n- Color palette\n- Animation style";

        return await CallGeminiAsync(prompt, _settings.DefaultModel);
    }

    public async Task<string> GenerateThumbnailAsync(VideoProject project)
    {
        var prompt = $"Create a detailed prompt for generating a YouTube thumbnail image for:\n" +
                     $"Title: {project.Title}\nDescription: {project.Description}\nStyle: {project.Style}\n\n" +
                     "The thumbnail should be eye-catching, 1280x720 pixels, high contrast.\n" +
                     "Provide a detailed image generation prompt.";

        return await CallGeminiAsync(prompt, _settings.DefaultModel);
    }

    private async Task<string> CallGeminiAsync(string prompt, string model)
    {
        if (string.IsNullOrEmpty(_settings.ApiKey))
        {
            _logger.LogWarning("Gemini API key not configured, returning mock response");
            return GetMockResponse(prompt);
        }

        try
        {
            var requestBody = new
            {
                contents = new[]
                {
                    new { parts = new[] { new { text = prompt } } }
                },
                generationConfig = new { temperature = 0.7, maxOutputTokens = 2048 }
            };

            var url = $"{_settings.BaseUrl}/models/{model}:generateContent?key={_settings.ApiKey}";
            var response = await _httpClient.PostAsJsonAsync(url, requestBody);

            if (!response.IsSuccessStatusCode)
            {
                var error = await response.Content.ReadAsStringAsync();
                _logger.LogError("Gemini API error {Status}: {Error}", response.StatusCode, error);
                return GetMockResponse(prompt);
            }

            var result = await response.Content.ReadFromJsonAsync<GeminiResponse>();
            return result?.Candidates?.FirstOrDefault()?.Content?.Parts?.FirstOrDefault()?.Text ?? string.Empty;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calling Gemini API");
            return GetMockResponse(prompt);
        }
    }

    private static string GetMockResponse(string prompt)
    {
        if (prompt.Contains("titles") || prompt.Contains("title"))
        {
            return "[{\"title\":\"Amazing Video Title #1\",\"description\":\"High engagement format\",\"seoScore\":85}," +
                   "{\"title\":\"Top 10 Viral Moments\",\"description\":\"Listicle format\",\"seoScore\":82}," +
                   "{\"title\":\"You Won't Believe This!\",\"description\":\"Curiosity gap format\",\"seoScore\":90}]";
        }
        if (prompt.Contains("script"))
        {
            return "{\"script\":\"[HOOK] Opening scene\\n[VOICEOVER] Welcome...\\n[CTA] Like and subscribe!\"," +
                   "\"suggestedTitles\":[\"Amazing Video 2025\"],\"suggestedTags\":[\"viral\",\"trending\"]," +
                   "\"estimatedDuration\":\"45-60 seconds\"}";
        }
        if (prompt.Contains("tags"))
        {
            return "[\"viral\",\"trending\",\"youtube\",\"shorts\",\"amazing\",\"2025\",\"mustwatch\"]";
        }
        return "{\"response\":\"I can help you create an amazing video! Here are some suggestions.\",\"suggestions\":[\"Try a dramatic opening\",\"Add background music\"],\"updatedConfig\":null}";
    }

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        PropertyNameCaseInsensitive = true
    };

    private record TitleSuggestionRaw(string Title, string Description, double SeoScore);
    private record GenerateScriptRaw(string Script, List<string> SuggestedTitles, List<string> SuggestedTags, string EstimatedDuration);
    private record AiChatRaw(string Response, List<string>? Suggestions, Dictionary<string, string>? UpdatedConfig);
    private record GeminiResponse(List<GeminiCandidate>? Candidates);
    private record GeminiCandidate(GeminiContent? Content);
    private record GeminiContent(List<GeminiPart>? Parts);
    private record GeminiPart(string? Text);
}
