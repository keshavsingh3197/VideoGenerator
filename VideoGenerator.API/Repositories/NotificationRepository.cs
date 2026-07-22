using MongoDB.Driver;
using VideoGenerator.API.Configuration;
using VideoGenerator.API.Models;

namespace VideoGenerator.API.Repositories;

public interface INotificationRepository
{
    Task<List<Notification>> GetByUserIdAsync(string userId, int limit = 50);
    Task<long> GetUnreadCountAsync(string userId);
    Task<Notification> CreateAsync(Notification notification);
    Task MarkAsReadAsync(string id);
    Task MarkAllAsReadAsync(string userId);
    Task DeleteAsync(string id);
}

public class NotificationRepository : INotificationRepository
{
    private readonly IMongoCollection<Notification> _collection;

    public NotificationRepository(IMongoDatabase database, MongoDbSettings settings)
    {
        _collection = database.GetCollection<Notification>(settings.NotificationsCollection);
    }

    public async Task<List<Notification>> GetByUserIdAsync(string userId, int limit = 50)
    {
        var filter = Builders<Notification>.Filter.Eq(n => n.UserId, userId);
        return await _collection.Find(filter)
            .SortByDescending(n => n.CreatedAt)
            .Limit(limit)
            .ToListAsync();
    }

    public async Task<long> GetUnreadCountAsync(string userId)
    {
        var filter = Builders<Notification>.Filter.And(
            Builders<Notification>.Filter.Eq(n => n.UserId, userId),
            Builders<Notification>.Filter.Eq(n => n.IsRead, false)
        );
        return await _collection.CountDocumentsAsync(filter);
    }

    public async Task<Notification> CreateAsync(Notification notification)
    {
        notification.CreatedAt = DateTime.UtcNow;
        await _collection.InsertOneAsync(notification);
        return notification;
    }

    public async Task MarkAsReadAsync(string id)
    {
        var filter = Builders<Notification>.Filter.Eq(n => n.Id, id);
        var update = Builders<Notification>.Update.Set(n => n.IsRead, true);
        await _collection.UpdateOneAsync(filter, update);
    }

    public async Task MarkAllAsReadAsync(string userId)
    {
        var filter = Builders<Notification>.Filter.And(
            Builders<Notification>.Filter.Eq(n => n.UserId, userId),
            Builders<Notification>.Filter.Eq(n => n.IsRead, false)
        );
        var update = Builders<Notification>.Update.Set(n => n.IsRead, true);
        await _collection.UpdateManyAsync(filter, update);
    }

    public async Task DeleteAsync(string id)
    {
        var filter = Builders<Notification>.Filter.Eq(n => n.Id, id);
        await _collection.DeleteOneAsync(filter);
    }
}
