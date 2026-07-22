namespace VideoGenerator.API.Configuration;

public class MongoDbSettings
{
    public string ConnectionString { get; set; } = "mongodb://localhost:27017";
    public string DatabaseName { get; set; } = "VideoGeneratorDb";
    public string VideoProjectsCollection { get; set; } = "VideoProjects";
    public string NotificationsCollection { get; set; } = "Notifications";
    public string AiSuggestionsCollection { get; set; } = "AiSuggestions";
}

public class GeminiSettings
{
    public string ApiKey { get; set; } = string.Empty;
    public string BaseUrl { get; set; } = "https://generativelanguage.googleapis.com/v1beta";
    public string DefaultModel { get; set; } = "gemini-2.0-flash";
    public string VideoModel { get; set; } = "gemini-2.0-flash-preview-image-generation";
}

public class YouTubeSettings
{
    public string ClientId { get; set; } = string.Empty;
    public string ClientSecret { get; set; } = string.Empty;
    public string ApiKey { get; set; } = string.Empty;
    public string RedirectUri { get; set; } = "http://localhost:4200/youtube-callback";
}
