# Inworld TTS Timestamps Demo App

Implementation of word highlighting as text is read by an Inworld voice.


## Prerequisites

- Node.js (v14 or higher)
- Inworld AI account with API credentials

## Setup Instructions

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   - Copy `.env.example` to `.env`:
     ```bash
     cp .env.example .env
     ```
   - Edit `.env` and add your Inworld AI credentials:
     - Get your API credentials from [Inworld AI Platform](https://www.platform.inworld.ai/)
     - Fill in `INWORLD_API_KEY`, `INWORLD_JWT_KEY`, and `INWORLD_JWT_SECRET`

3. **Start the application:**
   ```bash
   npm start
   ```

4. **Open your browser:**
   Navigate to `http://localhost:3000`

## License

MIT
