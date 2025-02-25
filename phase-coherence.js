/**
 * PhaseCoherenceHeatmap - Advanced visualization for phase relationships
 * between frequency bands across channels
 */
class PhaseCoherenceHeatmap extends BaseCanvasController {
  constructor(canvasId, options = {}) {
    super(canvasId, options);
    
    // Phase analysis options
    this.frequencyBands = options.frequencyBands || 24;
    this.minFreq = options.minFreq || 20;
    this.maxFreq = options.maxFreq || 20000;
    this.logScale = options.logScale !== undefined ? options.logScale : true;
    this.timeWindow = options.timeWindow || 2000; // Analysis time window in ms
    this.historyLength = options.historyLength || 30;
    
    // Visualization options
    this.cellSize = options.cellSize || 20;
    this.gridPadding = options.gridPadding || 60;
    this.showLabels = options.showLabels !== undefined ? options.showLabels : true;
    this.showTooltip = options.showTooltip !== undefined ? options.showTooltip : true;
    
    // Heatmap data
    this.phaseData = [];
    this.phaseHistory = [];
    this.phaseTrends = [];
    this.timeWindows = [];
    
    // Selected cell for detailed view
    this.selectedCell = null;
    this.hoveredCell = null;
    
    // Analysis results
    this.problematicRegions = [];
    this.overallCoherence = 0;
    this.bandCoherence = [];
    
    // Generate frequency bands
    this.bands = this.generateFrequencyBands();
    
    // Create empty phase data matrix
    this.createEmptyPhaseData();
  }
  
  /**
   * Generate logarithmically spaced frequency bands
   * @returns {Array} - Array of frequency bands
   */
  generateFrequencyBands() {
    const bands = [];
    
    // Create logarithmically spaced bands
    const logMin = Math.log10(this.minFreq);
    const logMax = Math.log10(this.maxFreq);
    const step = (logMax - logMin) / this.frequencyBands;
    
    for (let i = 0; i < this.frequencyBands; i++) {
      const logLow = logMin + step * i;
      const logHigh = logMin + step * (i + 1);
      
      const lowFreq = Math.pow(10, logLow);
      const highFreq = Math.pow(10, logHigh);
      const centerFreq = Math.sqrt(lowFreq * highFreq);
      
      bands.push({
        index: i,
        lowFreq: lowFreq,
        highFreq: highFreq,
        centerFreq: centerFreq,
        name: this.getFrequencyName(centerFreq)
      });
    }
    
    return bands;
  }
  
  /**
   * Get name for frequency range
   * @param {number} freq - Frequency in Hz
   * @returns {string} - Frequency range name
   */
  getFrequencyName(freq) {
    if (freq < 60) return "Sub Bass";
    if (freq < 250) return "Bass";
    if (freq < 500) return "Low Mids";
    if (freq < 2000) return "Mid Range";
    if (freq < 4000) return "Upper Mids";
    if (freq < 10000) return "Presence";
    return "Air";
  }
  
  /**
   * Create empty phase data matrix
   */
  createEmptyPhaseData() {
    this.phaseData = [];
    
    for (let i = 0; i < this.frequencyBands; i++) {
      this.phaseData[i] = [];
      for (let j = 0; j < this.frequencyBands; j++) {
        this.phaseData[i][j] = 0;
      }
    }
    
    // Initialize band coherence array
    this.bandCoherence = new Array(this.frequencyBands).fill(0);
  }
  
  /**
   * Update with new frequency data
   * @param {Object} metrics - Audio metrics
   */
  updateMetrics(metrics) {
    super.updateMetrics(metrics);
    
    // Only proceed if we have necessary data
    if (!metrics || !metrics.frequencyData || !metrics.timeData) return this;
    
    const freqDataL = metrics.frequencyData.left;
    const freqDataR = metrics.frequencyData.right;
    const timeDataL = metrics.timeData.left;
    const timeDataR = metrics.timeData.right;
    
    if (!freqDataL || !freqDataR || !timeDataL || !timeDataR) return this;
    
    // Add timestamp for this frame
    const timestamp = performance.now();
    this.timeWindows.push({
      timestamp: timestamp,
      timeDataL: [...timeDataL],
      timeDataR: [...timeDataR],
      freqDataL: [...freqDataL],
      freqDataR: [...freqDataR]
    });
    
    // Remove old windows
    while (this.timeWindows.length > 0 && 
           timestamp - this.timeWindows[0].timestamp > this.timeWindow) {
      this.timeWindows.shift();
    }
    
    // Calculate phase relationships
    this.calculatePhaseRelationships();
    
    return this;
  }
  
  /**
   * Calculate phase relationships between frequency bands
   */
  calculatePhaseRelationships() {
    // Need at least a few frames of data
    if (this.timeWindows.length < 3) return;
    
    // Extract complex spectrum from frames
    const complexSpectrumL = this.calculateComplexSpectrum(this.timeWindows.map(w => w.timeDataL));
    const complexSpectrumR = this.calculateComplexSpectrum(this.timeWindows.map(w => w.timeDataR));
    
    // Calculate band-to-band phase relationships
    const newPhaseData = [];
    
    for (let i = 0; i < this.frequencyBands; i++) {
      newPhaseData[i] = [];
      
      for (let j = 0; j < this.frequencyBands; j++) {
        // Calculate cross-channel phase correlation between bands
        const correlation = this.calculateBandPhaseCorrelation(
          complexSpectrumL, complexSpectrumR, i, j
        );
        
        newPhaseData[i][j] = correlation;
      }
    }
    
    // Add to history
    this.phaseHistory.push({
      timestamp: performance.now(),
      data: JSON.parse(JSON.stringify(newPhaseData))
    });
    
    // Keep history limited
    while (this.phaseHistory.length > this.historyLength) {
      this.phaseHistory.shift();
    }
    
    // Smooth phase data (weighted average)
    if (this.phaseHistory.length >= 3) {
      for (let i = 0; i < this.frequencyBands; i++) {
        for (let j = 0; j < this.frequencyBands; j++) {
          // Smooth with history (more weight to recent values)
          let weightedSum = 0;
          let totalWeight = 0;
          
          for (let k = 0; k < this.phaseHistory.length; k++) {
            const weight = Math.pow(1.5, k); // Exponential weighting
            weightedSum += this.phaseHistory[k].data[i][j] * weight;
            totalWeight += weight;
          }
          
          this.phaseData[i][j] = weightedSum / totalWeight;
        }
      }
    } else {
      // Just use latest data if not enough history
      this.phaseData = newPhaseData;
    }
    
    // Calculate phase trends
    this.calculatePhaseTrends();
    
    // Analyze phase issues
    this.analyzePhaseIssues();
  }
  
  /**
   * Calculate complex spectrum from time-domain data
   * @param {Array} timeWindows - Array of time-domain data windows
   * @returns {Array} - Array of complex spectra
   */
  calculateComplexSpectrum(timeWindows) {
    // This would ideally use a real FFT implementation
    // For this prototype, we'll simulate phase data
    
    const spectra = [];
    
    for (let i = 0; i < this.frequencyBands; i++) {
      // Simulate complex spectrum for each band
      const bandSpectrum = {
        magnitude: 0,
        phase: 0
      };
      
      // Calculate average magnitude for this band from latest frame
      const latestFrame = timeWindows[timeWindows.length - 1];
      let sum = 0;
      
      // Get band boundaries in samples
      const bandStart = Math.floor(latestFrame.length * (i / this.frequencyBands));
      const bandEnd = Math.floor(latestFrame.length * ((i + 1) / this.frequencyBands));
      
      // Calculate average magnitude
      for (let j = bandStart; j < bandEnd; j++) {
        sum += Math.abs(latestFrame[j]);
      }
      
      bandSpectrum.magnitude = sum / (bandEnd - bandStart);
      
      // Calculate phase (simulated for prototype)
      // In a real implementation, this would come from the FFT
      bandSpectrum.phase = Math.random() * 2 * Math.PI;
      
      spectra.push(bandSpectrum);
    }
    
    return spectra;
  }
  
  /**
   * Calculate phase correlation between two frequency bands
   * @param {Array} spectrumL - Left channel complex spectrum
   * @param {Array} spectrumR - Right channel complex spectrum
   * @param {number} bandA - First band index
   * @param {number} bandB - Second band index
   * @returns {number} - Phase correlation (-1 to 1)
   */
  calculateBandPhaseCorrelation(spectrumL, spectrumR, bandA, bandB) {
    // In a real implementation, this would calculate proper phase correlation
    // between frequency bands across channels
    
    // For this prototype, simulate meaningful phase relationships
    
    // Same band across channels should have high correlation (unless phase issues)
    if (bandA === bandB) {
      // Simulate some phase correlation issues in certain frequency ranges
      const centerFreq = this.bands[bandA].centerFreq;
      
      if (centerFreq < 100) {
        // Sub-bass usually in phase
        return 0.8 + Math.random() * 0.2;
      } else if (centerFreq > 10000) {
        // High frequencies often have phase variations
        return Math.random() * 0.4 + 0.3;
      } else {
        // Mid-range varies
        return Math.random() * 0.6 + 0.2;
      }
    }
    
    // Harmonically related bands should have some correlation
    const ratio = this.bands[bandB].centerFreq / this.bands[bandA].centerFreq;
    if (Math.abs(ratio - Math.round(ratio)) < 0.1) {
      return Math.random() * 0.3 + 0.3;
    }
    
    // Other relationships have weaker correlation
    return Math.random() * 0.2;
  }
  
  /**
   * Calculate trends in phase relationships
   */
  calculatePhaseTrends() {
    if (this.phaseHistory.length < 5) return;
    
    this.phaseTrends = [];
    
    for (let i = 0; i < this.frequencyBands; i++) {
      this.phaseTrends[i] = [];
      
      for (let j = 0; j < this.frequencyBands; j++) {
        // Extract historical values for this cell
        const values = this.phaseHistory.map(entry => entry.data[i][j]);
        
        // Calculate trend (simple linear regression)
        let sumX = 0;
        let sumY = 0;
        let sumXY = 0;
        let sumXX = 0;
        const n = values.length;
        
        for (let k = 0; k < n; k++) {
          sumX += k;
          sumY += values[k];
          sumXY += k * values[k];
          sumXX += k * k;
        }
        
        // Calculate slope
        const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
        
        this.phaseTrends[i][j] = slope;
      }
    }
  }
  
  /**
   * Analyze phase issues
   */
  analyzePhaseIssues() {
    this.problematicRegions = [];
    
    // Calculate overall coherence
    let coherenceSum = 0;
    let count = 0;
    
    // Calculate per-band coherence
    for (let i = 0; i < this.frequencyBands; i++) {
      let bandSum = 0;
      
      // Phase with itself (diagonal in matrix)
      bandSum += this.phaseData[i][i];
      
      // Phase with harmonically related bands
      for (let j = 0; j < this.frequencyBands; j++) {
        if (i === j) continue;
        
        const ratio = this.bands[j].centerFreq / this.bands[i].centerFreq;
        if (Math.abs(ratio - Math.round(ratio)) < 0.1) {
          bandSum += this.phaseData[i][j];
          count++;
        }
      }
      
      // Store band coherence
      this.bandCoherence[i] = bandSum / (count || 1);
      
      // Add to overall sum
      coherenceSum += this.phaseData[i][i];
    }
    
    // Calculate average
    this.overallCoherence = coherenceSum / this.frequencyBands;
    
    // Find problematic regions (low phase correlation)
    for (let i = 0; i < this.frequencyBands; i++) {
      if (this.phaseData[i][i] < 0.4) {
        this.problematicRegions.push({
          bandIndex: i,
          frequency: this.bands[i].centerFreq,
          correlation: this.phaseData[i][i],
          name: this.bands[i].name
        });
      }
    }
  }
  
  /**
   * Handle mouse move for hover information
   * @param {Object} position - Mouse position
   */
  onMouseMove(position) {
    this.hoveredCell = this.getCellAtPosition(position);
  }
  
  /**
   * Handle mouse down for cell selection
   * @param {Object} position - Mouse position
   */
  onMouseDown(position) {
    this.selectedCell = this.getCellAtPosition(position);
  }
  
  /**
   * Get cell at mouse position
   * @param {Object} position - Mouse position
   * @returns {Object|null} - Cell information or null
   */
  getCellAtPosition(position) {
    const { x, y } = position;
    
    // Calculate grid position
    const gridX = x - this.gridPadding;
    const gridY = y - this.gridPadding;
    
    // Check if outside grid
    if (gridX < 0 || gridY < 0) return null;
    
    // Calculate cell coordinates
    const cellX = Math.floor(gridX / this.cellSize);
    const cellY = Math.floor(gridY / this.cellSize);
    
    // Check if valid cell
    if (cellX >= 0 && cellX < this.frequencyBands && 
        cellY >= 0 && cellY < this.frequencyBands) {
      return {
        x: cellX,
        y: cellY,
        value: this.phaseData[cellY][cellX],
        trend: this.phaseTrends && this.phaseTrends[cellY] ? this.phaseTrends[cellY][cellX] : 0,
        bandX: this.bands[cellX],
        bandY: this.bands[cellY]
      };
    }
    
    return null;
  }
  
  /**
   * Create gradients for visualization
   */
  createGradients() {
    if (!this.theme) return;
    
    // Create correlation gradient
    this.correlationGradient = this.ctx.createLinearGradient(0, 0, 0, 20);
    this.correlationGradient.addColorStop(0, '#ff3366'); // Low correlation (red)
    this.correlationGradient.addColorStop(0.5, '#ffcc00'); // Medium correlation (yellow)
    this.correlationGradient.addColorStop(1, '#00ffff');   // High correlation (cyan)
  }
  
  /**
   * Render phase coherence heatmap
   */
  render() {
    if (!this.shouldRender()) return this;
    
    // Update animations
    this.updateAnimations();
    
    // Clear canvas
    this.clear();
    
    // Draw background
    this.drawBackground();
    
    // Draw heatmap grid
    this.drawHeatmapGrid();
    
    // Draw axes labels
    this.drawAxesLabels();
    
    // Draw phase coherence metrics
    this.drawCoherenceMetrics();
    
    // Draw hover info
    if (this.hoveredCell) {
      this.drawCellTooltip(this.hoveredCell);
    }
    
    // Draw selected cell detail
    if (this.selectedCell) {
      this.drawSelectedCellDetail(this.selectedCell);
    }
    
    return this;
  }
  
  /**
   * Draw heatmap grid
   */
  drawHeatmapGrid() {
    // Calculate grid dimensions
    const gridSize = this.cellSize * this.frequencyBands;
    
    // Draw grid background
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    this.ctx.fillRect(
      this.gridPadding, 
      this.gridPadding, 
      gridSize, 
      gridSize
    );
    
    // Draw cells
    for (let i = 0; i < this.frequencyBands; i++) {
      for (let j = 0; j < this.frequencyBands; j++) {
        const x = this.gridPadding + j * this.cellSize;
        const y = this.gridPadding + i * this.cellSize;
        
        // Get correlation value
        const value = this.phaseData[i][j];
        
        // Get cell color
        const color = this.getCorrelationColor(value);
        
        // Draw cell
        this.ctx.fillStyle = color;
        this.ctx.fillRect(
          x, 
          y, 
          this.cellSize, 
          this.cellSize
        );
        
        // Draw cell border
        this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(
          x, 
          y, 
          this.cellSize, 
          this.cellSize
        );
        
        // Highlight diagonal (same frequency across channels)
        if (i === j) {
          this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
          this.ctx.lineWidth = 2;
          this.ctx.strokeRect(
            x + 1, 
            y + 1, 
            this.cellSize - 2, 
            this.cellSize - 2
          );
        }
      }
    }
    
    // Draw grid border
    this.ctx.strokeStyle = this.theme.primary;
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(
      this.gridPadding, 
      this.gridPadding, 
      gridSize, 
      gridSize
    );
    
    // Highlight hovered cell
    if (this.hoveredCell) {
      const x = this.gridPadding + this.hoveredCell.x * this.cellSize;
      const y = this.gridPadding + this.hoveredCell.y * this.cellSize;
      
      this.ctx.strokeStyle = 'white';
      this.ctx.lineWidth = 2;
      this.ctx.strokeRect(
        x, 
        y, 
        this.cellSize, 
        this.cellSize
      );
    }
    
    // Highlight selected cell
    if (this.selectedCell) {
      const x = this.gridPadding + this.selectedCell.x * this.cellSize;
      const y = this.gridPadding + this.selectedCell.y * this.cellSize;
      
      this.ctx.strokeStyle = this.theme.secondary;
      this.ctx.lineWidth = 3;
      this.ctx.strokeRect(
        x - 1, 
        y - 1, 
        this.cellSize + 2, 
        this.cellSize + 2
      );
    }
  }
  
  /**
   * Draw axes labels
   */
  drawAxesLabels() {
    // Draw vertical labels (rows)
    this.ctx.fillStyle = this.theme.foreground;
    this.ctx.font = '10px Arial';
    this.ctx.textAlign = 'right';
    this.ctx.textBaseline = 'middle';
    
    for (let i = 0; i < this.frequencyBands; i += 2) {
      const y = this.gridPadding + i * this.cellSize + this.cellSize / 2;
      const freq = Math.round(this.bands[i].centerFreq);
      
      let label = freq.toString();
      if (freq >= 1000) {
        label = (freq / 1000) + 'k';
      }
      
      this.ctx.fillText(label + 'Hz', this.gridPadding - 5, y);
    }
    
    // Draw horizontal labels (columns)
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'top';
    
    for (let i = 0; i < this.frequencyBands; i += 2) {
      const x = this.gridPadding + i * this.cellSize + this.cellSize / 2;
      const freq = Math.round(this.bands[i].centerFreq);
      
      let label = freq.toString();
      if (freq >= 1000) {
        label = (freq / 1000) + 'k';
      }
      
      this.ctx.fillText(label, x, this.gridPadding - 15);
    }
    
    // Draw axis titles
    this.ctx.font = 'bold 12px Arial';
    this.ctx.fillStyle = this.theme.primary;
    
    // Vertical axis
    this.ctx.save();
    this.ctx.translate(20, this.gridPadding + (this.cellSize * this.frequencyBands) / 2);
    this.ctx.rotate(-Math.PI / 2);
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText('Frequency Band', 0, 0);
    this.ctx.restore();
    
    // Horizontal axis
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(
      'Frequency Band', 
      this.gridPadding + (this.cellSize * this.frequencyBands) / 2,
      this.gridPadding + this.cellSize * this.frequencyBands + 20
    );
    
    // Draw legend
    this.drawColorLegend();
  }
  
  /**
   * Draw color legend
   */
  drawColorLegend() {
    const legendWidth = 200;
    const legendHeight = 20;
    const x = this.width - legendWidth - 20;
    const y = 20;
    
    // Draw legend background
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(x, y, legendWidth, legendHeight + 30);
    
    // Draw gradient
    const gradient = this.ctx.createLinearGradient(x, y, x + legendWidth, y);
    gradient.addColorStop(0, this.getCorrelationColor(0));
    gradient.addColorStop(0.5, this.getCorrelationColor(0.5));
    gradient.addColorStop(1, this.getCorrelationColor(1));
    
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(x, y, legendWidth, legendHeight);
    
    // Draw labels
    this.ctx.fillStyle = this.theme.foreground;
    this.ctx.font = '10px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.textBaseline = 'top';
    
    this.ctx.fillText('Phase Correlation', x, y + legendHeight + 5);
    
    this.ctx.textAlign = 'left';
    this.ctx.fillText('Poor', x, y + legendHeight + 20);
    
    this.ctx.textAlign = 'center';
    this.ctx.fillText('Moderate', x + legendWidth / 2, y + legendHeight + 20);
    
    this.ctx.textAlign = 'right';
    this.ctx.fillText('Good', x + legendWidth, y + legendHeight + 20);
  }
  
  /**
   * Draw phase coherence metrics
   */
  drawCoherenceMetrics() {
    const panelWidth = 200;
    const panelHeight = 150;
    const x = 20;
    const y = this.gridPadding + this.cellSize * this.frequencyBands + 40;
    
    // Draw panel background
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(x, y, panelWidth, panelHeight);
    this.ctx.strokeStyle = this.theme.primary;
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(x, y, panelWidth, panelHeight);
    
    // Draw panel title
    this.ctx.fillStyle = this.theme.primary;
    this.ctx.font = 'bold 14px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.textBaseline = 'top';
    this.ctx.fillText('Phase Coherence Analysis', x + 10, y + 10);
    
    // Draw overall coherence
    this.ctx.fillStyle = this.theme.foreground;
    this.ctx.font = '12px Arial';
    this.ctx.fillText(`Overall Coherence: ${(this.overallCoherence * 100).toFixed(1)}%`, x + 10, y + 35);
    
    // Draw problematic regions
    this.ctx.fillText(`Problematic Regions: ${this.problematicRegions.length}`, x + 10, y + 55);
    
    let yOffset = y + 75;
    for (let i = 0; i < Math.min(this.problematicRegions.length, 3); i++) {
      const region = this.problematicRegions[i];
      const freqText = region.frequency < 1000 ? 
        `${Math.round(region.frequency)}Hz` : 
        `${(region.frequency / 1000).toFixed(1)}kHz`;
      
      this.ctx.fillText(
        `${region.name} (${freqText}): ${(region.correlation * 100).toFixed(1)}%`,
        x + 20,
        yOffset
      );
      
      yOffset += 20;
    }
    
    // Draw recommendations
    if (this.problematicRegions.length > 0) {
      this.ctx.fillStyle = this.theme.secondary;
      this.ctx.fillText('Recommendations:', x + 10, y + 115);
      this.ctx.fillText('Check stereo balance and phase alignment', x + 10, y + 135);
      
      if (this.problematicRegions.some(r => r.frequency < 100)) {
        this.ctx.fillText('Consider monitoring sub-bass in mono', x + 10, y + 135);
      }
    } else {
      this.ctx.fillStyle = this.theme.tertiary;
      this.ctx.fillText('Phase correlation looks good!', x + 10, y + 115);
    }
  }
  
  /**
   * Draw tooltip for hovered cell
   * @param {Object} cell - Cell information
   */
  drawCellTooltip(cell) {
    if (!this.showTooltip) return;
    
    const tooltipWidth = 180;
    const tooltipHeight = 80;
    
    // Calculate position
    const cellX = this.gridPadding + cell.x * this.cellSize;
    const cellY = this.gridPadding + cell.y * this.cellSize;
    
    let x = cellX + this.cellSize + 10;
    let y = cellY;
    
    // Adjust if off-screen
    if (x + tooltipWidth > this.width) {
      x = cellX - tooltipWidth - 10;
    }
    
    if (y + tooltipHeight > this.height) {
      y = this.height - tooltipHeight - 10;
    }
    
    // Draw tooltip background
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    this.ctx.fillRect(x, y, tooltipWidth, tooltipHeight);
    this.ctx.strokeStyle = this.getCorrelationColor(cell.value);
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(x, y, tooltipWidth, tooltipHeight);
    
    // Draw tooltip content
    this.ctx.fillStyle = this.theme.foreground;
    this.ctx.font = '12px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.textBaseline = 'top';
    
    // Format frequency values
    const freq1 = cell.bandX.centerFreq < 1000 ? 
      `${Math.round(cell.bandX.centerFreq)}Hz` : 
      `${(cell.bandX.centerFreq / 1000).toFixed(1)}kHz`;
    
    const freq2 = cell.bandY.centerFreq < 1000 ? 
      `${Math.round(cell.bandY.centerFreq)}Hz` : 
      `${(cell.bandY.centerFreq / 1000).toFixed(1)}kHz`;
    
    // Draw relationship info
    this.ctx.fillText(`${freq1} ↔ ${freq2}`, x + 10, y + 10);
    this.ctx.fillText(`Correlation: ${(cell.value * 100).toFixed(1)}%`, x + 10, y + 30);
    
    // Draw trend info
    const trendText = cell.trend > 0.01 ? 'Improving' : 
                   (cell.trend < -0.01 ? 'Degrading' : 'Stable');
    
    this.ctx.fillText(`Trend: ${trendText}`, x + 10, y + 50);
  }
  
  /**
   * Draw detailed view for selected cell
   * @param {Object} cell - Cell information
   */
  drawSelectedCellDetail(cell) {
    const detailWidth = 250;
    const detailHeight = 200;
    const x = this.width - detailWidth - 20;
    const y = this.height - detailHeight - 20;
    
    // Draw detail background
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    this.ctx.fillRect(x, y, detailWidth, detailHeight);
    this.ctx.strokeStyle = this.theme.secondary;
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(x, y, detailWidth, detailHeight);
    
    // Draw detail title
    this.ctx.fillStyle = this.theme.secondary;
    this.ctx.font = 'bold 14px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.textBaseline = 'top';
    
    // Format frequency values
    const freq1 = cell.bandX.centerFreq < 1000 ? 
      `${Math.round(cell.bandX.centerFreq)}Hz` : 
      `${(cell.bandX.centerFreq / 1000).toFixed(1)}kHz`;
    
    const freq2 = cell.bandY.centerFreq < 1000 ? 
      `${Math.round(cell.bandY.centerFreq)}Hz` : 
      `${(cell.bandY.centerFreq / 1000).toFixed(1)}kHz`;
    
    this.ctx.fillText(`Phase Relationship: ${freq1} ↔ ${freq2}`, x + 10, y + 10);
    
    // Draw detail info
    this.ctx.fillStyle = this.theme.foreground;
    this.ctx.font = '12px Arial';
    
    // Band information
    this.ctx.fillText(`Band X: ${cell.bandX.name} (${freq1})`, x + 10, y + 35);
    this.ctx.fillText(`Band Y: ${cell.bandY.name} (${freq2})`, x + 10, y + 55);
    
    // Correlation value
    this.ctx.fillText(`Current Correlation: ${(cell.value * 100).toFixed(1)}%`, x + 10, y + 80);
    
    // Check if bands are harmonically related
    const ratio = cell.bandY.centerFreq / cell.bandX.centerFreq;
    const isHarmonic = Math.abs(ratio - Math.round(ratio)) < 0.1;
    
    if (isHarmonic) {
      this.ctx.fillText(`Harmonic Relationship: ${Math.round(ratio)}:1`, x + 10, y + 100);
    } else {
      this.ctx.fillText('Not harmonically related', x + 10, y + 100);
    }
    
    // Draw correlation history if available
    if (this.phaseHistory.length > 1) {
      this.drawCorrelationHistory(cell, x + 10, y + 120, detailWidth - 20, 70);
    }
  }
  
  /**
   * Draw correlation history for selected cell
   * @param {Object} cell - Cell information
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} width - Graph width
   * @param {number} height - Graph height
   */
  drawCorrelationHistory(cell, x, y, width, height) {
    // Draw graph background
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    this.ctx.fillRect(x, y, width, height);
    
    // Get history values for this cell
    const values = this.phaseHistory.map(entry => entry.data[cell.y][cell.x]);
    
    // Draw grid
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    this.ctx.lineWidth = 1;
    
    // Horizontal grid lines
    for (let i = 0; i <= 4; i++) {
      const gridY = y + height * (1 - i / 4);
      
      this.ctx.beginPath();
      this.ctx.moveTo(x, gridY);
      this.ctx.lineTo(x + width, gridY);
      this.ctx.stroke();
      
      // Draw labels
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      this.ctx.textAlign = 'right';
      this.ctx.textBaseline = 'middle';
      this.ctx.font = '9px Arial';
      this.ctx.fillText(`${i * 25}%`, x - 5, gridY);
    }
    
    // Draw history line
    this.ctx.beginPath();
    this.ctx.moveTo(x, y + height * (1 - values[0]));
    
    for (let i = 1; i < values.length; i++) {
      const pointX = x + (i / (values.length - 1)) * width;
      const pointY = y + height * (1 - values[i]);
      
      this.ctx.lineTo(pointX, pointY);
    }
    
    this.ctx.strokeStyle = this.theme.tertiary;
    this.ctx.lineWidth = 2;
    this.ctx.stroke();
    
    // Draw graph title
    this.ctx.fillStyle = this.theme.tertiary;
    this.ctx.textAlign = 'left';
    this.ctx.textBaseline = 'top';
    this.ctx.font = '10px Arial';
    this.ctx.fillText('Correlation History', x, y - 15);
  }
  
  /**
   * Get color for correlation value
   * @param {number} value - Correlation value (0-1)
   * @returns {string} - CSS color
   */
  getCorrelationColor(value) {
    // Red for low correlation, yellow for medium, green/cyan for high
    if (value < 0.3) {
      // Poor correlation: red to orange
      const r = 255;
      const g = Math.round(value * 3 * 255);
      const b = 0;
      return `rgb(${r}, ${g}, ${b})`;
    } else if (value < 0.7) {
      // Medium correlation: orange to yellow to green
      const normalized = (value - 0.3) / 0.4;
      const r = Math.round(255 * (1 - normalized * 0.7));
      const g = Math.round(192 + normalized * 63);
      const b = Math.round(normalized * 255);
      return `rgb(${r}, ${g}, ${b})`;
    } else {
      // Good correlation: green to cyan
      const normalized = (value - 0.7) / 0.3;
      const r = 0;
      const g = Math.round(255);
      const b = Math.round(normalized * 255);
      return `rgb(${r}, ${g}, ${b})`;
    }
  }
}
