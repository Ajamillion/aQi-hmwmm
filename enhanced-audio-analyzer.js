  drawMeterBackground(meterAreaHeight) {
    // Draw meter background
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    this.ctx.fillRect(0, 0, this.width, meterAreaHeight);
    
    // Draw scale lines
    this.ctx.strokeStyle = this.theme.gridLines;
    this.ctx.lineWidth = 1;
    
    // Calculate scale positions
    const scaleValues = [-6, -9, -12, -14, -18, -23, -30];
    scaleValues.forEach(lufs => {
      const y = this.getLUFSPosition(lufs, meterAreaHeight);
      
      // Skip if outside visible area
      if (y < 0 || y > meterAreaHeight) return;
      
      // Draw scale line
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.width, y);
      this.ctx.stroke();
      
      // Draw scale label
      this.ctx.fillStyle = this.theme.foreground;
      this.ctx.font = '10px Arial';
      this.ctx.textAlign = 'left';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(`${lufs} LUFS`, 5, y);
    });
    
    // Highlight target zone
    const targetTop = this.getLUFSPosition(this.targetLUFS - this.targetTolerance, meterAreaHeight);
    const targetBottom = this.getLUFSPosition(this.targetLUFS + this.targetTolerance, meterAreaHeight);
    const targetHeight = targetBottom - targetTop;
    
    this.ctx.fillStyle = 'rgba(180, 180, 50, 0.1)';
    this.ctx.fillRect(0, targetTop, this.width, targetHeight);
    
    // Draw target label
    this.ctx.fillStyle = 'rgba(180, 180, 50, 0.8)';
    this.ctx.font = '11px Arial';
    this.ctx.textAlign = 'right';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(`Target: ${this.targetLUFS} LUFS`, this.width - 10, targetTop + targetHeight / 2);
  }
  
  /**
   * Draw LUFS meters
   * @param {number} meterAreaHeight - Height of meter area
   */
  drawMeters(meterAreaHeight) {
    if (this.lufsHistory.length === 0) return;
    
    // Get current LUFS values
    const latestEntry = this.lufsHistory[this.lufsHistory.length - 1];
    
    // Calculate positions
    const momentaryX = this.width * 0.2;
    const shortTermX = this.width * 0.5;
    const integratedX = this.width * 0.8;
    const meterWidth = this.meterWidth;
    
    // Draw momentary meter if enabled
    if (this.showMomentary) {
      this.drawLUFSMeter(
        momentaryX - meterWidth / 2, 
        0, 
        meterWidth, 
        meterAreaHeight, 
        latestEntry.momentary,
        'M',
        'Momentary'
      );
    }
    
    // Draw short-term meter if enabled
    if (this.showShortTerm) {
      this.drawLUFSMeter(
        shortTermX - meterWidth / 2, 
        0, 
        meterWidth, 
        meterAreaHeight, 
        latestEntry.shortTerm,
        'S',
        'Short-term'
      );
    }
    
    // Draw integrated meter if enabled
    if (this.showIntegrated) {
      this.drawLUFSMeter(
        integratedX - meterWidth / 2, 
        0, 
        meterWidth, 
        meterAreaHeight, 
        latestEntry.integrated,
        'I',
        'Integrated'
      );
    }
  }
  
  /**
   * Draw individual LUFS meter
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} width - Meter width
   * @param {number} height - Meter height
   * @param {number} lufsValue - LUFS value
   * @param {string} shortLabel - Short label
   * @param {string} fullLabel - Full label
   */
  drawLUFSMeter(x, y, width, height, lufsValue, shortLabel, fullLabel) {
    // Calculate meter position
    const meterPosition = this.getLUFSPosition(lufsValue, height);
    const meterHeight = height - meterPosition;
    
    // Draw meter background
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    this.ctx.fillRect(x, y, width, height);
    
    // Draw meter fill
    this.ctx.fillStyle = this.meterGradient || 'rgb(100, 200, 100)';
    this.ctx.fillRect(x, meterPosition, width, meterHeight);
    
    // Draw meter border
    this.ctx.strokeStyle = this.theme.gridLines;
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(x, y, width, height);
    
    // Draw label
    this.ctx.fillStyle = this.theme.foreground;
    this.ctx.font = '12px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'top';
    this.ctx.fillText(shortLabel, x + width / 2, y + 5);
    
    // Draw value
    this.ctx.fillStyle = this.theme.primary;
    this.ctx.font = '14px Arial';
    this.ctx.textBaseline = 'bottom';
    this.ctx.fillText(lufsValue.toFixed(1), x + width / 2, meterPosition - 5);
    
    // Draw full label
    this.ctx.fillStyle = this.theme.foreground;
    this.ctx.font = '10px Arial';
    this.ctx.textBaseline = 'top';
    this.ctx.fillText(fullLabel, x + width / 2, height + 5);
  }
  
  /**
   * Draw LUFS history graph
   */
  drawLUFSHistory() {
    if (this.lufsHistory.length < 2) return;
    
    const historyTop = this.height - this.historyHeight;
    
    // Draw history background
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    this.ctx.fillRect(0, historyTop, this.width, this.historyHeight);
    
    // Draw history grid
    this.ctx.strokeStyle = this.theme.gridLines;
    this.ctx.lineWidth = 1;
    
    // Horizontal grid lines (LUFS levels)
    const scaleValues = [-6, -9, -12, -14, -18, -23, -30];
    scaleValues.forEach(lufs => {
      const y = historyTop + this.getLUFSPosition(lufs, this.historyHeight);
      
      // Skip if outside visible area
      if (y < historyTop || y > this.height) return;
      
      // Draw grid line
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.width, y);
      this.ctx.stroke();
    });
    
    // Vertical grid lines (time)
    const numTimeLines = 10;
    for (let i = 1; i < numTimeLines; i++) {
      const x = this.width * (i / numTimeLines);
      
      this.ctx.beginPath();
      this.ctx.moveTo(x, historyTop);
      this.ctx.lineTo(x, this.height);
      this.ctx.stroke();
    }
    
    // Draw history lines
    if (this.showMomentary) {
      this.drawLUFSHistoryLine(historyTop, 'momentary', 'rgb(255, 50, 50)');
    }
    
    if (this.showShortTerm) {
      this.drawLUFSHistoryLine(historyTop, 'shortTerm', 'rgb(50, 200, 50)');
    }
    
    if (this.showIntegrated) {
      this.drawLUFSHistoryLine(historyTop, 'integrated', 'rgb(50, 100, 255)');
    }
    
    // Draw history labels
    const labelX = 50;
    const labelSpacing = 20;
    let labelY = historyTop + 15;
    
    if (this.showMomentary) {
      this.drawHistoryLabel(labelX, labelY, 'Momentary', 'rgb(255, 50, 50)');
      labelY += labelSpacing;
    }
    
    if (this.showShortTerm) {
      this.drawHistoryLabel(labelX, labelY, 'Short-term', 'rgb(50, 200, 50)');
      labelY += labelSpacing;
    }
    
    if (this.showIntegrated) {
      this.drawHistoryLabel(labelX, labelY, 'Integrated', 'rgb(50, 100, 255)');
    }
  }
  
  /**
   * Draw LUFS history line
   * @param {number} historyTop - Y position of history top
   * @param {string} key - LUFS type key (momentary, shortTerm, integrated)
   * @param {string} color - Line color
   */
  drawLUFSHistoryLine(historyTop, key, color) {
    this.ctx.beginPath();
    
    for (let i = 0; i < this.lufsHistory.length; i++) {
      const x = (i / (this.lufsHistory.length - 1)) * this.width;
      const lufsValue = this.lufsHistory[i][key];
      const y = historyTop + this.getLUFSPosition(lufsValue, this.historyHeight);
      
      if (i === 0) {
        this.ctx.moveTo(x, y);
      } else {
        this.ctx.lineTo(x, y);
      }
    }
    
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = 2;
    this.ctx.stroke();
  }
  
  /**
   * Draw history label
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {string} text - Label text
   * @param {string} color - Label color
   */
  drawHistoryLabel(x, y, text, color) {
    this.ctx.fillStyle = color;
    this.ctx.beginPath();
    this.ctx.arc(x - 10, y, 4, 0, Math.PI * 2);
    this.ctx.fill();
    
    this.ctx.fillStyle = this.theme.foreground;
    this.ctx.font = '12px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(text, x, y);
  }
  
  /**
   * Get Y position for LUFS value
   * @param {number} lufs - LUFS value
   * @param {number} height - Available height
   * @returns {number} Y position
   */
  getLUFSPosition(lufs, height) {
    // Clamp LUFS to range
    const clampedLUFS = Math.max(this.minLUFS, Math.min(this.maxLUFS, lufs));
    
    // Map LUFS value to position
    // minLUFS -> height, maxLUFS -> 0
    const normalizedValue = (clampedLUFS - this.minLUFS) / (this.maxLUFS - this.minLUFS);
    return height * (1 - normalizedValue);
  }
}

/**
 * UI Component for managing visualizations
 */
class AudioVisualizerUI {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    if (!this.container) {
      throw new Error(`Container with ID ${containerId} not found`);
    }
    
    // Options
    this.options = options;
    
    // Audio engine
    this.audioEngine = null;
    
    // Visualization manager
    this.visualizationManager = null;
    
    // UI elements
    this.uiElements = {
      dropZone: null,
      fileInput: null,
      playButton: null,
      stopButton: null,
      settingsButton: null,
      settingsPanel: null,
      themeSelect: null
    };
    
    // Initialize UI
    this.initializeUI();
    
    // Create audio engine
    this.createAudioEngine();
    
    // Create visualization manager
    this.createVisualizationManager();
    
    // Connect components
    this.connectComponents();
    
    // Add window resize handler
    window.addEventListener('resize', this.handleResize.bind(this));
  }
  
  /**
   * Initialize UI elements
   */
  initializeUI() {
    // Create UI container structure
    this.createUIStructure();
    
    // Create controllers
    this.createControllers();
    
    // Set up event handlers
    this.setupEventHandlers();
  }
  
  /**
   * Create UI structure
   */
  createUIStructure() {
    // Clear container
    this.container.innerHTML = '';
    
    // Set container style
    this.container.style.position = 'relative';
    this.container.style.width = '100%';
    this.container.style.height = '100%';
    this.container.style.overflow = 'hidden';
    this.container.style.backgroundColor = '#1a1a1a';
    this.container.style.fontFamily = '"Exo 2", sans-serif';
    
    // Create header
    const header = document.createElement('div');
    header.className = 'app-header';
    header.style.display = 'flex';
    header.style.justifyContent = 'space-between';
    header.style.alignItems = 'center';
    header.style.padding = '10px';
    header.style.backgroundColor = '#0d0d0d';
    header.style.borderBottom = '1px solid rgba(255, 255, 255, 0.1)';
    
    // Create logo
    const logoContainer = document.createElement('div');
    logoContainer.className = 'logo-container';
    logoContainer.style.display = 'flex';
    logoContainer.style.alignItems = 'center';
    
    const logoIcon = document.createElement('div');
    logoIcon.className = 'logo-icon';
    logoIcon.textContent = '🔊';
    logoIcon.style.fontSize = '24px';
    logoIcon.style.marginRight = '10px';
    
    const logoText = document.createElement('h1');
    logoText.textContent = 'aQi';
    logoText.style.margin = '0';
    logoText.style.fontSize = '24px';
    logoText.style.color = '#ffffff';
    
    logoContainer.appendChild(logoIcon);
    logoContainer.appendChild(logoText);
    header.appendChild(logoContainer);
    
    // Create controls
    const controls = document.createElement('div');
    controls.className = 'header-controls';
    controls.style.display = 'flex';
    controls.style.alignItems = 'center';
    
    // Play button
    const playButton = document.createElement('button');
    playButton.id = 'playButton';
    playButton.className = 'header-button';
    playButton.innerHTML = '▶️ Play';
    playButton.style.backgroundColor = '#00ffff';
    playButton.style.color = '#000000';
    playButton.style.border = 'none';
    playButton.style.borderRadius = '4px';
    playButton.style.padding = '8px 16px';
    playButton.style.marginRight = '10px';
    playButton.style.cursor = 'pointer';
    playButton.disabled = true;
    
    // Stop button
    const stopButton = document.createElement('button');
    stopButton.id = 'stopButton';
    stopButton.className = 'header-button';
    stopButton.innerHTML = '⏹️ Stop';
    stopButton.style.backgroundColor = '#ff3366';
    stopButton.style.color = '#ffffff';
    stopButton.style.border = 'none';
    stopButton.style.borderRadius = '4px';
    stopButton.style.padding = '8px 16px';
    stopButton.style.marginRight = '10px';
    stopButton.style.cursor = 'pointer';
    stopButton.disabled = true;
    
    // Settings button
    const settingsButton = document.createElement('button');
    settingsButton.id = 'settingsButton';
    settingsButton.className = 'header-button';
    settingsButton.innerHTML = '⚙️ Settings';
    settingsButton.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
    settingsButton.style.color = '#ffffff';
    settingsButton.style.border = 'none';
    settingsButton.style.borderRadius = '4px';
    settingsButton.style.padding = '8px 16px';
    settingsButton.style.marginRight = '10px';
    settingsButton.style.cursor = 'pointer';
    
    // Theme select
    const themeSelect = document.createElement('select');
    themeSelect.id = 'themeSelect';
    themeSelect.className = 'header-select';
    themeSelect.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
    themeSelect.style.color = '#ffffff';
    themeSelect.style.border = 'none';
    themeSelect.style.borderRadius = '4px';
    themeSelect.style.padding = '8px 16px';
    themeSelect.style.cursor = 'pointer';
    
    const themes = [
      { value: 'mastering', label: '🎛️ Mastering' },
      { value: 'studio', label: '🎚️ Studio' },
      { value: 'precision', label: '📊 Precision' }
    ];
    
    themes.forEach(theme => {
      const option = document.createElement('option');
      option.value = theme.value;
      option.textContent = theme.label;
      themeSelect.appendChild(option);
    });
    
    controls.appendChild(playButton);
    controls.appendChild(stopButton);
    controls.appendChild(settingsButton);
    controls.appendChild(themeSelect);
    header.appendChild(controls);
    
    // Create main content area
    const mainContent = document.createElement('div');
    mainContent.className = 'main-content';
    mainContent.style.display = 'flex';
    mainContent.style.flexDirection = 'column';
    mainContent.style.height = 'calc(100% - 60px)';
    mainContent.style.padding = '10px';
    mainContent.style.overflow = 'auto';
    
    // Create drop zone
    const dropZone = document.createElement('div');
    dropZone.id = 'dropZone';
    dropZone.className = 'drop-zone';
    dropZone.style.display = 'flex';
    dropZone.style.flexDirection = 'column';
    dropZone.style.justifyContent = 'center';
    dropZone.style.alignItems = 'center';
    dropZone.style.height = '200px';
    dropZone.style.border = '2px dashed rgba(255, 255, 255, 0.3)';
    dropZone.style.borderRadius = '8px';
    dropZone.style.backgroundColor = 'rgba(0, 0, 0, 0.2)';
    dropZone.style.color = '#ffffff';
    dropZone.style.cursor = 'pointer';
    
    const dropIcon = document.createElement('div');
    dropIcon.className = 'drop-icon';
    dropIcon.textContent = '📁';
    dropIcon.style.fontSize = '48px';
    dropIcon.style.marginBottom = '10px';
    
    const dropText = document.createElement('div');
    dropText.className = 'drop-text';
    dropText.textContent = 'Drag & Drop Audio File';
    dropText.style.fontSize = '18px';
    dropText.style.marginBottom = '5px';
    
    const dropSubtext = document.createElement('div');
    dropSubtext.className = 'drop-subtext';
    dropSubtext.textContent = 'or click to browse';
    dropSubtext.style.fontSize = '14px';
    dropSubtext.style.opacity = '0.7';
    
    const fileInput = document.createElement('input');
    fileInput.id = 'fileInput';
    fileInput.type = 'file';
    fileInput.accept = 'audio/*';
    fileInput.style.display = 'none';
    
    dropZone.appendChild(dropIcon);
    dropZone.appendChild(dropText);
    dropZone.appendChild(dropSubtext);
    dropZone.appendChild(fileInput);
    
    // Create visualization containers
    const visualizationArea = document.createElement('div');
    visualizationArea.className = 'visualization-area';
    visualizationArea.style.display = 'none';
    visualizationArea.style.flexGrow = '1';
    visualizationArea.style.marginTop = '10px';
    
    // Create spectrogram container
    const spectrogramContainer = document.createElement('div');
    spectrogramContainer.className = 'visualization-container';
    spectrogramContainer.style.height = '200px';
    spectrogramContainer.style.marginBottom = '10px';
    spectrogramContainer.style.borderRadius = '8px';
    spectrogramContainer.style.overflow = 'hidden';
    spectrogramContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.3)';
    
    const spectrogramTitle = document.createElement('div');
    spectrogramTitle.className = 'visualization-title';
    spectrogramTitle.textContent = 'Spectrogram';
    spectrogramTitle.style.padding = '5px 10px';
    spectrogramTitle.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    spectrogramTitle.style.color = '#ffffff';
    spectrogramTitle.style.fontSize = '14px';
    
    const spectrogramCanvas = document.createElement('canvas');
    spectrogramCanvas.id = 'spectrogramCanvas';
    spectrogramCanvas.style.width = '100%';
    spectrogramCanvas.style.height = 'calc(100% - 30px)';
    
    spectrogramContainer.appendChild(spectrogramTitle);
    spectrogramContainer.appendChild(spectrogramCanvas);
    
    // Create waveform container
    const waveformContainer = document.createElement('div');
    waveformContainer.className = 'visualization-container';
    waveformContainer.style.height = '200px';
    waveformContainer.style.marginBottom = '10px';
    waveformContainer.style.borderRadius = '8px';
    waveformContainer.style.overflow = 'hidden';
    waveformContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.3)';
    
    const waveformTitle = document.createElement('div');
    waveformTitle.className = 'visualization-title';
    waveformTitle.textContent = 'Waveform';
    waveformTitle.style.padding = '5px 10px';
    waveformTitle.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    waveformTitle.style.color = '#ffffff';
    waveformTitle.style.fontSize = '14px';
    
    const waveformCanvas = document.createElement('canvas');
    waveformCanvas.id = 'waveformCanvas';
    waveformCanvas.style.width = '100%';
    waveformCanvas.style.height = 'calc(100% - 30px)';
    
    waveformContainer.appendChild(waveformTitle);
    waveformContainer.appendChild(waveformCanvas);
    
    // Create phase and LUFS container
    const metersContainer = document.createElement('div');
    metersContainer.className = 'meters-container';
    metersContainer.style.display = 'flex';
    metersContainer.style.height = '250px';
    metersContainer.style.marginBottom = '10px';
    
    // Create phase container
    const phaseContainer = document.createElement('div');
    phaseContainer.className = 'visualization-container';
    phaseContainer.style.flex = '1';
    phaseContainer.style.marginRight = '10px';
    phaseContainer.style.borderRadius = '8px';
    phaseContainer.style.overflow = 'hidden';
    phaseContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.3)';
    
    const phaseTitle = document.createElement('div');
    phaseTitle.className = 'visualization-title';
    phaseTitle.textContent = 'Phase Correlation';
    phaseTitle.style.padding = '5px 10px';
    phaseTitle.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    phaseTitle.style.color = '#ffffff';
    phaseTitle.style.fontSize = '14px';
    
    const phaseCanvas = document.createElement('canvas');
    phaseCanvas.id = 'phaseCanvas';
    phaseCanvas.style.width = '100%';
    phaseCanvas.style.height = 'calc(100% - 30px)';
    
    phaseContainer.appendChild(phaseTitle);
    phaseContainer.appendChild(phaseCanvas);
    
    // Create LUFS container
    const lufsContainer = document.createElement('div');
    lufsContainer.className = 'visualization-container';
    lufsContainer.style.flex = '1';
    lufsContainer.style.borderRadius = '8px';
    lufsContainer.style.overflow = 'hidden';
    lufsContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.3)';
    
    const lufsTitle = document.createElement('div');
    lufsTitle.className = 'visualization-title';
    lufsTitle.textContent = 'LUFS Meter';
    lufsTitle.style.padding = '5px 10px';
    lufsTitle.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    lufsTitle.style.color = '#ffffff';
    lufsTitle.style.fontSize = '14px';
    
    const lufsCanvas = document.createElement('canvas');
    lufsCanvas.id = 'lufsCanvas';
    lufsCanvas.style.width = '100%';
    lufsCanvas.style.height = 'calc(100% - 30px)';
    
    lufsContainer.appendChild(lufsTitle);
    lufsContainer.appendChild(lufsCanvas);
    
    metersContainer.appendChild(phaseContainer);
    metersContainer.appendChild(lufsContainer);
    
    // Add all visualizations to the visualization area
    visualizationArea.appendChild(spectrogramContainer);
    visualizationArea.appendChild(waveformContainer);
    visualizationArea.appendChild(metersContainer);
    
    // Add components to main content
    mainContent.appendChild(dropZone);
    mainContent.appendChild(visualizationArea);
    
    // Add all elements to container
    this.container.appendChild(header);
    this.container.appendChild(mainContent);
    
    // Store UI elements
    this.uiElements = {
      dropZone,
      fileInput,
      playButton,
      stopButton,
      settingsButton,
      themeSelect,
      visualizationArea,
      spectrogramCanvas,
      waveformCanvas,
      phaseCanvas,
      lufsCanvas
    };
  }
  
  /**
   * Create visualization controllers
   */
  createControllers() {
    // Controllers will be created when visualization manager is initialized
  }
  
  /**
   * Set up event handlers
   */
  setupEventHandlers() {
    // File input handling
    this.uiElements.fileInput.addEventListener('change', this.handleFileSelect.bind(this));
    
    // Drop zone handling
    this.uiElements.dropZone.addEventListener('click', () => {
      this.uiElements.fileInput.click();
    });
    
    this.uiElements.dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      this.uiElements.dropZone.style.borderColor = '#00ffff';
      this.uiElements.dropZone.style.backgroundColor = 'rgba(0, 255, 255, 0.1)';
    });
    
    this.uiElements.dropZone.addEventListener('dragleave', () => {
      this.uiElements.dropZone.style.borderColor = 'rgba(255, 255, 255, 0.3)';
      this.uiElements.dropZone.style.backgroundColor = 'rgba(0, 0, 0, 0.2)';
    });
    
    this.uiElements.dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      this.uiElements.dropZone.style.borderColor = 'rgba(255, 255, 255, 0.3)';
      this.uiElements.dropZone.style.backgroundColor = 'rgba(0, 0, 0, 0.2)';
      
      if (e.dataTransfer.files.length > 0) {
        this.handleFile(e.dataTransfer.files[0]);
      }
    });
    
    // Play/stop button handling
    this.uiElements.playButton.addEventListener('click', () => {
      if (this.audioEngine) {
        this.audioEngine.play();
      }
    });
    
    this.uiElements.stopButton.addEventListener('click', () => {
      if (this.audioEngine) {
        this.audioEngine.stop();
      }
    });
    
    // Theme select handling
    this.uiElements.themeSelect.addEventListener('change', () => {
      const theme = this.uiElements.themeSelect.value;
      if (this.visualizationManager) {
        this.visualizationManager.setTheme(theme);
      }
    });
  }
  
  /**
   * Create audio engine
   */
  createAudioEngine() {
    this.audioEngine = new AudioEngine({
      fftSize: 2048,
      historyLength: 100
    });
  }
  
  /**
   * Create visualization manager
   */
  createVisualizationManager() {
    this.visualizationManager = new VisualizationManager({
      theme: 'mastering',
      targetFPS: 30
    });
    
    // Create visualization controllers
    this.createSpectrogramController();
    this.createWaveformController();
    this.createPhaseController();
    this.createLUFSController();
  }
  
  /**
   * Create spectrogram controller
   */
  createSpectrogramController() {
    const spectrogramController = new SpectrogramController('spectrogramCanvas', {
      logScale: true,
      showScale: true,
      minDb: -90,
      maxDb: 0,
      showTooltip: true
    });
    
    this.visualizationManager.registerCanvas('spectrogramCanvas', spectrogramController);
    this.visualizationManager.observeCanvas('spectrogramCanvas');
  }
  
  /**
   * Create waveform controller
   */
  createWaveformController() {
    const waveformController = new WaveformController('waveformCanvas', {
      showPeaks: true,
      showRMS: true,
      showClipping: true,
      showTimeAxis: true,
      showAmplitudeAxis: true
    });
    
    this.visualizationManager.registerCanvas('waveformCanvas', waveformController);
    this.visualizationManager.observeCanvas('waveformCanvas');
  }
  
  /**
   * Create phase controller
   */
  createPhaseController() {
    const phaseController = new PhaseCorrelationController('phaseCanvas', {
      showGoniometer: true,
      showCorrelationMeter: true,
      persistence: 0.92,
      samplesPerFrame: 1000
    });
    
    this.visualizationManager.registerCanvas('phaseCanvas', phaseController);
    this.visualizationManager.observeCanvas('phaseCanvas');
  }
  
  /**
   * Create LUFS controller
   */
  createLUFSController() {
    const lufsController = new LUFSMeterController('lufsCanvas', {
      showMomentary: true,
      showShortTerm: true,
      showIntegrated: true,
      showHistory: true,
      minLUFS: -30,
      maxLUFS: -6,
      targetLUFS: -14,
      targetTolerance: 1
    });
    
    this.visualizationManager.registerCanvas('lufsCanvas', lufsController);
    this.visualizationManager.observeCanvas('lufsCanvas');
  }
  
  /**
   * Connect components
   */
  connectComponents() {
    // Connect audio engine to visualization manager
    this.visualizationManager.connectAudioEngine(this.audioEngine);
    
    // Start visualization
    this.visualizationManager.start();
  }
  
  /**
   * Handle file select event
   * @param {Event} event - File select event
   */
  handleFileSelect(event) {
    if (event.target.files.length > 0) {
      this.handleFile(event.target.files[0]);
    }
  }
  
  /**
   * Handle file loading
   * @param {File} file - Audio file
   */
  handleFile(file) {
    // Check if file is audio
    if (!file.type.startsWith('audio/')) {
      alert('Please select an audio file');
      return;
    }
    
    // Show loading state
    this.showLoading(true);
    
    // Load file into audio engine
    this.audioEngine.loadFile(file)
      .then(() => {
        // Show visualizations
        this.showVisualizations();
        
        // Enable buttons
        this.uiElements.playButton.disabled = false;
        this.uiElements.stopButton.disabled = false;
        
        // Hide loading state
        this.showLoading(false);
      })
      .catch(error => {
        console.error('Error loading audio file:', error);
        alert('Error loading audio file: ' + error.message);
        
        // Hide loading state
        this.showLoading(false);
      });
  }
  
  /**
   * Show/hide loading state
   * @param {boolean} isLoading - Loading state
   */
  showLoading(isLoading) {
    const dropZone = this.uiElements.dropZone;
    
    if (isLoading) {
      // Change drop zone to loading state
      dropZone.querySelector('.drop-icon').textContent = '⏳';
      dropZone.querySelector('.drop-text').textContent = 'Loading...';
      dropZone.querySelector('.drop-subtext').textContent = 'Please wait';
      dropZone.style.cursor = 'wait';
    } else {
      // Reset drop zone
      dropZone.querySelector('.drop-icon').textContent = '📁';
      dropZone.querySelector('.drop-text').textContent = 'Drag & Drop Audio File';
      dropZone.querySelector('.drop-subtext').textContent = 'or click to browse';
      dropZone.style.cursor = 'pointer';
    }
  }
  
  /**
   * Show visualizations
   */
  showVisualizations() {
    this.uiElements.visualizationArea.style.display = 'block';
    this.uiElements.dropZone.style.height = '100px';
  }
  
  /**
   * Handle window resize
   */
  handleResize() {
    if (this.visualizationManager) {
      this.visualizationManager.handleResize();
    }
  }
}

/**
 * Initialize the application
 */
function initializeApp() {
  document.addEventListener('DOMContentLoaded', () => {
    // Create main container if it doesn't exist
    let container = document.getElementById('audioVisualizerContainer');
    
    if (!container) {
      container = document.createElement('div');
      container.id = 'audioVisualizerContainer';
      container.style.width = '100%';
      container.style.height = '100vh';
      document.body.appendChild(container);
    }
    
    // Create audio visualizer UI
    const audioVisualizerUI = new AudioVisualizerUI('audioVisualizerContainer');
    
    // Store reference in window for debugging
    window.audioVisualizer = audioVisualizerUI;
  });
}

// Initialize the application
initializeApp();  /**
   * Handle mouse down for panning
   * @param {Object} position - Mouse position
   */
  onMouseDown(position) {
    this.dragStart = { ...position };
    this.startFreqScroll = this.freqScroll;
    this.startTimeScroll = this.timeScroll;
  }
  
  /**
   * Handle mouse move for panning when mouse is down
   * @param {Object} position - Mouse position
   */
  onMouseMove(position) {
    super.onMouseMove(position);
    
    if (this.mouseDown && this.dragStart) {
      // Determine if we're dragging in frequency or time axis
      if (position.x > this.width - this.scaleWidth) {
        // Frequency axis drag
        const dragDelta = (position.y - this.dragStart.y) / this.height;
        this.freqScroll = Math.max(0, Math.min(1, this.startFreqScroll + dragDelta));
      } else {
        // Time axis drag
        const dragDelta = (position.x - this.dragStart.x) / (this.width - this.scaleWidth);
        this.timeScroll = Math.max(0, Math.min(1, this.startTimeScroll + dragDelta));
      }
    }
  }
  
  /**
   * Render spectrogram visualization
   */
  render() {
    if (!this.shouldRender()) return this;
    
    // Update animations
    this.updateAnimations();
    
    // Clear canvas
    this.clear();
    
    // Draw background
    this.drawBackground();
    
    // Calculate content width (accounting for frequency scale)
    const contentWidth = this.showScale ? this.width - this.scaleWidth : this.width;
    
    // Draw spectrogram only if we have data
    if (this.spectrogramData.length > 0) {
      this.drawSpectrogram(contentWidth);
    }
    
    // Draw frequency scale if enabled
    if (this.showScale) {
      this.drawFrequencyScale();
    }
    
    // Draw hover tooltip if enabled
    if (this.showTooltip && this.hoverInfo) {
      this.drawTooltip();
    }
    
    return this;
  }
  
  /**
   * Draw the spectrogram visualization
   * @param {number} contentWidth - Width of content area
   */
  drawSpectrogram(contentWidth) {
    // Create image data for the spectrogram
    const imageData = this.ctx.createImageData(contentWidth, this.height);
    const data = imageData.data;
    
    // Calculate visualization parameters
    const effectiveHeight = this.height * this.freqZoom;
    const yOffset = this.freqScroll * (effectiveHeight - this.height);
    
    // Calculate time scaling
    const visibleFrames = Math.min(
      this.spectrogramData.length,
      Math.ceil(contentWidth / this.timeScale)
    );
    
    const timeStart = Math.floor(this.timeScroll * (this.spectrogramData.length - visibleFrames));
    
    // Draw each spectrogram frame
    for (let x = 0; x < contentWidth; x++) {
      // Calculate frame index based on timeZoom and scroll
      const frameIndex = timeStart + Math.floor(x / contentWidth * visibleFrames);
      
      // Skip if out of range
      if (frameIndex < 0 || frameIndex >= this.spectrogramData.length) continue;
      
      const frame = this.spectrogramData[this.spectrogramData.length - 1 - frameIndex];
      
      for (let y = 0; y < this.height; y++) {
        // Adjust y position based on zoom and scroll
        const adjustedY = y + yOffset;
        if (adjustedY < 0 || adjustedY >= effectiveHeight) continue;
        
        // Map Y coordinate to frequency bin
        const relativeY = adjustedY / effectiveHeight;
        
        let binIndex;
        if (this.logScale) {
          // Logarithmic scale
          const minLog = Math.log10(this.minFreq);
          const maxLog = Math.log10(this.maxFreq);
          const valueLog = minLog + (maxLog - minLog) * relativeY;
          const freq = Math.pow(10, valueLog);
          
          binIndex = Math.floor(freq / this.maxFreq * frame.left.length);
        } else {
          // Linear scale
          binIndex = Math.floor(relativeY * frame.left.length);
        }
        
        binIndex = Math.max(0, Math.min(frame.left.length - 1, binIndex));
        
        // Get normalized value from frequency data (typically in dB scale)
        const leftDb = frame.left[binIndex];
        const rightDb = frame.right[binIndex];
        const dbValue = (leftDb + rightDb) / 2;
        
        // Normalize to 0-1 range for color mapping
        const normalizedValue = Math.max(0, Math.min(1, 
          (dbValue - this.minDb) / (this.maxDb - this.minDb)
        ));
        
        // Map to colormap
        const colorIndex = Math.floor(normalizedValue * 255) * 4;
        
        // Set pixel color
        const pixelIndex = (y * contentWidth + x) * 4;
        data[pixelIndex] = this.colorGradient[colorIndex];     // R
        data[pixelIndex + 1] = this.colorGradient[colorIndex + 1]; // G
        data[pixelIndex + 2] = this.colorGradient[colorIndex + 2]; // B
        data[pixelIndex + 3] = 255; // Alpha
      }
    }
    
    // Draw the image data to the canvas
    this.ctx.putImageData(imageData, 0, 0);
  }
  
  /**
   * Draw frequency scale on the right side
   */
  drawFrequencyScale() {
    // Draw scale background
    this.ctx.fillStyle = this.theme.background;
    this.ctx.fillRect(
      this.width - this.scaleWidth, 
      0, 
      this.scaleWidth, 
      this.height
    );
    
    // Draw scale line
    this.ctx.beginPath();
    this.ctx.moveTo(this.width - this.scaleWidth, 0);
    this.ctx.lineTo(this.width - this.scaleWidth, this.height);
    this.ctx.strokeStyle = this.theme.gridLines;
    this.ctx.lineWidth = 1;
    this.ctx.stroke();
    
    // Calculate effective height with zoom
    const effectiveHeight = this.height * this.freqZoom;
    const yOffset = this.freqScroll * (effectiveHeight - this.height);
    
    // Draw frequency labels
    this.ctx.font = '10px Arial';
    this.ctx.fillStyle = this.theme.foreground;
    this.ctx.textAlign = 'right';
    
    this.frequencyLabels.forEach(freq => {
      // Calculate y position based on frequency
      let y;
      if (this.logScale) {
        const minLog = Math.log10(this.minFreq);
        const maxLog = Math.log10(this.maxFreq);
        const freqLog = Math.log10(freq);
        
        const normalizedPos = (freqLog - minLog) / (maxLog - minLog);
        y = effectiveHeight * normalizedPos - yOffset;
      } else {
        y = this.height - ((freq - this.minFreq) / (this.maxFreq - this.minFreq)) * effectiveHeight - yOffset;
      }
      
      // Skip if out of visible range
      if (y < 0 || y > this.height) return;
      
      // Draw frequency label
      this.ctx.fillText(
        freq >= 1000 ? `${(freq/1000).toFixed(freq >= 10000 ? 0 : 1)}k` : freq, 
        this.width - 10, 
        y
      );
      
      // Draw tick line
      this.ctx.beginPath();
      this.ctx.moveTo(this.width - this.scaleWidth, y);
      this.ctx.lineTo(this.width - 5, y);
      this.ctx.strokeStyle = this.theme.gridLines;
      this.ctx.stroke();
    });
    
    // Draw scale title
    this.ctx.save();
    this.ctx.translate(this.width - 15, this.height / 2);
    this.ctx.rotate(-Math.PI / 2);
    this.ctx.textAlign = 'center';
    this.ctx.fillStyle = this.theme.primary;
    this.ctx.font = '11px Arial';
    this.ctx.fillText('Frequency (Hz)', 0, 0);
    this.ctx.restore();
  }
  
  /**
   * Draw hover tooltip with frequency and db value
   */
  drawTooltip() {
    if (!this.hoverInfo || this.hoverInfo.value === null) return;
    
    const { x, y, frequency, value } = this.hoverInfo;
    
    // Format tooltip text
    const freqText = frequency < 1000 ? 
      `${Math.round(frequency)} Hz` : 
      `${(frequency / 1000).toFixed(1)} kHz`;
    
    const dbText = `${value.toFixed(1)} dB`;
    const tooltipText = `${freqText}: ${dbText}`;
    
    // Measure text
    this.ctx.font = '12px Arial';
    const textWidth = this.ctx.measureText(tooltipText).width;
    
    // Draw tooltip background
    const padding = 6;
    const boxWidth = textWidth + padding * 2;
    const boxHeight = 20;
    
    // Adjust position to keep tooltip on screen
    let tooltipX = x + 10;
    if (tooltipX + boxWidth > this.width - this.scaleWidth) {
      tooltipX = x - boxWidth - 10;
    }
    
    let tooltipY = y - boxHeight - 10;
    if (tooltipY < 0) {
      tooltipY = y + 10;
    }
    
    // Draw tooltip box
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    this.ctx.fillRect(tooltipX, tooltipY, boxWidth, boxHeight);
    
    // Draw tooltip border
    this.ctx.strokeStyle = this.theme.primary;
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(tooltipX, tooltipY, boxWidth, boxHeight);
    
    // Draw tooltip text
    this.ctx.fillStyle = this.theme.foreground;
    this.ctx.textAlign = 'left';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(tooltipText, tooltipX + padding, tooltipY + boxHeight / 2);
  }
}

/**
 * WaveformController with advanced visualization
 */
class WaveformController extends BaseCanvasController {
  constructor(canvasId, options = {}) {
    super(canvasId, options);
    
    // Waveform options
    this.waveColor = options.waveColor || null; // Use theme if null
    this.peakColor = options.peakColor || null;
    this.backgroundColor = options.backgroundColor || null;
    
    this.showPeaks = options.showPeaks !== undefined ? options.showPeaks : true;
    this.showRMS = options.showRMS !== undefined ? options.showRMS : true;
    this.showClipping = options.showClipping !== undefined ? options.showClipping : true;
    
    // Time domain data
    this.timeDataHistory = [];
    this.historyLength = options.historyLength || 10; // Number of frames to keep
    
    // Zoom and scroll
    this.zoomLevel = 1.0;
    this.scrollPosition = 0;
    
    // Markers
    this.markers = [];
    
    // Analysis results
    this.peaks = [];
    this.rmsValues = [];
    this.clippingPoints = [];
    
    // Display options
    this.showTimeAxis = options.showTimeAxis !== undefined ? options.showTimeAxis : true;
    this.showAmplitudeAxis = options.showAmplitudeAxis !== undefined ? options.showAmplitudeAxis : true;
    this.timeAxisHeight = options.timeAxisHeight || 20;
    this.amplitudeAxisWidth = options.amplitudeAxisWidth || 40;
    
    // Initialize gradients
    this.waveGradient = null;
    this.rmsGradient = null;
  }
  
  /**
   * Create gradients for waveform visualization
   */
  createGradients() {
    if (!this.theme) return;
    
    // Create waveform gradient
    this.waveGradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
    this.waveGradient.addColorStop(0, this.theme.primary);
    this.waveGradient.addColorStop(0.5, this.theme.secondary);
    this.waveGradient.addColorStop(1, this.theme.primary);
    
    // Create RMS gradient
    this.rmsGradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
    this.rmsGradient.addColorStop(0, this.theme.tertiary);
    this.rmsGradient.addColorStop(1, this.theme.tertiary);
  }
  
  /**
   * Update waveform with new audio data
   * @param {Object} metrics - Audio metrics
   */
  updateMetrics(metrics) {
    super.updateMetrics(metrics);
    
    // Add time domain data to history if available
    if (metrics && metrics.timeData) {
      this.timeDataHistory.push({
        left: metrics.timeData.left,
        right: metrics.timeData.right,
        peaks: {
          left: Math.max(...metrics.timeData.left.map(Math.abs)),
          right: Math.max(...metrics.timeData.right.map(Math.abs))
        },
        rms: {
          left: Math.sqrt(metrics.timeData.left.reduce((sum, val) => sum + val * val, 0) / metrics.timeData.left.length),
          right: Math.sqrt(metrics.timeData.right.reduce((sum, val) => sum + val * val, 0) / metrics.timeData.right.length)
        },
        time: performance.now()
      });
      
      // Keep history limited
      while (this.timeDataHistory.length > this.historyLength) {
        this.timeDataHistory.shift();
      }
      
      // Detect peaks
      this.detectPeaks();
      
      // Detect clipping
      this.detectClipping();
    }
    
    return this;
  }
  
  /**
   * Detect peaks in audio data
   */
  detectPeaks() {
    if (!this.timeDataHistory.length) return;
    
    const latestFrame = this.timeDataHistory[this.timeDataHistory.length - 1];
    
    // Simple peak detection
    this.peaks = [];
    
    // Process left channel
    for (let i = 1; i < latestFrame.left.length - 1; i++) {
      if (Math.abs(latestFrame.left[i]) > 0.8 && // Only significant peaks
          Math.abs(latestFrame.left[i]) > Math.abs(latestFrame.left[i-1]) &&
          Math.abs(latestFrame.left[i]) > Math.abs(latestFrame.left[i+1])) {
        this.peaks.push({
          channel: 'left',
          position: i,
          value: latestFrame.left[i]
        });
      }
    }
    
    // Process right channel
    for (let i = 1; i < latestFrame.right.length - 1; i++) {
      if (Math.abs(latestFrame.right[i]) > 0.8 && // Only significant peaks
          Math.abs(latestFrame.right[i]) > Math.abs(latestFrame.right[i-1]) &&
          Math.abs(latestFrame.right[i]) > Math.abs(latestFrame.right[i+1])) {
        this.peaks.push({
          channel: 'right',
          position: i,
          value: latestFrame.right[i]
        });
      }
    }
  }
  
  /**
   * Detect clipping in audio data
   */
  detectClipping() {
    if (!this.timeDataHistory.length) return;
    
    const latestFrame = this.timeDataHistory[this.timeDataHistory.length - 1];
    const threshold = 0.98; // Clipping threshold
    
    this.clippingPoints = [];
    
    // Check for consecutive samples near maximum value
    let currentRun = 0;
    
    // Left channel
    for (let i = 0; i < latestFrame.left.length; i++) {
      if (Math.abs(latestFrame.left[i]) > threshold) {
        currentRun++;
        
        // Require at least 3 consecutive samples for clipping
        if (currentRun >= 3) {
          this.clippingPoints.push({
            channel: 'left',
            position: i - currentRun + 1,
            length: currentRun
          });
        }
      } else {
        currentRun = 0;
      }
    }
    
    // Right channel
    currentRun = 0;
    for (let i = 0; i < latestFrame.right.length; i++) {
      if (Math.abs(latestFrame.right[i]) > threshold) {
        currentRun++;
        
        // Require at least 3 consecutive samples for clipping
        if (currentRun >= 3) {
          this.clippingPoints.push({
            channel: 'right',
            position: i - currentRun + 1,
            length: currentRun
          });
        }
      } else {
        currentRun = 0;
      }
    }
  }
  
  /**
   * Handle mouse wheel for zooming
   * @param {number} delta - Wheel delta
   */
  onWheel(delta) {
    // Zoom waveform
    this.zoomLevel = Math.max(1, Math.min(50, this.zoomLevel + (delta > 0 ? -0.5 : 0.5)));
  }
  
  /**
   * Handle mouse down for panning
   * @param {Object} position - Mouse position
   */
  onMouseDown(position) {
    this.dragStart = { ...position };
    this.startScrollPosition = this.scrollPosition;
  }
  
  /**
   * Handle mouse move for panning
   * @param {Object} position - Mouse position
   */
  onMouseMove(position) {
    if (this.mouseDown && this.dragStart) {
      const dragDelta = (position.x - this.dragStart.x) / this.width;
      this.scrollPosition = Math.max(0, Math.min(1, this.startScrollPosition - dragDelta / this.zoomLevel));
    }
    
    // Calculate time position for hover tooltip
    const contentWidth = this.showAmplitudeAxis ? this.width - this.amplitudeAxisWidth : this.width;
    const contentHeight = this.showTimeAxis ? this.height - this.timeAxisHeight : this.height;
    
    if (position.x < contentWidth && position.y < contentHeight) {
      const visibleWidth = contentWidth / this.zoomLevel;
      const startOffset = this.scrollPosition * (1 - 1/this.zoomLevel) * contentWidth;
      const positionRatio = (position.x + startOffset) / contentWidth;
      
      this.hoverTime = positionRatio;
    } else {
      this.hoverTime = null;
    }
  }
  
  /**
   * Add a marker at current hover position
   */
  onMouseDown(position) {
    super.onMouseDown(position);
    
    // Add marker on double click
    if (this.lastClickTime && performance.now() - this.lastClickTime < 300) {
      if (this.hoverTime !== null) {
        this.markers.push({
          time: this.hoverTime,
          label: `M${this.markers.length + 1}`,
          color: this.theme.tertiary
        });
      }
    }
    
    this.lastClickTime = performance.now();
  }
  
  /**
   * Render waveform visualization
   */
  render() {
    if (!this.shouldRender()) return this;
    
    // Update animations
    this.updateAnimations();
    
    // Clear canvas
    this.clear();
    
    // Draw background
    this.drawBackground();
    
    // Calculate content dimensions
    const contentWidth = this.showAmplitudeAxis ? this.width - this.amplitudeAxisWidth : this.width;
    const contentHeight = this.showTimeAxis ? this.height - this.timeAxisHeight : this.height;
    
    // Draw waveform only if we have data
    if (this.timeDataHistory.length > 0) {
      // Draw grid
      this.drawGrid(contentWidth, contentHeight);
      
      // Draw waveform
      this.drawWaveform(contentWidth, contentHeight);
      
      // Draw RMS envelope if enabled
      if (this.showRMS) {
        this.drawRMSEnvelope(contentWidth, contentHeight);
      }
      
      // Draw peaks if enabled
      if (this.showPeaks) {
        this.drawPeaks(contentWidth, contentHeight);
      }
      
      // Draw clipping indicators if enabled
      if (this.showClipping) {
        this.drawClippingIndicators(contentWidth, contentHeight);
      }
      
      // Draw markers
      this.drawMarkers(contentWidth, contentHeight);
    }
    
    // Draw axes if enabled
    if (this.showTimeAxis) {
      this.drawTimeAxis(contentWidth, contentHeight);
    }
    
    if (this.showAmplitudeAxis) {
      this.drawAmplitudeAxis(contentWidth, contentHeight);
    }
    
    // Draw hover info
    if (this.hoverTime !== null) {
      this.drawHoverInfo(contentWidth, contentHeight);
    }
    
    return this;
  }
  
  /**
   * Draw grid lines
   * @param {number} width - Content width
   * @param {number} height - Content height
   */
  drawGrid(width, height) {
    // Draw amplitude grid lines
    this.ctx.beginPath();
    this.ctx.strokeStyle = this.theme.gridLines;
    this.ctx.lineWidth = 1;
    
    // Center line (0 dB)
    this.ctx.moveTo(0, height / 2);
    this.ctx.lineTo(width, height / 2);
    
    // +/- 0.5 lines
    this.ctx.moveTo(0, height * 0.25);
    this.ctx.lineTo(width, height * 0.25);
    this.ctx.moveTo(0, height * 0.75);
    this.ctx.lineTo(width, height * 0.75);
    
    this.ctx.stroke();
    
    // Draw time grid lines
    const numTimeLines = 10;
    for (let i = 1; i < numTimeLines; i++) {
      const x = width * (i / numTimeLines);
      
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, height);
      this.ctx.stroke();
    }
  }
  
  /**
   * Draw waveform
   * @param {number} width - Content width
   * @param {number} height - Content height
   */
  drawWaveform(width, height) {
    if (!this.timeDataHistory.length) return;
    
    const centerY = height / 2;
    const latestFrame = this.timeDataHistory[this.timeDataHistory.length - 1];
    
    // Calculate visible portion based on zoom and scroll
    const visibleWidth = width / this.zoomLevel;
    const startOffset = this.scrollPosition * (1 - 1/this.zoomLevel) * width;
    
    // Draw left channel
    this.ctx.beginPath();
    
    // Use data length to determine sample interval
    const sampleInterval = Math.max(1, Math.floor(latestFrame.left.length / visibleWidth));
    let x = 0;
    
    for (let i = 0; i < latestFrame.left.length; i += sampleInterval) {
      const sampleX = (i / latestFrame.left.length) * width - startOffset;
      
      // Skip if outside visible area
      if (sampleX < 0) continue;
      if (sampleX > width) break;
      
      const y = centerY - (latestFrame.left[i] * centerY);
      
      if (i === 0) {
        this.ctx.moveTo(sampleX, y);
      } else {
        this.ctx.lineTo(sampleX, y);
      }
    }
    
    this.ctx.strokeStyle = this.waveColor || this.theme.primary;
    this.ctx.lineWidth = 1.5;
    this.ctx.stroke();
    
    // Draw right channel
    this.ctx.beginPath();
    
    for (let i = 0; i < latestFrame.right.length; i += sampleInterval) {
      const sampleX = (i / latestFrame.right.length) * width - startOffset;
      
      // Skip if outside visible area
      if (sampleX < 0) continue;
      if (sampleX > width) break;
      
      const y = centerY - (latestFrame.right[i] * centerY);
      
      if (i === 0) {
        this.ctx.moveTo(sampleX, y);
      } else {
        this.ctx.lineTo(sampleX, y);
      }
    }
    
    this.ctx.strokeStyle = this.waveColor || this.theme.secondary;
    this.ctx.stroke();
  }
  
  /**
   * Draw RMS envelope
   * @param {number} width - Content width
   * @param {number} height - Content height
   */
  drawRMSEnvelope(width, height) {
    if (!this.timeDataHistory.length) return;
    
    const centerY = height / 2;
    const latestFrame = this.timeDataHistory[this.timeDataHistory.length - 1];
    
    // Calculate visible portion based on zoom and scroll
    const visibleWidth = width / this.zoomLevel;
    const startOffset = this.scrollPosition * (1 - 1/this.zoomLevel) * width;
    
    // Calculate RMS with moving window
    const windowSize = Math.floor(latestFrame.left.length / 100);
    const rmsValues = [];
    
    for (let i = 0; i < latestFrame.left.length; i += windowSize) {
      let sumSquared = 0;
      
      // Calculate RMS for this window
      for (let j = i; j < Math.min(i + windowSize, latestFrame.left.length); j++) {
        const avg = (latestFrame.left[j] + latestFrame.right[j]) / 2;
        sumSquared += avg * avg;
      }
      
      const rms = Math.sqrt(sumSquared / windowSize);
      rmsValues.push({
        position: i,
        value: rms
      });
    }
    
    // Draw RMS envelope
    this.ctx.beginPath();
    
    for (let i = 0; i < rmsValues.length; i++) {
      const rms = rmsValues[i];
      const sampleX = (rms.position / latestFrame.left.length) * width - startOffset;
      
      // Skip if outside visible area
      if (sampleX < 0) continue;
      if (sampleX > width) break;
      
      const y1 = centerY - (rms.value * centerY);
      const y2 = centerY + (rms.value * centerY);
      
      if (i === 0) {
        this.ctx.moveTo(sampleX, y1);
      } else {
        this.ctx.lineTo(sampleX, y1);
      }
    }
    
    // Draw back to complete the shape
    for (let i = rmsValues.length - 1; i >= 0; i--) {
      const rms = rmsValues[i];
      const sampleX = (rms.position / latestFrame.left.length) * width - startOffset;
      
      // Skip if outside visible area
      if (sampleX < 0) continue;
      if (sampleX > width) break;
      
      const y2 = centerY + (rms.value * centerY);
      this.ctx.lineTo(sampleX, y2);
    }
    
    this.ctx.closePath();
    this.ctx.fillStyle = this.rmsGradient || 'rgba(255, 204, 0, 0.2)';
    this.ctx.fill();
  }
  
  /**
   * Draw peak markers
   * @param {number} width - Content width
   * @param {number} height - Content height
   */
  drawPeaks(width, height) {
    if (!this.peaks.length) return;
    
    const centerY = height / 2;
    
    // Calculate visible portion based on zoom and scroll
    const visibleWidth = width / this.zoomLevel;
    const startOffset = this.scrollPosition * (1 - 1/this.zoomLevel) * width;
    
    // Get latest frame length for normalization
    const frameLength = this.timeDataHistory[this.timeDataHistory.length - 1].left.length;
    
    // Draw peak markers
    this.ctx.fillStyle = this.peakColor || this.theme.tertiary;
    
    this.peaks.forEach(peak => {
      const x = (peak.position / frameLength) * width - startOffset;
      
      // Skip if outside visible area
      if (x < 0 || x > width) return;
      
      const y = centerY - (peak.value * centerY);
      
      // Draw peak dot
      this.ctx.beginPath();
      this.ctx.arc(x, y, 3, 0, Math.PI * 2);
      this.ctx.fill();
    });
  }
  
  /**
   * Draw clipping indicators
   * @param {number} width - Content width
   * @param {number} height - Content height
   */
  drawClippingIndicators(width, height) {
    if (!this.clippingPoints.length) return;
    
    const centerY = height / 2;
    
    // Calculate visible portion based on zoom and scroll
    const visibleWidth = width / this.zoomLevel;
    const startOffset = this.scrollPosition * (1 - 1/this.zoomLevel) * width;
    
    // Get latest frame length for normalization
    const frameLength = this.timeDataHistory[this.timeDataHistory.length - 1].left.length;
    
    // Draw clipping indicators
    this.ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
    
    this.clippingPoints.forEach(clip => {
      const x1 = (clip.position / frameLength) * width - startOffset;
      const x2 = ((clip.position + clip.length) / frameLength) * width - startOffset;
      
      // Skip if outside visible area
      if (x2 < 0 || x1 > width) return;
      
      // Get y position based on channel
      const y = clip.channel === 'left' ? centerY - 0.98 * centerY : centerY + 0.98 * centerY;
      
      // Draw clipping indicator
      this.ctx.fillRect(
        Math.max(0, x1), 
        y - 2, 
        Math.min(width, x2) - Math.max(0, x1), 
        4
      );
    });
  }
  
  /**
   * Draw markers
   * @param {number} width - Content width
   * @param {number} height - Content height
   */
  drawMarkers(width, height) {
    if (!this.markers.length) return;
    
    // Calculate visible portion based on zoom and scroll
    const visibleWidth = width / this.zoomLevel;
    const startOffset = this.scrollPosition * (1 - 1/this.zoomLevel) * width;
    
    this.markers.forEach(marker => {
      const x = marker.time * width - startOffset;
      
      // Skip if outside visible area
      if (x < 0 || x > width) return;
      
      // Draw marker line
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, height);
      this.ctx.strokeStyle = marker.color || this.theme.tertiary;
      this.ctx.lineWidth = 1;
      this.ctx.stroke();
      
      // Draw marker label
      this.ctx.fillStyle = this.theme.background;
      this.ctx.fillRect(x - 10, 0, 20, 20);
      this.ctx.strokeRect(x - 10, 0, 20, 20);
      
      this.ctx.fillStyle = marker.color || this.theme.tertiary;
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.font = '10px Arial';
      this.ctx.fillText(marker.label, x, 10);
    });
  }
  
  /**
   * Draw time axis
   * @param {number} width - Content width
   * @param {number} height - Content height
   */
  drawTimeAxis(width, height) {
    // Draw time axis background
    this.ctx.fillStyle = this.theme.background;
    this.ctx.fillRect(0, height, width, this.timeAxisHeight);
    
    // Draw time axis line
    this.ctx.beginPath();
    this.ctx.moveTo(0, height);
    this.ctx.lineTo(width, height);
    this.ctx.strokeStyle = this.theme.gridLines;
    this.ctx.lineWidth = 1;
    this.ctx.stroke();
    
    // Calculate visible portion based on zoom and scroll
    const visibleWidth = width / this.zoomLevel;
    const startOffset = this.scrollPosition * (1 - 1/this.zoomLevel) * width;
    
    // Draw time ticks and labels
    const numTicks = 10;
    this.ctx.fillStyle = this.theme.foreground;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'top';
    this.ctx.font = '10px Arial';
    
    for (let i = 0; i <= numTicks; i++) {
      const timeRatio = i / numTicks;
      const visibleRatio = this.scrollPosition + timeRatio / this.zoomLevel;
      
      if (visibleRatio > 1) continue;
      
      const x = timeRatio * width;
      
      // Draw tick
      this.ctx.beginPath();
      this.ctx.moveTo(x, height);
      this.ctx.lineTo(x, height + 5);
      this.ctx.stroke();
      
      // Draw label
      const timeInSeconds = visibleRatio * 10; // Assume 10 seconds total for demo
      this.ctx.fillText(
        timeInSeconds.toFixed(2) + 's', 
        x, 
        height + 7
      );
    }
  }
  
  /**
   * Draw amplitude axis
   * @param {number} width - Content width
   * @param {number} height - Content height
   */
  drawAmplitudeAxis(width, height) {
    // Draw amplitude axis background
    this.ctx.fillStyle = this.theme.background;
    this.ctx.fillRect(width, 0, this.amplitudeAxisWidth, height);
    
    // Draw amplitude axis line
    this.ctx.beginPath();
    this.ctx.moveTo(width, 0);
    this.ctx.lineTo(width, height);
    this.ctx.strokeStyle = this.theme.gridLines;
    this.ctx.lineWidth = 1;
    this.ctx.stroke();
    
    // Draw amplitude ticks and labels
    const dbLabels = ['+1', '+0.5', '0', '-0.5', '-1'];
    const positions = [0, 0.25, 0.5, 0.75, 1];
    
    this.ctx.fillStyle = this.theme.foreground;
    this.ctx.textAlign = 'left';
    this.ctx.textBaseline = 'middle';
    this.ctx.font = '10px Arial';
    
    positions.forEach((pos, i) => {
      const y = height * pos;
      
      // Draw tick
      this.ctx.beginPath();
      this.ctx.moveTo(width, y);
      this.ctx.lineTo(width + 5, y);
      this.ctx.stroke();
      
      // Draw label
      this.ctx.fillText(
        dbLabels[i], 
        width + 8, 
        y
      );
    });
    
    // Draw axis title
    this.ctx.save();
    this.ctx.translate(width + 30, height / 2);
    this.ctx.rotate(-Math.PI / 2);
    this.ctx.textAlign = 'center';
    this.ctx.fillStyle = this.theme.primary;
    this.ctx.font = '11px Arial';
    this.ctx.fillText('Amplitude', 0, 0);
    this.ctx.restore();
  }
  
  /**
   * Draw hover information
   * @param {number} width - Content width
   * @param {number} height - Content height
   */
  drawHoverInfo(width, height) {
    // Calculate position based on zoom and scroll
    const visibleWidth = width / this.zoomLevel;
    const startOffset = this.scrollPosition * (1 - 1/this.zoomLevel) * width;
    const x = this.hoverTime * width - startOffset;
    
    // Skip if outside visible area
    if (x < 0 || x > width) return;
    
    // Draw time indicator line
    this.ctx.beginPath();
    this.ctx.moveTo(x, 0);
    this.ctx.lineTo(x, height);
    this.ctx.strokeStyle = this.theme.primary;
    this.ctx.lineWidth = 1;
    this.ctx.setLineDash([5, 5]);
    this.ctx.stroke();
    this.ctx.setLineDash([]);
    
    // Get values at hover position
    if (this.timeDataHistory.length > 0) {
      const latestFrame = this.timeDataHistory[this.timeDataHistory.length - 1];
      const sampleIndex = Math.floor(this.hoverTime * latestFrame.left.length);
      
      if (sampleIndex >= 0 && sampleIndex < latestFrame.left.length) {
        const leftValue = latestFrame.left[sampleIndex];
        const rightValue = latestFrame.right[sampleIndex];
        
        // Format tooltip text
        const timeText = `Time: ${(this.hoverTime * 10).toFixed(3)}s`; // Assume 10 seconds total for demo
        const valuesText = `L: ${leftValue.toFixed(3)} | R: ${rightValue.toFixed(3)}`;
        
        // Measure text
        this.ctx.font = '12px Arial';
        const timeWidth = this.ctx.measureText(timeText).width;
        const valuesWidth = this.ctx.measureText(valuesText).width;
        const boxWidth = Math.max(timeWidth, valuesWidth) + 16;
        const boxHeight = 40;
        
        // Adjust position to keep tooltip on screen
        let tooltipX = x + 10;
        if (tooltipX + boxWidth > width) {
          tooltipX = x - boxWidth - 10;
        }
        
        // Draw tooltip box
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(tooltipX, 10, boxWidth, boxHeight);
        
        // Draw tooltip border
        this.ctx.strokeStyle = this.theme.primary;
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(tooltipX, 10, boxWidth, boxHeight);
        
        // Draw tooltip text
        this.ctx.fillStyle = this.theme.foreground;
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'top';
        this.ctx.fillText(timeText, tooltipX + 8, 15);
        this.ctx.fillText(valuesText, tooltipX + 8, 15 + 20);
      }
    }
  }
}

/**
 * Phase Correlation Visualization Controller
 */
class PhaseCorrelationController extends BaseCanvasController {
  constructor(canvasId, options = {}) {
    super(canvasId, options);
    
    // Phase visualization options
    this.showGoniometer = options.showGoniometer !== undefined ? options.showGoniometer : true;
    this.showCorrelationMeter = options.showCorrelationMeter !== undefined ? options.showCorrelationMeter : true;
    
    // Goniometer options
    this.goniometerSize = options.goniometerSize || 0.8; // Relative to smaller dimension
    this.dotSize = options.dotSize || 1.5;
    this.persistence = options.persistence || 0.92; // Afterglow factor (0-1)
    this.samplesPerFrame = options.samplesPerFrame || 1000;
    
    // Correlation meter options
    this.meterWidth = options.meterWidth || 30;
    this.meterHeight = options.meterHeight || 0.7; // Relative to height
    
    // History
    this.correlationHistory = [];
    this.historyLength = options.historyLength || 100;
    
    // Previous frame for persistence
    this.previousFrame = null;
    
    // Setup offscreen canvas for persistence
    this.setupOffscreenCanvas();
  }
  
  /**
   * Set up offscreen canvas for goniometer persistence
   */
  setupOffscreenCanvas() {
    this.offscreenCanvas = document.createElement('canvas');
    this.offscreenCtx = this.offscreenCanvas.getContext('2d');
  }
  
  /**
   * Create gradients
   */
  createGradients() {
    if (!this.theme) return;
    
    // Create correlation meter gradient
    this.correlationGradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
    this.correlationGradient.addColorStop(0, 'rgb(255, 50, 50)'); // Out of phase (negative)
    this.correlationGradient.addColorStop(0.4, 'rgb(255, 150, 50)');
    this.correlationGradient.addColorStop(0.5, 'rgb(200, 200, 200)'); // Uncorrelated (zero)
    this.correlationGradient.addColorStop(0.6, 'rgb(100, 200, 100)');
    this.correlationGradient.addColorStop(1, 'rgb(50, 200, 50)'); // In phase (positive)
  }
  
  /**
   * Resize canvases
   */
  resize() {
    super.resize();
    
    // Resize offscreen canvas
    this.offscreenCanvas.width = this.canvas.width;
    this.offscreenCanvas.height = this.canvas.height;
    
    // Reset persistence when resizing
    this.previousFrame = null;
    
    return this;
  }
  
  /**
   * Update with new audio data
   * @param {Object} metrics - Audio metrics
   */
  updateMetrics(metrics) {
    super.updateMetrics(metrics);
    
    // Add correlation data to history if available
    if (metrics && metrics.correlation !== undefined) {
      this.correlationHistory.push({
        value: metrics.correlation,
        time: performance.now()
      });
      
      // Keep history limited
      while (this.correlationHistory.length > this.historyLength) {
        this.correlationHistory.shift();
      }
    }
    
    return this;
  }
  
  /**
   * Render phase correlation visualization
   */
  render() {
    if (!this.shouldRender()) return this;
    
    // Update animations
    this.updateAnimations();
    
    // Clear canvas
    this.clear();
    
    // Draw background
    this.drawBackground();
    
    // Calculate layout
    const smallerDimension = Math.min(this.width, this.height);
    const centerX = this.width / 2;
    const centerY = this.height / 2;
    
    // Draw goniometer if enabled
    if (this.showGoniometer) {
      const radius = smallerDimension * this.goniometerSize / 2;
      this.drawGoniometer(centerX, centerY, radius);
    }
    
    // Draw correlation meter if enabled
    if (this.showCorrelationMeter) {
      this.drawCorrelationMeter();
    }
    
    return this;
  }
  
  /**
   * Draw goniometer with persistence
   * @param {number} centerX - Center X position
   * @param {number} centerY - Center Y position
   * @param {number} radius - Goniometer radius
   */
  drawGoniometer(centerX, centerY, radius) {
    // Offscreen canvas must be the same size as the main canvas
    const offscreenWidth = this.width;
    const offscreenHeight = this.height;
    
    // Create new offscreen canvas if needed
    if (!this.previousFrame) {
      this.previousFrame = this.offscreenCtx.createImageData(offscreenWidth, offscreenHeight);
    }
    
    // Get current time domain data
    if (!this.metrics || !this.metrics.timeData) {
      // Just fade previous frame if no new data
      this.fadeGoniometer(offscreenWidth, offscreenHeight);
      return;
    }
    
    // Get latest time domain data
    const { left, right } = this.metrics.timeData;
    
    // Step 1: Apply persistence by fading previous frame
    this.fadeGoniometer(offscreenWidth, offscreenHeight);
    
    // Step 2: Draw new points
    const imageData = this.offscreenCtx.getImageData(0, 0, offscreenWidth, offscreenHeight);
    const data = imageData.data;
    
    // Draw background circle
    this.ctx.strokeStyle = this.theme.gridLines;
    this.ctx.lineWidth = 1;
    
    // Draw outer circle
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    this.ctx.stroke();
    
    // Draw inner circles (at 0.5 and 0.25 radius)
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, radius * 0.5, 0, Math.PI * 2);
    this.ctx.stroke();
    
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, radius * 0.25, 0, Math.PI * 2);
    this.ctx.stroke();
    
    // Draw crosshairs
    this.ctx.beginPath();
    this.ctx.moveTo(centerX - radius, centerY);
    this.ctx.lineTo(centerX + radius, centerY);
    this.ctx.moveTo(centerX, centerY - radius);
    this.ctx.lineTo(centerX, centerY + radius);
    this.ctx.stroke();
    
    // Draw diagonal lines (45°)
    this.ctx.beginPath();
    this.ctx.moveTo(centerX - radius * 0.7071, centerY - radius * 0.7071);
    this.ctx.lineTo(centerX + radius * 0.7071, centerY + radius * 0.7071);
    this.ctx.moveTo(centerX - radius * 0.7071, centerY + radius * 0.7071);
    this.ctx.lineTo(centerX + radius * 0.7071, centerY - radius * 0.7071);
    this.ctx.stroke();
    
    // Calculate how many points to plot
    const step = Math.max(1, Math.floor(left.length / this.samplesPerFrame));
    
    // Plot all samples with color based on correlation
    for (let i = 0; i < left.length; i += step) {
      // Skip if out of range
      if (i >= left.length || i >= right.length) continue;
      
      // Calculate position
      const x = centerX + left[i] * radius;
      const y = centerY + right[i] * radius;
      
      // Skip if outside plotting area
      if (x < 0 || x >= offscreenWidth || y < 0 || y >= offscreenHeight) continue;
      
      // Calculate pixel index
      const pixelIndex = (Math.floor(y) * offscreenWidth + Math.floor(x)) * 4;
      
      // Set pixel RGBA values
      data[pixelIndex] = 255; // R
      data[pixelIndex + 1] = 255; // G
      data[pixelIndex + 2] = 255; // B
      data[pixelIndex + 3] = 255; // A
      
      // Add glow around the point for better visibility
      this.drawGlowPoint(data, x, y, offscreenWidth, offscreenHeight, this.dotSize);
    }
    
    // Put the modified image data back to the offscreen canvas
    this.offscreenCtx.putImageData(imageData, 0, 0);
    
    // Draw the offscreen canvas to the main canvas
    this.ctx.drawImage(this.offscreenCanvas, 0, 0);
    
    // Store current frame for next iteration
    this.previousFrame = imageData;
  }
  
  /**
   * Fade goniometer for persistence effect
   * @param {number} width - Canvas width
   * @param {number} height - Canvas height
   */
  fadeGoniometer(width, height) {
    if (!this.previousFrame) return;
    
    // Get existing image data
    const imageData = this.offscreenCtx.getImageData(0, 0, width, height);
    const data = imageData.data;
    
    // Apply persistence by fading all pixels
    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.floor(data[i] * this.persistence);     // R
      data[i + 1] = Math.floor(data[i + 1] * this.persistence); // G
      data[i + 2] = Math.floor(data[i + 2] * this.persistence); // B
      // Leave alpha as is
    }
    
    // Put the faded image data back
    this.offscreenCtx.putImageData(imageData, 0, 0);
  }
  
  /**
   * Draw a glowing point
   * @param {Uint8ClampedArray} data - Image data array
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {number} width - Canvas width
   * @param {number} height - Canvas height
   * @param {number} size - Point size
   */
  drawGlowPoint(data, x, y, width, height, size) {
    const intensity = 255;
    const fadeRate = 0.7;
    
    // Handle fractional coordinates
    const baseX = Math.floor(x);
    const baseY = Math.floor(y);
    
    // Draw central pixel
    const centerIndex = (baseY * width + baseX) * 4;
    data[centerIndex] = intensity;
    data[centerIndex + 1] = intensity;
    data[centerIndex + 2] = intensity;
    data[centerIndex + 3] = 255;
    
    // Draw surrounding pixels with reduced intensity
    for (let r = 1; r <= size; r++) {
      const currentIntensity = intensity * Math.pow(fadeRate, r);
      
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          // Skip central pixel
          if (dx === 0 && dy === 0) continue;
          
          // Skip pixels outside the circle with radius r
          if (dx*dx + dy*dy > r*r) continue;
          
          const px = baseX + dx;
          const py = baseY + dy;
          
          // Skip if outside canvas
          if (px < 0 || px >= width || py < 0 || py >= height) continue;
          
          const index = (py * width + px) * 4;
          
          // Only increase pixel value if the new value is higher
          data[index] = Math.max(data[index], currentIntensity);
          data[index + 1] = Math.max(data[index + 1], currentIntensity);
          data[index + 2] = Math.max(data[index + 2], currentIntensity);
          data[index + 3] = 255;
        }
      }
    }
  }
  
  /**
   * Draw correlation meter
   */
  drawCorrelationMeter() {
    // Get latest correlation value if available
    let correlation = 0;
    
    if (this.correlationHistory.length > 0) {
      correlation = this.correlationHistory[this.correlationHistory.length - 1].value;
    }
    
    // Define meter dimensions
    const meterX = this.width - this.meterWidth - 10;
    const meterY = (this.height - this.height * this.meterHeight) / 2;
    const meterHeight = this.height * this.meterHeight;
    
    // Draw meter background
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    this.ctx.fillRect(meterX, meterY, this.meterWidth, meterHeight);
    
    // Draw meter scale
    this.ctx.strokeStyle = this.theme.gridLines;
    this.ctx.lineWidth = 1;
    
    // Draw horizontal lines at -1, -0.5, 0, 0.5, 1
    const positions = [0, 0.25, 0.5, 0.75, 1];
    positions.forEach(pos => {
      const y = meterY + meterHeight * pos;
      
      this.ctx.beginPath();
      this.ctx.moveTo(meterX, y);
      this.ctx.lineTo(meterX + this.meterWidth, y);
      this.ctx.stroke();
    });
    
    // Calculate correlation position
    // Map from -1...1 to meterHeight...0
    const correlationPos = meterY + meterHeight * (1 - (correlation + 1) / 2);
    
    // Draw correlation indicator
    this.ctx.fillStyle = this.theme.primary;
    this.ctx.fillRect(meterX, correlationPos, this.meterWidth, 3);
    
    // Draw labels
    this.ctx.fillStyle = this.theme.foreground;
    this.ctx.font = '10px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.textBaseline = 'middle';
    
    // Draw +1, 0, -1 labels
    this.ctx.fillText('+1', meterX + this.meterWidth + 2, meterY);
    this.ctx.fillText('0', meterX + this.meterWidth + 2, meterY + meterHeight / 2);
    this.ctx.fillText('-1', meterX + this.meterWidth + 2, meterY + meterHeight);
    
    // Draw correlation value
    this.ctx.fillStyle = this.theme.primary;
    this.ctx.font = '12px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(
      correlation.toFixed(2), 
      meterX + this.meterWidth / 2, 
      meterY - 15
    );
  }
}

/**
 * LUFS Meter Visualization Controller
 */
class LUFSMeterController extends BaseCanvasController {
  constructor(canvasId, options = {}) {
    super(canvasId, options);
    
    // LUFS meter options
    this.showMomentary = options.showMomentary !== undefined ? options.showMomentary : true;
    this.showShortTerm = options.showShortTerm !== undefined ? options.showShortTerm : true;
    this.showIntegrated = options.showIntegrated !== undefined ? options.showIntegrated : true;
    this.showHistory = options.showHistory !== undefined ? options.showHistory : true;
    
    // Meter scale
    this.minLUFS = options.minLUFS || -30;
    this.maxLUFS = options.maxLUFS || -6;
    this.meterWidth = options.meterWidth || 50;
    this.historyHeight = options.historyHeight || 100;
    
    // Target levels
    this.targetLUFS = options.targetLUFS || -14;
    this.targetTolerance = options.targetTolerance || 1;
    
    // History
    this.lufsHistory = [];
    this.historyLength = options.historyLength || 100;
    
    // Animation for smoother meter movement
    this.currentMomentary = -70;
    this.currentShortTerm = -70;
    this.currentIntegrated = -70;
    this.momentarySmoothing = 0.2; // Lower value = slower response
    this.shortTermSmoothing = 0.1;
    this.integratedSmoothing = 0.05;
  }
  
  /**
   * Create gradients
   */
  createGradients() {
    if (!this.theme) return;
    
    // Create meter gradient
    this.meterGradient = this.ctx.createLinearGradient(0, 0, 0, this.height - this.historyHeight);
    this.meterGradient.addColorStop(0, 'rgb(255, 50, 50)'); // Too hot
    this.meterGradient.addColorStop(0.2, 'rgb(255, 200, 50)'); // Getting hot
    this.meterGradient.addColorStop(0.3, 'rgb(180, 180, 50)'); // Target zone
    this.meterGradient.addColorStop(0.4, 'rgb(100, 200, 100)'); // Good
    this.meterGradient.addColorStop(1, 'rgb(50, 150, 150)'); // Too quiet
    
    // Create history gradient
    this.historyGradient = this.ctx.createLinearGradient(0, this.height - this.historyHeight, 0, this.height);
    this.historyGradient.addColorStop(0, 'rgba(255, 50, 50, 0.5)');
    this.historyGradient.addColorStop(0.2, 'rgba(255, 200, 50, 0.5)');
    this.historyGradient.addColorStop(0.3, 'rgba(180, 180, 50, 0.5)');
    this.historyGradient.addColorStop(0.4, 'rgba(100, 200, 100, 0.5)');
    this.historyGradient.addColorStop(1, 'rgba(50, 150, 150, 0.5)');
  }
  
  /**
   * Update with new audio data
   * @param {Object} metrics - Audio metrics
   */
  updateMetrics(metrics) {
    super.updateMetrics(metrics);
    
    // Add LUFS data to history if available
    if (metrics && metrics.lufs) {
      // Smooth meter values
      if (metrics.lufs.momentary > -70) {
        this.currentMomentary += (metrics.lufs.momentary - this.currentMomentary) * this.momentarySmoothing;
      }
      
      if (metrics.lufs.shortTerm > -70) {
        this.currentShortTerm += (metrics.lufs.shortTerm - this.currentShortTerm) * this.shortTermSmoothing;
      }
      
      if (metrics.lufs.integrated > -70) {
        this.currentIntegrated += (metrics.lufs.integrated - this.currentIntegrated) * this.integratedSmoothing;
      }
      
      this.lufsHistory.push({
        momentary: this.currentMomentary,
        shortTerm: this.currentShortTerm,
        integrated: this.currentIntegrated,
        time: performance.now()
      });
      
      // Keep history limited
      while (this.lufsHistory.length > this.historyLength) {
        this.lufsHistory.shift();
      }
    }
    
    return this;
  }
  
  /**
   * Render LUFS meter visualization
   */
  render() {
    if (!this.shouldRender()) return this;
    
    // Update animations
    this.updateAnimations();
    
    // Clear canvas
    this.clear();
    
    // Draw background
    this.drawBackground();
    
    // Calculate meter area height
    const meterAreaHeight = this.height - (this.showHistory ? this.historyHeight : 0);
    
    // Draw meter background and scale
    this.drawMeterBackground(meterAreaHeight);
    
    // Draw meters
    this.drawMeters(meterAreaHeight);
    
    // Draw history if enabled
    if (this.showHistory && this.lufsHistory.length > 0) {
      this.drawLUFSHistory();
    }
    
    return this;
  }
  
  /**
   * Draw meter background and scale
   * @param {number} meterAreaHeight - Height of meter area
   */
  drawMeterBackground(meterAreaHeight) {
    // Draw meter background
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    this.ctx.fillRect// Enhanced aQi Audio Analyzer Architecture
// Core Audio Processing System

/**
 * Audio Engine - Core processing center for all audio analysis
 */
class AudioEngine {
  constructor(options = {}) {
    // Audio context and nodes
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    this.analyserNodeL = this.audioContext.createAnalyser();
    this.analyserNodeR = this.audioContext.createAnalyser();
    this.gainNode = this.audioContext.createGain();
    
    // Configure analyzers
    this.setFFTSize(options.fftSize || 2048);
    
    // Connect nodes for stereo processing
    this.splitterNode = this.audioContext.createChannelSplitter(2);
    this.mergerNode = this.audioContext.createChannelMerger(2);
    
    // Data arrays
    this.frequencyDataL = new Float32Array(this.analyserNodeL.frequencyBinCount);
    this.frequencyDataR = new Float32Array(this.analyserNodeR.frequencyBinCount);
    this.timeDataL = new Float32Array(this.analyserNodeL.fftSize);
    this.timeDataR = new Float32Array(this.analyserNodeR.fftSize);
    
    // Metrics tracking
    this.metrics = {
      lufs: { integrated: -Infinity, shortTerm: -Infinity, momentary: -Infinity },
      truePeak: { left: 0, right: 0 },
      correlation: 0,
      stereoWidth: 0,
      dynamicRange: 0,
      crestFactor: 0,
      spectralCentroid: 0,
      subBassRatio: 0,
      midSideRatio: 0,
      clipCount: 0
    };
    
    // Historical data for visualizations
    this.history = {
      lufs: [],
      correlation: [],
      stereoWidth: [],
      spectrogram: [],
      maxHistoryLength: options.historyLength || 3600 // 1 minute at 60fps
    };
    
    // Analysis worker for heavy processing
    this.initializeWorker();
    
    // Event callbacks
    this.onAnalysisComplete = null;
    this.onMetricsUpdate = null;
  }
  
  /**
   * Initialize Web Worker for heavy audio processing
   */
  initializeWorker() {
    // Create worker from blob to avoid separate file
    const workerBlob = new Blob([`
      // Audio Analysis Worker
      
      // Import required DSP libraries
      self.importScripts('https://cdnjs.cloudflare.com/ajax/libs/mathjs/11.0.0/math.min.js');
      
      // Window functions
      const windowFunctions = {
        hann: (i, N) => 0.5 * (1 - Math.cos(2 * Math.PI * i / (N - 1))),
        hamming: (i, N) => 0.54 - 0.46 * Math.cos(2 * Math.PI * i / (N - 1)),
        blackman: (i, N) => 0.42 - 0.5 * Math.cos(2 * Math.PI * i / (N - 1)) + 0.08 * Math.cos(4 * Math.PI * i / (N - 1)),
        rectangular: () => 1
      };
      
      // LUFS calculation
      function calculateLUFS(channelDataL, channelDataR, sampleRate) {
        // ITU-R BS.1770-4 LUFS measurement
        const kWeighting = createKWeightingFilters(sampleRate);
        
        // Apply K-weighting to both channels
        const leftWeighted = applyFilters(channelDataL, kWeighting);
        const rightWeighted = applyFilters(channelDataR, kWeighting);
        
        // Square and sum channel powers (0.5 factor applied to mid channels)
        const powers = new Float32Array(leftWeighted.length);
        for (let i = 0; i < powers.length; i++) {
          powers[i] = (leftWeighted[i] * leftWeighted[i]) + (rightWeighted[i] * rightWeighted[i]);
        }
        
        // Block processing (400ms blocks)
        const blockSize = Math.floor(sampleRate * 0.4);
        const blocks = [];
        
        for (let i = 0; i < powers.length - blockSize; i += blockSize / 4) { // 75% overlap
          const blockSum = powers.slice(i, i + blockSize).reduce((sum, val) => sum + val, 0);
          const blockPower = blockSum / blockSize;
          blocks.push(blockPower);
        }
        
        // No blocks processed case
        if (!blocks.length) return { integrated: -70, shortTerm: -70, momentary: -70 };
        
        // Calculate ungated LUFS
        const ungatedMean = blocks.reduce((sum, val) => sum + val, 0) / blocks.length;
        const ungatedLUFS = -0.691 + 10 * Math.log10(ungatedMean);
        
        // Apply relative gate (-10 LU below ungated LUFS)
        const relativeThreshold = Math.pow(10, (ungatedLUFS - 10) / 10);
        const gatedBlocks = blocks.filter(block => block > relativeThreshold);
        
        if (!gatedBlocks.length) return { integrated: -70, shortTerm: -70, momentary: -70 };
        
        // Calculate gated (integrated) LUFS
        const gatedMean = gatedBlocks.reduce((sum, val) => sum + val, 0) / gatedBlocks.length;
        const integratedLUFS = -0.691 + 10 * Math.log10(gatedMean);
        
        // Short-term LUFS (3 second window)
        const shortTermSize = Math.min(powers.length, Math.floor(sampleRate * 3));
        const shortTermPower = powers.slice(0, shortTermSize).reduce((sum, val) => sum + val, 0) / shortTermSize;
        const shortTermLUFS = -0.691 + 10 * Math.log10(shortTermPower);
        
        // Momentary LUFS (400ms window)
        const momentarySize = Math.min(powers.length, Math.floor(sampleRate * 0.4));
        const momentaryPower = powers.slice(0, momentarySize).reduce((sum, val) => sum + val, 0) / momentarySize;
        const momentaryLUFS = -0.691 + 10 * Math.log10(momentaryPower);
        
        return {
          integrated: integratedLUFS,
          shortTerm: shortTermLUFS,
          momentary: momentaryLUFS
        };
      }
      
      // Process phase correlation
      function calculatePhaseCorrelation(channelDataL, channelDataR) {
        let sumSquaredL = 0;
        let sumSquaredR = 0;
        let sumProduct = 0;
        
        for (let i = 0; i < channelDataL.length; i++) {
          sumSquaredL += channelDataL[i] * channelDataL[i];
          sumSquaredR += channelDataR[i] * channelDataR[i];
          sumProduct += channelDataL[i] * channelDataR[i];
        }
        
        if (sumSquaredL === 0 || sumSquaredR === 0) return 0;
        
        return sumProduct / Math.sqrt(sumSquaredL * sumSquaredR);
      }
      
      // Calculate dynamic range
      function calculateDynamicRange(channelDataL, channelDataR) {
        let sumSquared = 0;
        let peakL = 0;
        let peakR = 0;
        
        for (let i = 0; i < channelDataL.length; i++) {
          const absL = Math.abs(channelDataL[i]);
          const absR = Math.abs(channelDataR[i]);
          
          peakL = Math.max(peakL, absL);
          peakR = Math.max(peakR, absR);
          
          // Sum for RMS
          sumSquared += (channelDataL[i] * channelDataL[i] + channelDataR[i] * channelDataR[i]) / 2;
        }
        
        const rms = Math.sqrt(sumSquared / channelDataL.length);
        const peak = Math.max(peakL, peakR);
        
        if (rms === 0) return { dynamicRange: 0, crestFactor: 0, peak, rms };
        
        const crestFactor = peak / rms;
        const dynamicRange = 20 * Math.log10(crestFactor);
        
        return { dynamicRange, crestFactor, peak, rms };
      }
      
      // Calculate spectral centroid
      function calculateSpectralCentroid(freqDataL, freqDataR, sampleRate, fftSize) {
        let sum = 0;
        let weightedSum = 0;
        
        for (let i = 0; i < freqDataL.length; i++) {
          // Convert dB back to magnitude
          const magnitudeL = Math.pow(10, freqDataL[i] / 20);
          const magnitudeR = Math.pow(10, freqDataR[i] / 20);
          const magnitude = (magnitudeL + magnitudeR) / 2;
          
          // Calculate frequency for this bin
          const frequency = i * sampleRate / fftSize;
          
          sum += magnitude;
          weightedSum += magnitude * frequency;
        }
        
        if (sum === 0) return 0;
        
        return weightedSum / sum;
      }
      
      // Calculate stereo width
      function calculateStereoWidth(channelDataL, channelDataR) {
        let midEnergy = 0;
        let sideEnergy = 0;
        
        for (let i = 0; i < channelDataL.length; i++) {
          const mid = (channelDataL[i] + channelDataR[i]) / 2;
          const side = (channelDataL[i] - channelDataR[i]) / 2;
          
          midEnergy += mid * mid;
          sideEnergy += side * side;
        }
        
        if (midEnergy + sideEnergy === 0) return 0;
        
        return (sideEnergy / (midEnergy + sideEnergy)) * 100;
      }
      
      // Calculate sub-bass mono ratio (below 100Hz)
      function calculateSubBassMono(freqDataL, freqDataR, sampleRate, fftSize) {
        const cutoffFreq = 100; // Hz
        const cutoffBin = Math.floor(cutoffFreq * fftSize / sampleRate);
        
        let correlationSum = 0;
        let binCount = 0;
        
        for (let i = 1; i <= cutoffBin; i++) {
          // Convert dB back to magnitude
          const magnitudeL = Math.pow(10, freqDataL[i] / 20);
          const magnitudeR = Math.pow(10, freqDataR[i] / 20);
          
          if (magnitudeL > 0 && magnitudeR > 0) {
            // Calculate correlation for this frequency bin
            const corrCoef = (Math.min(magnitudeL, magnitudeR) / Math.max(magnitudeL, magnitudeR));
            correlationSum += corrCoef;
            binCount++;
          }
        }
        
        if (binCount === 0) return 0;
        
        return (correlationSum / binCount) * 100;
      }
      
      // Detect clipping
      function detectClipping(channelDataL, channelDataR, threshold = 0.99) {
        let clipCount = 0;
        const sampleCount = channelDataL.length;
        
        for (let i = 0; i < sampleCount; i++) {
          if (Math.abs(channelDataL[i]) > threshold || Math.abs(channelDataR[i]) > threshold) {
            clipCount++;
          }
        }
        
        return clipCount;
      }
      
      // Create K-weighting filters (ITU-R BS.1770-4)
      function createKWeightingFilters(sampleRate) {
        // This would actually implement the filter coefficients
        // Simplified placeholder
        return {
          highShelfFilter: { b: [1, 0, 0], a: [1, 0, 0] },
          highPassFilter: { b: [1, -2, 1], a: [1, -1.99, 0.99] }
        };
      }
      
      // Apply filters to audio data
      function applyFilters(data, filters) {
        // This would actually apply the filters
        // Simplified placeholder that returns input
        return data;
      }
      
      // Process FFT data
      function processFFT(freqDataL, freqDataR, timeDataL, timeDataR, sampleRate, fftSize, options) {
        // Apply window function if specified
        const windowFunc = windowFunctions[options.windowFunction || 'hann'];
        
        // Apply window to time data if needed
        if (options.applyWindow) {
          for (let i = 0; i < timeDataL.length; i++) {
            const window = windowFunc(i, timeDataL.length);
            timeDataL[i] *= window;
            timeDataR[i] *= window;
          }
        }
        
        // Calculate all metrics
        const lufs = calculateLUFS(timeDataL, timeDataR, sampleRate);
        const correlation = calculatePhaseCorrelation(timeDataL, timeDataR);
        const { dynamicRange, crestFactor, peak } = calculateDynamicRange(timeDataL, timeDataR);
        const stereoWidth = calculateStereoWidth(timeDataL, timeDataR);
        const spectralCentroid = calculateSpectralCentroid(freqDataL, freqDataR, sampleRate, fftSize);
        const subBassRatio = calculateSubBassMono(freqDataL, freqDataR, sampleRate, fftSize);
        const clipCount = detectClipping(timeDataL, timeDataR, options.clipThreshold || 0.99);
        
        // Additional metrics could be calculated here
        
        return {
          lufs,
          correlation,
          dynamicRange,
          crestFactor,
          stereoWidth,
          spectralCentroid,
          subBassRatio,
          truePeak: peak,
          clipCount
        };
      }
      
      // Process messages from main thread
      self.onmessage = function(e) {
        const { command, data } = e.data;
        
        if (command === 'processAudio') {
          const { 
            freqDataL, 
            freqDataR, 
            timeDataL, 
            timeDataR, 
            sampleRate,
            fftSize,
            options 
          } = data;
          
          const results = processFFT(
            freqDataL, 
            freqDataR, 
            timeDataL, 
            timeDataR, 
            sampleRate,
            fftSize,
            options
          );
          
          self.postMessage({
            command: 'analysisResults',
            data: results
          });
        }
      };
    `], { type: 'application/javascript' });
    
    const workerUrl = URL.createObjectURL(workerBlob);
    this.worker = new Worker(workerUrl);
    
    // Handle messages from worker
    this.worker.onmessage = (e) => {
      const { command, data } = e.data;
      
      if (command === 'analysisResults') {
        this.updateMetrics(data);
        
        if (typeof this.onMetricsUpdate === 'function') {
          this.onMetricsUpdate(this.metrics);
        }
      }
    };
    
    // Clean up URL object
    URL.revokeObjectURL(workerUrl);
  }
  
  /**
   * Update FFT size for analyzers
   * @param {number} fftSize - FFT size (power of 2)
   */
  setFFTSize(fftSize) {
    // Ensure fftSize is a power of 2
    const validSizes = [1024, 2048, 4096, 8192, 16384];
    if (!validSizes.includes(fftSize)) {
      fftSize = 2048; // Default to 2048 if invalid
    }
    
    this.analyserNodeL.fftSize = fftSize;
    this.analyserNodeR.fftSize = fftSize;
    
    // Recreate data arrays with new size
    this.frequencyDataL = new Float32Array(this.analyserNodeL.frequencyBinCount);
    this.frequencyDataR = new Float32Array(this.analyserNodeR.frequencyBinCount);
    this.timeDataL = new Float32Array(this.analyserNodeL.fftSize);
    this.timeDataR = new Float32Array(this.analyserNodeR.fftSize);
  }
  
  /**
   * Set window function for analysis
   * @param {string} windowFunction - Window function name
   */
  setWindowFunction(windowFunction) {
    this.windowFunction = windowFunction;
  }
  
  /**
   * Load audio file and prepare for analysis
   * @param {File} file - Audio file object
   * @returns {Promise} - Resolves when audio is loaded
   */
  async loadFile(file) {
    // Reset state
    this.reset();
    
    // Create file reader
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async (event) => {
        try {
          // Decode audio data
          const audioData = await this.audioContext.decodeAudioData(event.target.result);
          
          // Store audio buffer
          this.audioBuffer = audioData;
          
          // Create buffer source
          this.setupAudioGraph();
          
          // Begin analysis
          this.startAnalysis();
          
          resolve(audioData);
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = reject;
      
      // Read file as array buffer
      reader.readAsArrayBuffer(file);
    });
  }
  
  /**
   * Set up audio processing graph
   */
  setupAudioGraph() {
    // Clean up existing source if any
    if (this.sourceNode) {
      this.sourceNode.disconnect();
    }
    
    // Create new source
    this.sourceNode = this.audioContext.createBufferSource();
    this.sourceNode.buffer = this.audioBuffer;
    
    // Connect nodes
    this.sourceNode.connect(this.gainNode);
    this.gainNode.connect(this.splitterNode);
    
    // Split channels for analysis
    this.splitterNode.connect(this.analyserNodeL, 0);
    this.splitterNode.connect(this.analyserNodeR, 1);
    
    // Connect to output for playback
    this.gainNode.connect(this.audioContext.destination);
  }
  
  /**
   * Start audio playback
   */
  play() {
    if (!this.sourceNode || !this.audioBuffer) return;
    
    // Resume context if suspended
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
    
    // Create new source if needed (sources can only be started once)
    if (this.isPlaying) {
      this.stop();
      this.setupAudioGraph();
    }
    
    // Start playback
    this.sourceNode.start(0);
    this.isPlaying = true;
    
    // Start analysis loop if not already running
    if (!this.animationFrame) {
      this.startAnalysis();
    }
  }
  
  /**
   * Stop audio playback
   */
  stop() {
    if (this.sourceNode && this.isPlaying) {
      this.sourceNode.stop();
      this.isPlaying = false;
    }
  }
  
  /**
   * Reset state
   */
  reset() {
    // Stop playback if active
    this.stop();
    
    // Clear metrics
    this.metrics = {
      lufs: { integrated: -Infinity, shortTerm: -Infinity, momentary: -Infinity },
      truePeak: { left: 0, right: 0 },
      correlation: 0,
      stereoWidth: 0,
      dynamicRange: 0,
      crestFactor: 0,
      spectralCentroid: 0,
      subBassRatio: 0,
      midSideRatio: 0,
      clipCount: 0
    };
    
    // Clear history
    this.history = {
      lufs: [],
      correlation: [],
      stereoWidth: [],
      spectrogram: [],
      maxHistoryLength: this.history.maxHistoryLength
    };
    
    // Clear analysis loop
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
  }
  
  /**
   * Start analysis loop
   */
  startAnalysis() {
    const analyse = () => {
      // Get frequency data
      this.analyserNodeL.getFloatFrequencyData(this.frequencyDataL);
      this.analyserNodeR.getFloatFrequencyData(this.frequencyDataR);
      
      // Get time domain data
      this.analyserNodeL.getFloatTimeDomainData(this.timeDataL);
      this.analyserNodeR.getFloatTimeDomainData(this.timeDataR);
      
      // Save to spectrogram history
      this.history.spectrogram.push({
        left: [...this.frequencyDataL],
        right: [...this.frequencyDataR],
        time: performance.now()
      });
      
      // Trim history if too long
      if (this.history.spectrogram.length > this.history.maxHistoryLength) {
        this.history.spectrogram.shift();
      }
      
      // Send data to worker for processing
      this.worker.postMessage({
        command: 'processAudio',
        data: {
          freqDataL: this.frequencyDataL,
          freqDataR: this.frequencyDataR,
          timeDataL: this.timeDataL,
          timeDataR: this.timeDataR,
          sampleRate: this.audioContext.sampleRate,
          fftSize: this.analyserNodeL.fftSize,
          options: {
            windowFunction: this.windowFunction || 'hann',
            applyWindow: true,
            clipThreshold: 0.99
          }
        }
      });
      
      // Continue loop
      this.animationFrame = requestAnimationFrame(analyse);
    };
    
    // Start loop
    this.animationFrame = requestAnimationFrame(analyse);
  }
  
  /**
   * Update metrics with results from worker
   * @param {Object} results - Analysis results
   */
  updateMetrics(results) {
    // Update current metrics
    this.metrics = {
      ...this.metrics,
      ...results
    };
    
    // Update history
    this.history.lufs.push({
      time: performance.now(),
      integrated: results.lufs.integrated,
      shortTerm: results.lufs.shortTerm,
      momentary: results.lufs.momentary
    });
    
    this.history.correlation.push({
      time: performance.now(),
      value: results.correlation
    });
    
    this.history.stereoWidth.push({
      time: performance.now(),
      value: results.stereoWidth
    });
    
    // Trim history if too long
    if (this.history.lufs.length > this.history.maxHistoryLength) {
      this.history.lufs.shift();
    }
    
    if (this.history.correlation.length > this.history.maxHistoryLength) {
      this.history.correlation.shift();
    }
    
    if (this.history.stereoWidth.length > this.history.maxHistoryLength) {
      this.history.stereoWidth.shift();
    }
  }
  
  /**
   * Generate recommendations based on analysis
   * @returns {Object} - Recommendations object
   */
  generateRecommendations() {
    const recommendations = {
      loudness: [],
      dynamics: [],
      stereo: [],
      spectral: []
    };
    
    // Loudness recommendations
    if (this.metrics.lufs.integrated > -9) {
      recommendations.loudness.push({
        issue: "Loudness too high",
        details: "Integrated LUFS exceeds streaming platform targets",
        suggestion: "Reduce overall level to around -14 LUFS for better platform compatibility"
      });
    } else if (this.metrics.lufs.integrated < -18) {
      recommendations.loudness.push({
        issue: "Loudness too low",
        details: "Integrated LUFS below typical streaming targets",
        suggestion: "Increase overall level to around -14 LUFS for better platform compatibility"
      });
    }
    
    if (this.metrics.truePeak > 0.5) {
      recommendations.loudness.push({
        issue: "True peak near clipping threshold",
        details: "True peak levels approaching 0dBFS",
        suggestion: "Apply limiting to ensure peaks stay below -1dBTP"
      });
    }
    
    // Dynamic range recommendations
    if (this.metrics.dynamicRange < 6) {
      recommendations.dynamics.push({
        issue: "Limited dynamic range",
        details: "Dynamic range is very compressed",
        suggestion: "Consider reducing compression for more musical dynamics"
      });
    } else if (this.metrics.dynamicRange > 20) {
      recommendations.dynamics.push({
        issue: "Very wide dynamic range",
        details: "Dynamic range may be too wide for some platforms",
        suggestion: "Consider gentle compression to control dynamics"
      });
    }
    
    // Stereo field recommendations
    if (this.metrics.correlation < 0.3) {
      recommendations.stereo.push({
        issue: "Poor mono compatibility",
        details: "Phase correlation is very low",
        suggestion: "Check for phase issues between channels"
      });
    } else if (this.metrics.stereoWidth < 20) {
      recommendations.stereo.push({
        issue: "Narrow stereo image",
        details: "Mix appears very mono/centered",
        suggestion: "Consider adding more stereo width to elements"
      });
    } else if (this.metrics.stereoWidth > 90) {
      recommendations.stereo.push({
        issue: "Excessive stereo width",
        details: "Stereo image may be unnaturally wide",
        suggestion: "Reduce extreme panning or stereo enhancement"
      });
    }
    
    if (this.metrics.subBassRatio < 80) {
      recommendations.stereo.push({
        issue: "Sub-bass not mono",
        details: "Frequencies below 100Hz not centered",
        suggestion: "Consider centering sub-bass for better translation"
      });
    }
    
    // Spectral recommendations
    if (this.metrics.spectralCentroid < 500) {
      recommendations.spectral.push({
        issue: "Dark spectral balance",
        details: "Spectral centroid suggests lack of high frequency content",
        suggestion: "Consider adding some highend brightness"
      });
    } else if (this.metrics.spectralCentroid > 4000) {
      recommendations.spectral.push({
        issue: "Bright spectral balance",
        details: "Spectral centroid suggests emphasis on high frequencies",
        suggestion: "Check for harshness or listen for ear fatigue"
      });
    }
    
    return recommendations;
  }
}

/**
 * Enhanced Visualization Manager
 * Coordinates all visualization components
 */
class VisualizationManager {
  constructor(options = {}) {
    this.canvasControllers = new Map();
    this.activeTheme = options.theme || 'mastering';
    this.isRunning = false;
    this.animationFrame = null;
    this.lastFrameTime = 0;
    this.targetFPS = options.targetFPS || 60;
    this.frameInterval = 1000 / this.targetFPS;
    
    // Reference to audio engine
    this.audioEngine = null;
    
    // Theme definitions
    this.themes = {
      mastering: {
        background: '#0d0d0d',
        foreground: '#e0e0e0',
        primary: '#00ffff',
        secondary: '#ff3366',
        tertiary: '#ffcc00',
        gridLines: 'rgba(255, 255, 255, 0.1)',
        spectrogramGradient: [
          { stop: 0, color: '#000000' },
          { stop: 0.3, color: '#0000ff' },
          { stop: 0.5, color: '#00ffff' },
          { stop: 0.7, color: '#00ff00' },
          { stop: 0.85, color: '#ffff00' },
          { stop: 1.0, color: '#ff0000' }
        ]
      },
      studio: {
        background: '#1a1a1a',
        foreground: '#f0f0f0',
        primary: '#4CAF50',
        secondary: '#FF5722',
        tertiary: '#2196F3',
        gridLines: 'rgba(255, 255, 255, 0.15)',
        spectrogramGradient: [
          { stop: 0, color: '#000033' },
          { stop: 0.3, color: '#000099' },
          { stop: 0.5, color: '#0099ff' },
          { stop: 0.7, color: '#33cc33' },
          { stop: 0.85, color: '#ffcc00' },
          { stop: 1.0, color: '#ff3300' }
        ]
      },
      precision: {
        background: '#000000',
        foreground: '#ffffff',
        primary: '#03A9F4',
        secondary: '#E91E63',
        tertiary: '#FFC107',
        gridLines: 'rgba(255, 255, 255, 0.2)',
        spectrogramGradient: [
          { stop: 0, color: '#000000' },
          { stop: 0.3, color: '#000066' },
          { stop: 0.5, color: '#0099cc' },
          { stop: 0.7, color: '#cccccc' },
          { stop: 0.85, color: '#ff9966' },
          { stop: 1.0, color: '#ff0000' }
        ]
      }
    };
    
    // Viewport observer for performance optimization
    this.setupViewportObserver();
  }
  
  /**
   * Connect to audio engine
   * @param {AudioEngine} engine - Audio engine instance
   */
  connectAudioEngine(engine) {
    this.audioEngine = engine;
    
    // Subscribe to metrics updates
    this.audioEngine.onMetricsUpdate = (metrics) => {
      this.updateVisualizations(metrics);
    };
    
    return this;
  }
  
  /**
   * Set active theme
   * @param {string} themeName - Theme name
   */
  setTheme(themeName) {
    if (this.themes[themeName]) {
      this.activeTheme = themeName;
      this.applyTheme();
    }
    
    return this;
  }
  
  /**
   * Apply current theme to all visualizations
   */
  applyTheme() {
    const theme = this.themes[this.activeTheme];
    
    // Update CSS variables
    document.documentElement.style.setProperty('--theme-background', theme.background);
    document.documentElement.style.setProperty('--theme-foreground', theme.foreground);
    document.documentElement.style.setProperty('--theme-primary', theme.primary);
    document.documentElement.style.setProperty('--theme-secondary', theme.secondary);
    document.documentElement.style.setProperty('--theme-tertiary', theme.tertiary);
    document.documentElement.style.setProperty('--theme-grid', theme.gridLines);
    
    // Update visualizations
    this.canvasControllers.forEach(controller => {
      controller.setTheme(theme);
    });
    
    return this;
  }
  
  /**
   * Register canvas controller
   * @param {string} id - Canvas element ID
   * @param {BaseCanvasController} controller - Canvas controller
   */
  registerCanvas(id, controller) {
    if (this.canvasControllers.has(id)) {
      console.warn(`Canvas with ID ${id} already registered. Replacing controller.`);
    }
    
    this.canvasControllers.set(id, controller);
    controller.initialize();
    controller.setTheme(this.themes[this.activeTheme]);
    
    return this;
  }
  
  /**
   * Start visualizations
   */
  start() {
    if (this.isRunning) return this;
    
    this.isRunning = true;
    this.lastFrameTime = performance.now();
    this.animate();
    
    return this;
  }
  
  /**
   * Stop visualizations
   */
  stop() {
    this.isRunning = false;
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
    
    return this;
  }
  
  /**
   * Animation loop with frame limiting
   */
  animate(timestamp) {
    if (!this.isRunning) return;
    
    // Calculate time since last frame
    const elapsed = timestamp - this.lastFrameTime;
    
    // Only render if enough time has elapsed
    if (elapsed >= this.frameInterval) {
      // Adjust time tracking by the amount we're actually rendering
      this.lastFrameTime = timestamp - (elapsed % this.frameInterval);
      
      // Render all visible controllers
      this.canvasControllers.forEach(controller => {
        if (controller.isVisible()) {
          controller.render();
        }
      });
    }
    
    this.animationFrame = requestAnimationFrame(this.animate.bind(this));
  }
  
  /**
   * Update visualizations with new metrics
   * @param {Object} metrics - Audio metrics data
   */
  updateVisualizations(metrics) {
    this.canvasControllers.forEach(controller => {
      controller.updateMetrics(metrics);
    });
  }
  
  /**
   * Handle window resize
   */
  handleResize() {
    this.canvasControllers.forEach(controller => {
      controller.resize();
    });
    
    return this;
  }
  
  /**
   * Set up intersection observer to monitor canvas visibility
   */
  setupViewportObserver() {
    // Create observer
    this.viewportObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const id = entry.target.id;
        const controller = this.canvasControllers.get(id);
        
        if (controller) {
          controller.setVisibility(entry.isIntersecting);
        }
      });
    }, {
      root: null,
      rootMargin: '0px',
      threshold: 0.1
    });
  }
  
  /**
   * Observe canvas element for visibility
   * @param {string} id - Canvas element ID
   */
  observeCanvas(id) {
    const element = document.getElementById(id);
    if (element && this.viewportObserver) {
      this.viewportObserver.observe(element);
    }
    return this;
  }
}

/**
 * BaseCanvasController - Abstract base class for all visualizations
 */
class BaseCanvasController {
  constructor(canvasId, options = {}) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) {
      throw new Error(`Canvas with ID ${canvasId} not found`);
    }
    
    this.ctx = this.canvas.getContext('2d');
    this.options = options;
    this.visible = true;
    this.lastRender = 0;
    this.throttleMs = options.throttleMs || 16; // ~60fps by default
    
    // Metrics data
    this.metrics = null;
    
    // Animation properties
    this.animations = [];
    
    // Theme
    this.theme = null;
    
    // Canvas size
    this.width = 0;
    this.height = 0;
    
    // Mouse interaction
    this.setupMouseHandling();
    
    // High DPI support
    this.pixelRatio = window.devicePixelRatio || 1;
  }
  
  /**
   * Initialize controller
   */
  initialize() {
    this.resize();
    return this;
  }
  
  /**
   * Set controller theme
   * @param {Object} theme - Theme object
   */
  setTheme(theme) {
    this.theme = theme;
    this.createGradients();
    return this;
  }
  
  /**
   * Create theme-based gradients
   */
  createGradients() {
    // To be implemented by subclasses
  }
  
  /**
   * Update with new metrics
   * @param {Object} metrics - Audio metrics data
   */
  updateMetrics(metrics) {
    this.metrics = metrics;
    return this;
  }
  
  /**
   * Resize canvas to fit container
   */
  resize() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    
    // Set logical size
    this.width = rect.width;
    this.height = rect.height;
    
    // Set physical size (accounting for high DPI)
    this.canvas.width = this.width * this.pixelRatio;
    this.canvas.height = this.height * this.pixelRatio;
    
    // Set display size
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;
    
    // Scale all drawing operations
    this.ctx.scale(this.pixelRatio, this.pixelRatio);
    
    // Recreate gradients if theme exists
    if (this.theme) {
      this.createGradients();
    }
    
    return this;
  }
  
  /**
   * Set controller visibility
   * @param {boolean} visible - Visibility state
   */
  setVisibility(visible) {
    this.visible = visible;
    return this;
  }
  
  /**
   * Check if controller is visible
   * @returns {boolean} - Visibility state
   */
  isVisible() {
    return this.visible;
  }
  
  /**
   * Set up mouse interaction
   */
  setupMouseHandling() {
    this.mousePosition = { x: 0, y: 0 };
    this.mouseDown = false;
    
    this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
    this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
    this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
    this.canvas.addEventListener('mouseleave', this.handleMouseLeave.bind(this));
    this.canvas.addEventListener('wheel', this.handleWheel.bind(this), { passive: false });
    
    // Add touch support
    this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
    this.canvas.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
    this.canvas.addEventListener('touchend', this.handleTouchEnd.bind(this));
  }
  
  /**
   * Handle mouse move event
   * @param {MouseEvent} event - Mouse event
   */
  handleMouseMove(event) {
    const rect = this.canvas.getBoundingClientRect();
    this.mousePosition = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
    
    this.onMouseMove(this.mousePosition, event);
  }
  
  /**
   * Handle mouse down event
   * @param {MouseEvent} event - Mouse event
   */
  handleMouseDown(event) {
    this.mouseDown = true;
    this.onMouseDown(this.mousePosition, event);
  }
  
  /**
   * Handle mouse up event
   * @param {MouseEvent} event - Mouse event
   */
  handleMouseUp(event) {
    this.mouseDown = false;
    this.onMouseUp(this.mousePosition, event);
  }
  
  /**
   * Handle mouse leave event
   * @param {MouseEvent} event - Mouse event
   */
  handleMouseLeave(event) {
    this.mouseDown = false;
    this.onMouseLeave(event);
  }
  
  /**
   * Handle wheel event
   * @param {WheelEvent} event - Wheel event
   */
  handleWheel(event) {
    event.preventDefault();
    this.onWheel(event.deltaY, event);
  }
  
  /**
   * Handle touch start event
   * @param {TouchEvent} event - Touch event
   */
  handleTouchStart(event) {
    event.preventDefault();
    const touch = event.touches[0];
    const rect = this.canvas.getBoundingClientRect();
    
    this.mousePosition = {
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top
    };
    
    this.mouseDown = true;
    this.onMouseDown(this.mousePosition, event);
  }
  
  /**
   * Handle touch move event
   * @param {TouchEvent} event - Touch event
   */
  handleTouchMove(event) {
    event.preventDefault();
    const touch = event.touches[0];
    const rect = this.canvas.getBoundingClientRect();
    
    this.mousePosition = {
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top
    };
    
    this.onMouseMove(this.mousePosition, event);
  }
  
  /**
   * Handle touch end event
   * @param {TouchEvent} event - Touch event
   */
  handleTouchEnd(event) {
    this.mouseDown = false;
    this.onMouseUp(this.mousePosition, event);
  }
  
  /**
   * Mouse move handler - to be overridden by subclasses
   * @param {Object} position - Mouse position
   * @param {Event} event - Original event
   */
  onMouseMove(position, event) {
    // To be implemented by subclasses
  }
  
  /**
   * Mouse down handler - to be overridden by subclasses
   * @param {Object} position - Mouse position
   * @param {Event} event - Original event
   */
  onMouseDown(position, event) {
    // To be implemented by subclasses
  }
  
  /**
   * Mouse up handler - to be overridden by subclasses
   * @param {Object} position - Mouse position
   * @param {Event} event - Original event
   */
  onMouseUp(position, event) {
    // To be implemented by subclasses
  }
  
  /**
   * Mouse leave handler - to be overridden by subclasses
   * @param {Event} event - Original event
   */
  onMouseLeave(event) {
    // To be implemented by subclasses
  }
  
  /**
   * Wheel handler - to be overridden by subclasses
   * @param {number} delta - Wheel delta
   * @param {Event} event - Original event
   */
  onWheel(delta, event) {
    // To be implemented by subclasses
  }
  
  /**
   * Add animation
   * @param {Object} animation - Animation object
   */
  addAnimation(animation) {
    this.animations.push(animation);
    return this;
  }
  
  /**
   * Update animations
   */
  updateAnimations() {
    const now = performance.now();
    let hasActiveAnimations = false;
    
    this.animations = this.animations.filter(anim => {
      // Skip completed animations
      if (anim.complete) return false;
      
      // Calculate progress
      const elapsed = now - anim.startTime;
      const duration = anim.duration || 1000;
      const progress = Math.min(1, elapsed / duration);
      
      // Apply easing function
      const easedProgress = anim.easing ? 
        anim.easing(progress) : 
        progress;
      
      // Update value
      anim.current = anim.from + (anim.to - anim.from) * easedProgress;
      
      // Check if complete
      if (progress >= 1) {
        anim.complete = true;
        anim.current = anim.to;
        
        // Call complete callback if exists
        if (typeof anim.onComplete === 'function') {
          anim.onComplete();
        }
      } else {
        hasActiveAnimations = true;
      }
      
      return true;
    });
    
    return hasActiveAnimations;
  }
  
  /**
   * Clear canvas
   */
  clear() {
    this.ctx.clearRect(0, 0, this.width, this.height);
    return this;
  }
  
  /**
   * Draw background
   */
  drawBackground() {
    if (!this.theme) return this;
    
    this.ctx.fillStyle = this.theme.background;
    this.ctx.fillRect(0, 0, this.width, this.height);
    
    return this;
  }
  
  /**
   * Draw grid
   * @param {number} xStep - Horizontal step
   * @param {number} yStep - Vertical step
   */
  drawGrid(xStep, yStep) {
    if (!this.theme) return this;
    
    this.ctx.strokeStyle = this.theme.gridLines;
    this.ctx.lineWidth = 1;
    
    // Draw vertical grid lines
    for (let x = 0; x <= this.width; x += xStep) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, this.height);
      this.ctx.stroke();
    }
    
    // Draw horizontal grid lines
    for (let y = 0; y <= this.height; y += yStep) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.width, y);
      this.ctx.stroke();
    }
    
    return this;
  }
  
  /**
   * Draw text with proper alignment
   * @param {string} text - Text to draw
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {Object} options - Text options
   */
  drawText(text, x, y, options = {}) {
    const {
      font = '12px Arial',
      fillStyle = this.theme ? this.theme.foreground : '#ffffff',
      textAlign = 'left',
      textBaseline = 'top',
      maxWidth = undefined
    } = options;
    
    this.ctx.font = font;
    this.ctx.fillStyle = fillStyle;
    this.ctx.textAlign = textAlign;
    this.ctx.textBaseline = textBaseline;
    this.ctx.fillText(text, x, y, maxWidth);
    
    return this;
  }
  
  /**
   * Check if rendering should occur
   * @returns {boolean} - Whether to render
   */
  shouldRender() {
    // Don't render if not visible
    if (!this.visible) return false;
    
    // Check if throttling is needed
    const now = performance.now();
    if (now - this.lastRender < this.throttleMs) {
      return false;
    }
    
    this.lastRender = now;
    return true;
  }
  
  /**
   * Render visualization - to be implemented by subclasses
   */
  render() {
    if (!this.shouldRender()) return this;
    
    // Update animations
    this.updateAnimations();
    
    // Clear canvas
    this.clear();
    
    // Draw background
    this.drawBackground();
    
    return this;
  }
}

/**
 * Enhanced SpectrogramController with frequency scale
 */
class SpectrogramController extends BaseCanvasController {
  constructor(canvasId, options = {}) {
    super(canvasId, options);
    
    // Spectrogram options
    this.logScale = options.logScale !== undefined ? options.logScale : true;
    this.showScale = options.showScale !== undefined ? options.showScale : true;
    this.colorGradient = null;
    this.scaleWidth = options.scaleWidth || 50;
    this.minFreq = options.minFreq || 20;
    this.maxFreq = options.maxFreq || 20000;
    this.minDb = options.minDb || -100;
    this.maxDb = options.maxDb || 0;
    
    // Time domain
    this.historyLength = options.historyLength || 200;
    this.spectrogramData = [];
    this.timeScale = options.timeScale || 1.0; // Pixels per frame
    
    // Zoom and pan
    this.freqZoom = 1.0;
    this.freqScroll = 0;
    this.timeZoom = 1.0;
    this.timeScroll = 0;
    
    // Hover information
    this.showTooltip = options.showTooltip !== undefined ? options.showTooltip : true;
    this.hoverInfo = null;
    
    // Add frequency labels
    this.frequencyLabels = [20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000];
  }
  
  /**
   * Create gradient for the spectrogram
   */
  createGradients() {
    if (!this.theme) return;
    
    // Create color gradient based on theme
    const gradientCanvas = document.createElement('canvas');
    const gradientCtx = gradientCanvas.getContext('2d');
    
    gradientCanvas.width = 256;
    gradientCanvas.height = 1;
    
    const gradient = gradientCtx.createLinearGradient(0, 0, 256, 0);
    
    // Add color stops based on theme
    if (this.theme.spectrogramGradient) {
      this.theme.spectrogramGradient.forEach(stop => {
        gradient.addColorStop(stop.stop, stop.color);
      });
    } else {
      // Default gradient if not specified in theme
      gradient.addColorStop(0.0, '#000000');
      gradient.addColorStop(0.3, '#0000ff');
      gradient.addColorStop(0.5, '#00ffff');
      gradient.addColorStop(0.7, '#00ff00');
      gradient.addColorStop(0.85, '#ffff00');
      gradient.addColorStop(1.0, '#ff0000');
    }
    
    gradientCtx.fillStyle = gradient;
    gradientCtx.fillRect(0, 0, 256, 1);
    
    this.colorGradient = gradientCtx.getImageData(0, 0, 256, 1).data;
  }
  
  /**
   * Update with new frequency data
   * @param {Object} metrics - Audio metrics
   */
  updateMetrics(metrics) {
    super.updateMetrics(metrics);
    
    // Check if we have frequency data from the audio engine
    if (metrics && metrics.frequencyData) {
      this.spectrogramData.push({
        left: metrics.frequencyData.left,
        right: metrics.frequencyData.right,
        time: performance.now()
      });
      
      // Keep history length limited
      while (this.spectrogramData.length > this.historyLength) {
        this.spectrogramData.shift();
      }
    }
    
    return this;
  }
  
  /**
   * Handle mouse wheel for zooming
   * @param {number} delta - Wheel delta
   */
  onWheel(delta) {
    // Zoom frequency axis
    if (this.mousePosition.x > this.width - this.scaleWidth) {
      // Zoom frequency
      this.freqZoom = Math.max(0.5, Math.min(5, this.freqZoom + (delta > 0 ? -0.1 : 0.1)));
    } else {
      // Zoom time
      this.timeZoom = Math.max(0.5, Math.min(5, this.timeZoom + (delta > 0 ? -0.1 : 0.1)));
    }
  }
  
  /**
   * Handle mouse move for hover info
   * @param {Object} position - Mouse position
   */
  onMouseMove(position) {
    if (!this.showTooltip || !this.spectrogramData.length) return;
    
    // Calculate frequency at mouse position
    const contentWidth = this.width - this.scaleWidth;
    
    // Only show hover info in the main content area
    if (position.x >= contentWidth) {
      this.hoverInfo = null;
      return;
    }
    
    // Calculate visualization parameters
    const effectiveHeight = this.height * this.freqZoom;
    const yOffset = this.freqScroll * (effectiveHeight - this.height);
    
    // Calculate time index
    const timeIndex = Math.floor(
      this.spectrogramData.length - 1 - 
      (position.x / contentWidth) * this.spectrogramData.length * this.timeZoom
    );
    
    // Calculate frequency
    let frequency;
    const relativeY = (position.y + yOffset) / effectiveHeight;
    
    if (this.logScale) {
      const minLog = Math.log10(this.minFreq);
      const maxLog = Math.log10(this.maxFreq);
      const valueLog = minLog + (maxLog - minLog) * relativeY;
      frequency = Math.pow(10, valueLog);
    } else {
      frequency = this.minFreq + (this.maxFreq - this.minFreq) * relativeY;
    }
    
    // Get spectrogram data if available
    let value = null;
    if (timeIndex >= 0 && timeIndex < this.spectrogramData.length) {
      const frame = this.spectrogramData[timeIndex];
      
      // Find closest frequency bin
      const binCount = frame.left.length;
      const binIndex = Math.floor(frequency / (this.maxFreq) * binCount);
      
      if (binIndex >= 0 && binIndex < binCount) {
        // Average left and right channels
        value = (frame.left[binIndex] + frame.right[binIndex]) / 2;
      }
    }
    
    this.hoverInfo = {
      x: position.x,
      y: position.y,
      frequency: frequency,
      value: value,
      timeIndex: timeIndex
    };
  }
  