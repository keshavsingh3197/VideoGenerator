using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace VideoGenerator.API.Models;

public class AiSuggestion
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? Id { get; set; }

    public string ProjectId { get; set; } = string.Empty;
    public string UserId { get; set; } = "default";
    public SuggestionType Type { get; set; }
    public string Input { get; set; } = string.Empty;
    public List<string> Suggestions { get; set; } = new();
    public string? SelectedSuggestion { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public enum SuggestionType
{
    Title,
    Description,
    Tags,
    Script,
    CharacterTransformation
}
