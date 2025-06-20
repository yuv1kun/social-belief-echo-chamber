
import React, { useEffect, useRef } from "react";
import { Network } from "@/lib/simulation";
import { useEnhancedPerformance } from "./EnhancedPerformanceManager";
import { useAdaptiveQuality } from "./AdaptiveQualityManager";

interface OptimizedBeliefPropagationEffectsProps {
  network: Network;
  svgRef: React.RefObject<SVGSVGElement>;
}

const OptimizedBeliefPropagationEffects: React.FC<OptimizedBeliefPropagationEffectsProps> = ({ 
  network, 
  svgRef 
}) => {
  const { registerAnimation, unregisterAnimation, getParticlePool, getEffectPool } = useEnhancedPerformance();
  const { qualitySettings } = useAdaptiveQuality();
  const previousBeliefsRef = useRef<{ [key: number]: boolean }>({});
  const svgGroupRef = useRef<any>(null);
  const lastCheckTimeRef = useRef<number>(0);
  const activeEffectsRef = useRef<any[]>([]);
  const activeParticlesRef = useRef<any[]>([]);

  useEffect(() => {
    if (!svgRef.current || !network.nodes || network.nodes.length === 0) return;

    import("d3").then((d3) => {
      const svg = d3.select(svgRef.current);
      
      // Remove existing effects
      svg.selectAll(".belief-propagation-effects").remove();
      
      svgGroupRef.current = svg.append("g").attr("class", "belief-propagation-effects");

      // Register optimized animation callback with adaptive interval
      const animationId = "optimized-belief-effects";
      const updateInterval = qualitySettings.animationFPS === 60 ? 16 : 
                           qualitySettings.animationFPS === 30 ? 33 : 50;
      
      registerAnimation(animationId, (deltaTime) => {
        updateEffects(deltaTime);
        renderEffects();
      }, 2, updateInterval);

      // Cleanup function
      return () => {
        unregisterAnimation(animationId);
        cleanupPools();
      };
    });
  }, [network, svgRef, registerAnimation, unregisterAnimation, qualitySettings]);

  const cleanupPools = () => {
    const particlePool = getParticlePool();
    const effectPool = getEffectPool();
    
    // Release all active objects back to pools
    activeParticlesRef.current.forEach(particle => {
      particlePool.release(particle);
    });
    activeEffectsRef.current.forEach(effect => {
      effectPool.release(effect);
    });
    
    activeParticlesRef.current.length = 0;
    activeEffectsRef.current.length = 0;
  };

  const updateEffects = (deltaTime: number) => {
    const now = Date.now();
    
    // Throttle belief change checking based on quality settings
    const checkInterval = qualitySettings.animationFPS === 60 ? 100 : 
                         qualitySettings.animationFPS === 30 ? 200 : 300;
    
    if (now - lastCheckTimeRef.current > checkInterval) {
      checkForEffects(now);
      lastCheckTimeRef.current = now;
    }
    
    // Update effects with object pooling
    const particlePool = getParticlePool();
    const effectPool = getEffectPool();
    const speedMultiplier = deltaTime / 16;
    
    // Update belief waves/effects
    activeEffectsRef.current = activeEffectsRef.current.filter(effect => {
      const elapsed = now - effect.startTime;
      const duration = effect.type === 'wave' ? 2000 : 1000;
      const progress = elapsed / duration;
      
      if (progress >= 1) {
        effectPool.release(effect);
        return false;
      }
      
      if (effect.type === 'wave') {
        effect.radius = effect.maxRadius * progress;
        effect.opacity = qualitySettings.effectIntensity * (1 - progress);
      }
      
      return true;
    });
    
    // Update particles
    activeParticlesRef.current = activeParticlesRef.current.filter(particle => {
      particle.x += particle.vx * speedMultiplier;
      particle.y += particle.vy * speedMultiplier;
      particle.life -= speedMultiplier;
      particle.vx *= 0.98;
      particle.vy *= 0.98;
      particle.opacity = Math.max(0, particle.life / particle.maxLife);
      
      if (particle.life <= 0) {
        particlePool.release(particle);
        return false;
      }
      
      return true;
    });
  };

  const checkForEffects = (now: number) => {
    // Limit node checking based on quality settings
    const maxNodesToCheck = qualitySettings.effectIntensity === 1.0 ? 
      network.nodes.length : 
      Math.min(network.nodes.length, Math.floor(network.nodes.length * qualitySettings.effectIntensity));
    
    const nodesToCheck = network.nodes.slice(0, maxNodesToCheck);
    
    nodesToCheck.forEach(node => {
      const previousBelief = previousBeliefsRef.current[node.id];
      if (previousBelief !== undefined && previousBelief !== node.believer && 
          node.x !== undefined && node.y !== undefined) {
        
        // Create conversion particles using object pool
        if (qualitySettings.particleCount > 0) {
          const particlePool = getParticlePool();
          const particleCount = Math.min(qualitySettings.particleCount, 12);
          
          for (let i = 0; i < particleCount; i++) {
            const particle = particlePool.acquire();
            if (particle) {
              const angle = (i / particleCount) * Math.PI * 2;
              const speed = 2 + Math.random() * 2;
              
              particle.x = node.x;
              particle.y = node.y;
              particle.vx = Math.cos(angle) * speed;
              particle.vy = Math.sin(angle) * speed;
              particle.life = 40;
              particle.maxLife = 40;
              particle.opacity = 1;
              particle.size = 2;
              particle.color = "#FCD34D";
              
              activeParticlesRef.current.push(particle);
            }
          }
        }

        // Create belief wave using object pool
        const effectPool = getEffectPool();
        const beliefWave = effectPool.acquire('wave');
        if (beliefWave) {
          beliefWave.x = node.x;
          beliefWave.y = node.y;
          beliefWave.radius = 0;
          beliefWave.maxRadius = 60 * qualitySettings.effectIntensity;
          beliefWave.opacity = 0.6 * qualitySettings.effectIntensity;
          beliefWave.color = node.believer ? "#8B5CF6" : "#06B6D4";
          beliefWave.startTime = now;
          
          activeEffectsRef.current.push(beliefWave);
        }
      }
      previousBeliefsRef.current[node.id] = node.believer;
    });
  };

  const renderEffects = () => {
    if (!svgGroupRef.current) return;

    import("d3").then((d3) => {
      // Batch DOM updates for better performance
      const waves = svgGroupRef.current.selectAll(".belief-wave")
        .data(activeEffectsRef.current.filter(e => e.type === 'wave'), (d: any) => d.id);

      waves.enter()
        .append("circle")
        .attr("class", "belief-wave")
        .attr("fill", "none")
        .attr("stroke-width", qualitySettings.enableFilters ? 2 : 1);

      waves
        .attr("cx", (d: any) => d.x)
        .attr("cy", (d: any) => d.y)
        .attr("r", (d: any) => d.radius)
        .attr("stroke", (d: any) => d.color)
        .attr("opacity", (d: any) => d.opacity);

      waves.exit().remove();

      // Render particles with quality-based limits
      const maxParticlesToRender = Math.min(activeParticlesRef.current.length, 
        qualitySettings.particleCount * 10);
      const visibleParticles = activeParticlesRef.current.slice(0, maxParticlesToRender);

      const particles = svgGroupRef.current.selectAll(".conversion-particle")
        .data(visibleParticles, (d: any) => d.id);

      particles.enter()
        .append("circle")
        .attr("class", "conversion-particle")
        .attr("r", (d: any) => d.size)
        .attr("fill", (d: any) => d.color)
        .style("filter", qualitySettings.enableGlow ? "url(#particleGlow)" : "none");

      particles
        .attr("cx", (d: any) => d.x)
        .attr("cy", (d: any) => d.y)
        .attr("opacity", (d: any) => d.opacity);

      particles.exit().remove();
    });
  };

  return null;
};

export default OptimizedBeliefPropagationEffects;
