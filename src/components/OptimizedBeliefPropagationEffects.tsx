
import React, { useEffect, useRef } from "react";
import { Network } from "@/lib/simulation";
import { usePerformance } from "./PerformanceManager";

interface BeliefWave {
  id: string;
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  opacity: number;
  color: string;
  startTime: number;
}

interface ConversionEffect {
  id: string;
  x: number;
  y: number;
  particles: Array<{
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    maxLife: number;
  }>;
  startTime: number;
}

interface OptimizedBeliefPropagationEffectsProps {
  network: Network;
  svgRef: React.RefObject<SVGSVGElement>;
}

const OptimizedBeliefPropagationEffects: React.FC<OptimizedBeliefPropagationEffectsProps> = ({ 
  network, 
  svgRef 
}) => {
  const { registerAnimation, unregisterAnimation, performanceLevel } = usePerformance();
  const beliefWavesRef = useRef<BeliefWave[]>([]);
  const conversionEffectsRef = useRef<ConversionEffect[]>([]);
  const previousBeliefsRef = useRef<{ [key: number]: boolean }>({});
  const svgGroupRef = useRef<any>(null);
  const lastCheckTimeRef = useRef<number>(0);
  const renderCacheRef = useRef<{ waves: any[], particles: any[] }>({ waves: [], particles: [] });

  useEffect(() => {
    if (!svgRef.current || !network.nodes || network.nodes.length === 0) return;

    import("d3").then((d3) => {
      const svg = d3.select(svgRef.current);
      
      // Remove existing effects
      svg.selectAll(".belief-propagation-effects").remove();
      
      svgGroupRef.current = svg.append("g").attr("class", "belief-propagation-effects");

      // Register optimized animation callback with interval based on performance
      const animationId = "belief-propagation-effects";
      const updateInterval = performanceLevel === 'low' ? 100 : performanceLevel === 'medium' ? 50 : 16;
      
      registerAnimation(animationId, (deltaTime) => {
        updateEffects(deltaTime);
        renderEffects();
      }, 2, updateInterval); // Medium priority with interval

      // Cleanup function
      return () => {
        unregisterAnimation(animationId);
      };
    });
  }, [network, svgRef, registerAnimation, unregisterAnimation, performanceLevel]);

  const updateEffects = (deltaTime: number) => {
    const now = Date.now();
    
    // Throttle belief change checking based on performance
    const checkInterval = performanceLevel === 'low' ? 500 : performanceLevel === 'medium' ? 200 : 100;
    if (now - lastCheckTimeRef.current > checkInterval) {
      checkForEffects(now);
      lastCheckTimeRef.current = now;
    }
    
    // More aggressive limits based on performance
    const maxWaves = performanceLevel === 'low' ? 2 : performanceLevel === 'medium' ? 4 : 6;
    const maxConversions = performanceLevel === 'low' ? 1 : performanceLevel === 'medium' ? 2 : 3;
    
    // Update belief waves
    beliefWavesRef.current = beliefWavesRef.current
      .filter(wave => {
        const elapsed = now - wave.startTime;
        const progress = elapsed / 2000;
        
        if (progress >= 1) return false;
        
        wave.radius = wave.maxRadius * progress;
        wave.opacity = 0.8 * (1 - progress);
        
        return true;
      })
      .slice(0, maxWaves);

    // Update conversion effects
    conversionEffectsRef.current = conversionEffectsRef.current
      .filter(effect => {
        const elapsed = now - effect.startTime;
        if (elapsed > 1000) return false;
        
        const speedMultiplier = deltaTime / 16;
        effect.particles.forEach(particle => {
          particle.x += particle.vx * speedMultiplier;
          particle.y += particle.vy * speedMultiplier;
          particle.life -= speedMultiplier;
          particle.vx *= 0.98;
          particle.vy *= 0.98;
        });
        
        effect.particles = effect.particles.filter(p => p.life > 0);
        
        return effect.particles.length > 0;
      })
      .slice(0, maxConversions);
  };

  const checkForEffects = (now: number) => {
    // Only check a subset of nodes for performance
    const nodesToCheck = performanceLevel === 'low' ? 
      network.nodes.slice(0, 10) : 
      performanceLevel === 'medium' ? 
        network.nodes.slice(0, 25) : 
        network.nodes;
    
    nodesToCheck.forEach(node => {
      const previousBelief = previousBeliefsRef.current[node.id];
      if (previousBelief !== undefined && previousBelief !== node.believer && 
          node.x !== undefined && node.y !== undefined) {
        
        // Reduced particle count for better performance
        const particleCount = performanceLevel === 'low' ? 4 : performanceLevel === 'medium' ? 6 : 8;
        const conversionEffect: ConversionEffect = {
          id: `conversion-${node.id}-${now}`,
          x: node.x,
          y: node.y,
          particles: Array.from({ length: particleCount }, (_, i) => {
            const angle = (i / particleCount) * Math.PI * 2;
            const speed = 2 + Math.random() * 2;
            return {
              x: node.x,
              y: node.y,
              vx: Math.cos(angle) * speed,
              vy: Math.sin(angle) * speed,
              life: 40, // Shorter life for better performance
              maxLife: 40
            };
          }),
          startTime: now
        };
        
        conversionEffectsRef.current.push(conversionEffect);

        // Smaller belief waves for better performance
        const beliefWave: BeliefWave = {
          id: `wave-${node.id}-${now}`,
          x: node.x,
          y: node.y,
          radius: 0,
          maxRadius: performanceLevel === 'low' ? 60 : performanceLevel === 'medium' ? 80 : 100,
          opacity: 0.6, // Reduced opacity for better performance
          color: node.believer ? "#8B5CF6" : "#06B6D4",
          startTime: now
        };
        
        beliefWavesRef.current.push(beliefWave);
      }
      previousBeliefsRef.current[node.id] = node.believer;
    });
  };

  const renderEffects = () => {
    if (!svgGroupRef.current) return;

    import("d3").then((d3) => {
      // Batch DOM updates for better performance
      const waves = svgGroupRef.current.selectAll(".belief-wave")
        .data(beliefWavesRef.current, (d: any) => d.id);

      waves.enter()
        .append("circle")
        .attr("class", "belief-wave")
        .attr("fill", "none")
        .attr("stroke-width", 2); // Reduced stroke width

      waves
        .attr("cx", (d: BeliefWave) => d.x)
        .attr("cy", (d: BeliefWave) => d.y)
        .attr("r", (d: BeliefWave) => d.radius)
        .attr("stroke", (d: BeliefWave) => d.color)
        .attr("opacity", (d: BeliefWave) => d.opacity);

      waves.exit().remove();

      // Simplified particle rendering
      const allParticles = conversionEffectsRef.current.flatMap(effect => 
        effect.particles.map(particle => ({
          ...particle,
          effectId: effect.id
        }))
      );

      const particles = svgGroupRef.current.selectAll(".conversion-particle")
        .data(allParticles, (d: any) => `${d.effectId}-${Math.round(d.x / 5)}-${Math.round(d.y / 5)}`);

      particles.enter()
        .append("circle")
        .attr("class", "conversion-particle")
        .attr("r", 2) // Smaller particles
        .attr("fill", "#FCD34D")
        .style("filter", performanceLevel === 'high' ? "url(#particleGlow)" : "none");

      particles
        .attr("cx", (d: any) => d.x)
        .attr("cy", (d: any) => d.y)
        .attr("opacity", (d: any) => d.life / d.maxLife);

      particles.exit().remove();
    });
  };

  return null;
};

export default OptimizedBeliefPropagationEffects;
