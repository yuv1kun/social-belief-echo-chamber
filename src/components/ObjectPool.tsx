
// Object pooling system for efficient memory management
export class ParticlePool {
  private particles: any[] = [];
  private activeParticles: Set<any> = new Set();
  private maxPoolSize: number;

  constructor(maxSize: number = 200) {
    this.maxPoolSize = maxSize;
  }

  acquire() {
    let particle = this.particles.pop();
    if (!particle) {
      particle = {
        id: Math.random().toString(36),
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        life: 0,
        maxLife: 0,
        opacity: 1,
        size: 3,
        color: '#FCD34D'
      };
    }
    this.activeParticles.add(particle);
    return particle;
  }

  release(particle: any) {
    if (this.activeParticles.has(particle)) {
      this.activeParticles.delete(particle);
      if (this.particles.length < this.maxPoolSize) {
        // Reset particle properties
        particle.life = 0;
        particle.opacity = 1;
        this.particles.push(particle);
      }
    }
  }

  clear() {
    this.particles.length = 0;
    this.activeParticles.clear();
  }

  getActiveCount() {
    return this.activeParticles.size;
  }

  getPoolSize() {
    return this.particles.length;
  }
}

export class EffectPool {
  private effects: any[] = [];
  private activeEffects: Set<any> = new Set();
  private maxPoolSize: number;

  constructor(maxSize: number = 50) {
    this.maxPoolSize = maxSize;
  }

  acquire(type: 'wave' | 'halo' | 'conversion') {
    let effect = this.effects.pop();
    if (!effect) {
      effect = {
        id: Math.random().toString(36),
        type,
        x: 0,
        y: 0,
        radius: 0,
        maxRadius: 100,
        opacity: 0.8,
        color: '#06B6D4',
        startTime: 0,
        particles: []
      };
    }
    effect.type = type;
    this.activeEffects.add(effect);
    return effect;
  }

  release(effect: any) {
    if (this.activeEffects.has(effect)) {
      this.activeEffects.delete(effect);
      if (this.effects.length < this.maxPoolSize) {
        // Reset effect properties
        effect.radius = 0;
        effect.opacity = 0.8;
        effect.particles.length = 0;
        this.effects.push(effect);
      }
    }
  }

  clear() {
    this.effects.length = 0;
    this.activeEffects.clear();
  }

  getActiveCount() {
    return this.activeEffects.size;
  }

  getPoolSize() {
    return this.effects.length;
  }
}
