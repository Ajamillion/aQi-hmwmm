/**
 * EmotionalResonanceTranslator - Maps audio characteristics to emotional dimensions
 * and visualizes how frequencies convey emotional content
 */
class EmotionalResonanceTranslator extends BaseCanvasController {
  constructor(canvasId, options = {}) {
    super(canvasId, options);
    
    // Emotional analysis options
    this.frequencyBands = options.frequencyBands || 32;
    this.emotionUpdateRate = options.emotionUpdateRate || 500; // ms
    this.historyLength = options.historyLength || 60; // seconds
    this.emotionalSensitivity = options.emotionalSensitivity || 0.7;
    this.transitionSpeed = options.transitionSpeed || 0.1;
    
    // Color mapping for emotions
    this.emotionColors = {
      joy: '#FFD700',     // Gold
      sadness: '#4682B4', // Steel Blue
      tension: '#8B0000', // Dark Red
      release: '#00CED1', // Dark Turquoise
      energy: '#FF4500',  // Orange Red
      calm: '#48D1CC',    // Medium Turquoise
      warmth: '#FF8C00',  // Dark Orange
      coldness: '#1E90FF' // Dodger Blue
    };
    
    // Emotional dimensions
    this.emotionalDimensions = [
      { name: 'joy', opposite: 'sadness', value: 0.5, 
        frequencyProfile: { lowMids: 0.6, highMids: 0.7, presence: 0.8 } },
      { name: 'tension', opposite: 'release', value: 0.5, 
        frequencyProfile: { lowMids: 0.7, presence: 0.8, air: 0.6 } },
      { name: 'energy', opposite: 'calm', value: 0.5, 
        frequencyProfile: { bass: 0.7, upperMids: 0.8, presence: 0.7 } },
      { name: 'warmth', opposite: 'coldness', value: 0.5, 
        frequencyProfile: { lowMids: 0.9, upperMids: 0.6, bass: 0.7 } }
    ];
    
    // Emotional state history
    this.emotionalHistory = [];
    this.lastEmotionUpdate = 0;
    
    // Audio features
    this.spectralCentroid = 0;
    this.spectralFlux = 0;
    this.harmonicRatio = 0;
    this.rhythmicIntensity = 0;
    this.dynamicRange = 0;
    this.transientDensity = 0;
    
    // Animation properties
    this.pulsatingElements = [];
    this.flowingElements = [];
    
    // Visualization layout
    this.centerX = this.width / 2;
    this.centerY = this.height / 2;
    this.outerRadius = Math.min(this.width, this.height) * 0.35;
    this.innerRadius = this.outerRadius * 0.6;
    
    // Emotional narrative
    this.dominantEmotion = null;
    this.secondaryEmotion = null;
    this.emotionalNarrative = [];
    this.narrativeUpdateCounter = 0;
    
    // Music genre prediction based on emotional profile
    this.genrePredictions = [];
    
    // Initialize frequency bands
    this.frequencyBands = this.generateFrequencyBands();
  }
  
  /**
   * Generate logarithmically spaced frequency bands
   * @returns {Array} - Array of frequency bands
   */
  generateFrequencyBands() {
    const bands = [];
    const minFreq = 20;
    const maxFreq = 20000;
    
    // Create logarithmically spaced bands
    const logMin = Math.log10(minFreq);
    const logMax = Math.log10(maxFreq);
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
        name: this.getFrequencyName(centerFreq),
        energy: 0,
        emotionalWeight: this.getEmotionalWeight(centerFreq)
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
    if (freq < 60) return "subBass";
    if (freq < 250) return "bass";
    if (freq < 500) return "lowMids";
    if (freq < 2000) return "mids";
    if (freq < 4000) return "upperMids";
    if (freq < 10000) return "presence";
    return "air";
  }
  
  /**
   * Get emotional weight profile for frequency
   * @param {number} freq - Frequency in Hz
   * @returns {Object} - Emotional weight profile
   */
  getEmotionalWeight(freq) {
    const freqName = this.getFrequencyName(freq);
    
    // Define emotional association weights for different frequency ranges
    // These are approximations based on psychoacoustic research and music theory
    switch (freqName) {
      case "subBass":
        return { energy: 0.9, tension: 0.7, warmth: 0.6, joy: 0.3 };
      case "bass":
        return { energy: 0.8, warmth: 0.7, tension: 0.5, joy: 0.4 };
      case "lowMids":
        return { warmth: 0.9, joy: 0.6, energy: 0.6, tension: 0.4 };
      case "mids":
        return { joy: 0.7, warmth: 0.8, energy: 0.5, tension: 0.5 };
      case "upperMids":
        return { joy: 0.8, energy: 0.7, tension: 0.6, warmth: 0.5 };
      case "presence":
        return { joy: 0.9, tension: 0.8, energy: 0.7, warmth: 0.4 };
      case "air":
        return { tension: 0.7, joy: 0.6, energy: 0.5, warmth: 0.3 };
      default:
        return { joy: 0.5, tension: 0.5, energy: 0.5, warmth: 0.5 };
    }
  }
  
  /**
   * Create gradients for visualization
   */
  createGradients() {
    if (!this.theme) return;
    
    // Create each emotion gradient
    for (const dimension of this.emotionalDimensions) {
      // Create gradient for positive emotion
      const posGradient = this.ctx.createRadialGradient(
        this.centerX, this.centerY, this.innerRadius * 0.3,
        this.centerX, this.centerY, this.outerRadius
      );
      
      const posColor = this.emotionColors[dimension.name];
      posGradient.addColorStop(0, posColor);
      posGradient.addColorStop(1, this.adjustColorOpacity(posColor, 0.1));
      
      dimension.posGradient = posGradient;
      
      // Create gradient for negative emotion
      const negGradient = this.ctx.createRadialGradient(
        this.centerX, this.centerY, this.innerRadius * 0.3,
        this.centerX, this.centerY, this.outerRadius
      );
      
      const negColor = this.emotionColors[dimension.opposite];
      negGradient.addColorStop(0, negColor);
      negGradient.addColorStop(1, this.adjustColorOpacity(negColor, 0.1));
      
      dimension.negGradient = negGradient;
    }
  }
  
  /**
   * Update with new audio data
   * @param {Object} metrics - Audio metrics
   */
  updateMetrics(metrics) {
    super.updateMetrics(metrics);
    
    // Only proceed if we have necessary data
    if (!metrics || !metrics.frequencyData) return this;
    
    const freqDataL = metrics.frequencyData.left;
    const freqDataR = metrics.frequencyData.right;
    
    if (!freqDataL || !freqDataR) return this;
    
    // Update audio features from metrics
    this.updateAudioFeatures(metrics);
    
    // Calculate energy for each frequency band
    const bandEnergies = this.calculateBandEnergies(freqDataL, freqDataR);
    
    // Update band energy values
    for (let i = 0; i < this.frequencyBands.length; i++) {
      // Smooth energy transitions
      this.frequencyBands[i].energy = this.frequencyBands[i].energy * 0.8 + bandEnergies[i] * 0.2;
    }
    
    // Update emotional dimensions periodically
    const now = performance.now();
    if (now - this.lastEmotionUpdate > this.emotionUpdateRate) {
      this.updateEmotionalDimensions();
      this.lastEmotionUpdate = now;
      
      // Update emotional narrative
      this.narrativeUpdateCounter++;
      if (this.narrativeUpdateCounter >= 10) { // Every ~5 seconds
        this.updateEmotionalNarrative();
        this.narrativeUpdateCounter = 0;
      }
    }
    
    return this;
  }
  
  /**
   * Update audio features from metrics
   * @param {Object} metrics - Audio metrics
   */
  updateAudioFeatures(metrics) {
    // Extract and update audio features from metrics
    if (metrics.spectralCentroid !== undefined) {
      this.spectralCentroid = metrics.spectralCentroid;
    }
    
    if (metrics.dynamicRange !== undefined) {
      this.dynamicRange = metrics.dynamicRange;
    }
    
    if (metrics.correlation !== undefined) {
      // Use correlation as a proxy for harmonic ratio
      this.harmonicRatio = (metrics.correlation + 1) / 2; // Map from -1...1 to 0...1
    }
    
    // Calculate spectral flux (rough approximation from frequency data)
    // In a real implementation, this would be properly calculated in the audio engine
    if (this.previousFreqData && metrics.frequencyData) {
      let flux = 0;
      const freqL = metrics.frequencyData.left;
      
      for (let i = 0; i < freqL.length; i++) {
        const diff = Math.abs(freqL[i] - this.previousFreqData[i]);
        flux += diff;
      }
      
      this.spectralFlux = flux / freqL.length;
      this.previousFreqData = [...freqL];
    } else if (metrics.frequencyData) {
      this.previousFreqData = [...metrics.frequencyData.left];
    }
    
    // Approximate rhythmic intensity from time domain data if available
    if (metrics.timeData && metrics.timeData.left) {
      const timeData = metrics.timeData.left;
      let sum = 0;
      let lastValue = 0;
      let changes = 0;
      
      for (let i = 0; i < timeData.length; i++) {
        sum += Math.abs(timeData[i]);
        
        // Count zero crossings as a simple transient measure
        if ((timeData[i] > 0 && lastValue <= 0) || 
            (timeData[i] < 0 && lastValue >= 0)) {
          changes++;
        }
        
        lastValue = timeData[i];
      }
      
      // Calculate average amplitude
      const avgAmplitude = sum / timeData.length;
      
      // Normalize zero crossings to 0-1 range (rough approximation)
      const normalizedChanges = Math.min(1, changes / (timeData.length * 0.1));
      
      this.rhythmicIntensity = avgAmplitude * normalizedChanges;
      this.transientDensity = normalizedChanges;
    }
  }
  
  /**
   * Calculate energy in each frequency band
   * @param {Float32Array} freqDataL - Left channel frequency data
   * @param {Float32Array} freqDataR - Right channel frequency data
   * @returns {Array} - Band energy values
   */
  calculateBandEnergies(freqDataL, freqDataR) {
    const energies = new Array(this.frequencyBands.length).fill(0);
    const fftSize = freqDataL.length * 2; // Assuming this is the analyzer's fftSize/2
    const sampleRate = 44100; // Assuming standard sample rate
    
    // For each frequency bin, add its energy to the appropriate band
    for (let i = 0; i < freqDataL.length; i++) {
      // Calculate the frequency of this bin
      const frequency = i * sampleRate / fftSize;
      
      // Find which band this frequency belongs to
      const band = this.findBandForFrequency(frequency);
      
      if (band !== -1) {
        // Convert from dB to linear scale and calculate magnitude
        const magnitudeL = Math.pow(10, freqDataL[i] / 20);
        const magnitudeR = Math.pow(10, freqDataR[i] / 20);
        
        // Average the channels and add to band energy
        const magnitude = (magnitudeL + magnitudeR) / 2;
        energies[band] += magnitude;
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
  findBandForFrequency(frequency) {
    for (let i = 0; i < this.frequencyBands.length; i++) {
      const band = this.frequencyBands[i];
      if (frequency >= band.lowFreq && frequency < band.highFreq) {
        return i;
      }
    }
    return -1;
  }
  
  /**
   * Update emotional dimensions based on audio features
   */
  updateEmotionalDimensions() {
    // Calculate emotional dimension values based on audio features and band energies
    
    // 1. Aggregate band energies by frequency range
    const rangeEnergies = {
      subBass: 0,
      bass: 0,
      lowMids: 0,
      mids: 0,
      upperMids: 0,
      presence: 0,
      air: 0
    };
    
    let totalBands = 0;
    for (const band of this.frequencyBands) {
      if (band.energy > 0.05) { // Only count significant energy
        rangeEnergies[band.name] += band.energy;
        totalBands++;
      }
    }
    
    // Normalize range energies
    for (const range in rangeEnergies) {
      rangeEnergies[range] /= totalBands || 1;
    }
    
    // 2. Calculate each emotional dimension
    for (const dimension of this.emotionalDimensions) {
      let emotionValue = 0;
      
      // Joy vs Sadness
      if (dimension.name === 'joy') {
        // High spectral centroid, higher mids/highs, transient density -> Joy
        // Lower centroid, lower lows/mids, less transients -> Sadness
        emotionValue = 0.5 + (
          (this.normalizeFeature(this.spectralCentroid, 500, 4000) - 0.5) * 0.3 +
          (rangeEnergies.upperMids + rangeEnergies.presence - rangeEnergies.bass - rangeEnergies.lowMids) * 0.3 +
          (this.transientDensity - 0.5) * 0.2 +
          (this.harmonicRatio - 0.5) * 0.2
        );
      }
      // Tension vs Release
      else if (dimension.name === 'tension') {
        // Dissonance, spectral flux, high frequencies -> Tension
        // Consonance, stability, mid frequencies -> Release
        emotionValue = 0.5 + (
          ((1 - this.harmonicRatio) - 0.5) * 0.3 +
          (this.spectralFlux - 0.5) * 0.3 +
          (rangeEnergies.presence + rangeEnergies.air - rangeEnergies.mids) * 0.2 +
          ((1 - this.dynamicRange / 10) - 0.5) * 0.2
        );
      }
      // Energy vs Calm
      else if (dimension.name === 'energy') {
        // High rhythmic intensity, transients, bass/sub -> Energy
        // Low intensity, fewer transients, mid focus -> Calm
        emotionValue = 0.5 + (
          (this.rhythmicIntensity - 0.5) * 0.3 +
          (this.transientDensity - 0.5) * 0.2 +
          (rangeEnergies.bass + rangeEnergies.subBass - rangeEnergies.mids) * 0.3 +
          (this.spectralFlux - 0.5) * 0.2
        );
      }
      // Warmth vs Coldness
      else if (dimension.name === 'warmth') {
        // Low-mids focus, harmonic ratio, less air -> Warmth
        // High frequency focus, less low-mids -> Coldness
        emotionValue = 0.5 + (
          (rangeEnergies.lowMids + rangeEnergies.mids - rangeEnergies.presence - rangeEnergies.air) * 0.4 +
          (this.harmonicRatio - 0.5) * 0.3 +
          ((1 - this.spectralCentroid / 3000) - 0.5) * 0.3
        );
      }
      
      // Apply sensitivity adjustment
      emotionValue = 0.5 + (emotionValue - 0.5) * this.emotionalSensitivity;
      
      // Smooth transitions
      dimension.value = dimension.value * (1 - this.transitionSpeed) + 
                        emotionValue * this.transitionSpeed;
      
      // Clamp value to 0-1
      dimension.value = Math.max(0, Math.min(1, dimension.value));
    }
    
    // 3. Record emotional state history
    this.emotionalHistory.push({
      timestamp: performance.now(),
      dimensions: this.emotionalDimensions.map(d => ({ 
        name: d.name, 
        value: d.value 
      }))
    });
    
    // Keep history limited
    const historyLimit = this.historyLength * (1000 / this.emotionUpdateRate);
    while (this.emotionalHistory.length > historyLimit) {
      this.emotionalHistory.shift();
    }
    
    // 4. Determine dominant emotion
    this.findDominantEmotions();
    
    // 5. Predict music genre based on emotional profile
    this.predictGenre();
  }
  
  /**
   * Find dominant emotions in current profile
   */
  findDominantEmotions() {
    // Clone and sort dimensions by distance from neutral (0.5)
    const sortedDimensions = this.emotionalDimensions
      .map(d => ({
        name: d.value > 0.5 ? d.name : d.opposite,
        value: Math.abs(d.value - 0.5) * 2 // Scale to 0-1 range
      }))
      .sort((a, b) => b.value - a.value);
    
    // Set dominant and secondary emotions
    this.dominantEmotion = sortedDimensions[0];
    this.secondaryEmotion = sortedDimensions[1];
  }
  
  /**
   * Update emotional narrative
   */
  updateEmotionalNarrative() {
    // Only update if we have dominant emotions
    if (!this.dominantEmotion) return;
    
    // Create narrative entry based on current emotional state
    const emotionalSnapshot = {
      timestamp: performance.now(),
      dominant: this.dominantEmotion,
      secondary: this.secondaryEmotion,
      dimensions: this.emotionalDimensions.map(d => ({
        name: d.name,
        value: d.value
      }))
    };
    
    // Add to narrative
    this.emotionalNarrative.push(emotionalSnapshot);
    
    // Limit narrative length
    if (this.emotionalNarrative.length > 20) {
      this.emotionalNarrative.shift();
    }
    
    // Analyze emotional journey
    this.analyzeEmotionalJourney();
  }
  
  /**
   * Analyze emotional journey from narrative
   */
  analyzeEmotionalJourney() {
    // Need at least a few points for analysis
    if (this.emotionalNarrative.length < 3) return;
    
    // Analyze emotional arcs
    const emotionalArcs = [];
    
    // For each dimension, check for significant changes
    for (const dimension of this.emotionalDimensions) {
      // Extract history for this dimension
      const history = this.emotionalNarrative.map(entry => {
        const dim = entry.dimensions.find(d => d.name === dimension.name);
        return dim ? dim.value : 0.5;
      });
      
      // Check for significant trend (simple linear regression)
      const trend = this.calculateTrend(history);
      
      if (Math.abs(trend) > 0.05) {
        emotionalArcs.push({
          dimension: dimension.name,
          direction: trend > 0 ? 'increasing' : 'decreasing',
          magnitude: Math.abs(trend)
        });
      }
    }
    
    // Store strongest arcs
    this.emotionalArcs = emotionalArcs.sort((a, b) => b.magnitude - a.magnitude).slice(0, 2);
  }
  
  /**
   * Predict music genre based on emotional profile
   */
  predictGenre() {
    // Define emotional profiles for different genres
    const genreProfiles = [
      {
        name: 'Classical',
        profile: {
          joy: 0.6, tension: 0.4, energy: 0.4, warmth: 0.7
        }
      },
      {
        name: 'Jazz',
        profile: {
          joy: 0.7, tension: 0.6, energy: 0.6, warmth: 0.8
        }
      },
      {
        name: 'Rock',
        profile: {
          joy: 0.6, tension: 0.7, energy: 0.8, warmth: 0.6
        }
      },
      {
        name: 'Electronic',
        profile: {
          joy: 0.7, tension: 0.6, energy: 0.8, warmth: 0.4
        }
      },
      {
        name: 'Ambient',
        profile: {
          joy: 0.5, tension: 0.3, energy: 0.2, warmth: 0.6
        }
      },
      {
        name: 'Pop',
        profile: {
          joy: 0.8, tension: 0.5, energy: 0.7, warmth: 0.6
        }
      },
      {
        name: 'Hip-Hop',
        profile: {
          joy: 0.6, tension: 0.6, energy: 0.8, warmth: 0.5
        }
      }
    ];
    
    // Create current emotional profile
    const currentProfile = {};
    for (const dimension of this.emotionalDimensions) {
      currentProfile[dimension.name] = dimension.value;
    }
    
    // Calculate similarity to each genre
    const genreSimilarities = genreProfiles.map(genre => {
      let similarity = 0;
      let count = 0;
      
      // Calculate Euclidean distance between profiles
      for (const dimension in genre.profile) {
        if (currentProfile[dimension] !== undefined) {
          const diff = genre.profile[dimension] - currentProfile[dimension];
          similarity += diff * diff;
          count++;
        }
      }
      
      // Convert to similarity (1 = identical, 0 = completely different)
      similarity = 1 - Math.sqrt(similarity / count);
      
      return {
        name: genre.name,
        similarity: similarity
      };
    });
    
    // Sort by similarity
    genreSimilarities.sort((a, b) => b.similarity - a.similarity);
    
    // Store top matches
    this.genrePredictions = genreSimilarities.slice(0, 3);
  }
  
  /**
   * Calculate trend in values
   * @param {Array} values - Array of values
   * @returns {number} - Trend value
   */
  calculateTrend(values) {
    // Need at least a few points
    if (values.length < 3) return 0;
    
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
    
    // Calculate slope using linear regression
    return (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  }
  
  /**
   * Normalize a feature value to 0-1 range
   * @param {number} value - Raw feature value
   * @param {number} min - Expected minimum value
   * @param {number} max - Expected maximum value
   * @returns {number} - Normalized value (0-1)
   */
  normalizeFeature(value, min, max) {
    return Math.max(0, Math.min(1, (value - min) / (max - min)));
  }
  
  /**
   * Resize handler
   */
  resize() {
    super.resize();
    
    // Update visualization parameters
    this.centerX = this.width / 2;
    this.centerY = this.height / 2;
    this.outerRadius = Math.min(this.width, this.height) * 0.35;
    this.innerRadius = this.outerRadius * 0.6;
    
    // Recreate gradients
    this.createGradients();
    
    return this;
  }
  
  /**
   * Render emotional visualization
   */
  render() {
    if (!this.shouldRender()) return this;
    
    // Update animations
    this.updateAnimations();
    
    // Clear canvas
    this.clear();
    
    // Draw background
    this.drawBackground();
    
    // Draw emotional visualization
    this.drawEmotionalLandscape();
    
    // Draw frequency bands visualization
    this.drawFrequencyBands();
    
    // Draw emotional dimensions
    this.drawEmotionalDimensions();
    
    // Draw emotional narrative
    this.drawEmotionalNarrative();
    
    // Draw genre predictions
    this.drawGenrePredictions();
    
    return this;
  }
  
  /**
   * Draw emotional landscape visualization
   */
  drawEmotionalLandscape() {
    // Calculate dominant emotion blending
    const dominantName = this.dominantEmotion ? this.dominantEmotion.name : null;
    const dominantStrength = this.dominantEmotion ? this.dominantEmotion.value : 0;
    const secondaryName = this.secondaryEmotion ? this.secondaryEmotion.name : null;
    const secondaryStrength = this.secondaryEmotion ? this.secondaryEmotion.value * 0.6 : 0;
    
    // Draw background glow
    if (dominantName) {
      // Draw dominant emotion glow
      this.ctx.beginPath();
      this.ctx.arc(this.centerX, this.centerY, this.outerRadius, 0, Math.PI * 2);
      this.ctx.fillStyle = this.adjustColorOpacity(this.emotionColors[dominantName], 0.1 + dominantStrength * 0.2);
      this.ctx.fill();
    }
    
    // Draw central flowing circle
    const time = performance.now() / 1000;
    this.ctx.beginPath();
    
    // Create distorted circle
    for (let i = 0; i <= 360; i += 5) {
      const angle = (i * Math.PI) / 180;
      
      // Add wave distortion based on audio features
      const distortion = this.rhythmicIntensity * 20 * Math.sin(angle * 6 + time * 2);
      const distortion2 = this.spectralFlux * 15 * Math.sin(angle * 3 + time * 1.5);
      
      const radius = this.innerRadius + distortion + distortion2;
      
      const x = this.centerX + Math.cos(angle) * radius;
      const y = this.centerY + Math.sin(angle) * radius;
      
      if (i === 0) {
        this.ctx.moveTo(x, y);
      } else {
        this.ctx.lineTo(x, y);
      }
    }
    
    this.ctx.closePath();
    
    // Create gradient
    let fillGradient;
    if (dominantName && secondaryName) {
      fillGradient = this.ctx.createRadialGradient(
        this.centerX, this.centerY, this.innerRadius * 0.3,
        this.centerX, this.centerY, this.innerRadius * 1.5
      );
      
      fillGradient.addColorStop(0, this.emotionColors[dominantName]);
      fillGradient.addColorStop(0.6, this.blendColors(
        this.emotionColors[dominantName], 
        this.emotionColors[secondaryName], 
        secondaryStrength / (dominantStrength + secondaryStrength)
      ));
      fillGradient.addColorStop(1, 'rgba(0, 0, 0, 0.1)');
    } else {
      fillGradient = this.ctx.createRadialGradient(
        this.centerX, this.centerY, this.innerRadius * 0.3,
        this.centerX, this.centerY, this.innerRadius * 1.5
      );
      
      fillGradient.addColorStop(0, this.theme.primary);
      fillGradient.addColorStop(1, 'rgba(0, 0, 0, 0.1)');
    }
    
    this.ctx.fillStyle = fillGradient;
    this.ctx.fill();
    
    // Add pulsating effect
    const pulseSize = this.innerRadius * (1 + this.rhythmicIntensity * 0.2 * Math.sin(time * 2));
    
    this.ctx.beginPath();
    this.ctx.arc(this.centerX, this.centerY, pulseSize, 0, Math.PI * 2);
    this.ctx.strokeStyle = dominantName ? 
      this.adjustColorOpacity(this.emotionColors[dominantName], 0.5) : 
      this.adjustColorOpacity(this.theme.primary, 0.5);
    this.ctx.lineWidth = 2;
    this.ctx.stroke();
  }
  
  /**
   * Draw frequency bands visualization
   */
  drawFrequencyBands() {
    const time = performance.now() / 1000;
    
    // Draw each frequency band as a particle system
    const particleCount = 100;
    const maxRadius = this.outerRadius * 1.2;
    const emotionColor = this.dominantEmotion ? 
      this.emotionColors[this.dominantEmotion.name] : 
      this.theme.primary;
    
    // Create particle positions and colors
    for (let i = 0; i < this.frequencyBands.length; i++) {
      const band = this.frequencyBands[i];
      
      // Skip bands with minimal energy
      if (band.energy < 0.1) continue;
      
      // Determine particle parameters
      const particlesForBand = Math.floor(particleCount * band.energy);
      const bandAngle = (i / this.frequencyBands.length) * Math.PI * 2;
      const bandRadius = this.innerRadius + (maxRadius - this.innerRadius) * 
                         (band.centerFreq / 20000);
      
      // Draw band center indicator
      this.ctx.beginPath();
      this.ctx.arc(
        this.centerX + Math.cos(bandAngle) * bandRadius,
        this.centerY + Math.sin(bandAngle) * bandRadius,
        5 * band.energy,
        0, Math.PI * 2
      );
      
      // Get color based on frequency and emotional weight
      const bandColor = this.getEmotionalColorForBand(band);
      
      this.ctx.fillStyle = bandColor;
      this.ctx.fill();
      
      // Draw particles
      for (let j = 0; j < particlesForBand; j++) {
        // Calculate particle position with noise
        const noiseOffset = Math.sin(time * 2 + j * 0.1) * 10 * band.energy;
        const noiseOffset2 = Math.cos(time + j * 0.2) * 15 * band.energy;
        
        const particleAngle = bandAngle + 
                            (Math.random() - 0.5) * Math.PI * 0.5 * band.energy;
        const particleRadius = bandRadius +
                             (Math.random() - 0.5) * 40 * band.energy;
        
        const x = this.centerX + Math.cos(particleAngle) * particleRadius + noiseOffset;
        const y = this.centerY + Math.sin(particleAngle) * particleRadius + noiseOffset2;
        
        // Calculate particle size based on energy
        const size = 1 + 3 * band.energy * Math.random();
        
        // Draw particle
        this.ctx.beginPath();
        this.ctx.arc(x, y, size, 0, Math.PI * 2);
        this.ctx.fillStyle = this.adjustColorOpacity(bandColor, 0.3 + 0.7 * Math.random());
        this.ctx.fill();
      }
    }
  }
  
  /**
   * Draw emotional dimensions
   */
  drawEmotionalDimensions() {
    // Draw radar chart for emotional dimensions
    const dimensions = this.emotionalDimensions.length;
    const angleStep = (Math.PI * 2) / dimensions;
    const radius = this.innerRadius * 0.6;
    
    // Draw radar background
    this.ctx.beginPath();
    for (let i = 0; i <= dimensions; i++) {
      const angle = i * angleStep - Math.PI / 2;
      const x = this.centerX + Math.cos(angle) * radius;
      const y = this.centerY + Math.sin(angle) * radius;
      
      if (i === 0) {
        this.ctx.moveTo(x, y);
      } else {
        this.ctx.lineTo(x, y);
      }
    }
    this.ctx.closePath();
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    this.ctx.fill();
    
    // Draw radar grid lines
    for (let i = 0; i < dimensions; i++) {
      const angle = i * angleStep - Math.PI / 2;
      this.ctx.beginPath();
      this.ctx.moveTo(this.centerX, this.centerY);
      this.ctx.lineTo(
        this.centerX + Math.cos(angle) * radius,
        this.centerY + Math.sin(angle) * radius
      );
      this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      this.ctx.lineWidth = 1;
      this.ctx.stroke();
    }
    
    // Draw radar chart data
    this.ctx.beginPath();
    for (let i = 0; i <= dimensions; i++) {
      const dimension = this.emotionalDimensions[i % dimensions];
      const value = dimension.value;
      
      const angle = i * angleStep - Math.PI / 2;
      const x = this.centerX + Math.cos(angle) * radius * value;
      const y = this.centerY + Math.sin(angle) * radius * value;
      
      if (i === 0) {
        this.ctx.moveTo(x, y);
      } else {
        this.ctx.lineTo(x, y);
      }
    }
    
    // Fill radar with gradient
    const gradient = this.ctx.createRadialGradient(
      this.centerX, this.centerY, 0,
      this.centerX, this.centerY, radius
    );
    
    const dominantColor = this.dominantEmotion ? 
      this.emotionColors[this.dominantEmotion.name] : 
      this.theme.primary;
    
    gradient.addColorStop(0, this.adjustColorOpacity(dominantColor, 0.8));
    gradient.addColorStop(1, this.adjustColorOpacity(dominantColor, 0.1));
    
    this.ctx.fillStyle = gradient;
    this.ctx.fill();
    
    // Draw dimension labels
    for (let i = 0; i < dimensions; i++) {
      const dimension = this.emotionalDimensions[i];
      const angle = i * angleStep - Math.PI / 2;
      
      // Calculate position for opposing emotional labels
      const posX = this.centerX + Math.cos(angle) * (radius + 20);
      const posY = this.centerY + Math.sin(angle) * (radius + 20);
      
      const negX = this.centerX - Math.cos(angle) * (radius + 20);
      const negY = this.centerY - Math.sin(angle) * (radius + 20);
      
      // Calculate text alignment based on angle
      const textAlign = Math.abs(Math.cos(angle)) < 0.5 ? 'center' : 
                      (Math.cos(angle) > 0 ? 'left' : 'right');
      
      const textBaseline = Math.abs(Math.sin(angle)) < 0.5 ? 'middle' : 
                         (Math.sin(angle) > 0 ? 'top' : 'bottom');
      
      // Draw labels
      this.ctx.font = '12px Arial';
      this.ctx.textAlign = textAlign;
      this.ctx.textBaseline = textBaseline;
      
      // Positive label (outer)
      this.ctx.fillStyle = this.adjustColorOpacity(this.emotionColors[dimension.name], 0.8);
      this.ctx.fillText(dimension.name, posX, posY);
      
      // Negative label (inner)
      this.ctx.fillStyle = this.adjustColorOpacity(this.emotionColors[dimension.opposite], 0.8);
      this.ctx.fillText(dimension.opposite, negX, negY);
      
      // Draw value marker
      const markerX = this.centerX + Math.cos(angle) * radius * dimension.value;
      const markerY = this.centerY + Math.sin(angle) * radius * dimension.value;
      
      this.ctx.beginPath();
      this.ctx.arc(markerX, markerY, 5, 0, Math.PI * 2);
      this.ctx.fillStyle = dimension.value > 0.5 ? 
        this.emotionColors[dimension.name] : 
        this.emotionColors[dimension.opposite];
      this.ctx.fill();
    }
  }
  
  /**
   * Draw emotional narrative and trend analysis
   */
  drawEmotionalNarrative() {
    // Draw emotional journey panel
    const panelWidth = 250;
    const panelHeight = 180;
    const panelX = this.width - panelWidth - 20;
    const panelY = 20;
    
    // Draw panel background
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(panelX, panelY, panelWidth, panelHeight);
    this.ctx.strokeStyle = this.theme.primary;
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(panelX, panelY, panelWidth, panelHeight);
    
    // Draw panel title
    this.ctx.fillStyle = this.theme.primary;
    this.ctx.font = 'bold 14px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.textBaseline = 'top';
    this.ctx.fillText('Emotional Narrative', panelX + 10, panelY + 10);
    
    // Draw dominant emotion
    if (this.dominantEmotion) {
      const strengthText = Math.round(this.dominantEmotion.value * 100) + '%';
      
      this.ctx.fillStyle = this.emotionColors[this.dominantEmotion.name];
      this.ctx.font = 'bold 20px Arial';
      this.ctx.fillText(
        this.dominantEmotion.name, 
        panelX + 10, 
        panelY + 35
      );
      
      this.ctx.font = '14px Arial';
      this.ctx.fillText(
        strengthText,
        panelX + 10 + this.ctx.measureText(this.dominantEmotion.name).width + 10,
        panelY + 38
      );
    }
    
    // Draw secondary emotion
    if (this.secondaryEmotion) {
      this.ctx.fillStyle = this.emotionColors[this.secondaryEmotion.name];
      this.ctx.font = '16px Arial';
      this.ctx.fillText(
        'with ' + this.secondaryEmotion.name,
        panelX + 10,
        panelY + 60
      );
    }
    
    // Draw emotional arc if available
    if (this.emotionalArcs && this.emotionalArcs.length > 0) {
      const arc = this.emotionalArcs[0];
      
      this.ctx.fillStyle = this.theme.foreground;
      this.ctx.font = '14px Arial';
      this.ctx.fillText(
        `Emotional Arc: ${arc.dimension} ${arc.direction}`,
        panelX + 10,
        panelY + 85
      );
    }
    
    // Draw emotional insight
    let insight = "Emotional content is ";
    
    // Generate insight based on emotional profile
    if (this.dominantEmotion && this.secondaryEmotion) {
      insight += `primarily ${this.dominantEmotion.name.toLowerCase()}, `;
      insight += `balanced with ${this.secondaryEmotion.name.toLowerCase()}. `;
      
      if (this.emotionalArcs && this.emotionalArcs.length > 0) {
        insight += `Moving toward more ${this.emotionalArcs[0].direction === 'increasing' ? 
                                         this.emotionalArcs[0].dimension : 
                                        'balanced'} territory.`;
      }
    } else {
      insight += "balanced and neutral.";
    }
    
    // Draw wrapped text
    this.wrapText(
      insight,
      panelX + 10,
      panelY + 110,
      panelWidth - 20,
      16
    );
  }
  
  /**
   * Draw genre predictions
   */
  drawGenrePredictions() {
    // Draw genre panel
    const panelWidth = 200;
    const panelHeight = 120;
    const panelX = 20;
    const panelY = 20;
    
    // Draw panel background
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(panelX, panelY, panelWidth, panelHeight);
    this.ctx.strokeStyle = this.theme.primary;
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(panelX, panelY, panelWidth, panelHeight);
    
    // Draw panel title
    this.ctx.fillStyle = this.theme.primary;
    this.ctx.font = 'bold 14px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.textBaseline = 'top';
    this.ctx.fillText('Genre Affinity', panelX + 10, panelY + 10);
    
    // Draw genre predictions
    if (this.genrePredictions && this.genrePredictions.length > 0) {
      let y = panelY + 40;
      
      this.genrePredictions.forEach((genre, index) => {
        // Calculate percentage
        const percentage = Math.round(genre.similarity * 100);
        
        // Draw genre name
        this.ctx.fillStyle = this.theme.foreground;
        this.ctx.font = index === 0 ? 'bold 14px Arial' : '13px Arial';
        this.ctx.fillText(genre.name, panelX + 10, y);
        
        // Draw percentage
        this.ctx.textAlign = 'right';
        this.ctx.fillText(`${percentage}%`, panelX + panelWidth - 10, y);
        this.ctx.textAlign = 'left';
        
        // Draw progress bar
        const barY = y + 20;
        const barWidth = panelWidth - 20;
        const barHeight = 5;
        
        // Background
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.fillRect(panelX + 10, barY, barWidth, barHeight);
        
        // Foreground
        const dominantColor = this.dominantEmotion ? 
          this.emotionColors[this.dominantEmotion.name] : 
          this.theme.primary;
        
        this.ctx.fillStyle = index === 0 ? dominantColor : this.adjustColorOpacity(dominantColor, 0.6);
        this.ctx.fillRect(panelX + 10, barY, barWidth * genre.similarity, barHeight);
        
        y += 35;
      });
    }
  }
  
  /**
   * Wrap text to fit width
   * @param {string} text - Text to wrap
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} maxWidth - Maximum width of line
   * @param {number} lineHeight - Line height
   */
  wrapText(text, x, y, maxWidth, lineHeight) {
    const words = text.split(' ');
    let line = '';
    let testLine = '';
    let lineCount = 0;
    
    this.ctx.fillStyle = this.theme.foreground;
    this.ctx.font = '13px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.textBaseline = 'top';
    
    for (let n = 0; n < words.length; n++) {
      testLine = line + words[n] + ' ';
      const metrics = this.ctx.measureText(testLine);
      const testWidth = metrics.width;
      
      if (testWidth > maxWidth && n > 0) {
        this.ctx.fillText(line, x, y + lineCount * lineHeight);
        line = words[n] + ' ';
        lineCount++;
      } else {
        line = testLine;
      }
    }
    
    this.ctx.fillText(line, x, y + lineCount * lineHeight);
  }
  
  /**
   * Get emotional color for frequency band
   * @param {Object} band - Frequency band
   * @returns {string} - CSS color
   */
  getEmotionalColorForBand(band) {
    // Blend colors based on emotional weight
    let r = 0, g = 0, b = 0;
    let totalWeight = 0;
    
    // For each emotional dimension, add weighted color
    for (const dimension of this.emotionalDimensions) {
      const weight = dimension.value * (band.emotionalWeight[dimension.name] || 0.5);
      totalWeight += weight;
      
      const color = this.hexToRgb(this.emotionColors[dimension.name]);
      r += color.r * weight;
      g += color.g * weight;
      b += color.b * weight;
    }
    
    // Normalize color values
    if (totalWeight > 0) {
      r /= totalWeight;
      g /= totalWeight;
      b /= totalWeight;
    }
    
    // Adjust brightness based on energy
    const brightness = 0.7 + 0.3 * band.energy;
    r *= brightness;
    g *= brightness;
    b *= brightness;
    
    return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
  }
  
  /**
   * Adjust color opacity
   * @param {string} color - CSS color
   * @param {number} opacity - Opacity (0-1)
   * @returns {string} - CSS color with opacity
   */
  adjustColorOpacity(color, opacity) {
    if (color.startsWith('#')) {
      const rgb = this.hexToRgb(color);
      return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`;
    } else if (color.startsWith('rgb(')) {
      return color.replace('rgb(', 'rgba(').replace(')', `, ${opacity})`);
    } else if (color.startsWith('rgba(')) {
      return color.replace(/,[^,]+\)$/, `, ${opacity})`);
    }
    
    return color;
  }
  
  /**
   * Convert hex color to RGB object
   * @param {string} hex - Hex color code
   * @returns {Object} - RGB color object
   */
  hexToRgb(hex) {
    // Remove # if present
    hex = hex.replace('#', '');
    
    // Parse hex
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    return { r, g, b };
  }
  
  /**
   * Blend two colors
   * @param {string} color1 - First color
   * @param {string} color2 - Second color
   * @param {number} ratio - Blend ratio (0 = all color1, 1 = all color2)
   * @returns {string} - Blended color
   */
  blendColors(color1, color2, ratio) {
    const rgb1 = this.hexToRgb(color1);
    const rgb2 = this.hexToRgb(color2);
    
    const r = Math.round(rgb1.r * (1 - ratio) + rgb2.r * ratio);
    const g = Math.round(rgb1.g * (1 - ratio) + rgb2.g * ratio);
    const b = Math.round(rgb1.b * (1 - ratio) + rgb2.b * ratio);
    
    return `rgb(${r}, ${g}, ${b})`;
  }
}
