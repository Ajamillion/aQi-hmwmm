/**
 * AdvancedAudioAnalysisUI - Integrates the enhanced analysis visualizations
 * into a cohesive user interface with recommendations
 */
class AdvancedAudioAnalysisUI {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    if (!this.container) {
      throw new Error(`Container with ID ${containerId} not found`);
    }
    
    // Options
    this.options = options;
    
    // Components
    this.audioEngine = null;
    this.visualizationManager = null;
    this.audioVisualizerUI = null; // Reference to basic visualization UI
    
    // Advanced visualization controllers
    this.advancedControllers = {
      frequencyEcosystem: null,
      spectralMigration: null,
      phaseCoherence: null,
      emotionalResonance: null
    };
    
    // UI state
    this.activeVisualization = 'standard';
    this.showRecommendations = true;
    this.showAdvancedControls = false;
    
    // Analysis state
    this.recommendations = [];
    this.analysisResults = {};
    
    // Initialize UI
    this.initializeUI();
  }
  
  /**
   * Initialize UI structure
   */
  initializeUI() {
    // Create advanced UI tabs and container
    this.createAdvancedUIStructure();
    
    // Create recommendations panel
    this.createRecommendationsPanel();
    
    // Set up event handlers
    this.setupEventHandlers();
  }
  
  /**
   * Create advanced visualization UI structure
   */
  createAdvancedUIStructure() {
    // Create container for advanced visualizations
    const advancedContainer = document.createElement('div');
    advancedContainer.className = 'advanced-visualizations';
    advancedContainer.style.display = 'none'; // Initially hidden
    advancedContainer.style.width = '100%';
    advancedContainer.style.height = 'calc(100% - 60px)';
    advancedContainer.style.position = 'absolute';
    advancedContainer.style.top = '60px';
    advancedContainer.style.left = '0';
    advancedContainer.style.backgroundColor = '#1a1a1a';
    advancedContainer.style.zIndex = '10';
    
    // Create tabs for switching between visualizations
    const tabContainer = document.createElement('div');
    tabContainer.className = 'visualization-tabs';
    tabContainer.style.display = 'flex';
    tabContainer.style.justifyContent = 'center';
    tabContainer.style.alignItems = 'center';
    tabContainer.style.padding = '10px';
    tabContainer.style.backgroundColor = '#0d0d0d';
    tabContainer.style.borderBottom = '1px solid rgba(255, 255, 255, 0.1)';
    
    // Create tab buttons
    const visualizationTypes = [
      { id: 'standard', label: '🎚️ Standard', description: 'Classic audio analysis tools' },
      { id: 'frequency-ecosystem', label: '🌐 Frequency Ecosystem', description: 'Interactive frequency relationship visualization' },
      { id: 'spectral-migration', label: '🌊 Spectral Migration', description: 'Flow of frequency content over time' },
      { id: 'phase-coherence', label: '🔄 Phase Coherence', description: 'Detailed phase relationship analysis' },
      { id: 'emotional-resonance', label: '💫 Emotional Resonance', description: 'Emotional mapping of audio content' }
    ];
    
    // Create tabs
    visualizationTypes.forEach(type => {
      const tab = document.createElement('button');
      tab.id = `tab-${type.id}`;
      tab.className = 'visualization-tab';
      tab.textContent = type.label;
      tab.dataset.visualizationType = type.id;
      tab.title = type.description;
      
      // Style the tab
      tab.style.backgroundColor = type.id === 'standard' ? 'rgba(0, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.3)';
      tab.style.color = '#ffffff';
      tab.style.border = 'none';
      tab.style.borderRadius = '4px';
      tab.style.padding = '8px 16px';
      tab.style.margin = '0 5px';
      tab.style.cursor = 'pointer';
      tab.style.transition = 'all 0.2s ease';
      
      // Add to tab container
      tabContainer.appendChild(tab);
    });
    
    // Create visualization containers
    const visualizationsContainer = document.createElement('div');
    visualizationsContainer.className = 'visualizations-container';
    visualizationsContainer.style.width = '100%';
    visualizationsContainer.style.height = 'calc(100% - 50px)';
    visualizationsContainer.style.position = 'relative';
    
    // Create individual visualization containers
    visualizationTypes.slice(1).forEach(type => {
      const container = document.createElement('div');
      container.id = `${type.id}-container`;
      container.className = 'visualization-container';
      container.style.width = '100%';
      container.style.height = '100%';
      container.style.display = 'none';
      container.style.position = 'absolute';
      container.style.top = '0';
      container.style.left = '0';
      
      // Create canvas element for this visualization
      const canvas = document.createElement('canvas');
      canvas.id = `${type.id}-canvas`;
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      
      container.appendChild(canvas);
      visualizationsContainer.appendChild(container);
    });
    
    // Add all components to the main container
    advancedContainer.appendChild(tabContainer);
    advancedContainer.appendChild(visualizationsContainer);
    
    // Add the advanced container to the document
    this.container.appendChild(advancedContainer);
    
    // Store references
    this.advancedContainer = advancedContainer;
    this.tabContainer = tabContainer;
    this.visualizationsContainer = visualizationsContainer;
  }
  
  /**
   * Create recommendations panel
   */
  createRecommendationsPanel() {
    // Create recommendations panel
    const recommendationsPanel = document.createElement('div');
    recommendationsPanel.className = 'recommendations-panel';
    recommendationsPanel.style.position = 'absolute';
    recommendationsPanel.style.bottom = '20px';
    recommendationsPanel.style.right = '20px';
    recommendationsPanel.style.width = '300px';
    recommendationsPanel.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    recommendationsPanel.style.borderRadius = '6px';
    recommendationsPanel.style.padding = '15px';
    recommendationsPanel.style.color = '#ffffff';
    recommendationsPanel.style.boxShadow = '0 0 20px rgba(0, 255, 255, 0.2)';
    recommendationsPanel.style.zIndex = '100';
    recommendationsPanel.style.transition = 'all 0.3s ease';
    recommendationsPanel.style.display = 'none'; // Initially hidden
    
    // Create header with title and toggle button
    const header = document.createElement('div');
    header.style.display = 'flex';
    header.style.justifyContent = 'space-between';
    header.style.alignItems = 'center';
    header.style.marginBottom = '10px';
    
    const title = document.createElement('h3');
    title.textContent = '🧠 Smart Recommendations';
    title.style.margin = '0';
    title.style.fontSize = '16px';
    title.style.color = '#00ffff';
    
    const toggleButton = document.createElement('button');
    toggleButton.textContent = '−';
    toggleButton.style.backgroundColor = 'transparent';
    toggleButton.style.border = 'none';
    toggleButton.style.color = '#ffffff';
    toggleButton.style.fontSize = '18px';
    toggleButton.style.cursor = 'pointer';
    toggleButton.style.width = '30px';
    toggleButton.style.height = '30px';
    toggleButton.style.display = 'flex';
    toggleButton.style.justifyContent = 'center';
    toggleButton.style.alignItems = 'center';
    toggleButton.style.borderRadius = '50%';
    
    header.appendChild(title);
    header.appendChild(toggleButton);
    
    // Create recommendations content
    const content = document.createElement('div');
    content.className = 'recommendations-content';
    content.style.transition = 'max-height 0.3s ease';
    
    // Create empty recommendations list
    const recommendationsList = document.createElement('ul');
    recommendationsList.className = 'recommendations-list';
    recommendationsList.style.listStyleType = 'none';
    recommendationsList.style.padding = '0';
    recommendationsList.style.margin = '0';
    
    content.appendChild(recommendationsList);
    
    // Add components to panel
    recommendationsPanel.appendChild(header);
    recommendationsPanel.appendChild(content);
    
    // Add panel to document
    this.container.appendChild(recommendationsPanel);
    
    // Store references
    this.recommendationsPanel = recommendationsPanel;
    this.recommendationsToggle = toggleButton;
    this.recommendationsList = recommendationsList;
    this.recommendationsContent = content;
  }
  
  /**
   * Set up event handlers
   */
  setupEventHandlers() {
    // Handle visualization tab clicks
    const tabs = this.tabContainer.querySelectorAll('.visualization-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const visualizationType = tab.dataset.visualizationType;
        this.activateVisualization(visualizationType);
      });
    });
    
    // Handle recommendations toggle
    this.recommendationsToggle.addEventListener('click', () => {
      // Toggle content visibility
      if (this.recommendationsContent.style.maxHeight) {
        this.recommendationsContent.style.maxHeight = null;
        this.recommendationsToggle.textContent = '+';
      } else {
        this.recommendationsContent.style.maxHeight = this.recommendationsContent.scrollHeight + 'px';
        this.recommendationsToggle.textContent = '−';
      }
    });
    
    // Add toggle button to existing UI for showing advanced analysis
    const existingHeader = this.container.querySelector('.app-header');
    if (existingHeader) {
      const advancedButton = document.createElement('button');
      advancedButton.id = 'advancedAnalysisButton';
      advancedButton.className = 'header-button';
      advancedButton.innerHTML = '🧪 Advanced Analysis';
      advancedButton.style.backgroundColor = 'rgba(0, 255, 255, 0.2)';
      advancedButton.style.color = '#ffffff';
      advancedButton.style.border = 'none';
      advancedButton.style.borderRadius = '4px';
      advancedButton.style.padding = '8px 16px';
      advancedButton.style.marginRight = '10px';
      advancedButton.style.cursor = 'pointer';
      
      // Add button to existing controls
      const headerControls = existingHeader.querySelector('.header-controls');
      if (headerControls) {
        headerControls.insertBefore(advancedButton, headerControls.firstChild);
        
        // Add event listener
        advancedButton.addEventListener('click', () => {
          this.toggleAdvancedAnalysis();
        });
      }
    }
  }
  
  /**
   * Connect to existing audio components
   * @param {AudioVisualizerUI} basicUI - Basic audio visualizer UI
   */
  connectToAudioVisualizer(basicUI) {
    if (!basicUI) return;
    
    this.audioVisualizerUI = basicUI;
    this.audioEngine = basicUI.audioEngine;
    this.visualizationManager = basicUI.visualizationManager;
    
    // Initialize advanced visualizations
    this.initializeAdvancedVisualizations();
    
    // Start the recommendation engine
    this.startRecommendationEngine();
  }
  
  /**
   * Initialize advanced visualization controllers
   */
  initializeAdvancedVisualizations() {
    // Create frequency ecosystem controller
    this.advancedControllers.frequencyEcosystem = new FrequencyRelationshipEcosystem(
      'frequency-ecosystem-canvas',
      {
        nodeCount: 32,
        showLabels: true
      }
    );
    
    // Create spectral migration controller
    this.advancedControllers.spectralMigration = new SpectralMigrationAnalyzer(
      'spectral-migration-canvas',
      {
        frequencyBands: 30,
        showLabels: true,
        flowIntensity: 0.8
      }
    );
    
    // Create phase coherence controller
    this.advancedControllers.phaseCoherence = new PhaseCoherenceHeatmap(
      'phase-coherence-canvas',
      {
        frequencyBands: 24,
        showTooltip: true
      }
    );
    
    // Create emotional resonance controller
    // This would be a placeholder for a future implementation
    
    // Register controllers with visualization manager
    if (this.visualizationManager) {
      // Frequency ecosystem
      this.visualizationManager.registerCanvas(
        'frequency-ecosystem-canvas',
        this.advancedControllers.frequencyEcosystem
      );
      
      // Spectral migration
      this.visualizationManager.registerCanvas(
        'spectral-migration-canvas',
        this.advancedControllers.spectralMigration
      );
      
      // Phase coherence
      this.visualizationManager.registerCanvas(
        'phase-coherence-canvas',
        this.advancedControllers.phaseCoherence
      );
      
      // Observe canvases for viewport optimization
      this.visualizationManager.observeCanvas('frequency-ecosystem-canvas');
      this.visualizationManager.observeCanvas('spectral-migration-canvas');
      this.visualizationManager.observeCanvas('phase-coherence-canvas');
    }
  }
  
  /**
   * Toggle advanced analysis view
   */
  toggleAdvancedAnalysis() {
    const visualizationArea = this.container.querySelector('.visualization-area');
    
    if (this.advancedContainer.style.display === 'none') {
      // Switch to advanced visualization
      this.advancedContainer.style.display = 'block';
      if (visualizationArea) {
        visualizationArea.style.display = 'none';
      }
      
      // Activate the current visualization
      this.activateVisualization(this.activeVisualization === 'standard' ? 'frequency-ecosystem' : this.activeVisualization);
      
      // Update button text
      const advancedButton = document.getElementById('advancedAnalysisButton');
      if (advancedButton) {
        advancedButton.innerHTML = '📊 Standard Analysis';
      }
      
      // Show recommendations panel
      this.recommendationsPanel.style.display = 'block';
      this.recommendationsContent.style.maxHeight = this.recommendationsContent.scrollHeight + 'px';
    } else {
      // Switch back to standard visualization
      this.advancedContainer.style.display = 'none';
      if (visualizationArea) {
        visualizationArea.style.display = 'flex';
      }
      
      // Update active visualization
      this.activeVisualization = 'standard';
      
      // Update button text
      const advancedButton = document.getElementById('advancedAnalysisButton');
      if (advancedButton) {
        advancedButton.innerHTML = '🧪 Advanced Analysis';
      }
      
      // Hide recommendations panel
      this.recommendationsPanel.style.display = 'none';
    }
    
    // Handle window resize to adjust visualizations
    if (this.visualizationManager) {
      this.visualizationManager.handleResize();
    }
  }
  
  /**
   * Activate a specific visualization
   * @param {string} visualizationType - Type of visualization to activate
   */
  activateVisualization(visualizationType) {
    // Update active visualization
    this.activeVisualization = visualizationType;
    
    // Update tab styling
    const tabs = this.tabContainer.querySelectorAll('.visualization-tab');
    tabs.forEach(tab => {
      if (tab.dataset.visualizationType === visualizationType) {
        tab.style.backgroundColor = 'rgba(0, 255, 255, 0.2)';
        tab.style.fontWeight = 'bold';
      } else {
        tab.style.backgroundColor = 'rgba(0, 0, 0, 0.3)';
        tab.style.fontWeight = 'normal';
      }
    });
    
    // Hide all visualization containers
    const containers = this.visualizationsContainer.querySelectorAll('.visualization-container');
    containers.forEach(container => {
      container.style.display = 'none';
    });
    
    // Show active visualization container
    if (visualizationType !== 'standard') {
      const activeContainer = document.getElementById(`${visualizationType}-container`);
      if (activeContainer) {
        activeContainer.style.display = 'block';
      }
    }
    
    // Update recommendations based on active visualization
    this.updateRecommendations();
    
    // Handle window resize to adjust visualizations
    if (this.visualizationManager) {
      this.visualizationManager.handleResize();
    }
  }
  
  /**
   * Start the recommendation engine
   */
  startRecommendationEngine() {
    if (!this.audioEngine) return;
    
    // Set up metrics update listener
    const originalMetricsUpdate = this.audioEngine.onMetricsUpdate;
    
    this.audioEngine.onMetricsUpdate = (metrics) => {
      // Call original handler if it exists
      if (typeof originalMetricsUpdate === 'function') {
        originalMetricsUpdate(metrics);
      }
      
      // Process metrics for recommendations
      this.processMetricsForRecommendations(metrics);
    };
    
    // Initial update of recommendations
    this.updateRecommendations();
  }
  
  /**
   * Process audio metrics for recommendations
   * @param {Object} metrics - Audio metrics
   */
  processMetricsForRecommendations(metrics) {
    // Combine insights from all analysis types
    if (!metrics) return;
    
    // Store analysis results from advanced controllers
    this.analysisResults = {
      frequencyEcosystem: this.advancedControllers.frequencyEcosystem ? {
        conflictingPairs: this.advancedControllers.frequencyEcosystem.conflictingPairs,
        dominantFrequencies: this.advancedControllers.frequencyEcosystem.dominantFrequencies
      } : {},
      
      spectralMigration: this.advancedControllers.spectralMigration ? {
        spectralFluidity: this.advancedControllers.spectralMigration.spectralFluidity,
        spectralDensity: this.advancedControllers.spectralMigration.spectralDensity,
        emergingFrequencies: this.advancedControllers.spectralMigration.emergingFrequencies,
        fadingFrequencies: this.advancedControllers.spectralMigration.fadingFrequencies
      } : {},
      
      phaseCoherence: this.advancedControllers.phaseCoherence ? {
        overallCoherence: this.advancedControllers.phaseCoherence.overallCoherence,
        problematicRegions: this.advancedControllers.phaseCoherence.problematicRegions
      } : {},
      
      // Add basic metrics
      lufs: metrics.lufs || {},
      correlation: metrics.correlation || 0,
      dynamicRange: metrics.dynamicRange || 0,
      crestFactor: metrics.crestFactor || 0
    };
    
    // Generate recommendations based on analysis
    this.generateRecommendations();
    
    // Update recommendations display
    this.updateRecommendations();
  }
  
  /**
   * Generate recommendations based on analysis results
   */
  generateRecommendations() {
    const recommendations = [];
    
    // Only generate if we have analysis results
    if (Object.keys(this.analysisResults).length === 0) return;
    
    // 1. Loudness recommendations
    if (this.analysisResults.lufs) {
      const integratedLUFS = this.analysisResults.lufs.integrated;
      
      if (integratedLUFS > -9) {
        recommendations.push({
          category: 'loudness',
          severity: 'high',
          issue: "Loudness too high",
          details: "Integrated LUFS exceeds streaming platform targets",
          suggestion: "Reduce overall level to around -14 LUFS for better platform compatibility"
        });
      } else if (integratedLUFS < -18) {
        recommendations.push({
          category: 'loudness',
          severity: 'medium',
          issue: "Loudness too low",
          details: "Integrated LUFS below typical streaming targets",
          suggestion: "Increase overall level to around -14 LUFS for better platform compatibility"
        });
      }
    }
    
    // 2. Frequency relationship recommendations
    if (this.analysisResults.frequencyEcosystem && 
        this.analysisResults.frequencyEcosystem.conflictingPairs &&
        this.analysisResults.frequencyEcosystem.conflictingPairs.length > 0) {
      
      recommendations.push({
        category: 'spectral',
        severity: 'high',
        issue: "Frequency conflicts detected",
        details: `${this.analysisResults.frequencyEcosystem.conflictingPairs.length} conflicting frequency relationships found`,
        suggestion: "Check EQ balance between conflicting frequencies"
      });
    }
    
    // 3. Spectral migration recommendations
    if (this.analysisResults.spectralMigration) {
      const spectralFluidity = this.analysisResults.spectralMigration.spectralFluidity;
      const spectralDensity = this.analysisResults.spectralMigration.spectralDensity;
      
      if (spectralFluidity > 0.8) {
        recommendations.push({
          category: 'spectral',
          severity: 'medium',
          issue: "High spectral fluidity",
          details: "Rapid changes in frequency content",
          suggestion: "Consider gentle compression to stabilize spectral behavior"
        });
      } else if (spectralFluidity < 0.2 && spectralDensity > 0.7) {
        recommendations.push({
          category: 'spectral',
          severity: 'medium',
          issue: "Static spectral density",
          details: "Spectral content appears stagnant with high density",
          suggestion: "Introduce more dynamic movement in frequency content"
        });
      }
    }
    
    // 4. Phase coherence recommendations
    if (this.analysisResults.phaseCoherence && 
        this.analysisResults.phaseCoherence.problematicRegions &&
        this.analysisResults.phaseCoherence.problematicRegions.length > 0) {
      
      const lowEndPhaseIssues = this.analysisResults.phaseCoherence.problematicRegions.some(
        region => region.frequency < 200
      );
      
      if (lowEndPhaseIssues) {
        recommendations.push({
          category: 'phase',
          severity: 'high',
          issue: "Low-end phase issues",
          details: "Phase correlation problems in bass frequencies",
          suggestion: "Check bass elements for phase alignment or consider mono below 100-150Hz"
        });
      } else {
        recommendations.push({
          category: 'phase',
          severity: 'medium',
          issue: "Phase correlation issues",
          details: `Phase issues detected in ${this.analysisResults.phaseCoherence.problematicRegions.length} frequency regions`,
          suggestion: "Review stereo imaging and check for phase cancellations"
        });
      }
    }
    
    // 5. Dynamic range recommendations
    if (this.analysisResults.dynamicRange !== undefined) {
      if (this.analysisResults.dynamicRange < 6) {
        recommendations.push({
          category: 'dynamics',
          severity: 'medium',
          issue: "Limited dynamic range",
          details: "Dynamic range appears heavily compressed",
          suggestion: "Consider reducing compression for more musical dynamics"
        });
      } else if (this.analysisResults.dynamicRange > 20) {
        recommendations.push({
          category: 'dynamics',
          severity: 'low',
          issue: "Very wide dynamic range",
          details: "Dynamic range may be too wide for consistent playback",
          suggestion: "Consider gentle compression to control dynamics"
        });
      }
    }
    
    // 6. Stereo width recommendations
    if (this.analysisResults.correlation !== undefined) {
      if (this.analysisResults.correlation < 0.3) {
        recommendations.push({
          category: 'stereo',
          severity: 'high',
          issue: "Poor mono compatibility",
          details: "Very low phase correlation between channels",
          suggestion: "Check for phase cancellation issues"
        });
      }
    }
    
    // Sort recommendations by severity
    recommendations.sort((a, b) => {
      const severityOrder = { high: 0, medium: 1, low: 2 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });
    
    // Store recommendations
    this.recommendations = recommendations;
  }
  
  /**
   * Update recommendations display
   */
  updateRecommendations() {
    // Clear current recommendations
    this.recommendationsList.innerHTML = '';
    
    // Filter recommendations based on active visualization
    let filteredRecommendations = [...this.recommendations];
    
    if (this.activeVisualization === 'frequency-ecosystem') {
      filteredRecommendations = filteredRecommendations.filter(
        rec => rec.category === 'spectral'
      );
    } else if (this.activeVisualization === 'spectral-migration') {
      filteredRecommendations = filteredRecommendations.filter(
        rec => rec.category === 'spectral' || rec.category === 'dynamics'
      );
    } else if (this.activeVisualization === 'phase-coherence') {
      filteredRecommendations = filteredRecommendations.filter(
        rec => rec.category === 'phase' || rec.category === 'stereo'
      );
    }
    
    // Display recommendations
    if (filteredRecommendations.length === 0) {
      const emptyItem = document.createElement('li');
      emptyItem.textContent = 'No recommendations available. Audio sounds good!';
      emptyItem.style.padding = '10px 0';
      emptyItem.style.color = '#00ffff';
      this.recommendationsList.appendChild(emptyItem);
    } else {
      filteredRecommendations.forEach(rec => {
        // Create recommendation item
        const item = document.createElement('li');
        item.style.marginBottom = '10px';
        item.style.padding = '10px';
        item.style.borderRadius = '4px';
        item.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
        
        // Add severity indicator
        const severityColor = rec.severity === 'high' ? '#ff3366' : 
                             (rec.severity === 'medium' ? '#ffcc00' : '#00ffff');
        
        const severityIndicator = document.createElement('div');
        severityIndicator.style.width = '12px';
        severityIndicator.style.height = '12px';
        severityIndicator.style.borderRadius = '50%';
        severityIndicator.style.backgroundColor = severityColor;
        severityIndicator.style.display = 'inline-block';
        severityIndicator.style.marginRight = '8px';
        
        // Create issue text
        const issueText = document.createElement('span');
        issueText.textContent = rec.issue;
        issueText.style.fontWeight = 'bold';
        issueText.style.color = severityColor;
        
        // Create header
        const header = document.createElement('div');
        header.style.display = 'flex';
        header.style.alignItems = 'center';
        header.style.marginBottom = '5px';
        header.appendChild(severityIndicator);
        header.appendChild(issueText);
        
        // Create details
        const details = document.createElement('div');
        details.textContent = rec.details;
        details.style.fontSize = '12px';
        details.style.opacity = '0.8';
        details.style.marginBottom = '5px';
        
        // Create suggestion
        const suggestion = document.createElement('div');
        suggestion.textContent = `Suggestion: ${rec.suggestion}`;
        suggestion.style.fontSize = '12px';
        suggestion.style.fontStyle = 'italic';
        suggestion.style.color = '#00ffff';
        
        // Add all elements to item
        item.appendChild(header);
        item.appendChild(details);
        item.appendChild(suggestion);
        
        // Add item to list
        this.recommendationsList.appendChild(item);
      });
    }
    
    // Update max height for animation
    if (this.recommendationsContent.style.maxHeight) {
      this.recommendationsContent.style.maxHeight = this.recommendationsContent.scrollHeight + 'px';
    }
  }
  
  /**
   * Handle window resize
   */
  handleResize() {
    // Update UI layout
    
    // Handle visualization manager resize if available
    if (this.visualizationManager) {
      this.visualizationManager.handleResize();
    }
  }
}

/**
 * Initialize advanced audio analysis
 */
function initializeAdvancedAudioAnalysis() {
  document.addEventListener('DOMContentLoaded', () => {
    // Wait for the basic audio analyzer to initialize
    const checkForBasicAnalyzer = setInterval(() => {
      if (window.audioVisualizer) {
        clearInterval(checkForBasicAnalyzer);
        
        // Create advanced audio analysis UI
        const advancedAnalysisUI = new AdvancedAudioAnalysisUI('audioVisualizerContainer');
        
        // Connect to existing audio visualizer
        advancedAnalysisUI.connectToAudioVisualizer(window.audioVisualizer);
        
        // Store reference in window for debugging
        window.advancedAudioAnalysis = advancedAnalysisUI;
      }
    }, 500);
  });
}

// Initialize advanced audio analysis
initializeAdvancedAudioAnalysis();
