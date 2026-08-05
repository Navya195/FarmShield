/**
 * FarmShield Voice Diagnosis System - COMPLETE REWRITE
 * Robust microphone handling with visual feedback, error management, and browser compatibility
 * Author: FarmShield Team
 * Version: 3.0
 */

'use strict';

// ============================================
// VOICE RECOGNITION STATE MANAGER
// ============================================

class VoiceRecognitionManager {
  constructor() {
    this.recognition = null;
    this.isRecording = false;
    this.isBrowserSupported = false;
    this.recordingStartTime = null;
    this.recordingTimer = null;
    this.currentLanguage = 'en-US';
    this.currentTranscript = '';
    
    this.initializeAPI();
  }

  initializeAPI() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      console.error('❌ Speech Recognition API not supported');
      this.isBrowserSupported = false;
      return;
    }
    
    this.isBrowserSupported = true;
    
    try {
      this.recognition = new SpeechRecognition();
      
      // Configure recognition settings
      this.recognition.continuous = false;
      this.recognition.interimResults = true;
      this.recognition.maxAlternatives = 1;
      this.recognition.lang = this.currentLanguage;
      
      // Bind event handlers
      this.recognition.onstart = () => this.onRecognitionStart();
      this.recognition.onresult = (event) => this.onRecognitionResult(event);
      this.recognition.onerror = (event) => this.onRecognitionError(event);
      this.recognition.onend = () => this.onRecognitionEnd();
      
      console.log('✅ Speech Recognition API initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Speech Recognition:', error);
      this.isBrowserSupported = false;
    }
  }

  start() {
    if (!this.isBrowserSupported) {
      this.showError('Speech Recognition is not supported in your browser. Please use Chrome, Edge, or Safari.');
      return false;
    }

    if (this.isRecording) {
      console.warn('⚠️ Already recording');
      return false;
    }

    if (!this.recognition) {
      this.initializeAPI();
      if (!this.recognition) {
        this.showError('Failed to initialize microphone. Please try again.');
        return false;
      }
    }

    try {
      this.isRecording = true;
      this.recordingStartTime = Date.now();
      this.currentTranscript = '';
      this.updateUI('recording');
      this.startRecordingTimer();
      this.recognition.start();
      console.log('✅ Recording started');
      return true;
    } catch (error) {
      console.error('❌ Error starting recognition:', error);
      this.isRecording = false;
      this.showError('Could not start recording. Please check your microphone permissions.');
      return false;
    }
  }

  stop() {
    if (!this.isRecording) {
      console.warn('⚠️ Not currently recording');
      return false;
    }

    try {
      this.isRecording = false;
      this.stopRecordingTimer();
      this.recognition.stop();
      console.log('✅ Recording stopped');
      return true;
    } catch (error) {
      console.error('❌ Error stopping recognition:', error);
      return false;
    }
  }

  setLanguage(langCode) {
    const langMap = {
      'en': 'en-US', 'hi': 'hi-IN', 'te': 'te-IN', 'ta': 'ta-IN',
      'kn': 'kn-IN', 'ml': 'ml-IN', 'mr': 'mr-IN', 'bn': 'bn-IN',
      'pa': 'pa-IN', 'gu': 'gu-IN'
    };
    
    const newLang = langMap[langCode] || 'en-US';
    if (this.currentLanguage !== newLang) {
      this.currentLanguage = newLang;
      if (this.recognition) {
        this.recognition.lang = newLang;
        console.log(`🌍 Language changed to: ${newLang}`);
      }
    }
  }

  onRecognitionStart() {
    console.log('🎤 Listening started');
    this.updateUI('recording');
    this.showStatus('🎤 Listening... Speak your crop problem now');
  }

  onRecognitionResult(event) {
    let interim = '';
    let final = '';

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;
      
      if (event.results[i].isFinal) {
        final += transcript;
      } else {
        interim += transcript;
      }
    }

    if (final || interim) {
      this.currentTranscript = (final || interim).trim();
      this.displayRecognizedText(this.currentTranscript);
      console.log(`📝 Text: ${this.currentTranscript}`);
    }

    if (final) {
      console.log(`✅ Final transcript: ${final}`);
      this.stop();
      this.processRecognizedText(final);
    }
  }

  onRecognitionError(event) {
    console.error(`❌ Speech recognition error: ${event.error}`);
    
    let errorMessage = '';
    
    switch(event.error) {
      case 'not-allowed':
        errorMessage = '❌ Microphone permission denied.\n\nPlease:\n1. Click the microphone icon in your browser address bar\n2. Select "Allow" for microphone access\n3. Try again';
        break;
      case 'no-speech':
        errorMessage = '❌ No speech detected.\n\nPlease:\n1. Check if your microphone is working\n2. Speak closer to the microphone\n3. Try again';
        break;
      case 'audio-capture':
        errorMessage = '❌ No microphone found.\n\nPlease:\n1. Connect a microphone\n2. Check browser microphone permissions\n3. Try again';
        break;
      case 'network':
        errorMessage = '❌ Network error. Check your internet connection.';
        break;
      case 'service-not-allowed':
        errorMessage = '❌ Speech recognition service not available in your region.';
        break;
      default:
        errorMessage = `❌ Error: ${event.error}\n\nPlease try again or use text input instead.`;
    }
    
    this.isRecording = false;
    this.stopRecordingTimer();
    this.updateUI('idle');
    this.showError(errorMessage);
  }

  onRecognitionEnd() {
    console.log('🛑 Recognition ended');
    this.isRecording = false;
    this.stopRecordingTimer();
    if (!this.currentTranscript) {
      this.updateUI('idle');
    }
  }

  updateUI(state) {
    const micBtn = document.getElementById('voiceMicButton');
    const statusEl = document.getElementById('voiceStatus');
    const recordingIndicator = document.getElementById('recordingIndicator');

    if (!micBtn) return;

    switch(state) {
      case 'recording':
        micBtn.style.background = 'linear-gradient(135deg, #ef4444, #dc2626)';
        micBtn.innerHTML = '<i class="fas fa-stop" style="font-size:3rem;color:white;"></i>';
        micBtn.style.animation = 'pulse 1.5s infinite';
        if (recordingIndicator) {
          recordingIndicator.style.display = 'inline-block';
          recordingIndicator.innerHTML = '<span style="animation: blink 1s infinite;">●</span> Recording';
        }
        if (statusEl) statusEl.textContent = '🎤 Recording... Click to stop';
        break;
        
      case 'idle':
      default:
        micBtn.style.background = 'linear-gradient(135deg, var(--farmer-primary), var(--farmer-secondary))';
        micBtn.innerHTML = '<i class="fas fa-microphone" style="font-size:3rem;color:white;"></i>';
        micBtn.style.animation = 'none';
        if (recordingIndicator) recordingIndicator.style.display = 'none';
        if (statusEl) statusEl.textContent = 'Click microphone to start';
    }
  }

  startRecordingTimer() {
    let seconds = 0;
    const timerEl = document.getElementById('recordingTimer');
    
    this.recordingTimer = setInterval(() => {
      seconds++;
      if (timerEl) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        timerEl.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
        timerEl.style.display = 'block';
      }
    }, 1000);
  }

  stopRecordingTimer() {
    if (this.recordingTimer) {
      clearInterval(this.recordingTimer);
      this.recordingTimer = null;
    }
    const timerEl = document.getElementById('recordingTimer');
    if (timerEl) timerEl.style.display = 'none';
  }

  displayRecognizedText(text) {
    const container = document.getElementById('recognizedTextContainer');
    const textEl = document.getElementById('recognizedText');
    
    if (container && textEl) {
      container.style.display = 'block';
      textEl.textContent = `"${text}"`;
    }
  }

  showStatus(message) {
    const statusEl = document.getElementById('voiceStatus');
    if (statusEl) {
      statusEl.textContent = message;
    }
  }

  showError(message) {
    const statusEl = document.getElementById('voiceStatus');
    if (statusEl) {
      statusEl.textContent = message;
      statusEl.style.color = '#ef4444';
      setTimeout(() => {
        statusEl.style.color = 'var(--text-primary)';
      }, 10000);
    }
    console.error(message);
  }

  async processRecognizedText(transcript) {
    const langSelect = document.getElementById('voiceLanguageSelect');
    const langMap = {
      'en': 'en-US', 'hi': 'hi-IN', 'te': 'te-IN', 'ta': 'ta-IN',
      'kn': 'kn-IN', 'ml': 'ml-IN', 'mr': 'mr-IN', 'bn': 'bn-IN',
      'pa': 'pa-IN', 'gu': 'gu-IN'
    };
    const lang = langSelect ? (langMap[langSelect.value] || 'en-US') : 'en-US';
    
    await sendToAPI(transcript, lang);
  }
}

// ============================================
// GLOBAL INSTANCE
// ============================================

let voiceManager = null;

// ============================================
// BUTTON HANDLERS
// ============================================

function handleMicClick() {
  console.log('🎤 Microphone button clicked');
  
  if (!voiceManager) {
    console.error('❌ Voice manager not initialized');
    alert('System not ready. Please refresh the page.');
    return;
  }

  if (voiceManager.isRecording) {
    voiceManager.stop();
  } else {
    voiceManager.start();
  }
}

function submitVoiceText() {
  console.log('📝 Send button clicked');
  
  const input = document.getElementById('voiceTextInput');
  if (!input || !input.value.trim()) {
    voiceManager?.showError('Please enter your crop symptoms');
    return;
  }
  
  const text = input.value.trim();
  const langSelect = document.getElementById('voiceLanguageSelect');
  const langMap = {
    'en': 'en-US', 'hi': 'hi-IN', 'te': 'te-IN', 'ta': 'ta-IN',
    'kn': 'kn-IN', 'ml': 'ml-IN', 'mr': 'mr-IN', 'bn': 'bn-IN',
    'pa': 'pa-IN', 'gu': 'gu-IN'
  };
  const lang = langSelect ? (langMap[langSelect.value] || 'en-US') : 'en-US';
  
  input.value = '';
  sendToAPI(text, lang);
}

// ============================================
// API COMMUNICATION
// ============================================

async function sendToAPI(transcript, lang) {
  if (!transcript.trim()) {
    voiceManager?.showError('Cannot send empty text');
    return;
  }

  const statusEl = document.getElementById('voiceStatus');
  const loaderEl = document.getElementById('voiceLoader');
  
  if (statusEl) statusEl.textContent = '🔍 Analyzing crop symptoms with AI...';
  if (loaderEl) loaderEl.style.display = 'flex';

  try {
    console.log(`🔍 Sending to API: "${transcript}"`);
    
    const response = await fetch('/api/voice-diagnosis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: transcript, language: lang })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ API Response:', data);
    
    displayDiagnosis(data);
  } catch (error) {
    console.error('❌ API Error:', error);
    if (statusEl) statusEl.textContent = '⚠️ Server error. Please check your internet and try again.';
  } finally {
    if (loaderEl) loaderEl.style.display = 'none';
    if (voiceManager) voiceManager.updateUI('idle');
  }
}

function displayDiagnosis(data) {
  const resultDiv = document.getElementById('diagnosisResult');
  const statusEl = document.getElementById('voiceStatus');
  
  if (!resultDiv) return;

  if (data.success && data.diagnosis) {
    const diag = data.diagnosis;
    const diseaseName = diag.disease || diag.disease_name || diag.name || 'Plant Health Analysis';
    
    let treatmentHTML = '';
    if (diag.treatment) {
      if (typeof diag.treatment === 'object') {
        treatmentHTML = `
          <div style="margin-top: 12px;">
            <p style="margin-bottom:6px;"><strong>🚨 Immediate Action:</strong> ${diag.treatment.immediate || 'Monitor closely'}</p>
            ${diag.treatment.organic && Array.isArray(diag.treatment.organic) && diag.treatment.organic.length > 0 ? 
              `<p style="margin-bottom:6px;"><strong>🌿 Organic Treatment:</strong> ${diag.treatment.organic.join(', ')}</p>` : ''}
            ${diag.treatment.chemical && Array.isArray(diag.treatment.chemical) && diag.treatment.chemical.length > 0 ? 
              `<p style="margin-bottom:6px;"><strong>💊 Chemical Treatment:</strong> ${diag.treatment.chemical.join(', ')}</p>` : ''}
          </div>
        `;
      } else {
        treatmentHTML = `<p style="margin-top:12px;"><strong>💊 Treatment:</strong> ${diag.treatment}</p>`;
      }
    }
    
    resultDiv.innerHTML = `
      <div style="padding:20px;background:var(--bg-secondary);border-radius:12px;border-left:4px solid var(--farmer-primary);margin-top:16px;animation:slideIn 0.5s ease;">
        <h4 style="color:var(--farmer-primary);margin-bottom:12px;font-size:1.2rem;"><i class="fas fa-seedling"></i> AI Diagnosis Result</h4>
        <p style="margin-bottom:6px;"><strong>🌱 Disease:</strong> ${escapeHtml(diseaseName)}</p>
        <p style="margin-bottom:6px;"><strong>📊 Confidence:</strong> ${diag.confidence || 85}%</p>
        <p style="margin-bottom:6px;"><strong>⚠️ Severity:</strong> <span style="text-transform: capitalize;">${diag.severity || 'Moderate'}</span></p>
        ${treatmentHTML}
      </div>
    `;
    resultDiv.style.display = 'block';
    
    if (statusEl) statusEl.textContent = '✅ Diagnosis complete! Click microphone to analyze again.';
    
    setTimeout(() => {
      resultDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);
  } else {
    resultDiv.style.display = 'none';
    if (statusEl) statusEl.textContent = '⚠️ Could not generate diagnosis. Please provide more details.';
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ============================================
// MODAL FUNCTIONS
// ============================================

function startVoiceAssistant() {
  console.log('🎤 Opening voice assistant...');
  
  const voiceModal = document.getElementById('voiceModal');
  if (!voiceModal) {
    console.error('❌ Voice modal not found');
    return;
  }
  
  voiceModal.classList.remove('hidden');
  voiceModal.style.display = 'flex';
  
  // Clear previous state
  const recognizedContainer = document.getElementById('recognizedTextContainer');
  if (recognizedContainer) recognizedContainer.style.display = 'none';
  
  const resultDiv = document.getElementById('diagnosisResult');
  if (resultDiv) resultDiv.style.display = 'none';
  
  const statusEl = document.getElementById('voiceStatus');
  if (statusEl) {
    statusEl.textContent = 'Click microphone to start';
    statusEl.style.color = 'var(--text-primary)';
  }
  
  if (voiceManager) {
    voiceManager.updateUI('idle');
  }
  
  console.log('✅ Voice assistant opened');
}

function closeVoiceModal() {
  console.log('❌ Closing voice assistant...');
  
  // Stop any ongoing recording
  if (voiceManager && voiceManager.isRecording) {
    voiceManager.stop();
  }
  
  const voiceModal = document.getElementById('voiceModal');
  if (voiceModal) {
    voiceModal.classList.add('hidden');
    voiceModal.style.display = 'none';
  }
  
  console.log('✅ Voice assistant closed');
}

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', function() {
  console.log('🚀 Initializing FarmShield Voice System v3.0...');
  
  // Create voice manager instance
  voiceManager = new VoiceRecognitionManager();
  
  // Attach microphone button listener
  const micBtn = document.getElementById('voiceMicButton');
  if (micBtn) {
    micBtn.addEventListener('click', handleMicClick);
    console.log('✅ Microphone button listener attached');
  } else {
    console.warn('⚠️ Microphone button not found');
  }
  
  // Attach send button listener
  const sendBtn = document.getElementById('voiceSendButton');
  if (sendBtn) {
    sendBtn.addEventListener('click', submitVoiceText);
    console.log('✅ Send button listener attached');
  } else {
    console.warn('⚠️ Send button not found');
  }
  
  // Attach text input Enter key listener
  const textInput = document.getElementById('voiceTextInput');
  if (textInput) {
    textInput.addEventListener('keypress', function(event) {
      if (event.key === 'Enter') {
        submitVoiceText();
      }
    });
    console.log('✅ Text input Enter key listener attached');
  } else {
    console.warn('⚠️ Text input not found');
  }
  
  // Attach close button listener
  const closeBtn = document.getElementById('closeVoiceModal');
  if (closeBtn) {
    closeBtn.addEventListener('click', closeVoiceModal);
    console.log('✅ Close button listener attached');
  } else {
    console.warn('⚠️ Close button not found');
  }
  
  // Attach language selector listener
  const langSelect = document.getElementById('voiceLanguageSelect');
  if (langSelect) {
    langSelect.addEventListener('change', function() {
      if (voiceManager) {
        voiceManager.setLanguage(langSelect.value);
        console.log(`🌍 Language changed to: ${langSelect.value}`);
      }
    });
    console.log('✅ Language selector listener attached');
  } else {
    console.warn('⚠️ Language selector not found');
  }
  
  console.log('✅ FarmShield Voice System v3.0 initialized successfully');
  console.log('🎤 Microphone Status:', voiceManager.isBrowserSupported ? '✅ Supported' : '❌ Not Supported');
});

console.log('✅ voice-system.js loaded');

// Add CSS animations for recording indicator
const style = document.createElement('style');
style.textContent = `
  @keyframes pulse {
    0%, 100% { box-shadow: 0 8px 25px rgba(34, 197, 94, 0.3); }
    50% { box-shadow: 0 8px 25px rgba(239, 68, 68, 0.6); }
  }
  
  @keyframes blink {
    0%, 49% { opacity: 1; }
    50%, 100% { opacity: 0.3; }
  }
  
  @keyframes slideIn {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  #recordingIndicator {
    display: none;
    color: #ef4444;
    font-weight: 600;
    margin-top: 10px;
    font-size: 0.95rem;
  }
  
  #recordingTimer {
    display: none;
    color: #ef4444;
    font-weight: 700;
    font-size: 1.2rem;
    margin-top: 10px;
    font-family: monospace;
  }
`;
document.head.appendChild(style);

window.startVoiceAssistant = startVoiceAssistant;
window.closeVoiceModal = closeVoiceModal;
window.handleMicClick = handleMicClick;
window.submitVoiceText = submitVoiceText;
