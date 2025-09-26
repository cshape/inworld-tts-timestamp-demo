# Inworld TTS Timestamps Demo App

A karaoke-style text-to-speech application that demonstrates real-time word-level timestamps using Inworld AI's TTS and LLM APIs. Users can select topics, generate text content, and play it back with synchronized word highlighting.

## Features

- 🎤 Text-to-speech with multiple voice options
- 📝 AI-generated content on various topics (sports, travel, music, food, mysteries, Canada, space, folklore)
- ⏱️ Real-time word-level timestamps for karaoke-style playback
- 🎵 Synchronized text highlighting during audio playback
- 🌐 Clean web interface with modern design

## Prerequisites

- Node.js (v14 or higher)
- Inworld AI account with API credentials

## Setup Instructions

1. **Clone the repository:**
   ```bash
   git clone <your-repo-url>
   cd timestamps
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   - Copy `.env.example` to `.env`:
     ```bash
     cp .env.example .env
     ```
   - Edit `.env` and add your Inworld AI credentials:
     - Get your API credentials from [Inworld AI Platform](https://www.platform.inworld.ai/)
     - Fill in `INWORLD_API_KEY`, `INWORLD_JWT_KEY`, and `INWORLD_JWT_SECRET`

4. **Start the application:**
   ```bash
   npm start
   ```

5. **Open your browser:**
   Navigate to `http://localhost:3000`

## Usage

1. Select a topic from the dropdown menu
2. Click "Generate Text" to create AI-generated content
3. Choose a voice from the available options
4. Click "Generate Speech" to create audio with timestamps
5. Use the playback controls to listen with synchronized highlighting

## API Endpoints

- `GET /api/voices` - Fetch available TTS voices
- `POST /api/generate-text` - Generate text content for selected topics
- `POST /api/generate-speech` - Convert text to speech with word-level timestamps

## Technologies Used

- **Backend:** Node.js, Express.js
- **Frontend:** Vanilla JavaScript, HTML5, CSS3
- **APIs:** Inworld AI TTS and LLM services
- **Audio:** OGG Opus format for high-quality playback

## License

MIT
