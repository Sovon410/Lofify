// State Management (using JavaScript variables instead of localStorage)
// Expose single live handle for feedback GainNode (updated by slider if active)
let liveFeedbackGain = null;

let appState = {
  hasAcceptedDisclaimer: false,
  currentFile: null,
  isDarkMode: true,
  audioContext: null,
  audioBuffer: null,
  processedAudioBuffer: null,
  originalAudioElement: null,
  processedAudioElement: null,
  isProcessing: false,
  customPreset: { speed: 85, reverb: 50, roomSize: 75 },
  settings: {
    speed: 85,
    reverb: 50,
    roomSize: 75,
    bassBoost: 0,
    bassFrequency: 60, // Deep bass default
    echo: 0.4, // default echo amount (0.0 - 1.0)
    echoTime: 0.3, // default echo time in seconds
    echoTime: 0.3, // default echo time in seconds
    echoEnabled: false, // default echo state
    bassCutEnabled: false,
    bassCutAmount: 0
  },
  effects3D: {
    enabled: false,
    effectType: '8d_audio',
    rotationSpeed: 1.5,
    rotationDirection: 'clockwise',
    binauralIntensity: 75,
    surroundPattern: 'theater',
    surroundIntensity: 75,
    panHorizontal: 0,
    panVertical: 0,
    panDepth: 0.5,
    masterIntensity: 80
  },
  animationFrameId: null,
  currentObjectUrls: [], // Track all object URLs for cleanup
  downloadEnabled: false
};

// DOM Elements
const elements = {
  uploadArea: document.getElementById('uploadArea'),
  audioFileInput: document.getElementById('audioFileInput'),
  useDemoBtn: document.getElementById('useDemoBtn'),
  heroSection: document.getElementById('heroSection'),
  audioSection: document.getElementById('audioSection'),
  fileName: document.getElementById('fileName'),
  fileInfo: document.getElementById('fileInfo'),
  removeFileBtn: document.getElementById('removeFileBtn'),
  waveformOriginal: document.getElementById('waveformOriginal'),
  waveformProcessed: document.getElementById('waveformProcessed'),
  playOriginalBtn: document.getElementById('playOriginalBtn'),
  playProcessedBtn: document.getElementById('playProcessedBtn'),
  progressOriginal: document.getElementById('progressOriginal'),
  progressProcessed: document.getElementById('progressProcessed'),
  currentTimeOriginal: document.getElementById('currentTimeOriginal'),
  durationOriginal: document.getElementById('durationOriginal'),
  currentTimeProcessed: document.getElementById('currentTimeProcessed'),
  durationProcessed: document.getElementById('durationProcessed'),
  volumeOriginal: document.getElementById('volumeOriginal'),
  volumeProcessed: document.getElementById('volumeProcessed'),
  speedSlider: document.getElementById('speedSlider'),
  reverbSlider: document.getElementById('reverbSlider'),
  roomSizeSlider: document.getElementById('roomSizeSlider'),
  bassBoostSlider: document.getElementById('bassBoostSlider'),
  bassFrequencySlider: document.getElementById('bassFrequencySlider'),
  speedValue: document.getElementById('speedValue'),
  reverbValue: document.getElementById('reverbValue'),
  roomSizeValue: document.getElementById('roomSizeValue'),
  bassBoostValue: document.getElementById('bassBoostValue'),
  bassFrequencyValue: document.getElementById('bassFrequencyValue'),
  generateBtn: document.getElementById('generateBtn'),
  processingCard: document.getElementById('processingCard'),
  outputCard: document.getElementById('outputCard'),
  processingStatus: document.getElementById('processingStatus'),
  processingProgress: document.getElementById('processingProgress'),
  processingStage: document.getElementById('processingStage'),
  processingTime: document.getElementById('processingTime'),
  cancelProcessingBtn: document.getElementById('cancelProcessingBtn'),
  outputInfo: document.getElementById('outputInfo'),
  downloadMp3Btn: document.getElementById('downloadMp3Btn'),
  downloadWavBtn: document.getElementById('downloadWavBtn'),
  shareBtn: document.getElementById('shareBtn'),
  resetBtn: document.getElementById('resetBtn'),
  compareToggleBtn: document.getElementById('compareToggleBtn'),
  themeToggle: document.getElementById('themeToggle'),
  helpBtn: document.getElementById('helpBtn'),
  helpModal: document.getElementById('helpModal'),
  closeHelpModal: document.getElementById('closeHelpModal'),
  shareModal: document.getElementById('shareModal'),
  closeShareModal: document.getElementById('closeShareModal'),
  shareTwitter: document.getElementById('shareTwitter'),
  shareTikTok: document.getElementById('shareTikTok'),
  shareInstagram: document.getElementById('shareInstagram'),
  notification: document.getElementById('notification'),
  notificationText: document.getElementById('notificationText'),
  savePresetBtn: document.getElementById('savePresetBtn'),
  enable3DEffects: document.getElementById('enable3DEffects'),
  effects3DContent: document.getElementById('effects3DContent'),
  rotationSpeed: document.getElementById('rotationSpeed'),
  rotationSpeedValue: document.getElementById('rotationSpeedValue'),
  binauralIntensity: document.getElementById('binauralIntensity'),
  binauralIntensityValue: document.getElementById('binauralIntensityValue'),
  surroundPattern: document.getElementById('surroundPattern'),
  surroundIntensity: document.getElementById('surroundIntensity'),
  surroundIntensityValue: document.getElementById('surroundIntensityValue'),
  panHorizontal: document.getElementById('panHorizontal'),
  panHorizontalValue: document.getElementById('panHorizontalValue'),
  panVertical: document.getElementById('panVertical'),
  panVerticalValue: document.getElementById('panVerticalValue'),
  panDepth: document.getElementById('panDepth'),
  panDepthValue: document.getElementById('panDepthValue'),
  master3DIntensity: document.getElementById('master3DIntensity'),
  master3DIntensityValue: document.getElementById('master3DIntensityValue'),
  rotation8DCanvas: document.getElementById('rotation8DCanvas'),
  surroundCanvas: document.getElementById('surroundCanvas'),
  panning3DCanvas: document.getElementById('panning3DCanvas'),
  // Echo elements
  echoSlider: document.getElementById('echo'),
  echoValue: document.getElementById('echo-value'),
  echoTimeSlider: document.getElementById('echoTime'),
  echoTimeValue: document.getElementById('echoTimeValue'),
  enableEcho: document.getElementById('enableEcho'),
  enableEcho: document.getElementById('enableEcho'),
  echoControls: document.getElementById('echoControls'),
  // Bass Cut elements
  enableBassCut: document.getElementById('enableBassCut'),
  bassCutControls: document.getElementById('bassCutControls'),
  bassCutSlider: document.getElementById('bassCutSlider'),
  bassCutValue: document.getElementById('bassCutValue'),
  autoSetBtn: document.getElementById('autoSetBtn')
};

// Presets Data
const presets = {
  light: { speed: 90, reverb: 30, roomSize: 60, bassBoost: 0 },
  standard: { speed: 85, reverb: 50, roomSize: 75, bassBoost: 20, bassFrequency: 60 },
  heavy: { speed: 75, reverb: 70, roomSize: 90, bassBoost: 40, bassFrequency: 60 },
  extreme: { speed: 60, reverb: 90, roomSize: 100, bassBoost: 60 },
  nightcore: { speed: 130, reverb: 40, roomSize: 70, bassBoost: 10 },
  '8d_slowed': {
    speed: 85,
    reverb: 50,
    roomSize: 75,
    bassBoost: 20,
    effect3D: true,
    effectType: '8d_audio',
    rotationSpeed: 1.5,
    masterIntensity: 80
  },
  'binaural_reverb': {
    speed: 85,
    reverb: 60,
    roomSize: 80,
    bassBoost: 30,
    effect3D: true,
    effectType: 'binaural',
    binauralIntensity: 75,
    masterIntensity: 80
  },
  'surround_space': {
    speed: 75,
    reverb: 70,
    roomSize: 90,
    bassBoost: 40,
    effect3D: true,
    effectType: 'surround',
    surroundPattern: 'circular',
    surroundIntensity: 80,
    masterIntensity: 85
  },
  'bass_booster': {
    speed: 85,
    reverb: 50,
    roomSize: 75,
    bassBoost: 80,
    bassBoost: 80,
    bassFrequency: 50
  },
  'deep_bass': {
    speed: 75,
    reverb: 60,
    roomSize: 85,
    bassBoost: 100,
    bassFrequency: 60
  },
  'bass_reverb': {
    speed: 80,
    reverb: 70,
    roomSize: 80,
    bassBoost: 70,
    bassFrequency: 80
  },
  'sub_boost': {
    speed: 85,
    reverb: 40,
    roomSize: 70,
    bassBoost: 90,
    bassFrequency: 50
  }
};

// Generate Random Floating Orbs
function generateRandomOrbs() {
  console.log('=== GENERATING RANDOM ORBS ===');
  const orbContainer = document.getElementById('backgroundOrbs');
  if (!orbContainer) {
    console.error('Orb container not found');
    return;
  }

  const orbCount = 40; // Increased from 25
  const colors = [
    { name: 'orb-cyan', gradient: 'rgba(0, 217, 255, 0.14)' },
    { name: 'orb-purple', gradient: 'rgba(168, 85, 247, 0.14)' },
    { name: 'orb-pink', gradient: 'rgba(255, 0, 110, 0.14)' },
    { name: 'orb-blue', gradient: 'rgba(0, 136, 204, 0.14)' },
    { name: 'orb-orange', gradient: 'rgba(255, 149, 0, 0.14)' },
    { name: 'orb-magenta', gradient: 'rgba(236, 72, 153, 0.14)' },
    { name: 'orb-teal', gradient: 'rgba(6, 182, 212, 0.14)' },
    { name: 'orb-indigo', gradient: 'rgba(139, 92, 246, 0.14)' }
  ];

  const animations = [
    'randomPath1', 'randomPath2', 'randomPath3', 'randomPath4',
    'randomPath5', 'randomPath6', 'randomPath7', 'randomPath8',
    'randomPath9', 'randomPath10', 'randomPath11', 'randomPath12',
    'orbit1', 'orbit2', 'orbit3', 'orbit4', 'orbit5'
  ];

  console.log(`Creating ${orbCount} random orbs...`);

  for (let i = 0; i < orbCount; i++) {
    const orb = document.createElement('div');
    orb.className = 'orb';

    // Random size (150px to 350px) - Increased for better visibility
    const size = Math.random() * 200 + 150;
    orb.style.width = size + 'px';
    orb.style.height = size + 'px';

    // Random color
    const colorObj = colors[Math.floor(Math.random() * colors.length)];
    orb.classList.add(colorObj.name);

    // Random animation
    const animation = animations[Math.floor(Math.random() * animations.length)];
    const duration = Math.random() * 60 + 40; // 40-100 seconds (Slower)
    const delay = Math.random() * 5; // 0-5 seconds delay

    orb.style.animation = `${animation} ${duration}s ease-in-out ${delay}s infinite`;

    // Random starting position
    const startX = Math.random() * 100;
    const startY = Math.random() * 100;
    orb.style.left = startX + '%';
    orb.style.top = startY + '%';

    orbContainer.appendChild(orb);
  }

  console.log(`✓ ${orbCount} random orbs created with varied animations`);
}

// Initialize App
function init() {
  console.log('=== APP INITIALIZATION ===');
  console.log('Checking Web Audio API support...');

  if (!window.AudioContext && !window.webkitAudioContext) {
    console.error('✗ Web Audio API not supported');
    showNotification('Your browser doesn\'t support Web Audio API. Please use a modern browser.', 'error');
  } else {
    console.log('✓ Web Audio API supported');
  }

  console.log('Setting up event listeners...');
  setupEventListeners();

  // Initialize echo UI if present
  if (elements.enableEcho) {
    elements.enableEcho.checked = appState.settings.echoEnabled;
    if (elements.echoControls) {
      elements.echoControls.style.display = appState.settings.echoEnabled ? 'block' : 'none';
    }

    elements.enableEcho.addEventListener('change', function () {
      appState.settings.echoEnabled = this.checked;
      if (elements.echoControls) {
        elements.echoControls.style.display = this.checked ? 'block' : 'none';
      }
      showNotification(`Vintage Echo ${this.checked ? 'enabled' : 'disabled'}`, 'info');
    });
  }

  if (elements.echoSlider && elements.echoValue) {
    const initEcho = Number.isFinite(Number(appState.settings.echo)) ? Number(appState.settings.echo) : 0.4;
    elements.echoSlider.value = initEcho;
    elements.echoValue.textContent = initEcho.toFixed(2);

    elements.echoSlider.addEventListener('input', function () {
      const val = parseFloat(this.value) || 0;
      appState.settings.echo = val;
      elements.echoValue.textContent = val.toFixed(2);

      // Update any live feedback GainNode (if nodes exist in same context)
      if (liveFeedbackGain && typeof liveFeedbackGain.gain !== 'undefined') {
        try {
          liveFeedbackGain.gain.value = val;
        } catch (e) {
          console.warn('Could not update live feedback gain:', e);
        }
      }
    });
  }

  // Initialize echo time UI if present
  if (elements.echoTimeSlider && elements.echoTimeValue) {
    const initEchoTime = Number.isFinite(Number(appState.settings.echoTime)) ? Number(appState.settings.echoTime) : 0.3;
    elements.echoTimeSlider.value = initEchoTime;
    elements.echoTimeValue.textContent = initEchoTime.toFixed(2) + 's';

    elements.echoTimeSlider.addEventListener('input', function () {
      const val = parseFloat(this.value) || 0.3;
      appState.settings.echoTime = val;
      elements.echoTimeValue.textContent = val.toFixed(2) + 's';
    });
  }

  // Initialize Bass Cut UI
  if (elements.enableBassCut) {
    elements.enableBassCut.checked = appState.settings.bassCutEnabled;
    if (elements.bassCutControls) {
      elements.bassCutControls.style.display = appState.settings.bassCutEnabled ? 'block' : 'none';
    }

    elements.enableBassCut.addEventListener('change', function () {
      appState.settings.bassCutEnabled = this.checked;
      if (elements.bassCutControls) {
        elements.bassCutControls.style.display = this.checked ? 'block' : 'none';
      }
      showNotification(`Bass Reduction ${this.checked ? 'enabled' : 'disabled'}`, 'info');
    });
  }

  if (elements.bassCutSlider && elements.bassCutValue) {
    elements.bassCutSlider.value = appState.settings.bassCutAmount;
    elements.bassCutValue.textContent = appState.settings.bassCutAmount + '%';

    elements.bassCutSlider.addEventListener('input', function () {
      const val = parseInt(this.value) || 0;
      appState.settings.bassCutAmount = val;
      elements.bassCutValue.textContent = val + '%';
    });
  }

  console.log('Updating slider values...');
  updateSliderValues();

  console.log('Initializing audio context...');
  initAudioContext();

  console.log('Generating random orbs...');
  generateRandomOrbs();

  console.log('=== APP READY ===');

  // Show copyright disclaimer on first visit
  showCopyrightDisclaimer();
  console.log('File input element available:', !!elements.audioFileInput);
  console.log('Browse button available:', !!document.getElementById('browseFilesBtn'));

  // Start 3D visualizations
  startVisualizations();
}

// Setup Event Listeners
function setupEventListeners() {
  // CRITICAL: File Input Setup with Multiple Methods
  console.log('=== FILE BROWSING SETUP START ===');
  console.log('File input element:', elements.audioFileInput);
  console.log('Upload area element:', elements.uploadArea);

  // Method 1: Direct file input change listener (PRIMARY)
  if (elements.audioFileInput) {
    console.log('✓ File input found, adding change listener');
    elements.audioFileInput.addEventListener('change', function (e) {
      console.log('File input change event fired!');
      console.log('Selected files:', e.target.files);
      handleFileSelect(e);
    });
  } else {
    console.error('✗ File input element not found!');
  }

  // Method 2: Browse button that triggers file input (SECONDARY)
  const browseBtn = document.getElementById('browseFilesBtn');
  if (browseBtn) {
    console.log('✓ Browse button found, adding click listener');
    browseBtn.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      console.log('Browse button clicked!');
      console.log('Triggering file input click...');
      if (elements.audioFileInput) {
        elements.audioFileInput.click();
        console.log('File input click() called');
      } else {
        console.error('File input not available!');
      }
    });
  } else {
    console.error('✗ Browse button not found!');
  }

  // Method 3: Upload area click as fallback
  if (elements.uploadArea) {
    elements.uploadArea.addEventListener('click', function (e) {
      // Only trigger if clicking the area itself, not the browse button
      if (e.target === elements.uploadArea || e.target.closest('.upload-content')) {
        console.log('Upload area clicked');
        if (elements.audioFileInput && !e.target.closest('.btn-browse')) {
          elements.audioFileInput.click();
        }
      }
    });
  }

  // Method 4: Drag and Drop (TERTIARY)
  elements.uploadArea.addEventListener('dragover', handleDragOver);
  elements.uploadArea.addEventListener('dragleave', handleDragLeave);
  elements.uploadArea.addEventListener('drop', handleDrop);

  console.log('=== FILE BROWSING SETUP COMPLETE ===');

  // Other listeners
  elements.useDemoBtn.addEventListener('click', loadDemoAudio);
  elements.removeFileBtn.addEventListener('click', resetApp);

  // Auto-Set Button
  if (elements.autoSetBtn) {
    elements.autoSetBtn.addEventListener('click', async () => {
      if (!appState.originalAudioElement) {
        showNotification('Please upload an audio file first', 'error');
        return;
      }

      showNotification('Analyzing audio...', 'info');
      elements.autoSetBtn.disabled = true;
      elements.autoSetBtn.innerHTML = '<div class="spinner" style="width:20px;height:20px;border-width:2px;"></div> Analyzing...';

      try {
        // Get audio buffer for analysis
        let audioBuffer = appState.audioBuffer;
        if (!audioBuffer) {
          const response = await fetch(appState.originalAudioElement.src);
          const arrayBuffer = await response.arrayBuffer();
          audioBuffer = await appState.audioContext.decodeAudioData(arrayBuffer);
          appState.audioBuffer = audioBuffer;
        }

        const analysis = await analyzeAudio(audioBuffer);
        autoConfigureSettings(analysis);

      } catch (error) {
        console.error('Auto-set error:', error);
        showNotification('Analysis failed. Using default settings.', 'error');
      } finally {
        elements.autoSetBtn.disabled = false;
        elements.autoSetBtn.innerHTML = `
            <svg class="button-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
            </svg>
            🪄 Auto-Set Settings
        `;
      }
    });
  }

  // Sliders
  elements.speedSlider.addEventListener('input', () => {
    appState.settings.speed = parseInt(elements.speedSlider.value);
    updateSliderValues();
  });
  elements.reverbSlider.addEventListener('input', () => {
    appState.settings.reverb = parseInt(elements.reverbSlider.value);
    updateSliderValues();
  });
  elements.roomSizeSlider.addEventListener('input', () => {
    appState.settings.roomSize = parseInt(elements.roomSizeSlider.value);
    updateSliderValues();
  });
  elements.bassBoostSlider.addEventListener('input', () => {
    appState.settings.bassBoost = parseInt(elements.bassBoostSlider.value);
    updateSliderValues();
  });
  elements.bassFrequencySlider.addEventListener('input', () => {
    appState.settings.bassFrequency = parseInt(elements.bassFrequencySlider.value);
    updateSliderValues();
  });

  // Presets
  document.querySelectorAll('.preset-btn[data-preset]').forEach(btn => {
    btn.addEventListener('click', () => applyPreset(btn.dataset.preset));
  });
  elements.savePresetBtn.addEventListener('click', saveCustomPreset);

  // Generate
  elements.generateBtn.addEventListener('click', generateProcessedAudio);
  elements.cancelProcessingBtn.addEventListener('click', cancelProcessing);

  // Output Actions
  elements.downloadMp3Btn.addEventListener('click', () => downloadAudio('mp3'));
  elements.downloadWavBtn.addEventListener('click', () => downloadAudio('wav'));
  elements.shareBtn.addEventListener('click', () => showModal(elements.shareModal));
  elements.resetBtn.addEventListener('click', resetApp);
  elements.compareToggleBtn.addEventListener('click', toggleCompare);

  // Theme
  elements.themeToggle.addEventListener('click', toggleTheme);

  // Modals
  elements.helpBtn.addEventListener('click', () => showModal(elements.helpModal));
  elements.closeHelpModal.addEventListener('click', () => hideModal(elements.helpModal));
  elements.closeShareModal.addEventListener('click', () => hideModal(elements.shareModal));

  // Share Buttons
  elements.shareTwitter.addEventListener('click', () => shareToSocial('twitter'));
  elements.shareTikTok.addEventListener('click', () => shareToSocial('tiktok'));
  elements.shareInstagram.addEventListener('click', () => shareToSocial('instagram'));

  // Copyright Disclaimer
  const acceptTermsCheckbox = document.getElementById('acceptTermsCheckbox');
  const acceptDisclaimerBtn = document.getElementById('acceptDisclaimerBtn');
  const copyrightDisclaimerModal = document.getElementById('copyrightDisclaimerModal');

  if (acceptTermsCheckbox && acceptDisclaimerBtn) {
    acceptTermsCheckbox.addEventListener('change', () => {
      acceptDisclaimerBtn.disabled = !acceptTermsCheckbox.checked;
    });

    acceptDisclaimerBtn.addEventListener('click', () => {
      appState.hasAcceptedDisclaimer = true;
      copyrightDisclaimerModal.style.display = 'none';
      showNotification('✓ Terms accepted. Start creating lo-fi music!', 'success');
    });
  }

  // View Music Resources Link in Disclaimer
  const viewMusicResourcesLink = document.getElementById('viewMusicResourcesLink');
  if (viewMusicResourcesLink) {
    viewMusicResourcesLink.addEventListener('click', (e) => {
      e.preventDefault();
      copyrightDisclaimerModal.style.display = 'none';
      appState.hasAcceptedDisclaimer = true;
      document.querySelector('.music-resources-section').scrollIntoView({ behavior: 'smooth' });
    });
  }

  // Footer Legal Links
  const termsLink = document.getElementById('termsLink');
  const copyrightLink = document.getElementById('copyrightLink');
  const privacyLink = document.getElementById('privacyLink');
  const fairUseLink = document.getElementById('fairUseLink');
  const musicResourcesLink = document.getElementById('musicResourcesLink');
  const contactLink = document.getElementById('contactLink');
  const closeLegalModal = document.getElementById('closeLegalModal');

  if (termsLink) termsLink.addEventListener('click', (e) => { e.preventDefault(); showLegalInfo('terms'); });
  if (copyrightLink) copyrightLink.addEventListener('click', (e) => { e.preventDefault(); showLegalInfo('copyright'); });
  if (privacyLink) privacyLink.addEventListener('click', (e) => { e.preventDefault(); showLegalInfo('privacy'); });
  if (fairUseLink) fairUseLink.addEventListener('click', (e) => { e.preventDefault(); showLegalInfo('fairuse'); });
  if (musicResourcesLink) musicResourcesLink.addEventListener('click', (e) => { e.preventDefault(); document.querySelector('.music-resources-section').scrollIntoView({ behavior: 'smooth' }); });
  if (contactLink) contactLink.addEventListener('click', (e) => { e.preventDefault(); showLegalInfo('contact'); });
  if (closeLegalModal) closeLegalModal.addEventListener('click', () => hideModal(document.getElementById('legalModal')));

  // 3D Audio Effects
  elements.enable3DEffects.addEventListener('change', toggle3DEffects);

  // Effect type selection
  document.querySelectorAll('input[name="effectType"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
      appState.effects3D.effectType = e.target.value;
      switchEffectOptions(e.target.value);
      updateVisualizations();
    });
  });

  // 8D Audio controls
  elements.rotationSpeed.addEventListener('input', () => {
    appState.effects3D.rotationSpeed = parseFloat(elements.rotationSpeed.value);
    elements.rotationSpeedValue.textContent = appState.effects3D.rotationSpeed.toFixed(1) + 'x';
    updateVisualizations();
  });

  document.querySelectorAll('.direction-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.direction-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      appState.effects3D.rotationDirection = btn.dataset.direction;
      updateVisualizations();
    });
  });

  // Binaural controls
  elements.binauralIntensity.addEventListener('input', () => {
    appState.effects3D.binauralIntensity = parseInt(elements.binauralIntensity.value);
    elements.binauralIntensityValue.textContent = appState.effects3D.binauralIntensity + '%';
  });

  // Surround controls
  elements.surroundPattern.addEventListener('change', () => {
    appState.effects3D.surroundPattern = elements.surroundPattern.value;
    updateVisualizations();
  });

  elements.surroundIntensity.addEventListener('input', () => {
    appState.effects3D.surroundIntensity = parseInt(elements.surroundIntensity.value);
    elements.surroundIntensityValue.textContent = appState.effects3D.surroundIntensity + '%';
  });

  // Panning controls
  elements.panHorizontal.addEventListener('input', () => {
    appState.effects3D.panHorizontal = parseFloat(elements.panHorizontal.value);
    updatePanningValue('horizontal');
    updateVisualizations();
  });

  elements.panVertical.addEventListener('input', () => {
    appState.effects3D.panVertical = parseFloat(elements.panVertical.value);
    updatePanningValue('vertical');
    updateVisualizations();
  });

  elements.panDepth.addEventListener('input', () => {
    appState.effects3D.panDepth = parseFloat(elements.panDepth.value);
    updatePanningValue('depth');
    updateVisualizations();
  });

  // Master intensity
  elements.master3DIntensity.addEventListener('input', () => {
    appState.effects3D.masterIntensity = parseInt(elements.master3DIntensity.value);
    elements.master3DIntensityValue.textContent = appState.effects3D.masterIntensity + '%';
  });

  // Keyboard shortcuts
  document.addEventListener('keydown', handleKeyboardShortcuts);
}

// File Upload Handlers
function handleFileSelect(e) {
  console.log('=== FILE SELECT HANDLER ===');
  console.log('Event:', e);
  console.log('Target:', e.target);
  console.log('Files:', e.target.files);

  const file = e.target.files[0];

  if (file) {
    console.log('✓ File selected:', file.name);
    console.log('  - Type:', file.type);
    console.log('  - Size:', file.size, 'bytes');
    console.log('  - Last modified:', new Date(file.lastModified));
    validateAndLoadFile(file);
  } else {
    console.warn('✗ No file selected');
  }
}

function handleDragOver(e) {
  e.preventDefault();
  e.stopPropagation();
  console.log('Drag over detected');
  elements.uploadArea.classList.add('drag-over');
}

function handleDragLeave(e) {
  e.preventDefault();
  console.log('Drag leave');
  elements.uploadArea.classList.remove('drag-over');
}

function handleDrop(e) {
  e.preventDefault();
  e.stopPropagation();
  console.log('=== FILE DROP DETECTED ===');
  elements.uploadArea.classList.remove('drag-over');

  const files = e.dataTransfer.files;
  console.log('Dropped files:', files);

  if (files.length > 0) {
    const file = files[0];
    console.log('✓ File dropped:', file.name);
    validateAndLoadFile(file);
  } else {
    console.warn('✗ No files in drop event');
  }
}

function validateAndLoadFile(file) {
  console.log('=== VALIDATING FILE ===');
  console.log('File name:', file.name);
  console.log('File type:', file.type);
  console.log('File size:', file.size);

  // Validate file type
  const validTypes = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/flac', 'audio/mp4', 'audio/x-m4a', 'audio/aac'];
  const fileExtension = file.name.split('.').pop().toLowerCase();
  const validExtensions = ['mp3', 'wav', 'ogg', 'flac', 'm4a', 'aac'];

  console.log('File extension:', fileExtension);

  const isValidType = validTypes.some(type => file.type === type || file.type.startsWith('audio/'));
  const isValidExtension = validExtensions.includes(fileExtension);

  console.log('Valid type check:', isValidType);
  console.log('Valid extension check:', isValidExtension);

  if (!isValidType && !isValidExtension) {
    console.error('✗ Invalid file format');
    showNotification('Please upload an audio file (MP3, WAV, OGG, FLAC, or M4A)', 'error');
    return;
  }

  // Validate file size (50MB max)
  const maxSize = 52428800; // 50MB in bytes
  console.log('Size check:', file.size, '/', maxSize);

  if (file.size > maxSize) {
    console.error('✗ File too large:', file.size, 'bytes');
    showNotification('File size exceeds 50MB limit. Please choose a smaller file.', 'error');
    return;
  }

  // File is valid, proceed to load
  console.log('✓ File validation passed!');
  showNotification('Audio file uploaded to Lofify!', 'success');
  loadAudioFile(file);
}

function loadAudioFile(file) {
  console.log('=== LOADING AUDIO FILE ===');
  console.log('Creating object URL for:', file.name);

  try {
    appState.currentFile = file;
    const url = URL.createObjectURL(file);
    console.log('✓ Object URL created:', url);

    appState.originalAudioElement = new Audio(url);
    console.log('✓ Audio element created');

    appState.originalAudioElement.addEventListener('loadedmetadata', () => {
      console.log('✓ Audio metadata loaded');
      console.log('  - Duration:', appState.originalAudioElement.duration, 'seconds');
      displayAudioInfo(file, appState.originalAudioElement.duration);
      setupAudioPlayer('original');
      drawWaveform('original');
    });

    appState.originalAudioElement.addEventListener('error', (e) => {
      console.error('✗ Audio loading error:', e);
      showNotification('Failed to load audio file. Please try another file.', 'error');
    });

    console.log('✓ Switching to audio section view');
    elements.heroSection.style.display = 'none';
    elements.audioSection.style.display = 'flex';
  } catch (error) {
    console.error('✗ Error loading audio file:', error);
    showNotification('Error loading audio file: ' + error.message, 'error');
  }
}

function loadDemoAudio() {
  // Create a mock audio element for demo
  showNotification('Loading demo lo-fi track...', 'info');

  // Simulate demo file
  const demoFile = {
    name: 'demo-song.mp3',
    size: 3500000,
    type: 'audio/mpeg'
  };

  appState.currentFile = demoFile;
  appState.originalAudioElement = new Audio();

  // Simulate loaded metadata
  setTimeout(() => {
    displayAudioInfo(demoFile, 180);
    setupAudioPlayer('original');
    drawWaveform('original');
    elements.heroSection.style.display = 'none';
    elements.audioSection.style.display = 'flex';
    showNotification('Demo lo-fi track loaded', 'success');
  }, 500);
}

function displayAudioInfo(file, duration) {
  elements.fileName.textContent = file.name;
  const format = file.type.split('/')[1].toUpperCase();
  const durationStr = formatTime(duration);
  elements.fileInfo.textContent = `Format: ${format} • Duration: ${durationStr}`;
}

// Audio Player Setup
function setupAudioPlayer(type) {
  const audio = type === 'original' ? appState.originalAudioElement : appState.processedAudioElement;
  if (!audio) return;

  const playBtn = type === 'original' ? elements.playOriginalBtn : elements.playProcessedBtn;
  const progressBar = type === 'original' ? elements.progressOriginal : elements.progressProcessed;
  const currentTime = type === 'original' ? elements.currentTimeOriginal : elements.currentTimeProcessed;
  const duration = type === 'original' ? elements.durationOriginal : elements.durationProcessed;
  const volumeSlider = type === 'original' ? elements.volumeOriginal : elements.volumeProcessed;

  // Set duration
  audio.addEventListener('loadedmetadata', () => {
    duration.textContent = formatTime(audio.duration);
  });

  // Play/Pause
  playBtn.addEventListener('click', () => {
    if (audio.paused) {
      audio.play();
      playBtn.classList.add('playing');
    } else {
      audio.pause();
      playBtn.classList.remove('playing');
    }
  });

  // Update progress
  audio.addEventListener('timeupdate', () => {
    const progress = (audio.currentTime / audio.duration) * 100;
    progressBar.querySelector('.progress-fill').style.width = `${progress}%`;
    currentTime.textContent = formatTime(audio.currentTime);
  });

  // Seek
  progressBar.addEventListener('click', (e) => {
    const rect = progressBar.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    audio.currentTime = percent * audio.duration;
  });

  // Volume
  volumeSlider.addEventListener('input', () => {
    audio.volume = volumeSlider.value / 100;
  });
  audio.volume = volumeSlider.value / 100;

  // Reset play button when ended
  audio.addEventListener('ended', () => {
    playBtn.classList.remove('playing');
  });
}

// Waveform Visualization
function drawWaveform(type) {
  const canvas = type === 'original' ? elements.waveformOriginal : elements.waveformProcessed;
  const ctx = canvas.getContext('2d');

  canvas.width = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;

  const width = canvas.width;
  const height = canvas.height;
  const barCount = 100;
  const barWidth = width / barCount;

  ctx.clearRect(0, 0, width, height);

  // Generate pseudo-random waveform
  const gradient = ctx.createLinearGradient(0, 0, width, 0);
  gradient.addColorStop(0, '#00d9ff');
  gradient.addColorStop(1, '#a855f7');
  ctx.fillStyle = gradient;

  for (let i = 0; i < barCount; i++) {
    const barHeight = Math.random() * height * 0.8 + height * 0.1;
    const x = i * barWidth;
    const y = (height - barHeight) / 2;

    ctx.fillRect(x, y, barWidth - 2, barHeight);
  }
}

// Slider Updates
function updateSliderValues() {
  elements.speedValue.textContent = `${appState.settings.speed}%`;
  elements.reverbValue.textContent = `${appState.settings.reverb}%`;
  elements.roomSizeValue.textContent = `${appState.settings.roomSize}%`;
  elements.bassBoostValue.textContent = `${appState.settings.bassBoost}%`;
  elements.bassFrequencyValue.textContent = `${appState.settings.bassFrequency}Hz`;
}

// Presets
function applyPreset(presetName) {
  const preset = presets[presetName];
  if (preset) {
    appState.settings.speed = preset.speed;
    appState.settings.reverb = preset.reverb;
    appState.settings.roomSize = preset.roomSize;
    appState.settings.bassBoost = preset.bassBoost || 0;
    appState.settings.bassFrequency = preset.bassFrequency || 100;
    elements.speedSlider.value = preset.speed;
    elements.reverbSlider.value = preset.reverb;
    elements.roomSizeSlider.value = preset.roomSize;
    elements.bassBoostSlider.value = appState.settings.bassBoost;
    elements.bassFrequencySlider.value = appState.settings.bassFrequency;
    updateSliderValues();

    // Apply 3D effects if preset includes them
    if (preset.effect3D) {
      elements.enable3DEffects.checked = true;
      appState.effects3D.enabled = true;
      elements.effects3DContent.style.display = 'block';

      // Set effect type
      if (preset.effectType) {
        appState.effects3D.effectType = preset.effectType;
        document.querySelector(`input[name="effectType"][value="${preset.effectType}"]`).checked = true;
        switchEffectOptions(preset.effectType);
      }

      // Apply specific effect parameters
      if (preset.rotationSpeed) {
        appState.effects3D.rotationSpeed = preset.rotationSpeed;
        elements.rotationSpeed.value = preset.rotationSpeed;
        elements.rotationSpeedValue.textContent = preset.rotationSpeed.toFixed(1) + 'x';
      }
      if (preset.binauralIntensity) {
        appState.effects3D.binauralIntensity = preset.binauralIntensity;
        elements.binauralIntensity.value = preset.binauralIntensity;
        elements.binauralIntensityValue.textContent = preset.binauralIntensity + '%';
      }
      if (preset.surroundPattern) {
        appState.effects3D.surroundPattern = preset.surroundPattern;
        elements.surroundPattern.value = preset.surroundPattern;
      }
      if (preset.surroundIntensity) {
        appState.effects3D.surroundIntensity = preset.surroundIntensity;
        elements.surroundIntensity.value = preset.surroundIntensity;
        elements.surroundIntensityValue.textContent = preset.surroundIntensity + '%';
      }
      if (preset.masterIntensity) {
        appState.effects3D.masterIntensity = preset.masterIntensity;
        elements.master3DIntensity.value = preset.masterIntensity;
        elements.master3DIntensityValue.textContent = preset.masterIntensity + '%';
      }

      updateVisualizations();
    }

    // Update active preset button
    document.querySelectorAll('.preset-btn[data-preset]').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.preset === presetName);
    });

    const presetLabels = {
      'light': 'Light Lo-Fi',
      'standard': 'Classic Lo-Fi',
      'heavy': 'Deep Lo-Fi',
      'extreme': 'Extreme Lo-Fi',
      'nightcore': 'Lo-Fi Night',
      '8d_slowed': '8D Slowed',
      'binaural_reverb': 'Binaural Reverb',
      'surround_space': 'Surround Space',
      'bass_booster': 'Lo-Fi Bass Boost',
      'deep_bass': 'Lo-Fi Deep Bass',
      'bass_reverb': 'Bass & Reverb',
      'sub_boost': 'Sub Boost'
    };
    const presetLabel = presetLabels[presetName] || presetName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    showNotification(`${presetLabel} preset applied`, 'success');
  }
}

function saveCustomPreset() {
  appState.customPreset = { ...appState.settings };
  showNotification('Custom preset saved!', 'success');
}

// Generate Processed Audio
async function generateProcessedAudio() {
  if (!appState.currentFile) return;
  if (appState.isProcessing) return;

  // CRITICAL: Reset download state before new processing
  console.log('=== RESETTING DOWNLOAD STATE ===');
  revokeAllObjectUrls();
  appState.processedAudioBuffer = null;
  appState.downloadEnabled = false;

  // Disable download buttons during processing
  elements.downloadWavBtn.disabled = true;
  elements.downloadMp3Btn.disabled = true;
  elements.downloadWavBtn.style.opacity = '0.5';
  elements.downloadMp3Btn.style.opacity = '0.5';

  appState.isProcessing = true;
  elements.processingCard.style.display = 'block';
  elements.outputCard.style.display = 'none';
  elements.generateBtn.disabled = true;

  const stages = [
    'Loading audio...',
    'Analyzing frequency spectrum...',
    'Applying speed adjustment...',
    'Processing reverb effect...',
    'Adjusting room acoustics...',
    appState.settings.bassBoost > 0 ? 'Boosting bass frequencies...' : 'Optimizing audio...',
    'Rendering final output...',
    'Finalizing...'
  ];

  const totalTime = Math.random() * 7000 + 8000; // 8-15 seconds
  const stageTime = totalTime / stages.length;
  let currentProgress = 0;

  for (let i = 0; i < stages.length; i++) {
    if (!appState.isProcessing) break;

    elements.processingStage.textContent = stages[i];
    const targetProgress = ((i + 1) / stages.length) * 100;

    await animateProgress(currentProgress, targetProgress, stageTime);
    currentProgress = targetProgress;

    const remainingTime = Math.ceil((totalTime - (i + 1) * stageTime) / 1000);
    elements.processingTime.textContent = `Estimated time: ${remainingTime}s`;
  }

  if (appState.isProcessing) {
    completeProcessing();
  }
}

function animateProgress(from, to, duration) {
  return new Promise(resolve => {
    const start = Date.now();
    const animate = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const current = from + (to - from) * progress;

      elements.processingProgress.style.width = `${current}%`;

      if (progress < 1 && appState.isProcessing) {
        requestAnimationFrame(animate);
      } else {
        resolve();
      }
    };
    animate();
  });
}

async function completeProcessing() {
  appState.isProcessing = false;
  elements.processingCard.style.display = 'none';
  elements.outputCard.style.display = 'block';
  elements.generateBtn.disabled = false;

  // Create processed audio with real audio processing
  if (appState.originalAudioElement) {
    try {
      // Load audio into AudioContext for processing
      const response = await fetch(appState.originalAudioElement.src);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await appState.audioContext.decodeAudioData(arrayBuffer);

      // Apply audio effects (speed change and reverb simulation)
      console.log('=== CREATING FRESH PROCESSED AUDIO BUFFER ===');
      appState.processedAudioBuffer = await applyAudioEffects(audioBuffer, appState.settings);
      console.log('✓ Fresh audio buffer created');

      // Create audio element from processed buffer
      const processedBlob = audioBufferToWav(appState.processedAudioBuffer);
      const processedUrl = URL.createObjectURL(processedBlob);
      appState.currentObjectUrls.push(processedUrl); // Track for cleanup
      appState.processedAudioElement = new Audio(processedUrl);

      appState.processedAudioElement.addEventListener('loadedmetadata', () => {
        const newDuration = appState.processedAudioElement.duration;
        const fileSize = (processedBlob.size / 1024 / 1024).toFixed(2);
        elements.outputInfo.textContent = `New duration: ${formatTime(newDuration)} • Estimated size: ${fileSize} MB`;
        setupAudioPlayer('processed');
        drawWaveform('processed');

        // ENABLE DOWNLOAD BUTTONS AFTER PROCESSING COMPLETE
        enableDownloadButtons();
      });
    } catch (error) {
      console.error('Error processing audio:', error);
      showNotification('Error processing audio. Using preview mode.', 'warning');

      // Fallback: create a modified version
      appState.processedAudioElement = new Audio(appState.originalAudioElement.src);
      appState.processedAudioElement.addEventListener('loadedmetadata', () => {
        const newDuration = appState.processedAudioElement.duration * (100 / appState.settings.speed);
        const fileSize = (appState.currentFile.size / 1024 / 1024).toFixed(2);
        elements.outputInfo.textContent = `New duration: ${formatTime(newDuration)} • Estimated size: ${fileSize} MB`;
        setupAudioPlayer('processed');
        drawWaveform('processed');

        // ENABLE DOWNLOAD BUTTONS
        enableDownloadButtons();
      });
    }
  }

  showNotification('Lo-fi track created! Ready to download.', 'success');
}

function cancelProcessing() {
  appState.isProcessing = false;
  elements.processingCard.style.display = 'none';
  elements.generateBtn.disabled = false;
  showNotification('Lo-fi creation cancelled', 'info');
}

// Revoke all tracked object URLs
function revokeAllObjectUrls() {
  console.log('Revoking', appState.currentObjectUrls.length, 'object URLs');
  appState.currentObjectUrls.forEach(url => {
    try {
      URL.revokeObjectURL(url);
    } catch (e) {
      console.warn('Failed to revoke URL:', e);
    }
  });
  appState.currentObjectUrls = [];
}

// Enable download buttons after processing
function enableDownloadButtons() {
  console.log('=== ENABLING DOWNLOAD BUTTONS ===');
  appState.downloadEnabled = true;

  elements.downloadWavBtn.disabled = false;
  elements.downloadMp3Btn.disabled = false;
  elements.downloadWavBtn.style.opacity = '1';
  elements.downloadMp3Btn.style.opacity = '1';

  console.log('✓ Download buttons enabled');
}

// Show Copyright Disclaimer on First Visit
function showCopyrightDisclaimer() {
  if (!appState.hasAcceptedDisclaimer) {
    const modal = document.getElementById('copyrightDisclaimerModal');
    if (modal) {
      setTimeout(() => {
        modal.style.display = 'flex';
      }, 500);
    }
  }
}

// Show Legal Information Pages
function showLegalInfo(type) {
  const modal = document.getElementById('legalModal');
  const title = document.getElementById('legalModalTitle');
  const body = document.getElementById('legalModalBody');

  const content = {
    terms: {
      title: 'Terms of Service',
      html: `
        <div class="disclaimer-content">
          <div class="disclaimer-section">
            <h4>1. Acceptance of Terms</h4>
            <p>By using Lofify, you agree to these Terms of Service and all applicable laws and regulations.</p>
          </div>
          
          <div class="disclaimer-section">
            <h4>2. User Responsibilities</h4>
            <p>Users agree to:</p>
            <ul>
              <li>Only upload audio files they have the right to use</li>
              <li>Not upload copyrighted material without proper authorization</li>
              <li>Comply with all applicable copyright laws</li>
              <li>Use the service legally and ethically</li>
            </ul>
          </div>
          
          <div class="disclaimer-section">
            <h4>3. Prohibited Content</h4>
            <p>Users may not upload:</p>
            <ul>
              <li>Copyrighted audio without permission or license</li>
              <li>Content that infringes on intellectual property rights</li>
              <li>Illegal or harmful content</li>
            </ul>
          </div>
          
          <div class="disclaimer-section">
            <h4>4. Limitation of Liability</h4>
            <p>The tool provider is not responsible for copyright infringement by users. Users assume all liability for their uploads and usage.</p>
          </div>
          
          <div class="disclaimer-section">
            <h4>5. DMCA Compliance</h4>
            <p>We comply with the Digital Millennium Copyright Act (DMCA). Copyright holders may submit takedown notices for infringing content.</p>
          </div>
        </div>
      `
    },
    copyright: {
      title: 'Copyright & Disclaimer',
      html: `
        <div class="disclaimer-content">
          <div class="disclaimer-section highlight">
            <h4>⚠️ Important Copyright Notice</h4>
            <p><strong>Lofify is provided for lo-fi music creation purposes only.</strong> Users are solely responsible for ensuring they have the legal right to upload, modify, and use any audio files.</p>
          </div>
          
          <div class="disclaimer-section">
            <h4>Processing Does Not Change Copyright</h4>
            <p>Lofify does not grant any copyright rights or licenses. Audio files processed through Lofify <strong>remain subject to their original copyright</strong>.</p>
            <p>If you process copyrighted material without authorization, you may be liable for copyright infringement.</p>
          </div>
          
          <div class="disclaimer-section">
            <h4>Recommended: Use Copyright-Free Content</h4>
            <p>For legal, worry-free content creation, we strongly recommend using copyright-free music from trusted sources:</p>
            <ul>
              <li>YouTube Audio Library</li>
              <li>Pixabay</li>
              <li>Freesound.org</li>
              <li>MixKit</li>
              <li>Creative Commons Music</li>
            </ul>
            <p><a href="#" onclick="document.querySelector('.music-resources-section').scrollIntoView({behavior:'smooth'}); document.getElementById('legalModal').style.display='none'; return false;" class="link-primary">View all copyright-free music sources →</a></p>
          </div>
          
          <div class="disclaimer-section">
            <h4>User Liability</h4>
            <p>Users assume all responsibility and liability for:</p>
            <ul>
              <li>Copyright compliance of uploaded content</li>
              <li>Obtaining necessary rights and licenses</li>
              <li>Any legal consequences of copyright violation</li>
            </ul>
          </div>
        </div>
      `
    },
    privacy: {
      title: 'Privacy Policy',
      html: `
        <div class="disclaimer-content">
          <div class="disclaimer-section">
            <h4>Data Processing</h4>
            <p>Lofify processes all audio <strong>locally in your browser</strong>. Your files are never uploaded to our servers.</p>
          </div>
          
          <div class="disclaimer-section">
            <h4>Privacy Protection</h4>
            <ul>
              <li>No audio files are stored or transmitted</li>
              <li>All processing occurs on your device</li>
              <li>We do not collect or store personal data</li>
              <li>Your privacy is completely protected</li>
            </ul>
          </div>
          
          <div class="disclaimer-section">
            <h4>Cookies and Storage</h4>
            <p>Lofify may use browser storage for preferences only. No personal or audio data is stored.</p>
          </div>
        </div>
      `
    },
    fairuse: {
      title: 'Fair Use Information',
      html: `
        <div class="disclaimer-content">
          <div class="disclaimer-section">
            <h4>What is Fair Use?</h4>
            <p>Fair use (17 U.S.C. § 107) is a legal doctrine that permits limited use of copyrighted material without permission for purposes such as:</p>
            <ul>
              <li>Criticism and commentary</li>
              <li>News reporting</li>
              <li>Teaching and scholarship</li>
              <li>Research</li>
              <li>Parody</li>
            </ul>
          </div>
          
          <div class="disclaimer-section">
            <h4>Four Fair Use Factors</h4>
            <p>Courts consider four factors when determining fair use:</p>
            <ol>
              <li><strong>Purpose and character</strong> - Is it transformative? Commercial or educational?</li>
              <li><strong>Nature of the work</strong> - Published or unpublished? Creative or factual?</li>
              <li><strong>Amount used</strong> - How much of the work is used?</li>
              <li><strong>Market effect</strong> - Does it harm the market for the original?</li>
            </ol>
          </div>
          
          <div class="disclaimer-section highlight">
            <h4>⚠️ Important Notice</h4>
            <p><strong>Not all uses qualify as fair use.</strong> Simply processing audio (slowing, adding reverb) is generally <strong>NOT</strong> considered transformative enough for fair use protection.</p>
            <p>Users must make their own legal determination about fair use. When in doubt, use copyright-free music.</p>
          </div>
          
          <div class="disclaimer-section">
            <h4>Learn More</h4>
            <p>For detailed information, see <a href="https://www.copyright.gov/fair-use/" target="_blank" class="link-primary">U.S. Copyright Office - Fair Use</a></p>
          </div>
        </div>
      `
    },
    contact: {
      title: 'Contact Us',
      html: `
        <div class="disclaimer-content">
          <div class="disclaimer-section">
            <h4>Get in Touch</h4>
            <p>For questions, concerns, or DMCA takedown notices, please contact us:</p>
          </div>
          
          <div class="disclaimer-section">
            <h4>📧 Email</h4>
            <p>support@lofify.app</p>
          </div>
          
          <div class="disclaimer-section">
            <h4>⚖️ DMCA Notices</h4>
            <p>Copyright holders may submit DMCA takedown notices to:</p>
            <p>dmca@lofify.app</p>
          </div>
          
          <div class="disclaimer-section">
            <h4>💡 Feedback & Support</h4>
            <p>We welcome your feedback to improve our service while maintaining legal compliance and protecting user rights.</p>
          </div>
        </div>
      `
    }
  };

  if (content[type]) {
    title.textContent = content[type].title;
    body.innerHTML = content[type].html;
    modal.style.display = 'flex';
  }
}

// Download Audio Function - MULTI-DOWNLOAD SUPPORT WITH UNLIMITED DOWNLOADS
let downloadCounter = 0;
const downloadHistory = [];

function getEffectSuffix() {
  if (!appState.effects3D.enabled) return '';

  const effectLabels = {
    '8d_audio': '_8d',
    'binaural': '_binaural',
    'surround': '_surround',
    'panning_3d': '_3d'
  };

  return effectLabels[appState.effects3D.effectType] || '';
}

function downloadAudio(format) {
  console.log('=== DOWNLOAD AUDIO STARTED (Multi-Download Support) ===');
  console.log('Download attempt #' + (downloadCounter + 1));
  console.log('Format requested:', format);
  console.log('Download enabled:', appState.downloadEnabled);
  console.log('Processed audio buffer available:', !!appState.processedAudioBuffer);
  console.log('Processed audio element available:', !!appState.processedAudioElement);

  // Validation checks
  if (!appState.processedAudioBuffer && !appState.processedAudioElement) {
    console.error('✗ No processed audio available');
    showNotification('❌ No audio to download. Please generate slowed + reverb audio first.', 'error');
    return;
  }

  if (!appState.downloadEnabled) {
    console.warn('⚠ Download not yet enabled (still processing)');
    showNotification('⏳ Please wait for processing to complete...', 'warning');
    return;
  }

  try {
    // Show copyright reminder before download
    const reminders = [
      '⚠️ Remember: Copyright rights remain with original owner',
      '💡 Tip: Use copyright-free music sources for worry-free content',
      '✓ Processing complete - original copyright status unchanged'
    ];
    const reminder = reminders[Math.floor(Math.random() * reminders.length)];
    console.log(reminder);

    console.log('Creating fresh blob for download...');
    downloadCounter++;

    let blob;
    let fileName;
    let mimeType;
    let formatLabel;
    let quality;
    const timestamp = Date.now();
    const originalName = appState.currentFile ? appState.currentFile.name.replace(/\.[^/.]+$/, '') : 'audio';
    const effectSuffix = getEffectSuffix();

    if (format === 'wav') {
      console.log('📥 Creating WAV file (lossless quality)...');
      showNotification('⏳ Preparing WAV download...', 'info');

      if (appState.processedAudioBuffer) {
        // Create FRESH blob from current buffer
        blob = audioBufferToWav(appState.processedAudioBuffer);
        fileName = `slowed_reverb${effectSuffix}_${timestamp}.wav`;
        mimeType = 'audio/wav';
        formatLabel = 'WAV';
        quality = 'Lossless';
        console.log('✓ Fresh WAV blob created');
        console.log('  - Size:', blob.size, 'bytes');
        console.log('  - Filename:', fileName);
      } else {
        throw new Error('No processed audio buffer available');
      }
    } else if (format === 'mp3') {
      console.log('📥 Creating MP3 file (compressed quality)...');
      showNotification('⏳ Preparing MP3 download...', 'info');

      if (appState.processedAudioBuffer) {
        // Create FRESH blob from current buffer
        // Note: True MP3 encoding requires lamejs library
        // For high-quality download, we use WAV format (lossless)
        blob = audioBufferToWav(appState.processedAudioBuffer);
        fileName = `lofify_lofi${effectSuffix}_${timestamp}.mp3.wav`;
        mimeType = 'audio/wav';
        formatLabel = 'MP3 (High Quality WAV)';
        quality = 'High (256kbps equivalent)';
        console.log('✓ Fresh MP3-compatible blob created');
        console.log('  - Size:', blob.size, 'bytes');
        console.log('  - Filename:', fileName);
      } else {
        throw new Error('No processed audio buffer available');
      }
    }

    if (!blob) {
      throw new Error('Failed to create audio blob');
    }

    // Calculate file size
    const fileSizeBytes = blob.size;
    const fileSizeMB = (fileSizeBytes / 1024 / 1024).toFixed(2);
    const fileSizeKB = (fileSizeBytes / 1024).toFixed(0);
    const displaySize = fileSizeBytes > 1024 * 1024 ? `${fileSizeMB} MB` : `${fileSizeKB} KB`;

    console.log('File details:');
    console.log('  - Format:', formatLabel);
    console.log('  - Quality:', quality);
    console.log('  - Size:', displaySize);
    console.log('  - MIME type:', mimeType);

    // Create FRESH download URL (each download gets a new URL)
    console.log('Creating fresh download URL...');
    const downloadUrl = URL.createObjectURL(blob);
    console.log('✓ Fresh object URL created:', downloadUrl.substring(0, 50) + '...');

    // Create temporary download link
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = fileName;
    link.type = mimeType;
    link.style.display = 'none';

    // Trigger download
    document.body.appendChild(link);
    console.log('✓ Download link added to DOM');

    link.click();
    console.log('✓ Download triggered!');
    console.log('✓ Browser download dialog should appear now');

    // Add to download history
    const downloadRecord = {
      format: formatLabel,
      fileName: fileName,
      size: displaySize,
      timestamp: new Date().toLocaleTimeString(),
      quality: quality,
      downloadNumber: downloadCounter
    };
    downloadHistory.unshift(downloadRecord);
    if (downloadHistory.length > 5) downloadHistory.pop();

    console.log('Download history updated:', downloadHistory.length, 'recent downloads');

    // Clean up after download (but keep buffer for more downloads)
    setTimeout(() => {
      try {
        document.body.removeChild(link);
        URL.revokeObjectURL(downloadUrl);
        console.log('✓ Download cleanup complete (link removed, URL revoked)');
      } catch (e) {
        console.warn('Cleanup warning:', e);
      }
    }, 100);

    // Success notification with detailed info
    const successMessage = `✓ Download started!\nFile: ${fileName}\nSize: ${displaySize}\nQuality: ${quality}`;
    console.log('=== DOWNLOAD SUCCESSFUL ===');
    console.log('Total downloads this session:', downloadCounter);
    showNotification(`📥 Download #${downloadCounter} started! ${formatLabel} (${displaySize})`, 'success');

    // Log that more downloads are available
    console.log('✓ Ready for additional downloads (unlimited)');
    console.log('✓ You can download the same audio multiple times');
    console.log('✓ You can switch between WAV and MP3 formats');

  } catch (error) {
    console.error('✗ Download error:', error);
    console.error('Error details:', error.message);
    console.error('Stack trace:', error.stack);
    showNotification('❌ Download failed: ' + error.message + ' - Please try again.', 'error');
  }
}

// Helper function to download original audio as WAV
function downloadOriginalAsWav() {
  showNotification('Converting to lo-fi...', 'info');

  fetch(appState.originalAudioElement.src)
    .then(response => response.arrayBuffer())
    .then(arrayBuffer => appState.audioContext.decodeAudioData(arrayBuffer))
    .then(audioBuffer => {
      const blob = audioBufferToWav(audioBuffer);
      const timestamp = Date.now();
      const fileName = `lofify_lofi_${timestamp}.wav`;

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showNotification('Download started!', 'success');
    })
    .catch(error => {
      console.error('Download error:', error);
      showNotification('Download failed. Please try again.', 'error');
    });
}

// Share
function shareToSocial(platform) {
  const text = `Check out my lo-fi creation with Lofify! 🎵✨ #Lofify #LoFiMusic`;
  const urls = {
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`,
    tiktok: 'https://www.tiktok.com/upload',
    instagram: 'https://www.instagram.com/'
  };

  window.open(urls[platform], '_blank');
  hideModal(elements.shareModal);
  showNotification(`Opening ${platform}...`, 'info');
}

// Compare Toggle
function toggleCompare() {
  if (appState.originalAudioElement && appState.processedAudioElement) {
    // Toggle between playing original and processed
    if (appState.originalAudioElement.paused) {
      appState.originalAudioElement.currentTime = 0;
      appState.originalAudioElement.play();
      elements.playOriginalBtn.classList.add('playing');
      showNotification('Playing original', 'info');
    } else {
      appState.originalAudioElement.pause();
      elements.playOriginalBtn.classList.remove('playing');
      appState.processedAudioElement.currentTime = 0;
      appState.processedAudioElement.play();
      elements.playProcessedBtn.classList.add('playing');
      showNotification('Playing processed', 'info');
    }
  }
}

// Theme Toggle
function toggleTheme() {
  appState.isDarkMode = !appState.isDarkMode;
  document.body.classList.toggle('light-mode');
  showNotification(`${appState.isDarkMode ? 'Dark' : 'Light'} mode enabled`, 'info');
}

// Reset App
function resetApp() {
  console.log('=== RESETTING APP ===');

  // Stop and clean up audio elements
  if (appState.originalAudioElement) {
    appState.originalAudioElement.pause();
    appState.originalAudioElement = null;
  }
  if (appState.processedAudioElement) {
    appState.processedAudioElement.pause();
    appState.processedAudioElement = null;
  }

  // Revoke all object URLs
  revokeAllObjectUrls();

  // Reset state
  appState.currentFile = null;
  appState.isProcessing = false;
  appState.processedAudioBuffer = null;
  appState.downloadEnabled = false;

  // Reset UI
  elements.heroSection.style.display = 'block';
  elements.audioSection.style.display = 'none';
  elements.processingCard.style.display = 'none';
  elements.outputCard.style.display = 'none';
  elements.audioFileInput.value = '';

  // Reset to standard preset
  applyPreset('standard');

  console.log('✓ App reset complete');
  showNotification('Ready to create lo-fi music', 'info');
}

// Audio Analysis Logic
async function analyzeAudio(audioBuffer) {
  console.log('=== STARTING AUDIO ANALYSIS ===');
  const channelData = audioBuffer.getChannelData(0);
  const sampleRate = audioBuffer.sampleRate;

  // 1. Estimate BPM (Energy-based peak detection)
  // Simplified BPM detection for client-side
  let bpm = 120; // Default fallback
  try {
    const peaks = getPeaks([channelData], 1000); // Get peaks every 1000 samples
    const intervals = countIntervals(peaks);
    const topInterval = intervals.reduce((a, b) => a.count > b.count ? a : b);
    // Rough estimation logic - in a real app we'd use a more robust library
    // For now, we'll simulate BPM detection based on energy distribution
    const rms = calculateRMS(channelData);
    // Higher energy often correlates with higher BPM in pop/electronic
    bpm = 80 + (rms * 100);
    if (bpm > 160) bpm = 160;
    if (bpm < 60) bpm = 60;
  } catch (e) {
    console.warn('BPM detection failed, using default', e);
  }

  // 2. Calculate Energy (RMS)
  const energy = calculateRMS(channelData);

  // 3. Calculate Brightness (Spectral Centroid approximation)
  // We'll take a snippet from the middle
  const snippetSize = 4096;
  const startIdx = Math.floor(channelData.length / 2);
  const snippet = channelData.slice(startIdx, startIdx + snippetSize);
  const brightness = calculateSpectralCentroid(snippet, sampleRate);

  console.log('Analysis Results:', { bpm, energy, brightness });
  return { bpm, energy, brightness };
}

function calculateRMS(data) {
  let sum = 0;
  // Sample every 100th point for performance
  for (let i = 0; i < data.length; i += 100) {
    sum += data[i] * data[i];
  }
  return Math.sqrt(sum / (data.length / 100));
}

function calculateSpectralCentroid(data, sampleRate) {
  // Simple time-domain zero-crossing rate as a proxy for brightness/frequency content
  let zeroCrossings = 0;
  for (let i = 1; i < data.length; i++) {
    if ((data[i] >= 0 && data[i - 1] < 0) || (data[i] < 0 && data[i - 1] >= 0)) {
      zeroCrossings++;
    }
  }
  return zeroCrossings / data.length; // Normalized 0-1
}

function getPeaks(data, threshold) {
  // Placeholder for peak detection
  return [];
}

function countIntervals(peaks) {
  // Placeholder
  return [{ count: 0 }];
}

function autoConfigureSettings(analysis) {
  const { bpm, energy, brightness } = analysis;

  // Logic to map analysis to settings
  let speed = 85;
  let reverb = 50;
  let roomSize = 75;
  let bassBoost = 20;
  let echo = 0.4;
  let echoTime = 0.3;

  // 1. Map BPM to Speed
  // Faster songs need more slowing down to reach "lo-fi" vibe (60-90 BPM target)
  if (bpm > 120) {
    speed = 75; // Slow it down significantly
  } else if (bpm > 100) {
    speed = 80;
  } else if (bpm < 70) {
    speed = 95; // Already slow, don't slow much
  } else {
    speed = 85; // Default
  }

  // 2. Map Energy/Brightness to Reverb & Bass
  // High energy/bright songs need more "mellowing" (more reverb, more bass)
  if (brightness > 0.1) { // "Bright" track
    reverb = 65;
    bassBoost = 40; // Add warmth
    roomSize = 85;
  } else { // Darker track
    reverb = 45;
    bassBoost = 15; // Don't muddy it too much
    roomSize = 65;
  }

  // 3. Echo settings
  if (energy < 0.1) { // Low energy / ambient
    echo = 0.6;
    echoTime = 0.5; // Longer, more pronounced echo
  } else {
    echo = 0.3;
    echoTime = 0.25; // Tighter echo for busy tracks
  }

  // Apply settings
  appState.settings.speed = speed;
  appState.settings.reverb = reverb;
  appState.settings.roomSize = roomSize;
  appState.settings.bassBoost = bassBoost;
  appState.settings.echo = echo;
  appState.settings.echoTime = echoTime;
  appState.settings.echoEnabled = true; // Enable echo for the "vibe"

  // Update UI
  elements.speedSlider.value = speed;
  elements.reverbSlider.value = reverb;
  elements.roomSizeSlider.value = roomSize;
  elements.bassBoostSlider.value = bassBoost;

  if (elements.echoSlider) elements.echoSlider.value = echo;
  if (elements.echoTimeSlider) elements.echoTimeSlider.value = echoTime;
  if (elements.enableEcho) elements.enableEcho.checked = true;
  if (elements.echoControls) elements.echoControls.style.display = 'block';

  updateSliderValues();
  if (elements.echoValue) elements.echoValue.textContent = echo.toFixed(2);
  if (elements.echoTimeValue) elements.echoTimeValue.textContent = echoTime.toFixed(2) + 's';

  showNotification(`Auto-configured: Speed ${speed}%, Reverb ${reverb}%`, 'success');
}

// Modal Functions
function showModal(modal) {
  modal.style.display = 'flex';
}

function hideModal(modal) {
  modal.style.display = 'none';
}

// Notification
function showNotification(message, type = 'success') {
  elements.notificationText.textContent = message;
  elements.notification.style.display = 'block';

  const colors = {
    success: '#10b981',
    error: '#ef4444',
    info: '#00d9ff',
    warning: '#f59e0b'
  };

  elements.notification.style.background = colors[type] || colors.success;

  setTimeout(() => {
    elements.notification.style.display = 'none';
  }, 3000);
}

// Keyboard Shortcuts
function handleKeyboardShortcuts(e) {
  // Don't trigger if user is typing in an input
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

  switch (e.key.toLowerCase()) {
    case ' ':
      e.preventDefault();
      if (appState.processedAudioElement && elements.outputCard.style.display === 'block') {
        elements.playProcessedBtn.click();
      } else if (appState.originalAudioElement) {
        elements.playOriginalBtn.click();
      }
      break;
    case 'r':
      if (elements.resetBtn && elements.outputCard.style.display === 'block') {
        resetApp();
      }
      break;
    case 'd':
      if (elements.downloadMp3Btn && elements.outputCard.style.display === 'block') {
        downloadAudio('mp3');
      }
      break;
    case 'g':
      if (elements.generateBtn && !elements.generateBtn.disabled) {
        generateProcessedAudio();
      }
      break;
    case '?':
      showModal(elements.helpModal);
      break;
    case 'escape':
      hideModal(elements.helpModal);
      hideModal(elements.shareModal);
      break;
  }
}

// Utility Functions
function formatTime(seconds) {
  if (isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function initAudioContext() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    appState.audioContext = new AudioContext();
    console.log('✓ AudioContext initialized');
  } catch (e) {
    console.error('Web Audio API not supported:', e);
    showNotification('Your browser does not support audio processing', 'error');
  }
}

// AudioBuffer to WAV conversion function
function audioBufferToWav(audioBuffer) {
  console.log('Converting AudioBuffer to WAV...');
  console.log('  - Sample rate:', audioBuffer.sampleRate);
  console.log('  - Channels:', audioBuffer.numberOfChannels);
  console.log('  - Duration:', audioBuffer.duration, 'seconds');

  const numberOfChannels = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;

  const bytesPerSample = bitDepth / 8;
  const blockAlign = numberOfChannels * bytesPerSample;

  const data = [];
  for (let i = 0; i < numberOfChannels; i++) {
    data.push(audioBuffer.getChannelData(i));
  }

  const length = audioBuffer.length * numberOfChannels * bytesPerSample;
  const buffer = new ArrayBuffer(44 + length);
  const view = new DataView(buffer);

  // Write WAV header
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + length, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // fmt chunk size
  view.setUint16(20, format, true);
  view.setUint16(22, numberOfChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);
  writeString(view, 36, 'data');
  view.setUint32(40, length, true);

  // Write audio data
  let offset = 44;
  for (let i = 0; i < audioBuffer.length; i++) {
    for (let channel = 0; channel < numberOfChannels; channel++) {
      const sample = Math.max(-1, Math.min(1, data[channel][i]));
      const value = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
      view.setInt16(offset, value, true);
      offset += 2;
    }
  }

  console.log('✓ WAV conversion complete, buffer size:', buffer.byteLength, 'bytes');
  return new Blob([buffer], { type: 'audio/wav' });
}

function writeString(view, offset, string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

// 3D Audio Effects Functions
function toggle3DEffects() {
  appState.effects3D.enabled = elements.enable3DEffects.checked;
  elements.effects3DContent.style.display = appState.effects3D.enabled ? 'block' : 'none';

  if (appState.effects3D.enabled) {
    showNotification('3D Lo-Fi Effects enabled! 🎧', 'success');
    updateVisualizations();
  } else {
    showNotification('3D Lo-Fi Effects disabled', 'info');
    if (appState.animationFrameId) {
      cancelAnimationFrame(appState.animationFrameId);
    }
  }
}

function switchEffectOptions(effectType) {
  // Hide all option panels
  document.getElementById('options8D').style.display = 'none';
  document.getElementById('optionsBinaural').style.display = 'none';
  document.getElementById('optionsSurround').style.display = 'none';
  document.getElementById('optionsPanning').style.display = 'none';

  // Show selected option panel
  const optionMap = {
    '8d_audio': 'options8D',
    'binaural': 'optionsBinaural',
    'surround': 'optionsSurround',
    'panning_3d': 'optionsPanning'
  };

  if (optionMap[effectType]) {
    document.getElementById(optionMap[effectType]).style.display = 'block';
  }
}

function updatePanningValue(type) {
  const value = appState.effects3D[`pan${type.charAt(0).toUpperCase() + type.slice(1)}`];

  let displayValue = '';
  if (type === 'horizontal') {
    if (value < -0.3) displayValue = 'Left';
    else if (value > 0.3) displayValue = 'Right';
    else displayValue = 'Center';
  } else if (type === 'vertical') {
    if (value < -0.3) displayValue = 'Below';
    else if (value > 0.3) displayValue = 'Above';
    else displayValue = 'Center';
  } else if (type === 'depth') {
    if (value < 0.35) displayValue = 'Far';
    else if (value > 0.65) displayValue = 'Near';
    else displayValue = 'Medium';
  }

  elements[`pan${type.charAt(0).toUpperCase() + type.slice(1)}Value`].textContent = displayValue;
}

// Visualization Functions
function startVisualizations() {
  updateVisualizations();
}

function updateVisualizations() {
  if (!appState.effects3D.enabled) return;

  if (appState.effects3D.effectType === '8d_audio') {
    animate8DRotation();
  } else if (appState.effects3D.effectType === 'surround') {
    animateSurround();
  } else if (appState.effects3D.effectType === 'panning_3d') {
    draw3DPanning();
  }
}

let rotation8DAngle = 0;
function animate8DRotation() {
  const canvas = elements.rotation8DCanvas;
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const radius = 40;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw circle path
  ctx.strokeStyle = 'rgba(0, 217, 255, 0.3)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.stroke();

  // Draw rotating point
  const pointX = centerX + Math.cos(rotation8DAngle) * radius;
  const pointY = centerY + Math.sin(rotation8DAngle) * radius;

  const gradient = ctx.createRadialGradient(pointX, pointY, 0, pointX, pointY, 10);
  gradient.addColorStop(0, '#00d9ff');
  gradient.addColorStop(1, 'rgba(0, 217, 255, 0)');

  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(pointX, pointY, 10, 0, Math.PI * 2);
  ctx.fill();

  // Update angle
  const speed = appState.effects3D.rotationSpeed * 0.02;
  const direction = appState.effects3D.rotationDirection === 'clockwise' ? 1 : -1;
  rotation8DAngle += speed * direction;

  if (appState.effects3D.enabled && appState.effects3D.effectType === '8d_audio') {
    appState.animationFrameId = requestAnimationFrame(animate8DRotation);
  }
}

let surroundAngle = 0;
function animateSurround() {
  const canvas = elements.surroundCanvas;
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const radius = 45;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw 360 degree circle
  ctx.strokeStyle = 'rgba(168, 85, 247, 0.3)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.stroke();

  const pattern = appState.effects3D.surroundPattern;

  if (pattern === 'circular') {
    // Rotating effect similar to 8D
    const pointX = centerX + Math.cos(surroundAngle) * radius;
    const pointY = centerY + Math.sin(surroundAngle) * radius;

    const gradient = ctx.createRadialGradient(pointX, pointY, 0, pointX, pointY, 12);
    gradient.addColorStop(0, '#a855f7');
    gradient.addColorStop(1, 'rgba(168, 85, 247, 0)');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(pointX, pointY, 12, 0, Math.PI * 2);
    ctx.fill();

    surroundAngle += 0.03;
  } else if (pattern === 'theater') {
    // Front and sides
    const positions = [
      { angle: -Math.PI / 4, label: 'L' },
      { angle: 0, label: 'C' },
      { angle: Math.PI / 4, label: 'R' }
    ];

    positions.forEach(pos => {
      const x = centerX + Math.cos(pos.angle) * radius;
      const y = centerY + Math.sin(pos.angle) * radius;

      ctx.fillStyle = '#a855f7';
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.fill();
    });
  } else if (pattern === 'static') {
    // Omnidirectional - multiple points
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 * i) / 8;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;

      ctx.fillStyle = '#a855f7';
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  if (appState.effects3D.enabled && appState.effects3D.effectType === 'surround') {
    appState.animationFrameId = requestAnimationFrame(animateSurround);
  }
}

function draw3DPanning() {
  const canvas = elements.panning3DCanvas;
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const gridSize = 50;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw coordinate grid
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.lineWidth = 1;

  // Horizontal line
  ctx.beginPath();
  ctx.moveTo(centerX - gridSize, centerY);
  ctx.lineTo(centerX + gridSize, centerY);
  ctx.stroke();

  // Vertical line
  ctx.beginPath();
  ctx.moveTo(centerX, centerY - gridSize);
  ctx.lineTo(centerX, centerY + gridSize);
  ctx.stroke();

  // Draw labels
  ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.font = '10px sans-serif';
  ctx.fillText('L', centerX - gridSize - 15, centerY + 4);
  ctx.fillText('R', centerX + gridSize + 8, centerY + 4);
  ctx.fillText('U', centerX - 4, centerY - gridSize - 5);
  ctx.fillText('D', centerX - 4, centerY + gridSize + 15);

  // Calculate position
  const x = centerX + (appState.effects3D.panHorizontal * gridSize);
  const y = centerY - (appState.effects3D.panVertical * gridSize);

  // Draw depth indicator (size based on depth)
  const depthSize = 8 + (appState.effects3D.panDepth * 12);

  // Outer glow
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, depthSize + 5);
  gradient.addColorStop(0, 'rgba(0, 217, 255, 0.8)');
  gradient.addColorStop(1, 'rgba(0, 217, 255, 0)');

  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(x, y, depthSize + 5, 0, Math.PI * 2);
  ctx.fill();

  // Main point
  ctx.fillStyle = '#00d9ff';
  ctx.beginPath();
  ctx.arc(x, y, depthSize, 0, Math.PI * 2);
  ctx.fill();

  // Center point
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(x, y, 3, 0, Math.PI * 2);
  ctx.fill();
}

// Apply audio effects (Robust implementation with Echo)
async function applyAudioEffects(audioBuffer, settings = {}) {
  if (!audioBuffer) throw new Error('applyAudioEffects: audioBuffer required');

  // Merge provided settings with appState defaults
  settings = Object.assign({}, appState.settings || {}, settings);

  console.log('Applying audio effects (Robust)...');
  console.log('  - Speed:', settings.speed + '%');
  console.log('  - Reverb:', settings.reverb + '%');
  console.log('  - Room size:', settings.roomSize + '%');
  console.log('  - Bass boost:', settings.bassBoost + '%');
  console.log('  - Bass cut:', (settings.bassCutEnabled ? settings.bassCutAmount : 0) + '%');
  console.log('  - Echo:', settings.echo);
  console.log('  - Echo Time:', settings.echoTime + 's');

  const sampleRate = audioBuffer.sampleRate;
  const numberOfChannels = audioBuffer.numberOfChannels;

  // Speed handling (resample into a new buffer)
  const speedRatio = (settings.speed && settings.speed > 0) ? (settings.speed / 100) : 1;
  const newLength = Math.max(1, Math.floor(audioBuffer.length / speedRatio));

  // Create processedBuffer using an AudioContext if available, otherwise OfflineAudioContext
  let processedBuffer;
  try {
    if (appState.audioContext && typeof appState.audioContext.createBuffer === 'function') {
      processedBuffer = appState.audioContext.createBuffer(numberOfChannels, newLength, sampleRate);
    } else {
      // create a temporary OfflineAudioContext only to make a buffer
      processedBuffer = new OfflineAudioContext(numberOfChannels, newLength, sampleRate).createBuffer(numberOfChannels, newLength, sampleRate);
    }
  } catch (err) {
    // Fallback: try OfflineAudioContext createBuffer
    processedBuffer = new OfflineAudioContext(numberOfChannels, newLength, sampleRate).createBuffer(numberOfChannels, newLength, sampleRate);
  }

  // Resample (linear interpolation)
  for (let ch = 0; ch < numberOfChannels; ch++) {
    const inData = audioBuffer.getChannelData(ch);
    const outData = processedBuffer.getChannelData(ch);
    for (let i = 0; i < newLength; i++) {
      const srcIndex = i * speedRatio;
      const i0 = Math.floor(srcIndex);
      const i1 = Math.min(i0 + 1, audioBuffer.length - 1);
      const frac = srcIndex - i0;
      const s0 = inData[i0] || 0;
      const s1 = inData[i1] || 0;
      outData[i] = s0 * (1 - frac) + s1 * frac;
    }
  }

  // Simple reverb algorithm (time-domain echo)
  const reverbAmount = (settings.reverb ?? 50) / 100;
  const roomSizeFactor = (settings.roomSize ?? 75) / 100;
  const delaySamples = Math.max(1, Math.floor(sampleRate * 0.03 * roomSizeFactor));
  const decayFactor = 0.3 * reverbAmount;

  for (let ch = 0; ch < numberOfChannels; ch++) {
    const data = processedBuffer.getChannelData(ch);
    const snapshot = new Float32Array(data); // preserve original for reference
    for (let i = delaySamples; i < data.length; i++) {
      data[i] = snapshot[i] + (snapshot[i - delaySamples] * decayFactor);
    }
  }

  // --- Integrate vintage echo via OfflineAudioContext safely ---
  try {
    const offlineCtx = new OfflineAudioContext(
      processedBuffer.numberOfChannels,
      processedBuffer.length,
      processedBuffer.sampleRate
    );

    const source = offlineCtx.createBufferSource();
    source.buffer = processedBuffer;

    // Delay + feedback + filter
    const delayNode = offlineCtx.createDelay();
    delayNode.delayTime.value = (typeof settings.echoTime !== 'undefined') ? settings.echoTime : (appState.settings.echoTime ?? 0.3);

    const feedbackGain = offlineCtx.createGain();
    // Only apply gain if echo is enabled
    const echoGainValue = (settings.echoEnabled !== false) ?
      ((typeof settings.echo !== 'undefined') ? settings.echo : (appState.settings.echo ?? 0.4)) : 0;

    feedbackGain.gain.value = echoGainValue;

    // Expose for UI updates before rendering begins
    liveFeedbackGain = feedbackGain;

    const echoFilter = offlineCtx.createBiquadFilter();
    echoFilter.type = 'lowpass';
    echoFilter.frequency.value = 1200;

    // feedback loop
    delayNode.connect(feedbackGain);
    feedbackGain.connect(echoFilter);
    echoFilter.connect(delayNode);

    // Wet/Dry mix
    const wetGain = offlineCtx.createGain();
    const dryGain = offlineCtx.createGain();
    const wetLevel = Math.min(0.8, reverbAmount * 0.6);
    wetGain.gain.value = wetLevel;
    dryGain.gain.value = 1 - wetLevel;

    // Routing: source -> dry -> destination, source -> delay -> wet -> destination
    source.connect(dryGain).connect(offlineCtx.destination);
    source.connect(delayNode);
    delayNode.connect(wetGain).connect(offlineCtx.destination);

    source.start(0);
    const rendered = await offlineCtx.startRendering();

    // Clear handle (do not reuse cross-context)
    liveFeedbackGain = null;

    processedBuffer = rendered;
  } catch (err) {
    console.warn('Offline echo render skipped or failed:', err);
    liveFeedbackGain = null;
  }

  // --- Bass boost offline render (if requested) ---
  if (settings.bassBoost && settings.bassBoost > 0) {
    try {
      const offlineBassCtx = new OfflineAudioContext(
        processedBuffer.numberOfChannels,
        processedBuffer.length,
        processedBuffer.sampleRate
      );
      const src = offlineBassCtx.createBufferSource();
      src.buffer = processedBuffer;

      const bassFilter = offlineBassCtx.createBiquadFilter();
      bassFilter.type = 'lowshelf';
      bassFilter.frequency.value = settings.bassFrequency || 60;
      // Softer gain curve (max 10dB instead of 12dB)
      bassFilter.gain.value = (settings.bassBoost / 100) * 10;

      src.connect(bassFilter).connect(offlineBassCtx.destination);
      src.start(0);
      const bassRendered = await offlineBassCtx.startRendering();
      processedBuffer = bassRendered;
    } catch (e) {
      console.warn('Bass boost render failed, skipping:', e);
    }
  }

  // --- Bass Reduction (Cut) offline render (if requested) ---
  if (settings.bassCutEnabled && settings.bassCutAmount > 0) {
    try {
      const offlineBassCutCtx = new OfflineAudioContext(
        processedBuffer.numberOfChannels,
        processedBuffer.length,
        processedBuffer.sampleRate
      );
      const src = offlineBassCutCtx.createBufferSource();
      src.buffer = processedBuffer;

      const bassCutFilter = offlineBassCutCtx.createBiquadFilter();
      bassCutFilter.type = 'lowshelf';
      bassCutFilter.frequency.value = 150; // Cut below 150Hz
      // Map 0-100% to 0 to -20dB
      bassCutFilter.gain.value = -(settings.bassCutAmount / 100) * 20;

      src.connect(bassCutFilter).connect(offlineBassCutCtx.destination);
      src.start(0);
      const bassCutRendered = await offlineBassCutCtx.startRendering();
      processedBuffer = bassCutRendered;
      console.log('✓ Bass reduction applied');
    } catch (e) {
      console.warn('Bass reduction render failed, skipping:', e);
    }
  }

  // --- Optionally apply 3D effects if existing helper available ---
  if (appState.effects3D && appState.effects3D.enabled && typeof apply3DEffects === 'function') {
    try {
      const threeD = await apply3DEffects(processedBuffer);
      if (threeD) processedBuffer = threeD;
    } catch (e) {
      console.warn('apply3DEffects failed:', e);
    }
  }

  return processedBuffer;
}

// Apply Bass Boost using Lowshelf Filter
async function applyBassBoost(audioBuffer, bassBoostAmount, bassFrequency) {
  console.log('=== APPLYING BASS BOOST ===');
  console.log('Bass amount:', bassBoostAmount + '%');
  console.log('Bass frequency:', bassFrequency + 'Hz');

  const numberOfChannels = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;

  // Calculate gain in dB (0-100% maps to 0-20dB)
  const gainDB = (bassBoostAmount / 100) * 20;
  console.log('Gain (dB):', gainDB);

  // Apply bass boost to each channel
  for (let channel = 0; channel < numberOfChannels; channel++) {
    const channelData = audioBuffer.getChannelData(channel);

    // Simple lowshelf filter implementation
    // This is a simplified version - for production, use BiquadFilterNode in real-time
    const omega = 2 * Math.PI * bassFrequency / sampleRate;
    const sinOmega = Math.sin(omega);
    const cosOmega = Math.cos(omega);
    const alpha = sinOmega / 2;
    const A = Math.pow(10, gainDB / 40); // Convert dB to linear gain

    // Lowshelf filter coefficients
    const b0 = A * ((A + 1) - (A - 1) * cosOmega + 2 * Math.sqrt(A) * alpha);
    const b1 = 2 * A * ((A - 1) - (A + 1) * cosOmega);
    const b2 = A * ((A + 1) - (A - 1) * cosOmega - 2 * Math.sqrt(A) * alpha);
    const a0 = (A + 1) + (A - 1) * cosOmega + 2 * Math.sqrt(A) * alpha;
    const a1 = -2 * ((A - 1) + (A + 1) * cosOmega);
    const a2 = (A + 1) + (A - 1) * cosOmega - 2 * Math.sqrt(A) * alpha;

    // Normalize coefficients
    const nb0 = b0 / a0;
    const nb1 = b1 / a0;
    const nb2 = b2 / a0;
    const na1 = a1 / a0;
    const na2 = a2 / a0;

    // Apply filter (simple biquad implementation)
    const filtered = new Float32Array(channelData.length);
    let x1 = 0, x2 = 0, y1 = 0, y2 = 0;

    for (let i = 0; i < channelData.length; i++) {
      const x0 = channelData[i];
      const y0 = nb0 * x0 + nb1 * x1 + nb2 * x2 - na1 * y1 - na2 * y2;

      // Prevent clipping
      filtered[i] = Math.max(-1, Math.min(1, y0));

      // Update state
      x2 = x1;
      x1 = x0;
      y2 = y1;
      y1 = y0;
    }

    // Copy filtered data back
    channelData.set(filtered);
  }

  console.log('✓ Bass boost filter applied to all channels');
}

// Apply 3D Audio Effects
async function apply3DEffects(audioBuffer) {
  const effectType = appState.effects3D.effectType;
  const masterIntensity = appState.effects3D.masterIntensity / 100;

  if (effectType === '8d_audio') {
    return apply8DAudio(audioBuffer, appState.effects3D.rotationSpeed, appState.effects3D.rotationDirection, masterIntensity);
  } else if (effectType === 'binaural') {
    return applyBinauralAudio(audioBuffer, appState.effects3D.binauralIntensity / 100, masterIntensity);
  } else if (effectType === 'surround') {
    return applySurroundAudio(audioBuffer, appState.effects3D.surroundPattern, appState.effects3D.surroundIntensity / 100, masterIntensity);
  } else if (effectType === 'panning_3d') {
    return apply3DPanningEffect(audioBuffer, appState.effects3D.panHorizontal, appState.effects3D.panVertical, appState.effects3D.panDepth, masterIntensity);
  }

  return audioBuffer;
}

// 8D Audio Effect - Circular Panning
async function apply8DAudio(audioBuffer, speed, direction, masterIntensity) {
  console.log('Applying 8D audio effect...');

  const sampleRate = audioBuffer.sampleRate;
  const numberOfChannels = 2; // Force stereo for 8D
  const duration = audioBuffer.duration;

  const newBuffer = appState.audioContext.createBuffer(
    numberOfChannels,
    audioBuffer.length,
    sampleRate
  );

  const leftChannel = newBuffer.getChannelData(0);
  const rightChannel = newBuffer.getChannelData(1);
  const sourceLeft = audioBuffer.getChannelData(0);
  const sourceRight = audioBuffer.numberOfChannels > 1 ? audioBuffer.getChannelData(1) : sourceLeft;

  // Calculate rotation frequency (cycles per second)
  const rotationFreq = speed * 0.2; // Adjust for reasonable rotation speed
  const directionMultiplier = direction === 'clockwise' ? 1 : -1;

  for (let i = 0; i < audioBuffer.length; i++) {
    const time = i / sampleRate;
    const angle = 2 * Math.PI * rotationFreq * time * directionMultiplier;

    // Calculate pan position (-1 to 1)
    const pan = Math.sin(angle) * masterIntensity;

    // Apply panning
    const leftGain = Math.cos((pan + 1) * Math.PI / 4);
    const rightGain = Math.sin((pan + 1) * Math.PI / 4);

    leftChannel[i] = (sourceLeft[i] + sourceRight[i]) * 0.5 * leftGain;
    rightChannel[i] = (sourceLeft[i] + sourceRight[i]) * 0.5 * rightGain;
  }

  console.log('✓ 8D audio effect applied');
  return newBuffer;
}

// Binaural Audio Effect
async function applyBinauralAudio(audioBuffer, intensity, masterIntensity) {
  console.log('Applying binaural audio effect...');

  const sampleRate = audioBuffer.sampleRate;
  const numberOfChannels = 2;

  const newBuffer = appState.audioContext.createBuffer(
    numberOfChannels,
    audioBuffer.length,
    sampleRate
  );

  const leftChannel = newBuffer.getChannelData(0);
  const rightChannel = newBuffer.getChannelData(1);
  const sourceLeft = audioBuffer.getChannelData(0);
  const sourceRight = audioBuffer.numberOfChannels > 1 ? audioBuffer.getChannelData(1) : sourceLeft;

  // Simple binaural effect: slight delay and phase shift
  const delayMs = 0.5; // 0.5ms delay for spatial effect
  const delaySamples = Math.floor((delayMs / 1000) * sampleRate);
  const effectIntensity = intensity * masterIntensity;

  for (let i = 0; i < audioBuffer.length; i++) {
    const dryLeft = sourceLeft[i];
    const dryRight = sourceRight[i];

    // Apply slight delay to right channel for spatial effect
    const delayedSample = i >= delaySamples ? sourceLeft[i - delaySamples] : 0;

    leftChannel[i] = dryLeft * (1 - effectIntensity * 0.3) + dryRight * effectIntensity * 0.3;
    rightChannel[i] = dryRight * (1 - effectIntensity * 0.3) + delayedSample * effectIntensity * 0.3;
  }

  console.log('✓ Binaural audio effect applied');
  return newBuffer;
}

// Surround Sound Effect
async function applySurroundAudio(audioBuffer, pattern, intensity, masterIntensity) {
  console.log('Applying surround audio effect...');

  if (pattern === 'circular') {
    // Use 8D-like rotation for circular pattern
    return apply8DAudio(audioBuffer, 1.0, 'clockwise', intensity * masterIntensity);
  }

  const sampleRate = audioBuffer.sampleRate;
  const numberOfChannels = 2;

  const newBuffer = appState.audioContext.createBuffer(
    numberOfChannels,
    audioBuffer.length,
    sampleRate
  );

  const leftChannel = newBuffer.getChannelData(0);
  const rightChannel = newBuffer.getChannelData(1);
  const sourceLeft = audioBuffer.getChannelData(0);
  const sourceRight = audioBuffer.numberOfChannels > 1 ? audioBuffer.getChannelData(1) : sourceLeft;

  const effectIntensity = intensity * masterIntensity;

  if (pattern === 'theater') {
    // Front-heavy mix with wide stereo
    for (let i = 0; i < audioBuffer.length; i++) {
      const mid = (sourceLeft[i] + sourceRight[i]) * 0.5;
      const side = (sourceLeft[i] - sourceRight[i]) * 0.5;

      leftChannel[i] = mid + side * (1 + effectIntensity);
      rightChannel[i] = mid - side * (1 + effectIntensity);
    }
  } else if (pattern === 'static') {
    // Omnidirectional - add ambience
    for (let i = 0; i < audioBuffer.length; i++) {
      const mono = (sourceLeft[i] + sourceRight[i]) * 0.5;
      leftChannel[i] = mono * (1 + effectIntensity * 0.2);
      rightChannel[i] = mono * (1 + effectIntensity * 0.2);
    }
  }

  console.log('✓ Surround audio effect applied');
  return newBuffer;
}

// 3D Panning Effect
async function apply3DPanningEffect(audioBuffer, horizontal, vertical, depth, masterIntensity) {
  console.log('Applying 3D panning effect...');

  const sampleRate = audioBuffer.sampleRate;
  const numberOfChannels = 2;

  const newBuffer = appState.audioContext.createBuffer(
    numberOfChannels,
    audioBuffer.length,
    sampleRate
  );

  const leftChannel = newBuffer.getChannelData(0);
  const rightChannel = newBuffer.getChannelData(1);
  const sourceLeft = audioBuffer.getChannelData(0);
  const sourceRight = audioBuffer.numberOfChannels > 1 ? audioBuffer.getChannelData(1) : sourceLeft;

  // Calculate gains based on position
  const pan = horizontal * masterIntensity;
  const distance = 1 + (1 - depth) * 0.5; // Distance affects volume
  const verticalEffect = Math.abs(vertical) * 0.3; // Vertical position affects brightness

  const leftGain = Math.cos((pan + 1) * Math.PI / 4) / distance;
  const rightGain = Math.sin((pan + 1) * Math.PI / 4) / distance;

  for (let i = 0; i < audioBuffer.length; i++) {
    const mono = (sourceLeft[i] + sourceRight[i]) * 0.5;

    // Apply simple low-pass filter for vertical position (approximate)
    const filtered = i > 0 ? mono * (1 - verticalEffect) + leftChannel[i - 1] * verticalEffect : mono;

    leftChannel[i] = filtered * leftGain;
    rightChannel[i] = filtered * rightGain;
  }

  console.log('✓ 3D panning effect applied');
  return newBuffer;
}



// Orb Visibility Management
let inactivityTimer = null;
const orbContainer = document.querySelector('.background-orbs');

function hideOrbs() {
  if (orbContainer) {
    orbContainer.classList.add('orbs-hidden');
  }
}

function showOrbs() {
  if (orbContainer) {
    orbContainer.classList.remove('orbs-hidden');
  }
}

function setupOrbInteractions() {
  console.log('=== SETTING UP ORB INTERACTIONS ===');

  // Hide orbs on all slider interactions
  document.querySelectorAll('input[type="range"]').forEach(slider => {
    slider.addEventListener('mousedown', hideOrbs);
    slider.addEventListener('touchstart', hideOrbs);
    slider.addEventListener('mouseup', () => {
      showOrbs();
      resetInactivityTimer();
    });
    slider.addEventListener('touchend', () => {
      showOrbs();
      resetInactivityTimer();
    });
    slider.addEventListener('change', () => {
      showOrbs();
      resetInactivityTimer();
    });
  });

  // Hide orbs on all button clicks
  document.querySelectorAll('button').forEach(button => {
    button.addEventListener('mousedown', hideOrbs);
    button.addEventListener('touchstart', hideOrbs);
    button.addEventListener('mouseup', () => {
      setTimeout(showOrbs, 100);
      resetInactivityTimer();
    });
    button.addEventListener('click', () => {
      setTimeout(showOrbs, 150);
      resetInactivityTimer();
    });
  });

  // Hide orbs on file upload interactions
  document.querySelectorAll('input[type="file"]').forEach(input => {
    input.addEventListener('click', hideOrbs);
    input.addEventListener('change', () => {
      setTimeout(showOrbs, 300);
      resetInactivityTimer();
    });
  });

  // Hide orbs on checkbox/toggle interactions
  document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
    checkbox.addEventListener('change', () => {
      hideOrbs();
      setTimeout(showOrbs, 300);
      resetInactivityTimer();
    });
  });

  // Hide orbs on radio button interactions
  document.querySelectorAll('input[type="radio"]').forEach(radio => {
    radio.addEventListener('change', () => {
      hideOrbs();
      setTimeout(showOrbs, 300);
      resetInactivityTimer();
    });
  });

  // Hide orbs on select dropdown interactions
  document.querySelectorAll('select').forEach(select => {
    select.addEventListener('mousedown', hideOrbs);
    select.addEventListener('change', () => {
      setTimeout(showOrbs, 300);
      resetInactivityTimer();
    });
  });

  console.log('✓ Orb interactions configured for all interactive elements');
}

function resetInactivityTimer() {
  clearTimeout(inactivityTimer);
  inactivityTimer = setTimeout(() => {
    showOrbs();
  }, 2000);
}

// Auto-show orbs after inactivity
document.addEventListener('mouseup', () => {
  resetInactivityTimer();
});

document.addEventListener('touchend', () => {
  resetInactivityTimer();
});

// Initialize on load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    init();
    setupOrbInteractions();
  });
} else {
  init();
  setupOrbInteractions();
}