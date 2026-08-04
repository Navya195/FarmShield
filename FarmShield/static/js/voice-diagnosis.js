/**
 * FarmShield Voice Diagnosis System
 * Complete speech recognition and disease diagnosis
 */

class VoiceDiagnosis {
    constructor() {
        this.recognition = null;
        this.isRecording = false;
        this.currentLanguage = 'en-US';
        this.recognizedText = '';
        this.hasRetried = false;
        this.diagnosisHistory = [];
        this.initSpeechRecognition();
    }

    initSpeechRecognition() {
        // Check if we're in a secure context (HTTPS or localhost)
        if (location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
            console.error('❌ Speech recognition requires HTTPS or localhost');
            this.showDetailedError(
                'Speech recognition requires a secure connection.',
                'Please use HTTPS or localhost to access voice features.'
            );
            return false;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        
        if (!SpeechRecognition) {
            console.error('❌ Speech recognition not supported in this browser');
            this.showDetailedError(
                'Speech recognition is not supported in your browser.',
                'Please use Chrome, Edge, Safari, or a modern browser that supports Web Speech API.'
            );
            return false;
        }

        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            console.error('❌ Microphone API not supported');
            this.showDetailedError(
                'Microphone access is not supported in your browser.',
                'Please update your browser or use a modern browser with microphone support.'
            );
            return false;
        }

        try {
            this.recognition = new SpeechRecognition();
            this.recognition.continuous = false;
            this.recognition.interimResults = true;
            this.recognition.maxAlternatives = 1;
            this.recognition.lang = this.currentLanguage;

            this.recognition.onstart = () => this.onRecognitionStart();
            this.recognition.onresult = (event) => this.onRecognitionResult(event);
            this.recognition.onerror = (event) => this.onRecognitionError(event);
            this.recognition.onend = () => this.onRecognitionEnd();

            console.log('✅ Speech recognition initialized successfully');
            console.log(`🌍 Language: ${this.currentLanguage}`);
            return true;
            
        } catch (error) {
            console.error('❌ Failed to initialize speech recognition:', error);
            this.showDetailedError(
                'Failed to initialize voice recognition.',
                'Please refresh the page and try again. If the problem persists, try a different browser.'
            );
            return false;
        }
    }

    setLanguage(langCode) {
        const langMap = {
            'en': 'en-US',
            'hi': 'hi-IN',
            'te': 'te-IN',
            'ta': 'ta-IN',
            'kn': 'kn-IN',
            'ml': 'ml-IN',
            'mr': 'mr-IN',
            'bn': 'bn-IN',
            'pa': 'pa-IN',
            'gu': 'gu-IN',
            'or': 'or-IN',
            'as': 'as-IN',
            'ur': 'ur-IN',
            'sa': 'sa-IN'
        };

        const newLanguage = langMap[langCode] || 'en-US';
        
        if (this.currentLanguage !== newLanguage) {
            this.currentLanguage = newLanguage;
            
            if (this.recognition) {
                this.recognition.lang = this.currentLanguage;
                console.log(`🌍 Language changed to: ${this.currentLanguage}`);
            }
            
            const langNames = {
                'en-US': 'English',
                'hi-IN': 'हिंदी (Hindi)',
                'te-IN': 'తెలుగు (Telugu)',
                'ta-IN': 'தமிழ் (Tamil)',
                'kn-IN': 'ಕನ್ನಡ (Kannada)',
                'ml-IN': 'മലയാളം (Malayalam)',
                'mr-IN': 'मराठी (Marathi)',
                'bn-IN': 'বাংলা (Bengali)',
                'pa-IN': 'ਪੰਜਾਬੀ (Punjabi)',
                'gu-IN': 'ગુજરાતી (Gujarati)',
                'or-IN': 'ଓଡ଼ିଆ (Odia)',
                'as-IN': 'অসমীয়া (Assamese)',
                'ur-IN': 'اردو (Urdu)',
                'sa-IN': 'संस्कृत (Sanskrit)'
            };
            
            this.showSuccess(`Language set to ${langNames[this.currentLanguage] || this.currentLanguage}`);
        }
    }

    checkBrowserCompatibility() {
        const checks = {
            speechRecognition: !!(window.SpeechRecognition || window.webkitSpeechRecognition),
            mediaDevices: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
            secureContext: location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1',
            permissions: !!(navigator.permissions),
        };

        console.log('🔍 Browser compatibility check:', checks);
        return checks;
    }

    showCompatibilityStatus() {
        const checks = this.checkBrowserCompatibility();
        const issues = [];

        if (!checks.speechRecognition) {
            issues.push('Speech Recognition API not supported');
        }
        if (!checks.mediaDevices) {
            issues.push('Microphone access not available');
        }
        if (!checks.secureContext) {
            issues.push('Secure connection (HTTPS) required');
        }

        if (issues.length > 0) {
            this.showDetailedError(
                'Voice features are not fully supported in your browser.',
                `Issues: ${issues.join(', ')}. Please use Chrome, Edge, or Safari on a secure connection.`
            );
            return false;
        }

        return true;
    }

    async startRecording() {
        if (!this.recognition) {
            this.showError('Speech recognition not supported in your browser. Please use Chrome, Edge, or Safari.');
            return;
        }

        if (this.isRecording) {
            return;
        }

        // Directly request microphone access without permissions.query (which fails in many browsers)
        try {
            console.log('🎤 Requesting microphone access...');

            let stream;
            try {
                stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                console.log('✅ Microphone access granted');
                // Immediately stop the test stream; SpeechRecognition manages its own stream
                stream.getTracks().forEach(track => track.stop());
            } catch (mediaError) {
                console.error('❌ Media access error:', mediaError);
                let errorMessage = 'Cannot access microphone. ';

                if (mediaError.name === 'NotAllowedError' || mediaError.name === 'PermissionDeniedError') {
                    errorMessage += 'Please allow microphone permission in your browser and try again.';
                } else if (mediaError.name === 'NotFoundError') {
                    errorMessage += 'No microphone found. Please connect a microphone and try again.';
                } else {
                    errorMessage += 'Please check your microphone settings and try again.';
                }

                this.showError(errorMessage);
                return;
            }

            this.recognizedText = '';
            this.updateUI('listening');

            setTimeout(() => {
                try {
                    this.recognition.start();
                    this.isRecording = true;
                    console.log('🎤 Speech recognition started successfully');
                } catch (speechError) {
                    console.error('❌ Speech recognition start error:', speechError);
                    // If already started, stop and restart
                    if (speechError.name === 'InvalidStateError') {
                        this.recognition.stop();
                        setTimeout(() => {
                            this.recognition.start();
                            this.isRecording = true;
                        }, 300);
                    } else {
                        this.showError('Failed to start speech recognition. Please try again.');
                        this.updateUI('idle');
                    }
                }
            }, 100);

        } catch (error) {
            console.error('❌ Recording start error:', error);
            this.showError('Could not start recording. Please allow microphone access and try again.');
            this.updateUI('idle');
        }
    }

    stopRecording() {
        if (this.recognition && this.isRecording) {
            this.recognition.stop();
            this.isRecording = false;
            console.log('🛑 Recording stopped');
        }
    }

    onRecognitionStart() {
        console.log('🎤 Listening...');
        this.updateUI('listening');
    }

    onRecognitionResult(event) {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
                finalTranscript += transcript;
            } else {
                interimTranscript += transcript;
            }
        }

        if (finalTranscript) {
            this.recognizedText = finalTranscript;
            this.displayRecognizedText(finalTranscript);
            console.log('✅ Final transcript:', finalTranscript);
        } else if (interimTranscript) {
            this.displayRecognizedText(interimTranscript, true);
        }
    }

    onRecognitionError(event) {
        console.error('❌ Speech recognition error:', event.error, event);
        this.isRecording = false;

        let errorMessage = 'Speech recognition error. Please try again.';
        let actionTip = '';

        switch (event.error) {
            case 'no-speech':
                errorMessage = 'No speech detected. Please speak clearly and try again.';
                actionTip = 'Make sure you are speaking close to the microphone.';
                break;
            case 'audio-capture':
                errorMessage = 'Microphone not accessible. Please check your device settings.';
                actionTip = 'Check if your microphone is connected and working.';
                break;
            case 'not-allowed':
                errorMessage = 'Microphone permission denied. Please allow access in your browser.';
                actionTip = 'Click the microphone icon in your browser\'s address bar and allow access.';
                break;
            case 'network':
                errorMessage = 'Network error occurred. Please check your internet connection.';
                actionTip = 'Make sure you have a stable internet connection.';
                break;
            case 'service-not-allowed':
                errorMessage = 'Speech recognition service not available. Please try again later.';
                actionTip = 'The speech service might be temporarily unavailable.';
                break;
            case 'bad-grammar':
                errorMessage = 'Speech recognition configuration error.';
                actionTip = 'This is a technical error. Please refresh the page and try again.';
                break;
            case 'language-not-supported':
                errorMessage = 'Selected language is not supported for speech recognition.';
                actionTip = 'Try switching to English or Hindi for better support.';
                break;
            default:
                errorMessage = `Speech recognition failed: ${event.error}`;
                actionTip = 'Please refresh the page and try again.';
        }

        this.showDetailedError(errorMessage, actionTip);
        this.updateUI('idle');
        
        if (event.error === 'network' && !this.hasRetried) {
            console.log('🔄 Auto-retrying after network error...');
            this.hasRetried = true;
            setTimeout(() => {
                this.startRecording();
            }, 2000);
        }
    }

    onRecognitionEnd() {
        this.isRecording = false;
        this.hasRetried = false; // Reset retry flag
        console.log('🔚 Recognition ended');

        if (this.recognizedText) {
            console.log('🚀 Auto-analyzing recognized text:', this.recognizedText);
            this.analyzeSpeech(this.recognizedText);
        } else {
            this.updateUI('idle');
            this.showError('No speech recognized. Please try again.');
        }
    }

    async analyzeSpeech(text) {
        if (!text || text.trim().length === 0) {
            this.showError('Please speak your query clearly');
            this.updateUI('idle');
            return;
        }

        try {
            console.log('🎤 [VOICE] Starting analysis for:', text);
            this.updateUI('analyzing');

            const requestPayload = {
                text: text.trim(),
                language: this.currentLanguage
            };

            console.log('📤 [VOICE] Request payload:', requestPayload);

            const response = await fetch('/api/voice-diagnosis', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(requestPayload)
            });

            console.log('📥 [VOICE] Response status:', response.status);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Server error' }));
                throw new Error(errorData.error || `HTTP ${response.status}`);
            }

            const result = await response.json();
            console.log('✅ [VOICE] Analysis result:', result);
            
            if (!result.success) {
                throw new Error(result.error || 'Analysis failed');
            }

            if (!result.diagnosis) {
                throw new Error('Invalid response: missing diagnosis data');
            }
            
            this.displayDiagnosis(result);
            this.updateUI('complete');

        } catch (error) {
            console.error('❌ [VOICE] Analysis error:', error);
            
            if (!this.hasRetried) {
                console.log('🔄 [VOICE] Retrying analysis...');
                this.hasRetried = true;
                setTimeout(() => {
                    this.analyzeSpeech(text);
                }, 1500);
                return;
            }
            
            this.hasRetried = false;
            this.showError(`Analysis failed: ${error.message}. Please try speaking again with more details about your crop and symptoms.`);
            this.updateUI('idle');
        }
    }

    displayRecognizedText(text, isInterim = false) {
        const textDisplay = document.getElementById('recognizedText');
        if (textDisplay) {
            textDisplay.textContent = text;
            textDisplay.style.opacity = isInterim ? '0.6' : '1';
            textDisplay.style.fontStyle = isInterim ? 'italic' : 'normal';
        }
    }

    displayDiagnosis(result) {
        const container = document.getElementById('diagnosisResult');
        if (!container) return;

        this.diagnosisHistory.push({
            timestamp: new Date(),
            result: result
        });

        const diagnosis = result.diagnosis;
        const confidence = diagnosis.confidence || 0;
        const severity = diagnosis.severity || 'unknown';

        const severityColors = {
            'mild': '#22c55e',
            'moderate': '#f59e0b',
            'severe': '#ef4444',
            'unknown': '#6b7280'
        };

        const severityIcons = {
            'mild': 'check-circle',
            'moderate': 'exclamation-triangle',
            'severe': 'exclamation-circle',
            'unknown': 'question-circle'
        };

        container.innerHTML = `
            <div class="diagnosis-card" style="animation: slideIn 0.5s ease;">
                <!-- Header -->
                <div class="diagnosis-header" style="border-left: 4px solid ${severityColors[severity]}">
                    <div class="diagnosis-title">
                        <i class="fas fa-${severityIcons[severity]}" style="color: ${severityColors[severity]}"></i>
                        <h3>${diagnosis.disease_name}</h3>
                    </div>
                    ${confidence > 0 ? `
                    <div class="confidence-badge" style="background: ${this.getConfidenceColor(confidence)}">
                        ${confidence}% Confidence
                    </div>
                    ` : ''}
                </div>

                <!-- Extracted Info -->
                <div class="extracted-info">
                    <div class="info-item">
                        <i class="fas fa-seedling"></i>
                        <span><strong>Crop:</strong> ${result.extracted_info.crop}</span>
                    </div>
                    <div class="info-item">
                        <i class="fas fa-heartbeat"></i>
                        <span><strong>Severity:</strong> 
                            <span style="color: ${severityColors[severity]}; text-transform: capitalize;">
                                ${severity}
                            </span>
                        </span>
                    </div>
                </div>

                <!-- Confidence Bar -->
                ${confidence > 0 ? `
                <div class="confidence-bar-container">
                    <label>Diagnosis Confidence</label>
                    <div class="confidence-bar">
                        <div class="confidence-fill" style="width: ${confidence}%; background: ${this.getConfidenceColor(confidence)}; transition: width 1s ease;">
                            ${confidence}%
                        </div>
                    </div>
                </div>
                ` : ''}

                <!-- Symptoms -->
                ${this.renderSymptoms(diagnosis.symptoms_detected || result.extracted_info.symptoms)}

                <!-- Causes -->
                ${diagnosis.causes ? `
                <div class="diagnosis-section">
                    <h4><i class="fas fa-microscope"></i> Causes</h4>
                    <p>${diagnosis.causes}</p>
                </div>
                ` : ''}

                <!-- General Suggestions (if no confident diagnosis) -->
                ${diagnosis.general_suggestions ? `
                <div class="diagnosis-section">
                    <h4><i class="fas fa-info-circle"></i> Please Provide More Details</h4>
                    <ul class="suggestions-list">
                        ${diagnosis.general_suggestions.map(s => `<li>${s}</li>`).join('')}
                    </ul>
                </div>
                ` : ''}

                <!-- Treatment -->
                ${diagnosis.treatment ? this.renderTreatment(diagnosis.treatment, severity) : ''}

                <!-- Recommendations -->
                ${this.renderRecommendations(result.recommendations)}

                <!-- Next Steps -->
                ${this.renderNextSteps(result.next_steps)}

                <!-- Action Buttons -->
                <div class="diagnosis-actions">
                    <button onclick="voiceDiagnosis.startRecording()" class="action-btn secondary">
                        <i class="fas fa-microphone"></i> Diagnose Again
                    </button>
                    <button onclick="voiceDiagnosis.copyDiagnosis()" class="action-btn secondary">
                        <i class="fas fa-copy"></i> Copy Report
                    </button>
                    <button onclick="window.print()" class="action-btn primary">
                        <i class="fas fa-print"></i> Print Report
                    </button>
                </div>
            </div>
        `;

        container.style.display = 'block';
        
        setTimeout(() => {
            container.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 100);
    }

    renderSymptoms(symptoms) {
        if (!symptoms || symptoms.length === 0) return '';

        return `
            <div class="diagnosis-section">
                <h4><i class="fas fa-stethoscope"></i> Symptoms Detected</h4>
                <div class="symptoms-list">
                    ${symptoms.map(symptom => `
                        <span class="symptom-tag">
                            <i class="fas fa-check"></i> ${symptom}
                        </span>
                    `).join('')}
                </div>
            </div>
        `;
    }

    renderTreatment(treatment, severity) {
        return `
            <div class="diagnosis-section treatment-section">
                <h4><i class="fas fa-pills"></i> Treatment Recommendations</h4>
                
                <!-- Immediate Action -->
                <div class="treatment-item urgent">
                    <h5>🚨 Immediate Action</h5>
                    <p>${treatment.immediate}</p>
                </div>

                <!-- Organic Treatment -->
                <div class="treatment-item">
                    <h5>🌿 Organic Treatment</h5>
                    <ul>
                        ${treatment.organic.map(item => `<li>${item}</li>`).join('')}
                    </ul>
                </div>

                <!-- Chemical Treatment -->
                ${severity === 'severe' || severity === 'moderate' ? `
                    <div class="treatment-item">
                        <h5>💊 Chemical Treatment</h5>
                        <ul>
                            ${treatment.chemical.map(item => `<li>${item}</li>`).join('')}
                        </ul>
                    </div>
                ` : ''}

                <!-- Prevention -->
                <div class="treatment-item">
                    <h5>🛡️ Prevention</h5>
                    <ul>
                        ${treatment.prevention.map(item => `<li>${item}</li>`).join('')}
                    </ul>
                </div>
            </div>
        `;
    }

    renderRecommendations(recommendations) {
        if (!recommendations || recommendations.length === 0) return '';

        return `
            <div class="diagnosis-section">
                <h4><i class="fas fa-lightbulb"></i> Key Recommendations</h4>
                <ul class="recommendations-list">
                    ${recommendations.map(rec => `<li>${rec}</li>`).join('')}
                </ul>
            </div>
        `;
    }

    renderNextSteps(steps) {
        if (!steps || steps.length === 0) return '';

        return `
            <div class="diagnosis-section next-steps">
                <h4><i class="fas fa-tasks"></i> Next Steps</h4>
                <ol class="steps-list">
                    ${steps.map(step => `<li>${step}</li>`).join('')}
                </ol>
            </div>
        `;
    }

    getConfidenceColor(confidence) {
        if (confidence >= 80) return '#22c55e';
        if (confidence >= 60) return '#f59e0b';
        return '#ef4444';
    }

    updateUI(state) {
        const micButton = document.getElementById('voiceMicButton');
        const statusText = document.getElementById('voiceStatus');
        const loader = document.getElementById('voiceLoader');

        if (!micButton) return;

        switch (state) {
            case 'listening':
                micButton.classList.add('recording');
                micButton.innerHTML = '<i class="fas fa-stop"></i>';
                if (statusText) statusText.textContent = '🎤 Listening... Speak your query';
                if (loader) loader.style.display = 'none';
                break;

            case 'analyzing':
                micButton.classList.remove('recording');
                micButton.disabled = true;
                micButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
                if (statusText) statusText.textContent = '🔍 Analyzing your voice...';
                if (loader) loader.style.display = 'block';
                break;

            case 'complete':
                micButton.disabled = false;
                micButton.classList.remove('recording');
                micButton.innerHTML = '<i class="fas fa-microphone"></i>';
                if (statusText) statusText.textContent = '✅ Diagnosis complete';
                if (loader) loader.style.display = 'none';
                break;

            case 'idle':
            default:
                micButton.disabled = false;
                micButton.classList.remove('recording');
                micButton.innerHTML = '<i class="fas fa-microphone"></i>';
                if (statusText) statusText.textContent = 'Click microphone to start';
                if (loader) loader.style.display = 'none';
                break;
        }
    }

    showError(message) {
        const notification = document.createElement('div');
        notification.className = 'voice-error-notification';
        notification.innerHTML = `
            <i class="fas fa-exclamation-circle"></i>
            <span>${message}</span>
        `;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #ef4444, #dc2626);
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 12px;
            box-shadow: 0 8px 25px rgba(239, 68, 68, 0.3);
            z-index: 10000;
            animation: slideInRight 0.5s ease;
            display: flex;
            align-items: center;
            gap: 10px;
            font-weight: 500;
            max-width: 400px;
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.5s ease';
            setTimeout(() => notification.remove(), 500);
        }, 5000);
    }

    showDetailedError(message, tip) {
        const notification = document.createElement('div');
        notification.className = 'voice-error-notification detailed';
        notification.innerHTML = `
            <div style="display: flex; align-items: flex-start; gap: 12px;">
                <i class="fas fa-exclamation-circle" style="font-size: 1.2rem; margin-top: 2px;"></i>
                <div>
                    <div style="font-weight: 600; margin-bottom: 6px;">${message}</div>
                    <div style="font-size: 0.85rem; opacity: 0.9;">${tip}</div>
                </div>
            </div>
            <button onclick="this.parentElement.remove()" style="background: none; border: none; color: white; cursor: pointer; padding: 4px; margin-left: 8px;">
                <i class="fas fa-times"></i>
            </button>
        `;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #ef4444, #dc2626);
            color: white;
            padding: 1.2rem 1.5rem;
            border-radius: 12px;
            box-shadow: 0 8px 25px rgba(239, 68, 68, 0.3);
            z-index: 10000;
            animation: slideInRight 0.5s ease;
            display: flex;
            align-items: flex-start;
            font-weight: 500;
            max-width: 450px;
            line-height: 1.4;
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            if (notification.parentElement) {
                notification.style.animation = 'slideOutRight 0.5s ease';
                setTimeout(() => notification.remove(), 500);
            }
        }, 8000);
    }

    showSuccess(message) {
        const notification = document.createElement('div');
        notification.className = 'voice-success-notification';
        notification.innerHTML = `
            <i class="fas fa-check-circle"></i>
            <span>${message}</span>
        `;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #22c55e, #16a34a);
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 12px;
            box-shadow: 0 8px 25px rgba(34, 197, 94, 0.3);
            z-index: 10000;
            animation: slideInRight 0.5s ease;
            display: flex;
            align-items: center;
            gap: 10px;
            font-weight: 500;
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.5s ease';
            setTimeout(() => notification.remove(), 500);
        }, 3000);
    }

    copyDiagnosis() {
        const diagnosisCard = document.querySelector('.diagnosis-card');
        if (!diagnosisCard) return;

        const text = diagnosisCard.innerText;
        
        navigator.clipboard.writeText(text)
            .then(() => {
                this.showSuccess('✅ Diagnosis copied to clipboard!');
            })
            .catch(err => {
                console.error('Copy failed:', err);
                this.showError('Failed to copy. Please try again.');
            });
    }
}

let voiceDiagnosis;

document.addEventListener('DOMContentLoaded', () => {
    try {
        voiceDiagnosis = new VoiceDiagnosis();
        window.voiceDiagnosis = voiceDiagnosis;
        
        if (voiceDiagnosis.recognition) {
            console.log('✅ Voice Diagnosis system ready');
            
            const statusElement = document.getElementById('voiceCompatibilityStatus');
            if (statusElement) {
                const compatible = voiceDiagnosis.showCompatibilityStatus();
                statusElement.textContent = compatible ? '✅ Voice features available' : '❌ Limited voice support';
            }
        } else {
            console.warn('⚠️ Voice Diagnosis initialized with limited functionality');
        }
    } catch (error) {
        console.error('❌ Failed to initialize Voice Diagnosis:', error);
        
        const fallbackDiv = document.createElement('div');
        fallbackDiv.innerHTML = `
            <div style="background: #fee2e2; border: 1px solid #fecaca; color: #dc2626; padding: 12px; border-radius: 8px; margin: 16px; font-size: 14px;">
                <strong>⚠️ Voice Recognition Unavailable</strong><br>
                Voice diagnosis features are not available in your current browser or environment. 
                Please use Chrome, Edge, or Safari with microphone permission for full functionality.
            </div>
        `;
        
        const container = document.getElementById('voiceModal') || document.body;
        if (container) {
            container.insertBefore(fallbackDiv, container.firstChild);
        }
    }
});
