
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

interface InfluenceHalo {
  id: string;
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  opacity: number;
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
  const influenceHalosRef = useRef<InfluenceHalo[]>([]);
  const conversionEffectsRef = useRef<ConversionEffect[]>([]);
  const previousBeliefsRef = useRef<{ [key: number]: boolean }>({});
  const recentMessagesRef = useRef<Set<string>>(new Set());
  const svgGroupRef = useRef<any>(null);

  useEffect(() => {
    if (!svgRef.current || !network.nodes || network.nodes.length === 0) return;

    import("d3").then((d3) => {
      const svg = d3.select(svgRef.current);
      
      // Remove existing effects
      svg.selectAll(".belief-propagation-effects").remove();
      
      svgGroupRef.current = svg.append("g").attr("class", "belief-propagation-effects");

      // Register optimized animation callback
      const animationId = "belief-propagation-effects";
      registerAnimation(animationId, (deltaTime) => {
        updateEffects(deltaTime);
        renderEffects();
      }, 2); // Medium priority

      // Cleanup function
      return () => {
        unregisterAnimation(animationId);
      };
    });
  }, [network, svgRef, registerAnimation, unregisterAnimation]);

  const updateEffects = (deltaTime: number) => {
    const now = Date.now();
    
    // Check for belief changes (throttled based on performance)
    const checkInterval = performanceLevel === 'low' ? 200 : performanceLevel === 'medium' ? 100 : 50;
    if (now % checkInterval < deltaTime) {
      checkForEffects(now);
    }
    
    // Update belief waves with performance-based limits
    const maxWaves = performanceLevel === 'low' ? 3 : performanceLevel === 'medium' ? 6 : 10;
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

    // Update influence halos with limits
    const maxHalos = performanceLevel === 'low' ? 2 : performanceLevel === 'medium' ? 4 : 6;
    influenceHalosRef.current = influenceHalosRef.current
      .filter(halo => {
        const elapsed = now - halo.startTime;
        const progress = elapsed / 1000;
        
        if (progress >= 1) return false;
        
        halo.radius = halo.maxRadius * progress;
        halo.opacity = 0.6 * (1 - progress);
        
        return true;
      })
      .slice(0, maxHalos);

    // Update conversion effects with limits
    const maxConversions = performanceLevel === 'low' ? 1 : performanceLevel === 'medium' ? 2 : 3;
    conversionEffectsRef.current = conversionEffectsRef.current
      .filter(effect => {
        const elapsed = now - effect.startTime;
        if (elapsed > 1000) return false;
        
        effect.particles.forEach(particle => {
          particle.x += particle.vx * (deltaTime / 16); // Normalize for 60fps
          particle.y += particle.vy * (deltaTime / 16);
          particle.life -= deltaTime / 16;
          particle.vx *= 0.98;
          particle.vy *= 0.98;
        });
        
        effect.particles = effect.particles.filter(p => p.life > 0);
        
        return effect.particles.length > 0;
      })
      .slice(0, maxConversions);
  };

  const checkForEffects = (now: number) => {
    // Check for belief conversions
    network.nodes.forEach(node => {
      const previousBelief = previousBeliefsRef.current[node.id];
      if (previousBelief !== undefined && previousBelief !== node.believer && 
          node.x !== undefined && node.y !== undefined) {
        
        // Create conversion effect with reduced particles for low performance
        const particleCount = performanceLevel === 'low' ? 6 : performanceLevel === 'medium' ? 9 : 12;
        const conversionEffect: ConversionEffect = {
          id: `conversion-${node.id}-${now}`,
          x: node.x,
          y: node.y,
          particles: Array.from({ length: particleCount }, (_, i) => {
            const angle = (i / particleCount) * Math.PI * 2;
            const speed = 2 + Math.random() * 3;
            return {
              x: node.x,
              y: node.y,
              vx: Math.cos(angle) * speed,
              vy: Math.sin(angle) * speed,
              life: 60,
              maxLife: 60
            };
          }),
          startTime: now
        };
        
        conversionEffectsRef.current.push(conversionEffect);

        // Create belief wave
        const beliefWave: BeliefWave = {
          id: `wave-${node.id}-${now}`,
          x: node.x,
          y: node.y,
          radius: 0,
          maxRadius: performanceLevel === 'low' ? 80 : 120,
          opacity: 0.8,
          color: node.believer ? "#8B5CF6" : "#06B6D4",
          startTime: now
        };
        
        beliefWavesRef.current.push(beliefWave);
      }
      previousBeliefsRef.current[node.id] = node.believer;
    });

    // Check for new messages (reduced frequency for performance)
    if (performanceLevel !== 'low') {
      network.messageLog.slice(-3).forEach(message => {
        if (!recentMessagesRef.current.has(message.id)) {
          const senderNode = network.nodes.find(n => n.id === message.senderId);
          if (senderNode && senderNode.x !== undefined && senderNode.y !== undefined) {
            const influenceHalo: InfluenceHalo = {
              id: `halo-${message.id}`,
              x: senderNode.x,
              y: senderNode.y,
              radius: 0,
              maxRadius: 80,
              opacity: 0.6,
              startTime: now
            };
            
            influenceHalosRef.current.push(influenceHalo);
          }
          recentMessagesRef.current.add(message.id);
        }
      });

      // Clean up old message IDs
      if (recentMessagesRef.current.size > 25) {
        const messageIds = Array.from(recentMessagesRef.current);
        recentMessagesRef.current = new Set(messageIds.slice(-15));
      }
    }
  };

  const renderEffects = () => {
    if (!svgGroupRef.current) return;

    import("d3").then((d3) => {
      // Render belief waves
      const waves = svgGroupRef.current.selectAll(".belief-wave")
        .data(beliefWavesRef.current, (d: any) => d.id);

      waves.enter()
        .append("circle")
        .attr("class", "belief-wave")
        .attr("fill", "none")
        .attr("stroke-width", 3);

      waves
        .attr("cx", (d: BeliefWave) => d.x)
        .attr("cy", (d: BeliefWave) => d.y)
        .attr("r", (d: BeliefWave) => d.radius)
        .attr("stroke", (d: BeliefWave) => d.color)
        .attr("opacity", (d: BeliefWave) => d.opacity);

      waves.exit().remove();

      // Render influence halos (skip in low performance mode)
      if (performanceLevel !== 'low') {
        const halos = svgGroupRef.current.selectAll(".influence-halo")
          .data(influenceHalosRef.current, (d: any) => d.id);

        halos.enter()
          .append("circle")
          .attr("class", "influence-halo")
          .attr("fill", "#F97316")
          .attr("fill-opacity", 0.1)
          .attr("stroke", "#F97316")
          .attr("stroke-width", 2);

        halos
          .attr("cx", (d: InfluenceHalo) => d.x)
          .attr("cy", (d: InfluenceHalo) => d.y)
          .attr("r", (d: InfluenceHalo) => d.radius)
          .attr("opacity", (d: InfluenceHalo) => d.opacity);

        halos.exit().remove();
      }

      // Render conversion particles
      const allParticles = conversionEffectsRef.current.flatMap(effect => 
        effect.particles.map(particle => ({
          ...particle,
          effectId: effect.id
        }))
      );

      const particles = svgGroupRef.current.selectAll(".conversion-particle")
        .data(allParticles, (d: any) => `${d.effectId}-${Math.round(d.x)}-${Math.round(d.y)}`);

      particles.enter()
        .append("circle")
        .attr("class", "conversion-particle")
        .attr("r", 3)
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
