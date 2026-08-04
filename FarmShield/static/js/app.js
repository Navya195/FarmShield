'use strict';

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initHamburger();
  initUpload();
  initFarmerMode();
  loadDailyTasks();
  loadOutbreakMap();
  initWeatherAlerts();
  initExperts();
  initCommunity();

  const voiceBtn = document.getElementById('voiceBtn');
  if (voiceBtn) {
    voiceBtn.addEventListener('click', startVoiceAssistant);
  }

  const closeCamBtn = document.getElementById('closeCameraModal');
  if (closeCamBtn) {
    closeCamBtn.addEventListener('click', closeCameraModal);
  }
  const camUploadBtn = document.getElementById('cameraUploadBtn');
  if (camUploadBtn) {
    camUploadBtn.addEventListener('click', () => {
      document.getElementById('fileInput').click();
      closeCameraModal();
    });
  }
  const camCaptureBtn = document.getElementById('cameraCaptureBtn');
  if (camCaptureBtn) {
    camCaptureBtn.addEventListener('click', capturePhoto);
  }
});

function initTheme() {
  const toggle = document.getElementById('themeToggle');
  if (!toggle) return;
  const saved = localStorage.getItem('farmshield_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', saved);
  updateThemeIcon(saved);
  toggle.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('farmshield_theme', next);
    updateThemeIcon(next);
  });
}

function initFarmerMode() {
  const farmerModeBtn = document.getElementById('farmerModeToggle');
  if (!farmerModeBtn) return;
  
  const saved = localStorage.getItem('farmshield_farmer_mode') === 'true';
  if (saved) {
    document.documentElement.setAttribute('data-mode', 'farmer');
    farmerModeBtn.style.background = 'linear-gradient(135deg, #22c55e, #10b981)';
  }
  
  farmerModeBtn.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-mode');
    const isOn = current === 'farmer';
    const next = isOn ? 'normal' : 'farmer';
    document.documentElement.setAttribute('data-mode', next);
    localStorage.setItem('farmshield_farmer_mode', next === 'farmer');
    farmerModeBtn.style.background = next === 'farmer' 
      ? 'linear-gradient(135deg, #22c55e, #10b981)' 
      : 'linear-gradient(135deg, var(--farmer-primary), var(--farmer-success))';
    
    const message = next === 'farmer' 
      ? '👨‍🌾 Farmer Mode ON - Larger buttons & text for easier use'
      : '🔄 Normal Mode - Standard display';
    
    showNotification(message, 2000);
  });
}

function showNotification(message, duration = 2000) {
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    bottom: 100px;
    left: 24px;
    background: linear-gradient(135deg, var(--farmer-primary), var(--farmer-success));
    color: white;
    padding: 1rem 1.5rem;
    border-radius: 12px;
    font-weight: 600;
    z-index: 10000;
    box-shadow: 0 8px 25px rgba(34, 197, 94, 0.3);
    animation: slideInLeft 0.5s ease;
  `;
  notification.textContent = message;
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.animation = 'slideOutLeft 0.5s ease';
    setTimeout(() => notification.remove(), 500);
  }, duration);
}

function updateThemeIcon(theme) {
  const icon = document.querySelector('#themeToggle i');
  if (icon) {
    icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
  }
}

function initHamburger() {
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.getElementById('navLinks');
  if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
      navLinks.classList.toggle('active');
      hamburger.classList.toggle('active');
    });
  }
}

function initUpload() {
  const fileInput = document.getElementById('fileInput');
  if (!fileInput) return;
  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      handleFile(file);
    }
  });
}

function handleFile(file) {
  const previewImg = document.getElementById('previewImg');
  const previewPlaceholder = document.querySelector('.preview-placeholder');
  if (previewImg && previewPlaceholder) {
    previewImg.src = URL.createObjectURL(file);
    previewImg.classList.remove('hidden');
    previewPlaceholder.classList.add('hidden');
  }
  const resultBox = document.getElementById('resultBox');
  if (!resultBox) return;
  resultBox.innerHTML = `
    <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;padding:2rem;">
      <i class="fas fa-spinner fa-spin" style="font-size:3rem;color:var(--farmer-primary);margin-bottom:1rem;"></i>
      <p style="font-weight:600;color:var(--text);">🌿 Analyzing crop health with FarmShield AI...</p>
      <p style="color:var(--text-muted);font-size:0.85rem;margin-top:0.5rem;">This may take a few seconds</p>
    </div>
  `;
  const formData = new FormData();
  formData.append('file', file);
  fetch('/api/predict', {
    method: 'POST',
    body: formData,
    credentials: 'same-origin'
  })
  .then(res => {
    if (res.status === 401 || res.redirected) {
      showError('Session expired. Please <a href="/login" style="color:var(--farmer-primary);">login again</a>.');
      return null;
    }
    return res.json();
  })
  .then(data => {
    if (!data) return;
    if (data.error) {
      showError(data.error);
    } else if (data.success && data.disease) {
      renderResult(data);
    } else {
      showError('Unexpected response from server. Please try again.');
    }
  })
  .catch(err => {
    console.error('Diagnosis error:', err);
    showError('Could not reach diagnosis server. Please check your connection and try again.');
  });
}

function showError(msg) {
  const resultBox = document.getElementById('resultBox');
  if (resultBox) {
    resultBox.innerHTML = `
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;padding:2rem;color:var(--red-danger);text-align:center;">
        <i class="fas fa-exclamation-circle" style="font-size:3rem;margin-bottom:1rem;"></i>
        <p style="font-weight:700;">Diagnosis Failed</p>
        <p style="font-size:0.9rem;margin-top:0.5rem;">${msg}</p>
      </div>
    `;
  }
}

function renderResult(data) {
  const resultBox = document.getElementById('resultBox');
  if (!resultBox) return;
  const d = data.disease;
  const displayName = d.name || d.display || 'Unknown Disease';
  const confidence = typeof d.confidence === 'number' ? (d.confidence > 1 ? d.confidence : Math.round(d.confidence * 100)) : d.confidence;
  const severityBadge = `<span style="background:${d.color};color:white;padding:4px 10px;border-radius:20px;font-size:0.8rem;font-weight:700;margin-left:10px;">${d.severity}</span>`;
  const symptomsHtml = Array.isArray(d.symptoms) ? d.symptoms.map(s => `<li style="margin-bottom:0.2rem;">${s}</li>`).join('') : `<li>${d.symptoms}</li>`;
  const preventionHtml = Array.isArray(d.prevention) ? d.prevention.map(p => `<li style="margin-bottom:0.2rem;">${p}</li>`).join('') : `<li>${d.prevention}</li>`;
  resultBox.innerHTML = `
    <div style="display:flex;flex-direction:column;gap:1.5rem;animation:fadeIn 0.5s ease;text-align:left;padding:1rem;">
      <div style="display:flex;align-items:center;gap:1rem;border-bottom:1px solid var(--border);padding-bottom:1rem;">
        <div style="width:50px;height:50px;border-radius:50%;background:${d.color}22;color:${d.color};display:flex;align-items:center;justify-content:center;font-size:1.5rem;">
          <i class="${d.icon || 'fas fa-leaf'}"></i>
        </div>
        <div>
          <h3 style="font-size:1.4rem;font-weight:800;color:var(--text);">${displayName} ${severityBadge}</h3>
          <p style="color:var(--text-muted);font-size:0.9rem;">Crop: ${d.crop} &bull; Confidence: ${confidence}%</p>
        </div>
      </div>
      <div>
        <h4 style="font-weight:700;margin-bottom:0.4rem;color:var(--farmer-primary);"><i class="fas fa-notes-medical"></i> Symptoms</h4>
        <ul style="padding-left:1.2rem;list-style-type:disc;font-size:0.95rem;color:var(--text);">${symptomsHtml}</ul>
      </div>
      <div>
        <h4 style="font-weight:700;margin-bottom:0.4rem;color:var(--farmer-primary);"><i class="fas fa-hand-holding-medical"></i> Organic Treatment</h4>
        <p style="font-size:0.95rem;color:var(--text);">${d.organic}</p>
      </div>
      <div>
        <h4 style="font-weight:700;margin-bottom:0.4rem;color:var(--farmer-primary);"><i class="fas fa-flask"></i> Chemical Pesticide</h4>
        <p style="font-size:0.95rem;color:var(--text);">${d.pesticide}</p>
      </div>
      <div>
        <h4 style="font-weight:700;margin-bottom:0.4rem;color:var(--farmer-primary);"><i class="fas fa-shield-alt"></i> Prevention</h4>
        <ul style="padding-left:1.2rem;list-style-type:disc;font-size:0.95rem;color:var(--text);">${preventionHtml}</ul>
      </div>
      <div>
        <h4 style="font-weight:700;margin-bottom:0.4rem;color:var(--farmer-primary);"><i class="fas fa-seedling"></i> Fertilizer</h4>
        <p style="font-size:0.95rem;color:var(--text);">${d.fertilizer || 'Balanced NPK recommended'}</p>
      </div>
    </div>
  `;
}

function setVoiceMessage(disease, lang) {
  const msgEl = document.getElementById('voiceMessage');
  if (!msgEl) return;
  const translations = {
    hi: `सावधान! टमाटर में अर्ली ब्लाइट रोग पाया गया है। तुरंत मैंकोजेब दवा का छिड़काव करें।`,
    te: `జాగ్రత్త! టమోటాలో ఎర్లీ బ్లైట్ తెగులు కనుగొనబడింది. వెంటనే మంకోజెబ్ మందు పిచికారీ చేయండి.`,
    ta: `எச்சரிக்கை! தக்காளியில் ஆரம்ப கருகல் நோய் கண்டறியப்பட்டுள்ளது. உடனடியாக மேன்கோசெப் மருந்து தெளிக்கவும்.`,
    mr: `सावधान! टोमॅटोमध्ये अर्ली ब्लाइट रोग आढळला आहे. त्वरित मँकोझेब औषधाची फवारणी करा.`,
    en: `Warning! Early Blight has been detected in your Tomato crop. Spray Mancozeb immediately.`
  };
  msgEl.textContent = translations[lang] || translations['en'];
}

function changeLanguage(lang) {
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.remove('active');
    if (btn.getAttribute('data-lang') === lang) {
      btn.classList.add('active');
    }
  });
  const voiceMessage = document.getElementById('voiceMessage');
  if (voiceMessage) {
    const msg = {
      hi: `सावधान! टमाटर में अर्ली ब्लाइट रोग पाया गया है। तुरंत मैंकोजेब दवा का छिड़काव करें।`,
      te: `జాగ్రత్త! టమోటాలో ఎర్లీ బ్లైట్ తెగులు కనుగొనబడింది. వెంటనే మంకోజెబ్ మందు పిచికారీ చేయండి.`,
      ta: `எச்சரிக்கை! தக்காளியில் ஆரம்ப கருகல் நோய் கண்டறியப்பட்டுள்ளது. உடனடியாக மேன்கோசெப் மருந்து தெளிக்கவும்.`,
      mr: `सावधान! टोमॅटोमध्ये अर्ली ब्लाइट रोग आढळला आहे. त्वरित मँकोझेब औषधाची फवारणी करा.`,
      en: `Warning! Early Blight has been detected in your Tomato crop. Spray Mancozeb immediately.`
    };
    voiceMessage.textContent = msg[lang] || msg['en'];
  }
}

function playVoiceMessage() {
  const msgEl = document.getElementById('voiceMessage');
  if (!msgEl) return;
  const text = msgEl.textContent;
  const activeLang = document.querySelector('.lang-btn.active').getAttribute('data-lang');
  const utterance = new SpeechSynthesisUtterance(text);
  const langMap = { hi: 'hi-IN', te: 'te-IN', ta: 'ta-IN', mr: 'mr-IN', en: 'en-US' };
  utterance.lang = langMap[activeLang] || 'en-US';
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

function downloadVoiceMessage() {
  alert('Downloading voice guidelines in your local language... Audio file saved to Downloads.');
}

function shareVoiceMessage() {
  alert('Sharing local voice advisory via WhatsApp to your community...');
}

let cameraStream = null;

function openCameraModal() {
  const modal = document.getElementById('cameraModal');
  const video = document.getElementById('cameraVideo');
  const errorDiv = document.getElementById('cameraError');
  
  if (!modal) return;
  modal.classList.remove('hidden');
  
  errorDiv.classList.add('hidden');
  errorDiv.textContent = '';
  if (video) video.classList.remove('hidden');
  
  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      .then(stream => {
        cameraStream = stream;
        if (video) video.srcObject = stream;
      })
      .catch(err => {
        console.error('Camera access error:', err);
        showCameraError('Camera permission denied. Please allow access.');
      });
  } else {
    showCameraError('Camera is unavailable. Please upload an image.');
  }
}

function showCameraError(msg) {
  const video = document.getElementById('cameraVideo');
  const errorDiv = document.getElementById('cameraError');
  if (video) video.classList.add('hidden');
  if (errorDiv) {
    errorDiv.textContent = msg;
    errorDiv.classList.remove('hidden');
  }
}

function closeCameraModal() {
  const modal = document.getElementById('cameraModal');
  if (modal) modal.classList.add('hidden');
  
  if (cameraStream) {
    cameraStream.getTracks().forEach(track => track.stop());
    cameraStream = null;
  }
}

function capturePhoto() {
  const video = document.getElementById('cameraVideo');
  if (!video || video.classList.contains('hidden') || !cameraStream) {
    document.getElementById('fileInput').click();
    closeCameraModal();
    return;
  }
  
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth || 640;
  canvas.height = video.videoHeight || 480;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  
  canvas.toBlob(blob => {
    if (blob) {
      const file = new File([blob], 'captured_leaf.jpg', { type: 'image/jpeg' });
      handleFile(file);
    }
  }, 'image/jpeg');
  
  closeCameraModal();
}

function startCameraScan() {
  openCameraModal();
}

function startVoiceAssistant() {
  const voiceModal = document.getElementById('voiceModal');
  if (voiceModal) {
    voiceModal.classList.remove('hidden');
    if (!window.voiceDiagnosis) {
      window.voiceDiagnosis = new VoiceDiagnosis();
    }
    if (window.voiceDiagnosis) {
      window.voiceDiagnosis.setLanguage('en');
      const langSelect = document.getElementById('voiceLanguageSelect');
      if (langSelect) {
        langSelect.value = 'en';
      }
    }
  }
}

function calculateYieldLoss() {
  const currentLossText = document.getElementById('predictedLoss').textContent;
  const currentLoss = parseFloat(currentLossText.replace('%', '')) || 20;
  const expected = prompt('Enter your expected tomato harvest yield (in kilograms):', '1000');
  if (!expected) return;
  const expectedVal = parseFloat(expected);
  if (isNaN(expectedVal) || expectedVal <= 0) {
    alert('Please enter a valid positive number.');
    return;
  }
  const lossKg = Math.round(expectedVal * (currentLoss / 100));
  const finalVal = expectedVal - lossKg;
  const lossFin = Math.round(lossKg * 30);
  document.getElementById('expectedYield').textContent = `${expectedVal} kg`;
  document.getElementById('predictedLoss').textContent = `${currentLoss}%`;
  document.getElementById('predictedYield').textContent = `${finalVal} kg`;
  document.getElementById('lossValue').textContent = `₹${lossFin}`;
  const fill = document.querySelector('.yield-loss-fill');
  if (fill) {
    fill.style.width = `${currentLoss}%`;
  }
  alert('Crop yield loss and economic impact updated successfully based on Early Blight severity!');
}

function loadDailyTasks() {
  const taskList = document.getElementById('taskList');
  if (!taskList) return;
  const tasks = [
    { text: "Water tomato beds early morning to prevent fungal spore germination.", icon: "fa-droplet", done: false },
    { text: "Apply copper oxychloride organic spray to lower tomato leaves.", icon: "fa-spray-can", done: false },
    { text: "Prune yellow or spotted lower branches to maximize air flow.", icon: "fa-scissors", done: true },
    { text: "Check nearby tomato plants for dark concentric rings.", icon: "fa-magnifying-glass", done: false }
  ];
  taskList.innerHTML = tasks.map((t, i) => `
    <div style="display:flex;align-items:center;gap:1rem;background:var(--bg-card);border:1px solid var(--border);padding:1rem;border-radius:12px;margin-bottom:0.8rem;transition:all 0.3s ease;">
      <i class="fas ${t.icon}" style="color:var(--farmer-primary);font-size:1.2rem;"></i>
      <span style="flex:1;font-weight:500;color:var(--text);text-decoration:${t.done ? 'line-through' : 'none'};opacity:${t.done ? 0.6 : 1};">${t.text}</span>
      <input type="checkbox" ${t.done ? 'checked' : ''} style="width:20px;height:20px;cursor:pointer;" onchange="toggleTask(${i})"/>
    </div>
  `).join('');
}

window.toggleTask = function(index) {
  const rows = document.querySelectorAll('#taskList > div');
  if (rows[index]) {
    const span = rows[index].querySelector('span');
    const cb = rows[index].querySelector('input[type="checkbox"]');
    if (cb.checked) {
      span.style.textDecoration = 'line-through';
      span.style.opacity = '0.6';
    } else {
      span.style.textDecoration = 'none';
      span.style.opacity = '1';
    }
  }
};

function loadOutbreakMap() {
  const mapContainer = document.getElementById('outbreakMap');
  const outbreakList = document.getElementById('outbreakList');
  if (!mapContainer || !outbreakList) return;
  mapContainer.innerHTML = `
    <div style="width:100%;height:300px;background:var(--border);border-radius:12px;display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden;border:1px solid var(--border);">
      <div style="position:absolute;width:100%;height:100%;background-image:radial-gradient(circle, var(--farmer-primary)12 1px, transparent 1px);background-size:20px 20px;opacity:0.2;"></div>
      <div style="position:absolute;top:30%;left:45%;width:20px;height:20px;border-radius:50%;background:rgba(239,68,68,0.4);border:2px solid var(--red-danger);animation:pulse 2s infinite;"></div>
      <div style="position:absolute;top:60%;left:25%;width:16px;height:16px;border-radius:50%;background:rgba(245,158,11,0.4);border:2px solid var(--yellow-moderate);animation:pulse 2s infinite;"></div>
      <div style="position:absolute;top:50%;left:70%;width:18px;height:18px;border-radius:50%;background:rgba(249,115,22,0.4);border:2px solid var(--orange-warning);animation:pulse 2s infinite;"></div>
      <div style="font-weight:700;color:var(--text-muted);z-index:2;background:var(--bg-card);padding:10px 20px;border-radius:30px;box-shadow:var(--shadow);"><i class="fas fa-map-marker-alt" style="color:var(--red-danger);"></i> Hotspots Map Active</div>
    </div>
  `;
  const outbreaks = [
    { crop: "Tomato", disease: "Early Blight", distance: "4.2 km away", severity: "Severe", color: "var(--orange-warning)" },
    { crop: "Potato", disease: "Late Blight", distance: "12.5 km away", severity: "Critical", color: "var(--red-danger)" },
    { crop: "Rice", disease: "Blast Disease", distance: "28.1 km away", severity: "Moderate", color: "var(--yellow-moderate)" }
  ];
  outbreakList.innerHTML = outbreaks.map(o => `
    <div style="display:flex;align-items:center;justify-content:between;background:var(--bg-card);border:1px solid var(--border);padding:1rem;border-radius:12px;margin-bottom:0.8rem;">
      <div style="flex:1;text-align:left;">
        <h4 style="font-weight:700;color:var(--text);">${o.crop} ${o.disease}</h4>
        <p style="color:var(--text-muted);font-size:0.85rem;"><i class="fas fa-location-arrow"></i> ${o.distance}</p>
      </div>
      <span style="background:${o.color};color:white;padding:4px 10px;border-radius:20px;font-size:0.8rem;font-weight:700;">${o.severity}</span>
    </div>
  `).join('');
}

function initWeatherAlerts() {
  const container = document.getElementById('weatherAlerts');
  if (!container) return;
  const alerts = [
    { temp: "31°C", humidity: "82%", wind: "14km/h", advice: "High humidity and temperature favor Late Blight growth. Spray copper oxychloride preventive medication within 24 hours.", type: "warning", title: "Fungal Risk High" },
    { temp: "28°C", humidity: "90%", wind: "18km/h", advice: "Continuous rains expected tomorrow. Ensure proper trenching to drain water from tomato rows immediately.", type: "critical", title: "Waterlogging Risk" }
  ];
  container.innerHTML = alerts.map(a => `
    <div style="background:var(--bg-card);border:2px solid ${a.type === 'critical' ? 'var(--red-danger)' : 'var(--orange-warning)'};border-radius:16px;padding:1.5rem;margin-bottom:1rem;text-align:left;position:relative;overflow:hidden;">
      <div style="position:absolute;top:0;left:0;bottom:0;width:6px;background:${a.type === 'critical' ? 'var(--red-danger)' : 'var(--orange-warning)'};"></div>
      <div style="display:flex;justify-content:between;align-items:center;margin-bottom:0.8rem;flex-wrap:wrap;gap:0.5rem;">
        <h3 style="font-weight:800;color:var(--text);"><i class="fas fa-cloud-showers-water" style="color:var(--farmer-primary);"></i> ${a.title}</h3>
        <div style="display:flex;gap:10px;font-size:0.85rem;color:var(--text-muted);font-weight:600;">
          <span>Temp: ${a.temp}</span>|<span>Humidity: ${a.humidity}</span>|<span>Wind: ${a.wind}</span>
        </div>
      </div>
      <p style="line-height:1.5;font-size:0.95rem;color:var(--text);">${a.advice}</p>
    </div>
  `).join('');
}

function initExperts() {
  const grid = document.getElementById('expertGrid');
  if (!grid) return;
  const experts = [
    { name: "Dr. Ramesh Patel", role: "Plant Pathologist", specialization: "Fungal Blights & Rot", rating: "4.9 ★", location: "KVK Ludhiana", available: true },
    { name: "Prof. Savita Kulkarni", role: "Agronomy Expert", specialization: "Organic IPM & Fertilizer", rating: "4.8 ★", location: "IARI New Delhi", available: true },
    { name: "Er. Dinesh Kumar", role: "Smart Irrigation Specialist", specialization: "Drip & Fertigation Systems", rating: "4.7 ★", location: "TNAU Coimbatore", available: false }
  ];
  grid.innerHTML = experts.map(e => `
    <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:16px;padding:1.5rem;text-align:left;position:relative;transition:all 0.3s ease;">
      <span style="position:absolute;top:15px;right:15px;width:12px;height:12px;border-radius:50%;background:${e.available ? 'var(--green-healthy)' : 'var(--text-muted)'};" title="${e.available ? 'Available Now' : 'Busy'}"></span>
      <h3 style="font-weight:800;color:var(--text);margin-bottom:0.2rem;">${e.name}</h3>
      <p style="color:var(--farmer-primary);font-weight:600;font-size:0.9rem;margin-bottom:0.6rem;">${e.role}</p>
      <div style="font-size:0.85rem;color:var(--text-muted);line-height:1.4;margin-bottom:1rem;">
        <p>Specialty: ${e.specialization}</p>
        <p>Station: ${e.location}</p>
        <p>Rating: <span style="color:var(--yellow-moderate);font-weight:700;">${e.rating}</span></p>
      </div>
      <button class="farmer-btn-text" style="width:100%;justify-content:center;padding:12px;" onclick="callExpert('${e.name}')">
        <i class="fas fa-phone"></i> Call Expert
      </button>
    </div>
  `).join('');
}

window.callExpert = function(name) {
  alert(`Connecting you to ${name} via secure Agri-VoIP call... Please pick up the incoming call.`);
};

function initCommunity() {
  const posts = [
    { author: "Rajesh K. (Farmer)", location: "Punjab", crop: "Tomato", time: "2 hours ago", text: "Spotted early signs of leaf yellowing in crop today. Uploaded scan to FarmShield and got immediate early blight advice. Highly recommend applying Trichoderma before it spreads!", likes: 24 },
    { author: "Vicky Patil (Farmer)", location: "Maharashtra", crop: "Cotton", time: "1 day ago", text: "Organic garlic spray works wonders for soft insects like whitefly on cotton leaves. Highly recommend for fellow small holders in critical humidity zones.", likes: 18 }
  ];
  const list = document.getElementById('communityPosts');
  if (!list) return;
  list.innerHTML = posts.map((p, i) => `
    <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:16px;padding:1.5rem;margin-bottom:1rem;text-align:left;transition:all 0.3s ease;">
      <div style="display:flex;justify-content:between;margin-bottom:0.6rem;">
        <div>
          <h4 style="font-weight:800;color:var(--text);">${p.author}</h4>
          <p style="color:var(--text-muted);font-size:0.8rem;">Location: ${p.location} • Crop: ${p.crop}</p>
        </div>
        <span style="color:var(--text-muted);font-size:0.8rem;margin-left:auto;">${p.time}</span>
      </div>
      <p style="line-height:1.5;color:var(--text);margin-bottom:1rem;font-size:0.95rem;">${p.text}</p>
      <div style="display:flex;gap:1.5rem;font-size:0.9rem;color:var(--text-muted);">
        <button style="display:flex;align-items:center;gap:6px;cursor:pointer;color:inherit;" onclick="likePost(${i})">
          <i class="far fa-thumbs-up" style="color:var(--farmer-primary);"></i> <span class="likes-count">${p.likes}</span> Likes
        </button>
        <button style="display:flex;align-items:center;gap:6px;cursor:pointer;color:inherit;" onclick="alert('Comment interface coming soon!')">
          <i class="far fa-comment"></i> Comment
        </button>
      </div>
    </div>
  `).join('');
}

window.likePost = function(index) {
  const rows = document.querySelectorAll('#communityPosts > div');
  if (rows[index]) {
    const likeSpan = rows[index].querySelector('.likes-count');
    const current = parseInt(likeSpan.textContent) || 0;
    likeSpan.textContent = current + 1;
    const thumb = rows[index].querySelector('.fa-thumbs-up');
    thumb.className = 'fas fa-thumbs-up';
  }
};

window.submitPost = function() {
  const ta = document.querySelector('.post-form textarea');
  if (!ta) return;
  const val = ta.value.strip ? ta.value.strip() : ta.value.trim();
  if (!val) {
    alert('Please write something to post.');
    return;
  }
  const postsContainer = document.getElementById('communityPosts');
  if (postsContainer) {
    const div = document.createElement('div');
    div.style.background = 'var(--bg-card)';
    div.style.border = '1px solid var(--border)';
    div.style.borderRadius = '16px';
    div.style.padding = '1.5rem';
    div.style.marginBottom = '1rem';
    div.style.textAlign = 'left';
    div.style.animation = 'fadeIn 0.5s ease';
    div.innerHTML = `
      <div style="display:flex;justify-content:between;margin-bottom:0.6rem;">
        <div>
          <h4 style="font-weight:800;color:var(--text);">Self (Farmer)</h4>
          <p style="color:var(--text-muted);font-size:0.8rem;">Location: Local • Crop: General</p>
        </div>
        <span style="color:var(--text-muted);font-size:0.8rem;margin-left:auto;">Just now</span>
      </div>
      <p style="line-height:1.5;color:var(--text);margin-bottom:1rem;font-size:0.95rem;">${val}</p>
      <div style="display:flex;gap:1.5rem;font-size:0.9rem;color:var(--text-muted);">
        <button style="display:flex;align-items:center;gap:6px;cursor:pointer;color:inherit;">
          <i class="fas fa-thumbs-up" style="color:var(--farmer-primary);"></i> <span>1</span> Likes
        </button>
        <button style="display:flex;align-items:center;gap:6px;cursor:pointer;color:inherit;">
          <i class="far fa-comment"></i> Comment
        </button>
      </div>
    `;
    postsContainer.prepend(div);
    ta.value = '';
    alert('Your farming experience post was successfully shared with the community!');
  }
};

window.closeAlert = function() {
  const alertEl = document.getElementById('emergencyAlert');
  if (alertEl) {
    alertEl.classList.add('hidden');
  }
};

window.callKVK = function() {
  alert('Dialing Krishi Vigyan Kendra toll-free hotline: 1800-180-1551. Calling...');
};

window.callAgricultureDept = function() {
  alert('Dialing Kisan Call Centre toll-free hotline: 1551. Calling...');
};

window.callExpertHelpline = function() {
  alert('Dialing Agri-Expert Emergency Hotline: 1800-11-1363. Calling...');
};

window.changeLanguage = changeLanguage;
window.playVoiceMessage = playVoiceMessage;
window.downloadVoiceMessage = downloadVoiceMessage;
window.shareVoiceMessage = shareVoiceMessage;
window.startCameraScan = startCameraScan;
window.startVoiceAssistant = startVoiceAssistant;
window.calculateYieldLoss = calculateYieldLoss;
window.loadDailyTasks = loadDailyTasks;
window.loadOutbreakMap = loadOutbreakMap;
