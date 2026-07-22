using MongoDB.Driver;
using VideoGenerator.API.Configuration;
using VideoGenerator.API.Hubs;
using VideoGenerator.API.Repositories;
using VideoGenerator.API.Services;

var builder = WebApplication.CreateBuilder(args);

// Settings
var mongoSettings = builder.Configuration.GetSection("MongoDb").Get<MongoDbSettings>() ?? new MongoDbSettings();
var geminiSettings = builder.Configuration.GetSection("Gemini").Get<GeminiSettings>() ?? new GeminiSettings();
var youTubeSettings = builder.Configuration.GetSection("YouTube").Get<YouTubeSettings>() ?? new YouTubeSettings();

builder.Services.AddSingleton(mongoSettings);
builder.Services.AddSingleton(geminiSettings);
builder.Services.AddSingleton(youTubeSettings);

// MongoDB
builder.Services.AddSingleton<IMongoClient>(_ => new MongoClient(mongoSettings.ConnectionString));
builder.Services.AddSingleton(sp =>
    sp.GetRequiredService<IMongoClient>().GetDatabase(mongoSettings.DatabaseName));

// Repositories
builder.Services.AddScoped<IVideoProjectRepository, VideoProjectRepository>();
builder.Services.AddScoped<INotificationRepository, NotificationRepository>();

// HTTP Client for Gemini
builder.Services.AddHttpClient("Gemini");

// Services
builder.Services.AddScoped<IGeminiService, GeminiService>();
builder.Services.AddScoped<IVideoProjectService, VideoProjectService>();
builder.Services.AddScoped<INotificationService, NotificationService>();
builder.Services.AddScoped<IYouTubeService, YouTubeService>();

// SignalR
builder.Services.AddSignalR();

// Controllers
builder.Services.AddControllers();

// OpenAPI / Swagger
builder.Services.AddOpenApi();
builder.Services.AddEndpointsApiExplorer();

// CORS for Angular frontend
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngular", policy =>
    {
        policy.WithOrigins("http://localhost:4200", "https://localhost:4200")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseCors("AllowAngular");
app.UseHttpsRedirection();
app.UseAuthorization();

app.MapControllers();
app.MapHub<NotificationHub>("/hubs/notifications");

app.Run();
