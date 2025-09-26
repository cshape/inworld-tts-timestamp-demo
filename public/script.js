class KaraokeApp {
    constructor() {
        this.initializeElements();
        this.bindEvents();
        this.timestamps = null;
        this.currentWordIndex = -1; // Start with -1 to ensure first word gets highlighted
        this.words = [];
        this.isPlaying = false;
        this.loadVoices();
    }

    initializeElements() {
        this.topicSelect = document.getElementById('topic');
        this.topicForm = document.getElementById('topic-form');
        this.generateBtn = document.getElementById('generate-btn');
        this.voiceSelect = document.getElementById('voice-select');
        this.outputSection = document.getElementById('output-section');
        this.textDisplay = document.getElementById('text-display');
        this.audioPlayer = document.getElementById('audio-player');
        this.playPauseBtn = document.getElementById('play-pause-btn');
        this.restartBtn = document.getElementById('restart-btn');
        this.progressFill = document.getElementById('progress-fill');
        this.currentTime = document.getElementById('current-time');
        this.totalTime = document.getElementById('total-time');
        this.errorMessage = document.getElementById('error-message');
        this.playIcon = document.querySelector('.play-icon');
        this.pauseIcon = document.querySelector('.pause-icon');
    }

    bindEvents() {
        // Form submission
        this.topicForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.generateContent();
        });

        // Audio controls
        this.playPauseBtn.addEventListener('click', () => {
            this.togglePlayPause();
        });

        this.restartBtn.addEventListener('click', () => {
            this.restartAudio();
        });

        // Audio player events
        this.audioPlayer.addEventListener('loadedmetadata', () => {
            this.updateTotalTime();
        });

        this.audioPlayer.addEventListener('timeupdate', () => {
            this.updateProgress();
            this.highlightCurrentWord();
        });

        this.audioPlayer.addEventListener('ended', () => {
            this.onAudioEnded();
        });

        this.audioPlayer.addEventListener('play', () => {
            this.isPlaying = true;
            this.updatePlayPauseButton();
            // Ensure highlighting starts immediately when audio plays
            setTimeout(() => this.highlightCurrentWord(), 10);
        });

        this.audioPlayer.addEventListener('pause', () => {
            this.isPlaying = false;
            this.updatePlayPauseButton();
        });
    }

    async loadVoices() {
        try {
            const response = await fetch('/api/voices');
            if (!response.ok) {
                throw new Error('Failed to fetch voices');
            }
            
            const { voices } = await response.json();
            
            // Clear existing options
            this.voiceSelect.innerHTML = '';
            
            if (voices && voices.length > 0) {
                // Add voices to dropdown with descriptions
                voices.forEach(voice => {
                    const option = document.createElement('option');
                    option.value = voice.voiceId;
                    
                    // Create display text with description if available
                    let displayText = voice.voiceId;
                    if (voice.description && voice.description.trim()) {
                        displayText = `${voice.voiceId} - ${voice.description}`;
                    } else if (voice.displayName && voice.displayName.trim() && voice.displayName !== voice.voiceId) {
                        displayText = `${voice.voiceId} - ${voice.displayName}`;
                    }
                    
                    option.textContent = displayText;
                    this.voiceSelect.appendChild(option);
                });
                
                // Set Alex as default if available, otherwise Dennis, otherwise first voice
                const alexOption = voices.find(voice => voice.voiceId === 'Alex');
                const dennisOption = voices.find(voice => voice.voiceId === 'Dennis');
                
                if (alexOption) {
                    this.voiceSelect.value = 'Alex';
                } else if (dennisOption) {
                    this.voiceSelect.value = 'Dennis';
                } else if (voices.length > 0) {
                    this.voiceSelect.value = voices[0].voiceId;
                }
            } else {
                // Fallback if no voices returned
                const option = document.createElement('option');
                option.value = 'Alex';
                option.textContent = 'Alex - Energetic and expressive mid-range male voice, with a mildly nasal quality';
                this.voiceSelect.appendChild(option);
            }
            
        } catch (error) {
            console.error('Error loading voices:', error);
            // Keep the existing Alex option as fallback - don't clear it
        }
    }

    async generateContent() {
        const topic = this.topicSelect.value.trim();
        
        if (!topic) {
            this.showError('Please select a topic');
            return;
        }

        this.setLoading(true);
        this.hideError();

        try {
            // Step 1: Generate text
            const textResponse = await fetch('/api/generate-text', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ topic })
            });

            if (!textResponse.ok) {
                const error = await textResponse.json();
                throw new Error(error.error || 'Failed to generate text');
            }

            const { text } = await textResponse.json();

            // Step 2: Generate speech with timestamps
            const selectedVoice = this.voiceSelect.value;
            
            const speechResponse = await fetch('/api/generate-speech', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ text, voiceId: selectedVoice })
            });

            if (!speechResponse.ok) {
                const error = await speechResponse.json();
                throw new Error(error.error || 'Failed to generate speech');
            }

            const { audioUrl, timestamps } = await speechResponse.json();

            // Display results
            this.displayContent(text, audioUrl, timestamps);

        } catch (error) {
            console.error('Generation error:', error);
            this.showError(error.message);
        } finally {
            this.setLoading(false);
        }
    }

    displayContent(text, audioUrl, timestamps) {
        this.timestamps = timestamps;
        this.words = timestamps.words;
        this.currentWordIndex = -1; // Reset to -1 for proper initialization

        // Create word elements with filtered text for display
        this.textDisplay.innerHTML = '';
        this.words.forEach((word, index) => {
            // Filter out audio markups from the display text
            const filteredWord = this.filterAudioMarkups(word);
            
            // Only create elements for words that have content after filtering
            if (filteredWord.length > 0) {
                const wordElement = document.createElement('span');
                wordElement.className = 'word';
                wordElement.textContent = filteredWord;
                wordElement.dataset.index = index;
                this.textDisplay.appendChild(wordElement);
                
                // Add space after word (except for punctuation)
                if (index < this.words.length - 1 && !this.isPunctuation(this.words[index + 1])) {
                    this.textDisplay.appendChild(document.createTextNode(' '));
                }
            }
        });

        // Set up audio
        if (this.audioPlayer) {
            this.audioPlayer.src = audioUrl;
            this.audioPlayer.load();
        } else {
            console.error('Audio player not available');
            this.showError('Audio player not found. Please refresh the page.');
            return;
        }

        // Show output section
        this.outputSection.style.display = 'block';
        this.outputSection.scrollIntoView({ behavior: 'smooth' });

        // Reset controls
        this.isPlaying = false;
        this.updatePlayPauseButton();
    }

    isPunctuation(word) {
        return /^[.,!?;:]/.test(word);
    }

    // Filter out audio markups like [laugh], [sigh], etc. from display text
    filterAudioMarkups(text) {
        // Remove square brackets and everything between them
        return text.replace(/\[([^\]]*)\]/g, '').trim();
    }

    togglePlayPause() {
        if (this.isPlaying) {
            this.audioPlayer.pause();
        } else {
            this.audioPlayer.play();
        }
    }

    restartAudio() {
        this.audioPlayer.currentTime = 0;
        this.currentWordIndex = -1; // Reset to -1 so the first word gets highlighted
        this.clearWordHighlights();
        this.updateProgress();
        // Force highlight update after a brief delay to ensure audio time is set
        setTimeout(() => this.highlightCurrentWord(), 50);
    }

    updatePlayPauseButton() {
        if (this.isPlaying) {
            this.playIcon.style.display = 'none';
            this.pauseIcon.style.display = 'inline';
        } else {
            this.playIcon.style.display = 'inline';
            this.pauseIcon.style.display = 'none';
        }
    }

    updateProgress() {
        if (this.audioPlayer.duration) {
            const progress = (this.audioPlayer.currentTime / this.audioPlayer.duration) * 100;
            this.progressFill.style.width = progress + '%';
            this.currentTime.textContent = this.formatTime(this.audioPlayer.currentTime);
        }
    }

    updateTotalTime() {
        this.totalTime.textContent = this.formatTime(this.audioPlayer.duration);
    }

    formatTime(seconds) {
        if (isNaN(seconds)) return '0:00';
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    highlightCurrentWord() {
        if (!this.timestamps || !this.timestamps.wordStartTimeSeconds) return;

        const currentTime = this.audioPlayer.currentTime;
        const wordElements = this.textDisplay.querySelectorAll('.word');
        let targetWordIndex = -1;
        let targetDisplayIndex = -1;

        // Find the appropriate word to highlight in the timestamps
        for (let i = 0; i < this.timestamps.wordStartTimeSeconds.length; i++) {
            const startTime = this.timestamps.wordStartTimeSeconds[i];
            const endTime = this.timestamps.wordEndTimeSeconds[i];

            // If we're within the word's time range, highlight it
            if (currentTime >= startTime && currentTime <= endTime) {
                targetWordIndex = i;
                break;
            }
            // If we're past this word but before the next word (or it's the last word), 
            // keep this word highlighted until the next one starts
            else if (currentTime >= startTime) {
                const nextWordStartTime = i + 1 < this.timestamps.wordStartTimeSeconds.length 
                    ? this.timestamps.wordStartTimeSeconds[i + 1] 
                    : Infinity;
                
                if (currentTime < nextWordStartTime) {
                    targetWordIndex = i;
                    break;
                }
            }
        }

        // If no word found but audio is playing, highlight the first word
        if (targetWordIndex === -1 && currentTime > 0) {
            targetWordIndex = 0;
        }

        // Find the corresponding display element index (accounting for filtered words)
        if (targetWordIndex !== -1) {
            let displayIndex = 0;
            for (let i = 0; i <= targetWordIndex && i < this.words.length; i++) {
                const filteredWord = this.filterAudioMarkups(this.words[i]);
                if (filteredWord.length > 0) {
                    if (i === targetWordIndex) {
                        targetDisplayIndex = displayIndex;
                        break;
                    }
                    displayIndex++;
                }
            }
        }

        // Update highlighting if we found a target word and it's different from current
        if (targetWordIndex !== -1 && this.currentWordIndex !== targetWordIndex) {
            // Remove previous highlights
            this.clearCurrentHighlight();
            
            // Add current highlight if we have a valid display element
            if (targetDisplayIndex !== -1 && wordElements[targetDisplayIndex]) {
                wordElements[targetDisplayIndex].classList.add('current');
            }
            
            // Mark previous words as spoken (only visible ones)
            for (let j = 0; j < targetDisplayIndex; j++) {
                if (wordElements[j]) {
                    wordElements[j].classList.remove('current');
                    wordElements[j].classList.add('spoken');
                }
            }
            
            this.currentWordIndex = targetWordIndex;
        }
    }

    clearCurrentHighlight() {
        const currentWords = this.textDisplay.querySelectorAll('.word.current');
        currentWords.forEach(word => word.classList.remove('current'));
    }

    clearWordHighlights() {
        const wordElements = this.textDisplay.querySelectorAll('.word');
        wordElements.forEach(word => {
            word.classList.remove('current', 'spoken');
        });
    }

    onAudioEnded() {
        this.isPlaying = false;
        this.updatePlayPauseButton();
        
        // Mark all words as spoken
        const wordElements = this.textDisplay.querySelectorAll('.word');
        wordElements.forEach(word => {
            word.classList.remove('current');
            word.classList.add('spoken');
        });
    }

    setLoading(loading) {
        if (loading) {
            this.generateBtn.classList.add('loading');
            this.generateBtn.disabled = true;
        } else {
            this.generateBtn.classList.remove('loading');
            this.generateBtn.disabled = false;
        }
    }

    showError(message) {
        this.errorMessage.textContent = message;
        this.errorMessage.style.display = 'block';
        this.errorMessage.scrollIntoView({ behavior: 'smooth' });
    }

    hideError() {
        this.errorMessage.style.display = 'none';
    }
}

// Initialize the app when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new KaraokeApp();
});
