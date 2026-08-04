'use strict';

document.addEventListener('DOMContentLoaded', () => {
  initFarmerMode();
  checkNetworkStatus();
  initAutoSlideshow();
});

function initFarmerMode() {
  const toggle = document.getElementById('farmerModeToggle');
  if (!toggle) return;
  const savedMode = localStorage.getItem('farmshield_mode') || 'normal';
  document.body.setAttribute('data-mode', savedMode);
  updateFarmerModeUI(savedMode);
  toggle.addEventListener('click', () => {
    const current = document.body.getAttribute('data-mode') || 'normal';
    const next = current === 'farmer' ? 'normal' : 'farmer';
    document.body.setAttribute('data-mode', next);
    localStorage.setItem('farmshield_mode', next);
    updateFarmerModeUI(next);
    speakModeActivation(next);
  });
}

function updateFarmerModeUI(mode) {
  const toggle = document.getElementById('farmerModeToggle');
  if (!toggle) return;
  const icon = toggle.querySelector('i');
  if (mode === 'farmer') {
    toggle.style.background = 'linear-gradient(135deg, #f59e0b, #d97706)';
    if (icon) icon.className = 'fas fa-times-circle';
  } else {
    toggle.style.background = 'linear-gradient(135deg, var(--farmer-primary), var(--farmer-success))';
    if (icon) icon.className = 'fas fa-user-farmer';
  }
}

function speakModeActivation(mode) {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  let text = '';
  let lang = 'hi-IN';
  const activeLangBtn = document.querySelector('.lang-btn.active');
  const activeLang = activeLangBtn ? activeLangBtn.getAttribute('data-lang') : 'hi';
  if (mode === 'farmer') {
    if (activeLang === 'hi') {
      text = 'किसान मोड चालू है। बड़ी लिखावट और आवाज़ सहायता सक्रिय है। फसल की जांच के लिए नीचे कैमरा बटन दबाएं।';
      lang = 'hi-IN';
    } else if (activeLang === 'te') {
      text = 'రైతు మోడ్ ప్రారంభించబడింది. పెద్ద అక్షరాలు మరియు వాయిస్ సహాయం అందుబాటులో ఉన్నాయి.';
      lang = 'te-IN';
    } else if (activeLang === 'ta') {
      text = 'விவசாயி முறை செயல்படுத்தப்பட்டது. பெரிய எழுத்துருக்கள் மற்றும் குரல் உதவி செயலில் உள்ளன.';
      lang = 'ta-IN';
    } else if (activeLang === 'mr') {
      text = 'शेतकरी मोड चालू केला आहे. मोठी अक्षरे आणि आवाज मदत सक्रिय आहे.';
      lang = 'mr-IN';
    } else {
      text = 'Farmer Mode activated. Simplified layout and voice assistant is enabled. Press the camera scan button to diagnose crop.';
      lang = 'en-US';
    }
  } else {
    if (activeLang === 'hi') {
      text = 'सामान्य मोड सक्रिय है।';
      lang = 'hi-IN';
    } else {
      text = 'Standard layout activated.';
      lang = 'en-US';
    }
  }
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  window.speechSynthesis.speak(utterance);
}

function checkNetworkStatus() {
  const offlineEl = document.getElementById('offlineMode');
  if (!offlineEl) return;
  const updateStatus = () => {
    if (navigator.onLine) {
      offlineEl.innerHTML = '<i class="fas fa-wifi"></i> <span>Online Mode</span>';
      offlineEl.classList.remove('offline');
    } else {
      offlineEl.innerHTML = '<i class="fas fa-wifi-slash"></i> <span>Offline AI Active</span>';
      offlineEl.classList.add('offline');
      speakOfflineActivation();
    }
  };
  window.addEventListener('online', updateStatus);
  window.addEventListener('offline', updateStatus);
  updateStatus();
}

function speakOfflineActivation() {
  if (!('speechSynthesis' in window)) return;
  const activeLangBtn = document.querySelector('.lang-btn.active');
  const activeLang = activeLangBtn ? activeLangBtn.getAttribute('data-lang') : 'hi';
  let text = '';
  let lang = 'hi-IN';
  if (activeLang === 'hi') {
    text = 'इंटरनेट बंद है। फार्मशील्ड ऑफलाइन एआई सक्रिय है। आप बिना इंटरनेट के भी फसल की जांच कर सकते हैं।';
    lang = 'hi-IN';
  } else {
    text = 'Network disconnected. FarmShield Offline AI is active. You can still scan and diagnose crop diseases offline.';
    lang = 'en-US';
  }
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  window.speechSynthesis.speak(utterance);
}

function initAutoSlideshow() {
  const hero = document.querySelector('.hero');
  if (!hero) return;
  const images = [
    'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?q=80&w=1600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1593113630400-ea4288922497?q=80&w=1600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?q=80&w=1600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1605000797499-95a51c5269ae?q=80&w=1600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1595841696677-6489ff3f8cd1?q=80&w=1600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1563514227147-6d2ff665a6a0?q=80&w=1600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1495107334309-fcf20504a5ab?q=80&w=1600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1464226184884-fa280b87c399?q=80&w=1600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=1600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1574943320219-553eb213f72d?q=80&w=1600&auto=format&fit=crop'
  ];
  
  images.forEach(src => {
    const img = new Image();
    img.src = src;
  });

  let currentIdx = 0;
  const slide1 = document.createElement('div');
  const slide2 = document.createElement('div');
  const styles = 'position:absolute;top:0;left:0;right:0;bottom:0;background-size:cover;background-position:center;background-repeat:no-repeat;transition:opacity 1.5s ease-in-out;z-index:0;';
  slide1.style.cssText = styles + 'opacity:1; background-image:url("' + images[0] + '");';
  slide2.style.cssText = styles + 'opacity:0; background-image:url("' + images[1] + '");';
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:absolute;top:0;left:0;right:0;bottom:0;background:rgba(15,23,42,0.65);z-index:0;';
  hero.style.position = 'relative';
  hero.style.overflow = 'hidden';
  hero.prepend(overlay);
  hero.prepend(slide2);
  hero.prepend(slide1);
  setInterval(() => {
    currentIdx = (currentIdx + 1) % images.length;
    const nextIdx = (currentIdx + 1) % images.length;
    if (slide1.style.opacity === '1') {
      slide2.style.backgroundImage = 'url("' + images[currentIdx] + '")';
      slide2.style.opacity = '1';
      slide1.style.opacity = '0';
    } else {
      slide1.style.backgroundImage = 'url("' + images[currentIdx] + '")';
      slide1.style.opacity = '1';
      slide2.style.opacity = '0';
    }
  }, 3000);
}
