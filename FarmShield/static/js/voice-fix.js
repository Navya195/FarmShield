/**
 * FarmShield Voice Diagnosis - Fixed Button Handlers
 * SINGLE SOURCE OF TRUTH for all voice and UI interactions
 * Fixes all button functionality issues
 */

// Global variables for voice recognition
let _micRecognition = null;
let _micIsRecording = false;

// Initialize speech recognition
function initSpeechRecognition() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  
  if (!SpeechRecognition) {
    console.error('❌ Speech recognition not supported');
    return null;
  }
  
  try {
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.lang = 'en-US';
    return recognition;
  } catch (error) {
    console.error('❌ Failed to initialize speech recognition:', error);
    return null;
  }
}

// Handle microphone button click
function handleMicClick() {
  console.log('🎤 Microphone button clicked');
  
  const micBtn = document.getElementById('voiceMicButton');
  const statusEl = document.getElementById('voiceStatus');

  if (_micIsRecording) {
    // Stop recording
    if (_micRecognition) {
      try {
        _micRecognition.stop();
      } catch(e) {
        console.error('❌ Error stopping recognition:', e);
      }
    }
    _micIsRecording = false;
    if (micBtn) {
      micBtn.style.background = 'linear-gradient(135deg, var(--farmer-primary), var(--farmer-secondary))';
      micBtn.innerHTML = '<i class="fas fa-microphone" style="font-size:3rem;color:white;"></i>';
    }
    if (statusEl) statusEl.textContent = 'Click microphone to start';
    return;
  }

  // Start recording
  const langSelect = document.getElementById('voiceLanguageSelect');
  const langMap = {
    'en': 'en-US', 'hi': 'hi-IN', 'te': 'te-IN', 'ta': 'ta-IN',
    'kn': 'kn-IN', 'ml': 'ml-IN', 'mr': 'mr-IN', 'bn': 'bn-IN',
    'pa': 'pa-IN', 'gu': 'gu-IN'
  };
  const lang = langSelect ? (langMap[langSelect.value] || 'en-US') : 'en-US';

  if (!_micRecognition) {
    _micRecognition = initSpeechRecognition();
  }

  if (!_micRecognition) {
    alert('❌ Speech recognition is not supported in your browser.\n\nPlease use:\n• Google Chrome\n• Microsoft Edge\n• Safari\n\nOr type your symptoms below.');
    return;
  }

  _micRecognition.lang = lang;
  _micIsRecording = true;

  _micRecognition.onstart = function() {
    console.log('✅ Started listening');
    if (micBtn) {
      micBtn.style.background = 'linear-gradient(135deg, #ef4444, #dc2626)';
      micBtn.innerHTML = '<i class="fas fa-stop" style="font-size:3rem;color:white;"></i>';
    }
    if (statusEl) statusEl.textContent = '🎤 Listening... Speak your crop problem now';
  };

  _micRecognition.onresult = function(event) {
    let transcript = '';
    for (let i = event.resultIndex; i < event.results.length; i++) {
      transcript += event.results[i][0].transcript;
    }

    const container = document.getElementById('recognizedTextContainer');
    const textEl = document.getElementById('recognizedText');
    if (container) container.style.display = 'block';
    if (textEl) textEl.textContent = '"' + transcript + '"';

    if (event.results[0] && event.results[0].isFinal) {
      console.log('✅ Final transcript:', transcript);
      processVoiceQuery(transcript, lang);
    }
  };

  _micRecognition.onerror = function(e) {
    console.error('❌ Speech recognition error:', e.error);
    _micIsRecording = false;
    
    if (micBtn) {
      micBtn.style.background = 'linear-gradient(135deg, var(--farmer-primary), var(--farmer-secondary))';
      micBtn.innerHTML = '<i class="fas fa-microphone" style="font-size:3rem;color:white;"></i>';
    }

    let errorMsg = '❌ Error: ' + e.error;
    if (e.error === 'not-allowed') {
      errorMsg = '❌ Microphone permission blocked.\n\nPlease:\n1. Click the microphone icon in address bar\n2. Allow microphone access\n3. Try again';
    } else if (e.error === 'no-speech') {
      errorMsg = '❌ No speech detected. Speak clearly or type below.';
    } else if (e.error === 'network') {
      errorMsg = '❌ Network error. Check your internet.';
    }
    
    if (statusEl) statusEl.textContent = errorMsg;
  };

  _micRecognition.onend = function() {
    if (_micIsRecording) {
      _micIsRecording = false;
      if (micBtn) {
        micBtn.style.background = 'linear-gradient(135deg, var(--farmer-primary), var(--farmer-secondary))';
        micBtn.innerHTML = '<i class="fas fa-microphone" style="font-size:3rem;color:white;"></i>';
      }
    }
  };

  try {
    _micRecognition.start();
  } catch (err) {
    console.error('❌ Failed to start speech recognition:', err);
    alert('❌ Could not access microphone.\n\nType your symptoms below.');
    _micIsRecording = false;
  }
}

// Submit text input
function submitVoiceText() {
  console.log('📝 Send button clicked');
  
  const input = document.getElementById('voiceTextInput');
  if (!input || !input.value.trim()) {
    alert('⚠️ Please enter your crop symptoms');
    return;
  }
  
  const text = input.value.trim();
  console.log('📝 Text to analyze:', text);
  
  const langSelect = document.getElementById('voiceLanguageSelect');
  const langMap = {
    'en': 'en-US', 'hi': 'hi-IN', 'te': 'te-IN', 'ta': 'ta-IN',
    'kn': 'kn-IN', 'ml': 'ml-IN', 'mr': 'mr-IN', 'bn': 'bn-IN',
    'pa': 'pa-IN', 'gu': 'gu-IN'
  };
  const lang = langSelect ? (langMap[langSelect.value] || 'en-US') : 'en-US';
  
  processVoiceQuery(text, lang);
  input.value = '';
}

// Process voice query
function processVoiceQuery(transcript, lang) {
  console.log('🔍 Processing query:', transcript);
  
  const micBtn = document.getElementById('voiceMicButton');
  const statusEl = document.getElementById('voiceStatus');
  const container = document.getElementById('recognizedTextContainer');
  const textEl = document.getElementById('recognizedText');
  const loaderEl = document.getElementById('voiceLoader');

  if (container) container.style.display = 'block';
  if (textEl) textEl.textContent = '"' + transcript + '"';
  if (statusEl) statusEl.textContent = '🔍 Analyzing crop symptoms with AI...';
  if (loaderEl) loaderEl.style.display = 'flex';

  fetch('/api/voice-diagnosis', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: transcript, language: lang })
  })
  .then(r => {
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  })
  .then(function(data) {
    console.log('✅ Analysis complete:', data);
    
    if (loaderEl) loaderEl.style.display = 'none';
    
    _micIsRecording = false;
    if (micBtn) {
      micBtn.style.background = 'linear-gradient(135deg, var(--farmer-primary), var(--farmer-secondary))';
      micBtn.innerHTML = '<i class="fas fa-microphone" style="font-size:3rem;color:white;"></i>';
    }
    if (statusEl) statusEl.textContent = '✅ Diagnosis complete! Speak or type again.';

    if (data.success && data.diagnosis) {
      const resultDiv = document.getElementById('diagnosisResult');
      if (resultDiv) {
        resultDiv.style.display = 'block';
        const diag = data.diagnosis;
        
        // Get disease name
        const diseaseName = diag.disease || diag.disease_name || diag.name || 'Plant Health Analysis';
        
        // Get treatment info
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
        } else if (data.recommendations && Array.isArray(data.recommendations) && data.recommendations.length > 0) {
          treatmentHTML = `<p style="margin-top:12px;"><strong>📋 Recommendations:</strong> ${data.recommendations.join(', ')}</p>`;
        }
        
        resultDiv.innerHTML = `
          <div style="padding:20px;background:var(--bg-secondary);border-radius:12px;border-left:4px solid var(--farmer-primary);margin-top:16px;">
            <h4 style="color:var(--farmer-primary);margin-bottom:12px;font-size:1.2rem;"><i class="fas fa-seedling"></i> AI Diagnosis Result</h4>
            <p style="margin-bottom:6px;"><strong>🌱 Disease:</strong> ${escapeHtml(diseaseName)}</p>
            <p style="margin-bottom:6px;"><strong>📊 Confidence:</strong> ${diag.confidence || 85}%</p>
            <p style="margin-bottom:6px;"><strong>⚠️ Severity:</strong> <span style="text-transform: capitalize;">${diag.severity || 'Moderate'}</span></p>
            ${treatmentHTML}
            ${diag.message ? `<p style="margin-top:12px;font-style:italic;color:var(--text-muted);">💬 ${diag.message}</p>` : ''}
          </div>
        `;
        
        // Scroll to result
        setTimeout(() => {
          resultDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 100);
      }
    } else {
      if (statusEl) statusEl.textContent = '⚠️ Could not analyze. Provide more details.';
    }
  })
  .catch(function(err) {
    console.error('❌ Analysis error:', err);
    
    if (loaderEl) loaderEl.style.display = 'none';
    
    _micIsRecording = false;
    if (micBtn) {
      micBtn.style.background = 'linear-gradient(135deg, var(--farmer-primary), var(--farmer-secondary))';
      micBtn.innerHTML = '<i class="fas fa-microphone" style="font-size:3rem;color:white;"></i>';
    }
    if (statusEl) statusEl.textContent = '⚠️ Server connection error. Check internet.';
  });
}

// Start voice assistant
function startVoiceAssistant() {
  console.log('🎤 Starting voice assistant...');
  
  const voiceModal = document.getElementById('voiceModal');
  if (voiceModal) {
    voiceModal.classList.remove('hidden');
    voiceModal.style.display = 'flex';
    
    const statusElement = document.getElementById('voiceStatus');
    if (statusElement) {
      statusElement.textContent = 'Click microphone to start';
    }
    
    const micButton = document.getElementById('voiceMicButton');
    if (micButton) {
      micButton.style.background = 'linear-gradient(135deg, var(--farmer-primary), var(--farmer-secondary))';
      micButton.innerHTML = '<i class="fas fa-microphone" style="font-size:3rem; color:white;"></i>';
    }
    
    // Clear previous results
    const recognizedContainer = document.getElementById('recognizedTextContainer');
    if (recognizedContainer) recognizedContainer.style.display = 'none';
    
    const resultDiv = document.getElementById('diagnosisResult');
    if (resultDiv) resultDiv.style.display = 'none';
    
    const loaderEl = document.getElementById('voiceLoader');
    if (loaderEl) loaderEl.style.display = 'none';
  }
}

// Close voice modal
function closeVoiceModal() {
  console.log('❌ Closing voice modal');
  
  const voiceModal = document.getElementById('voiceModal');
  if (voiceModal) {
    voiceModal.classList.add('hidden');
    voiceModal.style.display = 'none';
  }
  
  // Stop any ongoing recognition
  if (_micRecognition && _micIsRecording) {
    try {
      _micRecognition.stop();
    } catch(e) {
      console.error('❌ Error stopping recognition:', e);
    }
    _micIsRecording = false;
  }
}

// Helper function to escape HTML
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// =============================================
// EVENT LISTENERS - Initialize when DOM is ready
// =============================================
document.addEventListener('DOMContentLoaded', function() {
  console.log('🚀 Initializing voice diagnosis system...');
  
  // Microphone button
  const micBtn = document.getElementById('voiceMicButton');
  if (micBtn) {
    micBtn.addEventListener('click', handleMicClick);
    console.log('✅ Microphone button handler attached');
  }
  
  // Send button
  const sendBtn = document.getElementById('voiceSendButton');
  if (sendBtn) {
    sendBtn.addEventListener('click', submitVoiceText);
    console.log('✅ Send button handler attached');
  }
  
  // Text input - handle Enter key
  const textInput = document.getElementById('voiceTextInput');
  if (textInput) {
    textInput.addEventListener('keypress', function(event) {
      if (event.key === 'Enter') {
        submitVoiceText();
      }
    });
    console.log('✅ Text input Enter key handler attached');
  }
  
  // Close button
  const closeBtn = document.getElementById('closeVoiceModal');
  if (closeBtn) {
    closeBtn.addEventListener('click', closeVoiceModal);
    console.log('✅ Close button handler attached');
  }
  
  // Language selector
  const langSelect = document.getElementById('voiceLanguageSelect');
  if (langSelect) {
    langSelect.addEventListener('change', function() {
      const langMap = {
        'en': 'en-US', 'hi': 'hi-IN', 'te': 'te-IN', 'ta': 'ta-IN',
        'kn': 'kn-IN', 'ml': 'ml-IN', 'mr': 'mr-IN', 'bn': 'bn-IN',
        'pa': 'pa-IN', 'gu': 'gu-IN'
      };
      const newLang = langMap[langSelect.value] || 'en-US';
      if (_micRecognition) {
        _micRecognition.lang = newLang;
        console.log(`🌍 Language changed to: ${newLang}`);
      }
    });
    console.log('✅ Language selector handler attached');
  }
  
  console.log('✅ Voice diagnosis system initialized successfully');
});

console.log('✅ voice-fix.js loaded');
