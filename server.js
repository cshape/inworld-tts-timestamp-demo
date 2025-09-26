const express = require('express');
const cors = require('cors');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Environment variables
const INWORLD_API_KEY = process.env.INWORLD_API_KEY;
const INWORLD_JWT_KEY = process.env.INWORLD_JWT_KEY;
const INWORLD_JWT_SECRET = process.env.INWORLD_JWT_SECRET;

// Check for required environment variables
if (!INWORLD_API_KEY) {
  console.error('Please set INWORLD_API_KEY environment variable');
  process.exit(1);
}

if (!INWORLD_JWT_KEY || !INWORLD_JWT_SECRET) {
  console.error('Please set INWORLD_JWT_KEY and INWORLD_JWT_SECRET environment variables');
  process.exit(1);
}

// Create auth headers for different services
const ttsAuthHeader = `Basic ${INWORLD_API_KEY}`;
const llmCredentials = Buffer.from(`${INWORLD_JWT_KEY}:${INWORLD_JWT_SECRET}`).toString('base64');
const llmAuthHeader = `Basic ${llmCredentials}`;

// Get available voices from Inworld TTS
app.get('/api/voices', async (req, res) => {
  try {
    const response = await axios.get(
      'https://api.inworld.ai/tts/v1/voices?filter=language=en',
      {
        headers: {
          'Authorization': ttsAuthHeader,
          'Content-Type': 'application/json'
        }
      }
    );

    const voices = response.data.voices || [];
    res.json({ voices });

  } catch (error) {
    console.error('Voices API Error:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Failed to fetch voices',
      details: error.response?.data?.message || error.message
    });
  }
});

// Generate text using Inworld LLM
app.post('/api/generate-text', async (req, res) => {
  try {
    const { topic } = req.body;
    
    if (!topic || topic.trim().length === 0) {
      return res.status(400).json({ error: 'Topic is required' });
    }
    
    // Validate that the topic is one of the allowed options
    const allowedTopics = ['sports', 'travel', 'music', 'food', 'mysteries', 'canada', 'space', 'folklore'];
    if (!allowedTopics.includes(topic.toLowerCase())) {
      return res.status(400).json({ error: 'Invalid topic selection' });
    }

    const response = await axios.post(
      'https://api.inworld.ai/llm/v1alpha/completions:completeChat',
      {
        servingId: {
          modelId: {
            model: 'gpt-4.1-nano',
            serviceProvider: 'SERVICE_PROVIDER_OPENAI'
          },
          userId: 'user-' + Date.now(),
          sessionId: 'session-' + Date.now()
        },
        messages: [
          {
            content: `Write 2 sentences about ${topic}. It will be read aloud so use filler words and the [laugh] audio markup where appropriate. But sparingly. Return only the 2 sentences.`,
            role: 'MESSAGE_ROLE_USER'
          }
        ],
        textGenerationConfig: {
          maxTokens: 200,
          temperature: 1
        }
      },
      {
        headers: {
          'Authorization': llmAuthHeader,
          'Content-Type': 'application/json'
        }
      }
    );

    const generatedText = response.data.result.choices[0].message.content;
    res.json({ text: generatedText });

  } catch (error) {
    console.error('LLM Error:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Failed to generate text',
      details: error.response?.data?.message || error.message
    });
  }
});

// Generate speech with timestamps using Inworld TTS
app.post('/api/generate-speech', async (req, res) => {
  try {
    const { text, voiceId } = req.body;
    
    if (!text || text.trim().length === 0) {
      console.log('Text validation failed:', text); // Debug log
      return res.status(400).json({ error: 'Text is required' });
    }

    // Use provided voice or default to Alex
    const selectedVoice = voiceId || 'Alex';

    const response = await axios.post(
      'https://api.inworld.ai/tts/v1/voice',
      {
        text: text,
        voiceId: selectedVoice,
        modelId: 'inworld-tts-1',
        timestampType: 'WORD',
        audioConfig: {
          audioEncoding: 'OGG_OPUS',
          sampleRateHertz: 48000,  // High quality sample rate
          speakingRate: 1.0        // Natural speaking rate
        },
        temperature: 1.1
      },
      {
        headers: {
          'Authorization': ttsAuthHeader,
          'Content-Type': 'application/json'
        }
      }
    );

    const { audioContent, timestampInfo } = response.data;
    console.log(timestampInfo);
    

    
    // Save audio file (keeping original OGG Opus format for best quality)
    const audioBuffer = Buffer.from(audioContent, 'base64');
    const audioFileName = `audio_${Date.now()}.ogg`;
    const audioFilePath = path.join(__dirname, 'public', 'audio', audioFileName);
    
    // Ensure audio directory exists
    const audioDir = path.join(__dirname, 'public', 'audio');
    if (!fs.existsSync(audioDir)) {
      fs.mkdirSync(audioDir, { recursive: true });
    }
    
    fs.writeFileSync(audioFilePath, audioBuffer);

    res.json({
      audioUrl: `/audio/${audioFileName}`,
      timestamps: timestampInfo.wordAlignment
    });

  } catch (error) {
    console.error('TTS Error:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Failed to generate speech',
      details: error.response?.data?.message || error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`App running on http://localhost:${PORT}`);
});
