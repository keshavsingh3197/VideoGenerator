# VideoGen AI — AI-Powered Video Generator

A full-stack application for creating viral YouTube videos using **Google Gemini AI**, built with **.NET 10** backend and **Angular** frontend.

## 🚀 Features

- **AI Script Generator** — Generate engaging video scripts using Google Gemini AI
- **Viral Title Creator** — SEO-optimized titles with engagement scoring
- **Character Transformation** — Convert characters to anime, cartoon, pixel art, and more styles
- **YouTube Upload** — Direct upload with OAuth2 integration
- **Real-time Notifications** — SignalR-powered in-app notifications for generation progress
- **Video Preview** — Storyboard preview before final generation
- **AI Chat Assistant** — Contextual Gemini AI assistant for each video project
- **Tag Generator** — AI-powered tag generation for maximum YouTube reach

## 🏗️ Architecture

```
VideoGenerator/
├── VideoGenerator.API/          # .NET 10 Web API Backend
│   ├── Controllers/             # REST API endpoints
│   ├── Services/                # Business logic (Gemini, YouTube, Notifications)
│   ├── Repositories/            # MongoDB data access
│   ├── Models/                  # Domain models
│   ├── DTOs/                    # Data transfer objects
│   ├── Hubs/                    # SignalR notification hub
│   └── Configuration/           # App settings models
└── video-generator-ui/          # Angular Frontend
    └── src/app/
        ├── pages/               # Dashboard, Projects, Create, AI Tools
        ├── components/          # Shared components (Header, Notifications)
        ├── services/            # HTTP services
        └── models/              # TypeScript interfaces
```

## ⚙️ Prerequisites

- [.NET 10 SDK](https://dotnet.microsoft.com/download)
- [Node.js 18+](https://nodejs.org/)
- [Angular CLI 17+](https://angular.io/cli) — `npm install -g @angular/cli`
- [MongoDB](https://www.mongodb.com/try/download/community) (local or Atlas)
- [Google Gemini API Key](https://aistudio.google.com/app/apikey)
- [YouTube Data API credentials](https://console.cloud.google.com/) (optional, for upload)

## 🔧 Setup & Configuration

### 1. Backend Configuration

Create `VideoGenerator.API/appsettings.Local.json` (not committed):
```json
{
  "MongoDb": {
    "ConnectionString": "mongodb://localhost:27017",
    "DatabaseName": "VideoGeneratorDb"
  },
  "Gemini": {
    "ApiKey": "YOUR_GEMINI_API_KEY"
  },
  "YouTube": {
    "ClientId": "YOUR_YOUTUBE_CLIENT_ID",
    "ClientSecret": "YOUR_YOUTUBE_CLIENT_SECRET"
  }
}
```

Or use environment variables:
```bash
export Gemini__ApiKey="YOUR_KEY"
export MongoDb__ConnectionString="mongodb://localhost:27017"
```

### 2. Run the Backend

```bash
cd VideoGenerator.API
dotnet run
# API available at http://localhost:5000
# OpenAPI docs at http://localhost:5000/openapi/v1.json
```

### 3. Run the Frontend

```bash
cd video-generator-ui
npm install
ng serve
# App available at http://localhost:4200
```

## 📖 API Endpoints

### Videos
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/videos` | List all projects |
| POST | `/api/videos` | Create new project |
| PUT | `/api/videos/{id}` | Update project |
| DELETE | `/api/videos/{id}` | Delete project |
| POST | `/api/videos/{id}/preview` | Generate AI storyboard preview |
| POST | `/api/videos/{id}/generate` | Start final video generation |
| POST | `/api/videos/{id}/upload-youtube` | Upload to YouTube |

### AI Tools
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ai/generate-titles` | Generate SEO titles |
| POST | `/api/ai/generate-script` | Generate video script |
| POST | `/api/ai/generate-tags` | Generate YouTube tags |
| POST | `/api/ai/chat` | AI assistant chat |
| POST | `/api/ai/transform-character` | Character style transform plan |
| POST | `/api/ai/generate-thumbnail` | Thumbnail generation prompt |

### Notifications
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/notifications` | Get user notifications |
| PUT | `/api/notifications/{id}/read` | Mark as read |
| PUT | `/api/notifications/mark-all-read` | Mark all as read |

### SignalR Hub
- Connect: `ws://localhost:5000/hubs/notifications`
- Join group: `JoinUserGroup(userId)`
- Event: `ReceiveNotification`

## 🎨 Video Styles Supported

Cinematic, Anime, Cartoon, Realistic, Documentary, Vlog, Educational, Horror, Comedy, Sci-Fi

## 🎭 Character Transformation Styles

Anime, Cartoon, Pixel Art, Claymation, Watercolor, Oil Painting, Comic Book, Cyberpunk

## 📱 Video Formats

- **YouTube Short**: 9:16, 60 seconds
- **YouTube Long-form**: 16:9, 3–15 minutes
- **Instagram Reel**: 9:16, 15–60 seconds
- **TikTok**: 9:16, 15–60 seconds

## 🔒 Security Notes

- Never commit API keys — use environment variables or user secrets
- YouTube OAuth tokens are stored per-session
- MongoDB connection strings should use authentication in production

## 🛠️ Development

```bash
# Backend hot reload
cd VideoGenerator.API
dotnet watch run

# Frontend dev server
cd video-generator-ui
ng serve --open
```
