/**
 * SpectralMigrationAnalyzer - Visualizes how frequency content evolves over time
 * Shows the "journey" of sound rather than static measurements
 */
class SpectralMigrationAnalyzer extends BaseCanvasController {
  constructor(canvasId, options = {}) {
    super(canvasId, options);
    
    // Migration options
    this.historyLength = options.historyLength || 200;
    this.frequencyBands = options.frequencyBands || 30;
    this.minFreq = options.minFreq || 20;
    this.maxFreq = options.maxFreq || 20000;
    this.minDb = options.minDb || -70;
    this.maxDb = options.maxDb || 0;
    this.logScale = options.logScale !== undefined ? options.logScale : true;
    
    // Visualization options
    this.showLabels = options.showLabels !== undefined ? options.showLabels : true;
    this.showControlPoints = options.showControlPoints !== undefined ? options.showControlPoints : false;
    this.flowIntensity = options.flowIntensity || 0.8;
    this.flowOpacity = options.flowOpacity || 0.7;
    this.lineWidth = options.lineWidth || 2;
    
    // Migration data structures
    this.spectrumHistory = [];
    this.flowLines = [];
    this.bandCenters = [];
    this.controlPoints = [];
    this.emergingFrequencies = [];
    this.fadingFrequencies = [];
    this.stableFrequencies = [];
    
    // Analysis metrics
    this.spectralFluidity = 0;
    this.spectralDensity = 0;
    this.spectralCenterOfMass = 0;
    this.spectralEntropyHistory = [];
    
    // Map for frequency ranges to common names
    this.frequencyRangeNames = [
      { min: 20, max: 60, name: "Sub Bass" },
      { min: 60, max: 250, name: "Bass" },
      { min: 250, max: 500, name: "Low Mids" },
      { min: 500, max: 2000, name: "Mid Range" },
      { min: 2000, max: 4000, name: "Upper Mids" },
      { min: 4000, max: 10000, name: "Presence" },
      { min: 10000, max: 20000, name: "Air" }
    ];
    
    // Generate frequency bands
    this.generateFrequencyBands();
    
    // Animation properties
    this.flowAnimations = [];
  }
  
  /**
   * Generate logarithmically spaced frequency bands
   */
  generateFrequencyBands() {
    this.bandCenters = [];
    
    // Create logarithmically spaced bands
    const logMin = Math.log10(this.minFreq);
    const logMax = Math.log10(this.maxFreq);
    const step = (logMax - logMin) / (this.frequencyBands - 1);
    
    for (let i = 0; i < this.frequencyBands; i++) {
      const logFreq = logMin + step * i;
      const freq = Math.pow(10, logFreq);
      
      this.bandCenters.push({
        frequency: freq,
        name: this.getFrequencyName(freq),
        index: i,
        energy: 0,
        history: []
      });
    }
  }
  
  /**
   * Get name for frequency range
   * @param {number} freq - Frequency in Hz
   * @returns {string} - Frequency range name
   */
  getFrequencyName(freq) {
    for (const range of this.frequencyRangeNames) {
      if (freq >= range.min && freq <= range.max) {
        return range.name;
      }
    }
    return "Unknown";
  }
  
  /**
   * Create gradients for visualization
   */
  createGradients() {
    if (!this.theme) return;
    
    // Create flow gradient
    this.flowGradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
    this.flowGradient.addColorStop(0, this.theme.secondary);
    this.flowGradient.addColorStop(0.5, this.theme.primary);
    this.flowGradient.addColorStop(1, this.theme.tertiary);
  }
  
  /**
   * Update with new frequency data
   * @param {Object} metrics - Audio metrics
   */
  updateMetrics(metrics) {
    super.updateMetrics(metrics);
    
    // Only proceed if we have spectrum data
    if (!metrics || !metrics.frequencyData) return this;
    
    // Get latest frequency data
    const freqDataL = metrics.frequencyData.left;
    const freqDataR = metrics.frequencyData.right;
    
    if (!freqDataL || !freqDataR) return this;
    
    // Calculate energy for each frequency band
    const bandEnergies = this.calculateBandEnergies(freqDataL, freqDataR);
    
    // Add to history
    this.spectrumHistory.push({
      time: performance.now(),
      energies: [...bandEnergies]
    });
    
    // Keep history limited
    if (this.spectrumHistory.length > this.historyLength) {
      this.spectrumHistory.shift();
    }
    
    // Update band energy values
    for (let i = 0; i < this.bandCenters.length; i++) {
      // Smooth energy transitions
      this.bandCenters[i].energy = this.bandCenters[i].energy * 0.7 + bandEnergies[i] * 0.3;
      
      // Add to band history
      this.bandCenters[i].history.push(this.bandCenters[i].energy);
      
      // Keep history limited
      if (this.bandCenters[i].history.length > this.historyLength) {
        this.bandCenters[i].history.shift();
      }
    }
    
    // Analyze spectral migration
    this.analyzeSpectralMigration();
    
    // Generate flow lines
    this.generateFlowLines();
    
    return this;
  }
  
  /**
   * Calculate energy in each frequency band
   * @param {Float32Array} freqDataL - Left channel frequency data
   * @param {Float32Array} freqDataR - Right channel frequency data
   * @returns {Array} - Band energy values
   */
  calculateBandEnergies(freqDataL, freqDataR) {
    const energies = new Array(this.frequencyBands).fill(0);
    const fftSize = freqDataL.length * 2; // Assuming this is the analyzer's fftSize/2
    const sampleRate = 44100; // Assuming standard sample rate
    
    // For each frequency bin, add its energy to the appropriate band
    for (let i = 0; i < freqDataL.length; i++) {
      // Calculate the frequency of this bin
      const frequency = i * sampleRate / fftSize;
      
      // Find which band this frequency belongs to
      const bandIndex = this.findBandIndex(frequency);
      
      if (bandIndex >= 0) {
        // Convert from dB to linear scale and calculate magnitude
        const magnitudeL = Math.pow(10, freqDataL[i] / 20);
        const magnitudeR = Math.pow(10, freqDataR[i] / 20);
        
        // Average the channels and add to band energy
        const magnitude = (magnitudeL + magnitudeR) / 2;
        energies[bandIndex] += magnitude;
      }
    }
    
    // Normalize energies to 0-1 range
    const maxEnergy = Math.max(...energies, 0.0001);
    for (let i = 0; i < energies.length; i++) {
      energies[i] /= maxEnergy;
    }
    
    return energies;
  }
  
  /**
   * Find which band a frequency belongs to
   * @param {number} frequency - Frequency in Hz
   * @returns {number} - Band index or -1 if not found
   */
  findBandIndex(frequency) {
    if (frequency < this.minFreq || frequency > this.maxFreq) {
      return -1;
    }
    
    // For logarithmic scale
    if (this.logScale) {
      const logFreq = Math.log10(frequency);
      const logMin = Math.log10(this.minFreq);
      const logMax = Math.log10(this.maxFreq);
      const logRange = logMax - logMin;
      
      const normalizedPos = (logFreq - logMin) / logRange;
      const bandIndex = Math.floor(normalizedPos * this.frequencyBands);
      
      return Math.max(0, Math.min(this.frequencyBands - 1, bandIndex));
    } 
    // For linear scale
    else {
      const normalizedPos = (frequency - this.minFreq) / (this.maxFreq - this.minFreq);
      const bandIndex = Math.floor(normalizedPos * this.frequencyBands);
      
      return Math.max(0, Math.min(this.frequencyBands - 1, bandIndex));
    }
  }
  
  /**
   * Analyze spectral migration patterns
   */
  analyzeSpectralMigration() {
    // Need at least 10 frames of history for meaningful analysis
    if (this.spectrumHistory.length < 10) return;
    
    // Clear previous analysis results
    this.emergingFrequencies = [];
    this.fadingFrequencies = [];
    this.stableFrequencies = [];
    this.controlPoints = [];
    
    // Calculate spectral entropy to measure frequency distribution
    const currentSpectrum = this.spectrumHistory[this.spectrumHistory.length - 1].energies;
    const spectralEntropy = this.calculateSpectralEntropy(currentSpectrum);
    
    this.spectralEntropyHistory.push(spectralEntropy);
    if (this.spectralEntropyHistory.length > 30) {
      this.spectralEntropyHistory.shift();
    }
    
    // Calculate spectral fluidity by analyzing entropy changes
    this.spectralFluidity = this.calculateSpectralFluidity();
    
    // Calculate spectral density
    this.spectralDensity = currentSpectrum.filter(energy => energy > 0.1).length / this.frequencyBands;
    
    // Calculate spectral center of mass
    this.spectralCenterOfMass = this.calculateSpectralCenterOfMass(currentSpectrum);
    
    // Analyze each frequency band for energy trends
    for (let i = 0; i < this.bandCenters.length; i++) {
      const band = this.bandCenters[i];
      
      // Need sufficient history for this band
      if (band.history.length < 10) continue;
      
      // Get recent history for trend analysis
      const recentHistory = band.history.slice(-10);
      
      // Calculate trend (slope of energy change)
      const trend = this.calculateTrend(recentHistory);
      
      // Calculate volatility
      const volatility = this.calculateVolatility(recentHistory);
      
      // Classify frequency bands based on behavior
      
      // Emerging frequencies (growing energy)
      if (trend > 0.1 && band.energy > 0.2) {
        this.emergingFrequencies.push({
          bandIndex: i,
          trend: trend,
          energy: band.energy
        });
      } 
      // Fading frequencies (declining energy)
      else if (trend < -0.1 && band.history.slice(-11, -1).some(e => e > 0.4)) {
        this.fadingFrequencies.push({
          bandIndex: i,
          trend: trend,
          energy: band.energy
        });
      }
      // Stable significant frequencies (consistent energy)
      else if (Math.abs(trend) < 0.05 && volatility < 0.1 && band.energy > 0.3) {
        this.stableFrequencies.push({
          bandIndex: i,
          volatility: volatility,
          energy: band.energy
        });
      }
      
      // Create control points for frequency band flow visualization
      this.createControlPoints(i, trend, volatility);
    }
  }
  
  /**
   * Calculate spectral entropy
   * @param {Array} spectrum - Array of spectrum energies
   * @returns {number} - Spectral entropy (0-1)
   */
  calculateSpectralEntropy(spectrum) {
    // Normalize spectrum to sum to 1 (make it a probability distribution)
    const sum = spectrum.reduce((acc, val) => acc + val, 0);
    if (sum === 0) return 0;
    
    const normalizedSpectrum = spectrum.map(val => val / sum);
    
    // Calculate entropy: -sum(p_i * log(p_i))
    let entropy = 0;
    for (const p of normalizedSpectrum) {
      if (p > 0) {
        entropy -= p * Math.log2(p);
      }
    }
    
    // Normalize to 0-1 range (divide by log2(n))
    return entropy / Math.log2(spectrum.length);
  }
  
  /**
   * Calculate spectral fluidity based on entropy changes
   * @returns {number} - Fluidity measure (0-1)
   */
  calculateSpectralFluidity() {
    if (this.spectralEntropyHistory.length < 5) return 0;
    
    // Calculate average rate of change in entropy
    let totalChange = 0;
    for (let i = 1; i < this.spectralEntropyHistory.length; i++) {
      totalChange += Math.abs(this.spectralEntropyHistory[i] - this.spectralEntropyHistory[i-1]);
    }
    
    const avgChange = totalChange / (this.spectralEntropyHistory.length - 1);
    
    // Scale to 0-1 range
    return Math.min(1, avgChange * 10);
  }
  
  /**
   * Calculate spectral center of mass
   * @param {Array} spectrum - Array of spectrum energies
   * @returns {number} - Center of mass as band index
   */
  calculateSpectralCenterOfMass(spectrum) {
    let weightedSum = 0;
    let totalWeight = 0;
    
    for (let i = 0; i < spectrum.length; i++) {
      weightedSum += i * spectrum[i];
      totalWeight += spectrum[i];
    }
    
    if (totalWeight === 0) return spectrum.length / 2;
    
    return weightedSum / totalWeight;
  }
  
  /**
   * Calculate linear trend in values
   * @param {Array} values - Array of values
   * @returns {number} - Trend value (positive = increasing, negative = decreasing)
   */
  calculateTrend(values) {
    if (values.length < 2) return 0;
    
    // Simple linear regression
    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumXX = 0;
    const n = values.length;
    
    for (let i = 0; i < n; i++) {
      sumX += i;
      sumY += values[i];
      sumXY += i * values[i];
      sumXX += i * i;
    }
    
    // Calculate slope
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    
    return slope;
  }
  
  /**
   * Calculate volatility (variance) in values
   * @param {Array} values - Array of values
   * @returns {number} - Volatility measure
   */
  calculateVolatility(values) {
    if (values.length < 2) return 0;
    
    // Calculate mean
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    
    // Calculate variance
    const variance = values.reduce((sum, val) => sum + (val - mean) * (val - mean), 0) / values.length;
    
    return Math.sqrt(variance);
  }
  
  /**
   * Create control points for flow visualization
   * @param {number} bandIndex - Frequency band index
   * @param {number} trend - Energy trend
   * @param {number} volatility - Energy volatility
   */
  createControlPoints(bandIndex, trend, volatility) {
    const band = this.bandCenters[bandIndex];
    
    // Only create control points for bands with significant energy
    if (band.energy < 0.1) return;
    
    // Calculate y-position for this frequency band
    const y = this.getFrequencyY(band.frequency);
    
    // Create control point
    const controlPoint = {
      bandIndex: bandIndex,
      frequency: band.frequency,
      x: this.width * 0.8, // Place control points near right edge
      y: y,
      strength: band.energy,
      trend: trend,
      volatility: volatility,
      color: this.getColorForFrequency(band.frequency, band.energy)
    };
    
    this.controlPoints.push(controlPoint);
  }
  
  /**
   * Generate flow lines based on spectral migration
   */
  generateFlowLines() {
    // Clear previous flow lines
    this.flowLines = [];
    
    // Need control points for flow lines
    if (this.controlPoints.length === 0) return;
    
    // Generate flow lines for each control point
    for (const point of this.controlPoints) {
      // Skip weak control points
      if (point.strength < 0.2) continue;
      
      // Create flow line
      const flowLine = {
        points: this.generateFlowCurve(point),
        color: point.color,
        strength: point.strength,
        trend: point.trend,
        frequency: point.frequency,
        bandIndex: point.bandIndex,
        animation: Math.random() // Random phase for animation
      };
      
      this.flowLines.push(flowLine);
    }
  }
  
  /**
   * Generate flow curve points for visualization
   * @param {Object} controlPoint - Control point for flow generation
   * @returns {Array} - Array of curve points
   */
  generateFlowCurve(controlPoint) {
    const points = [];
    const steps = 50;
    
    // Start point at right edge
    const startX = this.width;
    const startY = controlPoint.y;
    
    // End point based on frequency trend
    let endX, endY;
    
    // For emerging frequencies, flow from left to right
    if (controlPoint.trend > 0.05) {
      endX = controlPoint.x - this.width * 0.7;
      endY = this.getFrequencyY(controlPoint.frequency * (0.8 + Math.random() * 0.4));
    } 
    // For fading frequencies, flow to bottom or top
    else if (controlPoint.trend < -0.05) {
      endX = controlPoint.x - this.width * 0.5 * Math.random();
      endY = Math.random() < 0.5 ? 0 : this.height;
    }
    // For stable frequencies, flow horizontally
    else {
      endX = 0;
      endY = controlPoint.y + (Math.random() - 0.5) * this.height * 0.1;
    }
    
    // Add volatility-based randomness
    const volatilityFactor = Math.min(1, controlPoint.volatility * 10);
    const randomOffsetY = (Math.random() - 0.5) * this.height * 0.2 * volatilityFactor;
    endY += randomOffsetY;
    
    // Generate control points for cubic Bezier curve
    const cp1x = startX - (startX - endX) * 0.3;
    const cp1y = startY;
    const cp2x = endX + (startX - endX) * 0.1;
    const cp2y = endY;
    
    // Generate curve points
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const point = this.cubicBezier(startX, startY, cp1x, cp1y, cp2x, cp2y, endX, endY, t);
      points.push(point);
    }
    
    return points;
  }
  
  /**
   * Calculate cubic Bezier curve point
   * @param {number} x0 - Start X
   * @param {number} y0 - Start Y
   * @param {number} x1 - Control point 1 X
   * @param {number} y1 - Control point 1 Y
   * @param {number} x2 - Control point 2 X
   * @param {number} y2 - Control point 2 Y
   * @param {number} x3 - End X
   * @param {number} y3 - End Y
   * @param {number} t - Curve parameter (0-1)
   * @returns {Object} - {x, y} coordinates
   */
  cubicBezier(x0, y0, x1, y1, x2, y2, x3, y3, t) {
    const cx = 3 * (x1 - x0);
    const bx = 3 * (x2 - x1) - cx;
    const ax = x3 - x0 - cx - bx;
    
    const cy = 3 * (y1 - y0);
    const by = 3 * (y2 - y1) - cy;
    const ay = y3 - y0 - cy - by;
    
    const tSquared = t * t;
    const tCubed = tSquared * t;
    
    const x = ax * tCubed + bx * tSquared + cx * t + x0;
    const y = ay * tCubed + by * tSquared + cy * t + y0;
    
    return { x, y };
  }
  
  /**
   * Get Y coordinate for frequency
   * @param {number} frequency - Frequency in Hz
   * @returns {number} - Y coordinate
   */
  getFrequencyY(frequency) {
    if (this.logScale) {
      const logFreq = Math.log10(frequency);
      const logMin = Math.log10(this.minFreq);
      const logMax = Math.log10(this.maxFreq);
      
      // Map logarithmically from bottom to top (higher frequencies at top)
      return this.height - (logFreq - logMin) / (logMax - logMin) * this.height;
    } else {
      // Linear mapping
      return this.height - (frequency - this.minFreq) / (this.maxFreq - this.minFreq) * this.height;
    }
  }
  
  /**
   * Get color for frequency visualization
   * @param {number} frequency - Frequency in Hz
   * @param {number} energy - Energy level (0-1)
   * @returns {string} - CSS color
   */
  getColorForFrequency(frequency, energy) {
    // Map frequency to hue (low=red, high=blue)
    const logMin = Math.log10(this.minFreq);
    const logMax = Math.log10(this.maxFreq);
    const logFreq = Math.log10(frequency);
    
    // Normalize to 0-1 range
    const normalizedFreq = (logFreq - logMin) / (logMax - logMin);
    
    // Map to hue (0-360)
    const hue = 240 - normalizedFreq * 240; // High frequencies are blue (240), low are red (0)
    
    // Use energy for brightness
    const brightness = 30 + energy * 70;
    
    return `hsl(${hue}, 100%, ${brightness}%)`;
  }
  
  /**
   * Render spectral migration visualization
   */
  render() {
    if (!this.shouldRender()) return this;
    
    // Update animations
    this.updateAnimations();
    
    // Clear canvas
    this.clear();
    
    // Draw background
    this.drawBackground();
    
    // Draw frequency axis
    this.drawFrequencyAxis();
    
    // Draw flow lines
    this.drawFlowLines();
    
    // Draw control points if enabled
    if (this.showControlPoints) {
      this.drawControlPoints();
    }
    
    // Draw spectral metrics panel
    this.drawSpectralMetricsPanel();
    
    // Draw legend for frequency migrations
    this.drawFrequencyMigrationLegend();
    
    return this;
  }
  
  /**
   * Draw frequency axis on the right side
   */
  drawFrequencyAxis() {
    const axisWidth = 50;
    const axisX = this.width - axisWidth;
    
    // Draw axis background
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    this.ctx.fillRect(axisX, 0, axisWidth, this.height);
    
    // Draw axis line
    this.ctx.strokeStyle = this.theme.gridLines;
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    this.ctx.moveTo(axisX, 0);
    this.ctx.lineTo(axisX, this.height);
    this.ctx.stroke();
    
    // Draw frequency labels
    this.ctx.fillStyle = this.theme.foreground;
    this.ctx.font = '10px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.textBaseline = 'middle';
    
    // Draw standard frequency markers
    const frequencies = [20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000];
    
    for (const freq of frequencies) {
      const y = this.getFrequencyY(freq);
      
      // Draw tick
      this.ctx.beginPath();
      this.ctx.moveTo(axisX, y);
      this.ctx.lineTo(axisX + 5, y);
      this.ctx.stroke();
      
      // Draw label
      let label = freq.toString();
      if (freq >= 1000) {
        label = (freq / 1000) + 'k';
      }
      
      this.ctx.fillText(label + 'Hz', axisX + 8, y);
    }
    
    // Draw frequency range bands
    for (const range of this.frequencyRangeNames) {
      const y1 = this.getFrequencyY(range.min);
      const y2 = this.getFrequencyY(range.max);
      const height = y1 - y2;
      
      // Draw range background
      this.ctx.fillStyle = `rgba(${Math.random() * 50 + 100}, ${Math.random() * 50 + 100}, ${Math.random() * 50 + 150}, 0.1)`;
      this.ctx.fillRect(0, y2, axisX, height);
      
      // Draw range name
      this.ctx.save();
      this.ctx.translate(axisX - 15, y2 + height / 2);
      this.ctx.rotate(-Math.PI / 2);
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      this.ctx.textAlign = 'center';
      this.ctx.font = '11px Arial';
      this.ctx.fillText(range.name, 0, 0);
      this.ctx.restore();
    }
  }
  
  /**
   * Draw flow lines representing spectral migration
   */
  drawFlowLines() {
    const time = performance.now() / 1000;
    
    // Draw from weaker to stronger flows to ensure stronger ones are more visible
    const sortedFlowLines = [...this.flowLines].sort((a, b) => a.strength - b.strength);
    
    for (const flow of sortedFlowLines) {
      // Animate flow position based on time and flow properties
      const animationPhase = (time * this.flowIntensity + flow.animation) % 1;
      
      // Draw flow path for animation
      this.ctx.beginPath();
      
      // Find start and end indices for the animation segment
      const startIndex = Math.floor((flow.points.length - 1) * Math.max(0, animationPhase - 0.1));
      const endIndex = Math.floor((flow.points.length - 1) * Math.min(1, animationPhase + 0.1));
      
      // Skip if invalid segment
      if (startIndex >= endIndex) continue;
      
      // Draw segment of flow path
      this.ctx.moveTo(flow.points[startIndex].x, flow.points[startIndex].y);
      
      for (let i = startIndex + 1; i <= endIndex; i++) {
        this.ctx.lineTo(flow.points[i].x, flow.points[i].y);
      }
      
      // Set stroke style based on flow properties
      this.ctx.strokeStyle = flow.color;
      this.ctx.lineWidth = this.lineWidth * flow.strength;
      this.ctx.globalAlpha = this.flowOpacity;
      this.ctx.stroke();
      this.ctx.globalAlpha = 1.0;
      
      // Draw entire flow path with lower opacity
      this.ctx.beginPath();
      this.ctx.moveTo(flow.points[0].x, flow.points[0].y);
      
      for (let i = 1; i < flow.points.length; i++) {
        this.ctx.lineTo(flow.points[i].x, flow.points[i].y);
      }
      
      this.ctx.strokeStyle = flow.color;
      this.ctx.lineWidth = this.lineWidth * flow.strength * 0.5;
      this.ctx.globalAlpha = this.flowOpacity * 0.3;
      this.ctx.stroke();
      this.ctx.globalAlpha = 1.0;
    }
  }
  
  /**
   * Draw control points for debugging
   */
  drawControlPoints() {
    for (const point of this.controlPoints) {
      // Draw control point
      this.ctx.beginPath();
      this.ctx.arc(point.x, point.y, 5 * point.strength, 0, Math.PI * 2);
      this.ctx.fillStyle = point.color;
      this.ctx.fill();
      
      // Draw band name
      this.ctx.fillStyle = 'white';
      this.ctx.font = '10px Arial';
      this.ctx.textAlign = 'right';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(
        `${this.bandCenters[point.bandIndex].name} (${Math.round(point.frequency)}Hz)`,
        point.x - 10,
        point.y
      );
    }
  }
  
  /**
   * Draw spectral metrics panel
   */
  drawSpectralMetricsPanel() {
    const panelWidth = 180;
    const panelHeight = 150;
    const x = 20;
    const y = 20;
    
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
    this.ctx.fillText('Spectral Migration', x + 10, y + 10);
    
    // Draw spectral metrics
    this.ctx.fillStyle = this.theme.foreground;
    this.ctx.font = '12px Arial';
    
    // Fluidity
    this.ctx.fillText(`Fluidity: ${(this.spectralFluidity * 100).toFixed(1)}%`, x + 10, y + 35);
    this.drawProgressBar(x + 10, y + 50, 160, 8, this.spectralFluidity, this.theme.secondary);
    
    // Density
    this.ctx.fillText(`Density: ${(this.spectralDensity * 100).toFixed(1)}%`, x + 10, y + 70);
    this.drawProgressBar(x + 10, y + 85, 160, 8, this.spectralDensity, this.theme.tertiary);
    
    // Active frequencies
    const emergingCount = this.emergingFrequencies.length;
    const fadingCount = this.fadingFrequencies.length;
    const stableCount = this.stableFrequencies.length;
    
    this.ctx.fillText(`Emerging: ${emergingCount}  Stable: ${stableCount}  Fading: ${fadingCount}`, x + 10, y + 105);
    
    // Most active frequency range
    const activeRange = this.getMostActiveFrequencyRange();
    this.ctx.fillText(`Focus: ${activeRange}`, x + 10, y + 125);
  }
  
  /**
   * Draw progress bar
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} width - Bar width
   * @param {number} height - Bar height
   * @param {number} value - Value (0-1)
   * @param {string} color - Bar color
   */
  drawProgressBar(x, y, width, height, value, color) {
    // Draw background
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    this.ctx.fillRect(x, y, width, height);
    
    // Draw value
    this.ctx.fillStyle = color;
    this.ctx.fillRect(x, y, width * value, height);
  }
  
  /**
   * Draw legend for frequency migrations
   */
  drawFrequencyMigrationLegend() {
    const legendWidth = 180;
    const legendHeight = 80;
    const x = 20;
    const y = this.height - legendHeight - 20;
    
    // Draw legend background
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(x, y, legendWidth, legendHeight);
    this.ctx.strokeStyle = this.theme.tertiary;
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(x, y, legendWidth, legendHeight);
    
    // Draw legend title
    this.ctx.fillStyle = this.theme.tertiary;
    this.ctx.font = 'bold 12px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.textBaseline = 'top';
    this.ctx.fillText('Migration Legend', x + 10, y + 10);
    
    // Draw legend items
    this.ctx.font = '11px Arial';
    
    // Emerging
    this.ctx.strokeStyle = 'rgb(50, 220, 50)';
    this.ctx.lineWidth = 3;
    this.ctx.beginPath();
    this.ctx.moveTo(x + 10, y + 35);
    this.ctx.lineTo(x + 40, y + 35);
    this.ctx.stroke();
    this.ctx.fillStyle = this.theme.foreground;
    this.ctx.fillText('Emerging', x + 50, y + 35);
    
    // Stable
    this.ctx.strokeStyle = 'rgb(50, 150, 220)';
    this.ctx.lineWidth = 3;
    this.ctx.beginPath();
    this.ctx.moveTo(x + 10, y + 55);
    this.ctx.lineTo(x + 40, y + 55);
    this.ctx.stroke();
    this.ctx.fillStyle = this.theme.foreground;
    this.ctx.fillText('Stable', x + 50, y + 55);
    
    // Fading
    this.ctx.strokeStyle = 'rgb(220, 50, 50)';
    this.ctx.lineWidth = 3;
    this.ctx.beginPath();
    this.ctx.moveTo(x + 10, y + 75);
    this.ctx.lineTo(x + 40, y + 75);
    this.ctx.stroke();
    this.ctx.fillStyle = this.theme.foreground;
    this.ctx.fillText('Fading', x + 50, y + 75);
  }
  
  /**
   * Get most active frequency range
   * @returns {string} - Name of most active frequency range
   */
  getMostActiveFrequencyRange() {
    // Get energy by frequency range
    const energyByRange = {};
    
    for (const range of this.frequencyRangeNames) {
      energyByRange[range.name] = 0;
    }
    
    // Sum energy for each band
    for (const band of this.bandCenters) {
      const rangeName = this.getFrequencyName(band.frequency);
      energyByRange[rangeName] += band.energy;
    }
    
    // Find range with maximum energy
    let maxEnergy = 0;
    let maxRange = "None";
    
    for (const [range, energy] of Object.entries(energyByRange)) {
      if (energy > maxEnergy) {
        maxEnergy = energy;
        maxRange = range;
      }
    }
    
    return maxRange;
  }
}
