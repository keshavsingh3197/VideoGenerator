using MongoDB.Driver;
using VideoGenerator.API.Configuration;
using VideoGenerator.API.Models;

namespace VideoGenerator.API.Repositories;

public interface IVideoProjectRepository
{
    Task<List<VideoProject>> GetAllAsync(string userId);
    Task<VideoProject?> GetByIdAsync(string id);
    Task<VideoProject> CreateAsync(VideoProject project);
    Task UpdateAsync(string id, VideoProject project);
    Task DeleteAsync(string id);
    Task UpdateStatusAsync(string id, VideoStatus status);
}

public class VideoProjectRepository : IVideoProjectRepository
{
    private readonly IMongoCollection<VideoProject> _collection;

    public VideoProjectRepository(IMongoDatabase database, MongoDbSettings settings)
    {
        _collection = database.GetCollection<VideoProject>(settings.VideoProjectsCollection);
    }

    public async Task<List<VideoProject>> GetAllAsync(string userId)
    {
        var filter = Builders<VideoProject>.Filter.Eq(p => p.UserId, userId);
        return await _collection.Find(filter).SortByDescending(p => p.CreatedAt).ToListAsync();
    }

    public async Task<VideoProject?> GetByIdAsync(string id)
    {
        var filter = Builders<VideoProject>.Filter.Eq(p => p.Id, id);
        return await _collection.Find(filter).FirstOrDefaultAsync();
    }

    public async Task<VideoProject> CreateAsync(VideoProject project)
    {
        project.CreatedAt = DateTime.UtcNow;
        project.UpdatedAt = DateTime.UtcNow;
        await _collection.InsertOneAsync(project);
        return project;
    }

    public async Task UpdateAsync(string id, VideoProject project)
    {
        project.UpdatedAt = DateTime.UtcNow;
        var filter = Builders<VideoProject>.Filter.Eq(p => p.Id, id);
        await _collection.ReplaceOneAsync(filter, project);
    }

    public async Task DeleteAsync(string id)
    {
        var filter = Builders<VideoProject>.Filter.Eq(p => p.Id, id);
        await _collection.DeleteOneAsync(filter);
    }

    public async Task UpdateStatusAsync(string id, VideoStatus status)
    {
        var filter = Builders<VideoProject>.Filter.Eq(p => p.Id, id);
        var update = Builders<VideoProject>.Update
            .Set(p => p.Status, status)
            .Set(p => p.UpdatedAt, DateTime.UtcNow);
        await _collection.UpdateOneAsync(filter, update);
    }
}
