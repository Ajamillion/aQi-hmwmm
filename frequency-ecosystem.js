/**
 * FrequencyRelationshipEcosystem - Advanced visualization that reveals how frequencies
 * interact like a living system rather than static measurements
 */
class FrequencyRelationshipEcosystem extends BaseCanvasController {
  constructor(canvasId, options = {}) {
    super(canvasId, options);
    
    // Ecosystem options
    this.nodeCount = options.nodeCount || 32;
    this.frequencyBands = options.frequencyBands || this.generateFrequencyBands(this.nodeCount);
    this.interactionThreshold = options.interactionThreshold || 0.2;
    this.nodeSizeBase = options.nodeSizeBase || 5;
    this.nodeSizeScale = options.nodeSizeScale || 15;
    this.showLabels = options.showLabels !== undefined ? options.showLabels : true;
    
    // Visual parameters
    this.centerX = this.width / 2;
    this.centerY = this.height / 2;
    this.radiusBase = Math.min(this.width, this.height) * 0.35;
    
    // Nodes and connections
    this.nodes = [];
    this.connections = [];
    
    // Simulation parameters
    this.simulating = false;
    this.simulation = null;
    this.simulationStrength = options.simulationStrength || 0.1;
    
    // Interaction parameters
    this.selectedNode = null;
    this.hoveredNode = null;
    
    // History of frequency energy
    this.energyHistory = [];
    this.historyLength = options.historyLength || 30;
    
    // Analysis results
    this.harmonicRelationships = new Map();
    this.conflictingPairs = [];
    this.dominantFrequencies = [];
    
    // Initialize nodes
    this.initializeNodes();
  }
  
  /**
   * Generate logarithmically spaced frequency bands
   * @param {number} count - Number of bands
   * @returns {Array} - Array of frequency bands
   */
  generateFrequencyBands(count) {
    const bands = [];
    const minFreq = 20;  // Hz
    const maxFreq = 20000; // Hz
    
    // Logarithmic spacing (musical perception)
    const logMin = Math.log10(minFreq);
    const logMax = Math.log10(maxFreq);
    const step = (logMax - logMin) / (count - 1);
    
    for (let i = 0; i < count; i++) {
      const logFreq = logMin + step * i;
      const freq = Math.pow(10, logFreq);
      
      // Find the nearest musical note
      const nearest = this.findNearestMusicalNote(freq);
      
      bands.push({
        minFreq: i === 0 ? minFreq : bands[i-1].maxFreq,
        centerFreq: freq,
        maxFreq: i === count - 1 ? maxFreq : Math.pow(10, logMin + step * (i + 1)),
        note: nearest.note,
        octave: nearest.octave
      });
    }
    
    return bands;
  }
  
  /**
   * Find nearest musical note to a frequency
   * @param {number} freq - Frequency in Hz
   * @returns {Object} - Note name and octave
   */
  findNearestMusicalNote(freq) {
    // A4 = 440Hz
    const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const a4 = 440;
    
    // Calculate number of half steps from A4
    const halfStepsFromA4 = Math.round(12 * Math.log2(freq / a4));
    
    // Calculate note index and octave
    let noteIndex = (halfStepsFromA4 + 9) % 12; // A is at index 9
    if (noteIndex < 0) noteIndex += 12;
    
    const octave = Math.floor((halfStepsFromA4 + 9) / 12) + 4;
    
    return {
      note: notes[noteIndex],
      octave: octave
    };
  }
  
  /**
   * Initialize frequency nodes
   */
  initializeNodes() {
    this.nodes = [];
    
    // Create a node for each frequency band
    for (let i = 0; i < this.frequencyBands.length; i++) {
      const band = this.frequencyBands[i];
      const angle = (i / this.frequencyBands.length) * Math.PI * 2;
      
      // Arrange nodes in a circle initially
      const x = this.centerX + Math.cos(angle) * this.radiusBase;
      const y = this.centerY + Math.sin(angle) * this.radiusBase;
      
      this.nodes.push({
        id: i,
        band: band,
        x: x,
        y: y,
        originalX: x,
        originalY: y,
        energy: 0,
        size: this.nodeSizeBase,
        color: this.getFrequencyColor(band.centerFreq),
        label: `${band.note}${band.octave} (${Math.round(band.centerFreq)}Hz)`,
        connections: []
      });
    }
  }
  
  /**
   * Get color for frequency node
   * @param {number} freq - Frequency in Hz
   * @returns {string} - Color string
   */
  getFrequencyColor(freq) {
    // Map frequency range to hue
    // Low frequencies: red/orange
    // Mid frequencies: green/yellow
    // High frequencies: blue/purple
    const logMin = Math.log10(20);
    const logMax = Math.log10(20000);
    const logFreq = Math.log10(freq);
    
    // Normalize to 0-1 range
    const normalizedFreq = (logFreq - logMin) / (logMax - logMin);
    
    // Map to hue (0-360)
    // Use a color scale that's perceptually meaningful for audio
    // Red (0) -> Yellow (60) -> Green (120) -> Cyan (180) -> Blue (240) -> Magenta (300) -> Red (360)
    const hue = 240 - normalizedFreq * 240; // High frequencies are blue (240), low are red (0)
    
    return `hsl(${hue}, 100%, 50%)`;
  }
  
  /**
   * Resize handler
   */
  resize() {
    super.resize();
    
    // Update visualization parameters
    this.centerX = this.width / 2;
    this.centerY = this.height / 2;
    this.radiusBase = Math.min(this.width, this.height) * 0.35;
    
    // Reset node positions
    this.resetNodePositions();
    
    return this;
  }
  
  /**
   * Reset node positions to original circle
   */
  resetNodePositions() {
    for (let i = 0; i < this.nodes.length; i++) {
      const angle = (i / this.nodes.length) * Math.PI * 2;
      this.nodes[i].originalX = this.centerX + Math.cos(angle) * this.radiusBase;
      this.nodes[i].originalY = this.centerY + Math.sin(angle) * this.radiusBase;
      this.nodes[i].x = this.nodes[i].originalX;
      this.nodes[i].y = this.nodes[i].originalY;
    }
  }
  
  /**
   * Update with new audio data
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
    
    // Calculate energy for each band
    const bandEnergies = this.calculateBandEnergies(freqDataL, freqDataR);
    
    // Update node energy values
    for (let i = 0; i < this.nodes.length; i++) {
      // Smooth energy transitions
      this.nodes[i].energy = this.nodes[i].energy * 0.7 + bandEnergies[i] * 0.3;
      
      // Update node size based on energy
      this.nodes[i].size = this.nodeSizeBase + this.nodes[i].energy * this.nodeSizeScale;
    }
    
    // Update energy history
    this.energyHistory.push([...bandEnergies]);
    if (this.energyHistory.length > this.historyLength) {
      this.energyHistory.shift();
    }
    
    // Analyze relationships between frequency bands
    this.analyzeRelationships();
    
    // Update connections between nodes
    this.updateConnections();
    
    return this;
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
      const bandIndex = this.findBandIndex(frequency);
      
      if (bandIndex >= 0) {
        // Convert from dB to linear scale
        const magnitudeL = Math.pow(10, freqDataL[i] / 20);
        const magnitudeR = Math.pow(10, freqDataR[i] / 20);
        
        // Average the channels and add to band energy
        const magnitude = (magnitudeL + magnitudeR) / 2;
        energies[bandIndex] += magnitude;
      }
    }
    
    // Normalize energies to 0-1 range
    const maxEnergy = Math.max(...energies);
    if (maxEnergy > 0) {
      for (let i = 0; i < energies.length; i++) {
        energies[i] /= maxEnergy;
      }
    }
    
    return energies;
  }
  
  /**
   * Find which band a frequency belongs to
   * @param {number} frequency - Frequency in Hz
   * @returns {number} - Band index or -1 if not found
   */
  findBandIndex(frequency) {
    for (let i = 0; i < this.frequencyBands.length; i++) {
      const band = this.frequencyBands[i];
      if (frequency >= band.minFreq && frequency < band.maxFreq) {
        return i;
      }
    }
    return -1;
  }
  
  /**
   * Analyze relationships between frequency bands
   */
  analyzeRelationships() {
    // Skip if not enough history
    if (this.energyHistory.length < 2) return;
    
    // Clear previous analysis
    this.harmonicRelationships.clear();
    this.conflictingPairs = [];
    this.dominantFrequencies = [];
    
    // Calculate correlation between bands over time
    for (let i = 0; i < this.nodes.length; i++) {
      for (let j = i + 1; j < this.nodes.length; j++) {
        const correlation = this.calculateBandCorrelation(i, j);
        
        // Store relationship
        if (Math.abs(correlation) > this.interactionThreshold) {
          const key = `${i}-${j}`;
          this.harmonicRelationships.set(key, {
            source: i,
            target: j,
            correlation: correlation,
            type: this.getRelationshipType(i, j, correlation)
          });
          
          // Check for conflicts
          if (correlation < -0.4) {
            this.conflictingPairs.push([i, j]);
          }
        }
      }
    }
    
    // Find dominant frequencies
    const currentEnergies = this.nodes.map(node => node.energy);
    const threshold = 0.6; // Threshold for dominance
    
    for (let i = 0; i < currentEnergies.length; i++) {
      if (currentEnergies[i] > threshold) {
        this.dominantFrequencies.push(i);
      }
    }
  }
  
  /**
   * Calculate correlation between two frequency bands over time
   * @param {number} bandA - First band index
   * @param {number} bandB - Second band index
   * @returns {number} - Correlation coefficient (-1 to 1)
   */
  calculateBandCorrelation(bandA, bandB) {
    // Extract energy histories for the two bands
    const energiesA = this.energyHistory.map(frame => frame[bandA]);
    const energiesB = this.energyHistory.map(frame => frame[bandB]);
    
    // Calculate means
    const meanA = energiesA.reduce((sum, val) => sum + val, 0) / energiesA.length;
    const meanB = energiesB.reduce((sum, val) => sum + val, 0) / energiesB.length;
    
    // Calculate correlation coefficient
    let numerator = 0;
    let denominatorA = 0;
    let denominatorB = 0;
    
    for (let i = 0; i < energiesA.length; i++) {
      const diffA = energiesA[i] - meanA;
      const diffB = energiesB[i] - meanB;
      
      numerator += diffA * diffB;
      denominatorA += diffA * diffA;
      denominatorB += diffB * diffB;
    }
    
    const denominator = Math.sqrt(denominatorA * denominatorB);
    
    return denominator === 0 ? 0 : numerator / denominator;
  }
  
  /**
   * Determine relationship type between frequency bands
   * @param {number} bandA - First band index
   * @param {number} bandB - Second band index
   * @param {number} correlation - Correlation coefficient
   * @returns {string} - Relationship type
   */
  getRelationshipType(bandA, bandB, correlation) {
    const freqA = this.frequencyBands[bandA].centerFreq;
    const freqB = this.frequencyBands[bandB].centerFreq;
    
    // Check for harmonic relationship
    const ratio = freqB / freqA;
    const isHarmonic = this.isNearInteger(ratio, 0.05) || this.isNearInteger(1/ratio, 0.05);
    
    // Check for musical interval relationship
    const semitones = 12 * Math.log2(freqB / freqA);
    const roundedSemitones = Math.round(semitones);
    const isMusical = Math.abs(semitones - roundedSemitones) < 0.1;
    
    if (correlation > 0.6) {
      return isHarmonic ? "harmonic" : (isMusical ? "musical" : "synergistic");
    } else if (correlation > 0.3) {
      return "cooperative";
    } else if (correlation < -0.6) {
      return "conflicting";
    } else if (correlation < -0.3) {
      return "competing";
    } else {
      return "neutral";
    }
  }
  
  /**
   * Check if a number is near an integer
   * @param {number} value - Value to check
   * @param {number} tolerance - Tolerance
   * @returns {boolean} - Whether value is near an integer
   */
  isNearInteger(value, tolerance) {
    const nearest = Math.round(value);
    return Math.abs(value - nearest) < tolerance;
  }
  
  /**
   * Update connections between nodes
   */
  updateConnections() {
    this.connections = [];
    
    // Create connections from relationships
    for (const [key, relationship] of this.harmonicRelationships.entries()) {
      const sourceNode = this.nodes[relationship.source];
      const targetNode = this.nodes[relationship.target];
      
      // Only create connection if both nodes have energy
      if (sourceNode.energy > 0.1 && targetNode.energy > 0.1) {
        // Connection strength based on correlation and node energies
        const strength = Math.abs(relationship.correlation) * 
                         Math.min(sourceNode.energy, targetNode.energy);
        
        this.connections.push({
          source: relationship.source,
          target: relationship.target,
          type: relationship.type,
          correlation: relationship.correlation,
          strength: strength,
          color: this.getConnectionColor(relationship.type, relationship.correlation)
        });
      }
    }
  }
  
  /**
   * Get color for connection based on relationship type
   * @param {string} type - Relationship type
   * @param {number} correlation - Correlation value
   * @returns {string} - Color string
   */
  getConnectionColor(type, correlation) {
    switch (type) {
      case "harmonic":
        return `rgba(64, 255, 64, ${Math.abs(correlation)})`;
      case "musical":
        return `rgba(64, 196, 255, ${Math.abs(correlation)})`;
      case "synergistic":
        return `rgba(255, 255, 64, ${Math.abs(correlation)})`;
      case "cooperative":
        return `rgba(64, 128, 255, ${Math.abs(correlation)})`;
      case "conflicting":
        return `rgba(255, 32, 32, ${Math.abs(correlation)})`;
      case "competing":
        return `rgba(255, 128, 32, ${Math.abs(correlation)})`;
      default:
        return `rgba(180, 180, 180, ${Math.abs(correlation)})`;
    }
  }
  
  /**
   * Handle mouse move for node interaction
   * @param {Object} position - Mouse position
   */
  onMouseMove(position) {
    this.hoveredNode = null;
    
    // Check if mouse is over a node
    for (const node of this.nodes) {
      const dx = position.x - node.x;
      const dy = position.y - node.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance <= node.size) {
        this.hoveredNode = node;
        break;
      }
    }
  }
  
  /**
   * Handle mouse down for node selection
   * @param {Object} position - Mouse position
   */
  onMouseDown(position) {
    this.selectedNode = null;
    
    // Check if mouse is over a node
    for (const node of this.nodes) {
      const dx = position.x - node.x;
      const dy = position.y - node.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance <= node.size) {
        this.selectedNode = node;
        break;
      }
    }
  }
  
  /**
   * Start force-directed simulation
   */
  startSimulation() {
    if (this.simulating) return;
    
    this.simulating = true;
    this.simulateStep();
  }
  
  /**
   * Stop force-directed simulation
   */
  stopSimulation() {
    this.simulating = false;
  }
  
  /**
   * Single step of force-directed simulation
   */
  simulateStep() {
    if (!this.simulating) return;
    
    // Apply forces to nodes
    this.applyForces();
    
    // Request next animation frame
    requestAnimationFrame(() => this.simulateStep());
  }
  
  /**
   * Apply forces to nodes for simulation
   */
  applyForces() {
    // Force parameters
    const repulsionForce = 0.5;
    const attractionForce = 0.2;
    const centralForce = 0.02;
    const maxSpeed = 2.0;
    
    // Initialize forces
    const forces = this.nodes.map(() => ({ fx: 0, fy: 0 }));
    
    // Apply repulsion between all nodes
    for (let i = 0; i < this.nodes.length; i++) {
      for (let j = i + 1; j < this.nodes.length; j++) {
        const dx = this.nodes[j].x - this.nodes[i].x;
        const dy = this.nodes[j].y - this.nodes[i].y;
        const distSq = dx * dx + dy * dy;
        const dist = Math.sqrt(distSq);
        
        if (dist < 1) continue; // Avoid division by zero
        
        // Repulsion force (inverse square law)
        const force = repulsionForce / distSq;
        const fx = dx / dist * force;
        const fy = dy / dist * force;
        
        forces[i].fx -= fx;
        forces[i].fy -= fy;
        forces[j].fx += fx;
        forces[j].fy += fy;
      }
    }
    
    // Apply attraction along connections
    for (const conn of this.connections) {
      const sourceNode = this.nodes[conn.source];
      const targetNode = this.nodes[conn.target];
      
      const dx = targetNode.x - sourceNode.x;
      const dy = targetNode.y - sourceNode.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < 1) continue; // Avoid division by zero
      
      // Calculate attraction based on connection strength
      let force = attractionForce * conn.strength;
      
      // Adjust based on correlation (negative = repulsion)
      if (conn.correlation < 0) {
        force *= -1; // Repulsion for negative correlation
      }
      
      const fx = dx / dist * force;
      const fy = dy / dist * force;
      
      forces[conn.source].fx += fx;
      forces[conn.source].fy += fy;
      forces[conn.target].fx -= fx;
      forces[conn.target].fy -= fy;
    }
    
    // Apply central force to keep nodes in view
    for (let i = 0; i < this.nodes.length; i++) {
      const dx = this.nodes[i].originalX - this.nodes[i].x;
      const dy = this.nodes[i].originalY - this.nodes[i].y;
      
      forces[i].fx += dx * centralForce;
      forces[i].fy += dy * centralForce;
    }
    
    // Apply forces to node positions with limits
    for (let i = 0; i < this.nodes.length; i++) {
      // Skip if node is selected (being dragged)
      if (this.selectedNode === this.nodes[i]) continue;
      
      // Apply force with damping
      const speed = Math.sqrt(forces[i].fx * forces[i].fx + forces[i].fy * forces[i].fy);
      
      if (speed > maxSpeed) {
        forces[i].fx = (forces[i].fx / speed) * maxSpeed;
        forces[i].fy = (forces[i].fy / speed) * maxSpeed;
      }
      
      this.nodes[i].x += forces[i].fx * this.simulationStrength;
      this.nodes[i].y += forces[i].fy * this.simulationStrength;
      
      // Keep nodes within canvas
      this.nodes[i].x = Math.max(this.nodes[i].size, Math.min(this.width - this.nodes[i].size, this.nodes[i].x));
      this.nodes[i].y = Math.max(this.nodes[i].size, Math.min(this.height - this.nodes[i].size, this.nodes[i].y));
    }
  }
  
  /**
   * Render frequency ecosystem visualization
   */
  render() {
    if (!this.shouldRender()) return this;
    
    // Start simulation if we have connections
    if (this.connections.length > 0 && !this.simulating) {
      this.startSimulation();
    } else if (this.connections.length === 0 && this.simulating) {
      this.stopSimulation();
    }
    
    // Update animations
    this.updateAnimations();
    
    // Clear canvas
    this.clear();
    
    // Draw background
    this.drawBackground();
    
    // Draw connections first (behind nodes)
    this.drawConnections();
    
    // Draw nodes
    this.drawNodes();
    
    // Draw information panel
    this.drawInfoPanel();
    
    // Draw hover info
    if (this.hoveredNode || this.selectedNode) {
      this.drawNodeInfo(this.hoveredNode || this.selectedNode);
    }
    
    return this;
  }
  
  /**
   * Draw connections between nodes
   */
  drawConnections() {
    for (const conn of this.connections) {
      const sourceNode = this.nodes[conn.source];
      const targetNode = this.nodes[conn.target];
      
      // Draw connection line
      this.ctx.beginPath();
      this.ctx.moveTo(sourceNode.x, sourceNode.y);
      this.ctx.lineTo(targetNode.x, targetNode.y);
      this.ctx.strokeStyle = conn.color;
      this.ctx.lineWidth = 1 + conn.strength * 3;
      this.ctx.stroke();
      
      // Draw connection type if strong connection
      if (conn.strength > 0.5 && this.showLabels) {
        const midX = (sourceNode.x + targetNode.x) / 2;
        const midY = (sourceNode.y + targetNode.y) / 2;
        
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(midX - 30, midY - 10, 60, 20);
        
        this.ctx.fillStyle = 'white';
        this.ctx.font = '10px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(conn.type, midX, midY);
      }
    }
  }
  
  /**
   * Draw frequency nodes
   */
  drawNodes() {
    for (const node of this.nodes) {
      // Skip nodes with no energy
      if (node.energy < 0.05) continue;
      
      // Draw node circle
      this.ctx.beginPath();
      this.ctx.arc(node.x, node.y, node.size, 0, Math.PI * 2);
      
      // Fill with gradient
      const gradient = this.ctx.createRadialGradient(
        node.x, node.y, 0,
        node.x, node.y, node.size
      );
      gradient.addColorStop(0, node.color);
      gradient.addColorStop(1, this.adjustColor(node.color, -30));
      
      this.ctx.fillStyle = gradient;
      this.ctx.fill();
      
      // Draw border
      this.ctx.strokeStyle = this.adjustColor(node.color, 30);
      this.ctx.lineWidth = 2;
      this.ctx.stroke();
      
      // Draw node label if enabled
      if (this.showLabels && node.energy > 0.2) {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(node.x - 40, node.y + node.size + 5, 80, 20);
        
        this.ctx.fillStyle = 'white';
        this.ctx.font = '10px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(node.band.note + node.band.octave, node.x, node.y + node.size + 15);
      }
    }
  }
  
  /**
   * Draw information panel with analysis results
   */
  drawInfoPanel() {
    const padding = 15;
    const width = 200;
    const height = 150;
    const x = this.width - width - padding;
    const y = padding;
    
    // Draw panel background
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(x, y, width, height);
    this.ctx.strokeStyle = this.theme.primary;
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(x, y, width, height);
    
    // Draw panel title
    this.ctx.fillStyle = this.theme.primary;
    this.ctx.font = 'bold 14px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.textBaseline = 'top';
    this.ctx.fillText('Frequency Ecosystem', x + 10, y + 10);
    
    // Draw active frequencies
    this.ctx.fillStyle = this.theme.foreground;
    this.ctx.font = '12px Arial';
    
    let activeCount = 0;
    let dominantText = "None";
    
    // Count active frequencies
    for (const node of this.nodes) {
      if (node.energy > 0.1) {
        activeCount++;
      }
    }
    
    // Format dominant frequencies
    if (this.dominantFrequencies.length > 0) {
      dominantText = this.dominantFrequencies
        .map(i => `${this.nodes[i].band.note}${this.nodes[i].band.octave}`)
        .join(', ');
    }
    
    // Draw stats
    this.ctx.fillText(`Active Frequencies: ${activeCount}`, x + 10, y + 35);
    this.ctx.fillText(`Connections: ${this.connections.length}`, x + 10, y + 55);
    this.ctx.fillText(`Dominant: ${dominantText}`, x + 10, y + 75);
    
    // Draw conflicts
    this.ctx.fillStyle = this.theme.secondary;
    this.ctx.fillText(
      `Conflicts: ${this.conflictingPairs.length}`, 
      x + 10, 
      y + 95
    );
    
    if (this.conflictingPairs.length > 0) {
      const conflictText = this.conflictingPairs
        .map(pair => {
          const nodeA = this.nodes[pair[0]];
          const nodeB = this.nodes[pair[1]];
          return `${nodeA.band.note}${nodeA.band.octave}/${nodeB.band.note}${nodeB.band.octave}`;
        })
        .slice(0, 3)
        .join(', ');
      
      this.ctx.fillText(conflictText, x + 10, y + 115);
    }
  }
  
  /**
   * Draw detailed node information
   * @param {Object} node - Node to show info for
   */
  drawNodeInfo(node) {
    const padding = 15;
    const width = 250;
    const height = 180;
    const x = padding;
    const y = padding;
    
    // Draw panel background
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    this.ctx.fillRect(x, y, width, height);
    this.ctx.strokeStyle = node.color;
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(x, y, width, height);
    
    // Draw panel title
    this.ctx.fillStyle = node.color;
    this.ctx.font = 'bold 14px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.textBaseline = 'top';
    this.ctx.fillText(`${node.band.note}${node.band.octave} (${Math.round(node.band.centerFreq)}Hz)`, x + 10, y + 10);
    
    // Draw node details
    this.ctx.fillStyle = this.theme.foreground;
    this.ctx.font = '12px Arial';
    
    this.ctx.fillText(`Energy: ${(node.energy * 100).toFixed(1)}%`, x + 10, y + 35);
    this.ctx.fillText(`Range: ${Math.round(node.band.minFreq)}Hz - ${Math.round(node.band.maxFreq)}Hz`, x + 10, y + 55);
    
    // Find connections for this node
    const nodeConnections = this.connections.filter(
      conn => conn.source === node.id || conn.target === node.id
    ).sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation));
    
    // Draw connection info
    this.ctx.fillText(`Connections: ${nodeConnections.length}`, x + 10, y + 75);
    
    let yOffset = 95;
    
    // List top 3 connections
    for (let i = 0; i < Math.min(nodeConnections.length, 3); i++) {
      const conn = nodeConnections[i];
      const otherNodeId = conn.source === node.id ? conn.target : conn.source;
      const otherNode = this.nodes[otherNodeId];
      
      this.ctx.fillStyle = conn.color;
      this.ctx.fillText(
        `${otherNode.band.note}${otherNode.band.octave}: ${conn.type} (${conn.correlation.toFixed(2)})`,
        x + 10,
        y + yOffset
      );
      
      yOffset += 20;
    }
    
    // Draw info about band frequency
    this.ctx.fillStyle = this.theme.foreground;
    this.ctx.fillText(`Musical Role: ${this.getFrequencyRole(node.band.centerFreq)}`, x + 10, y + 155);
  }
  
  /**
   * Get musical role description for a frequency
   * @param {number} freq - Frequency in Hz
   * @returns {string} - Description of frequency role
   */
  getFrequencyRole(freq) {
    if (freq < 60) return "Sub Bass";
    if (freq < 250) return "Bass";
    if (freq < 500) return "Low Mids";
    if (freq < 2000) return "Mid Range";
    if (freq < 4000) return "Upper Mids";
    if (freq < 10000) return "Presence";
    return "Air";
  }
  
  /**
   * Adjust color brightness
   * @param {string} color - Color string (hsl format)
   * @param {number} amount - Amount to adjust
   * @returns {string} - Adjusted color
   */
  adjustColor(color, amount) {
    // Parse HSL color
    const match = color.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
    if (!match) return color;
    
    const h = parseInt(match[1]);
    const s = parseInt(match[2]);
    const l = parseInt(match[3]);
    
    // Adjust lightness
    const newL = Math.max(0, Math.min(100, l + amount));
    
    return `hsl(${h}, ${s}%, ${newL}%)`;
  }
}
