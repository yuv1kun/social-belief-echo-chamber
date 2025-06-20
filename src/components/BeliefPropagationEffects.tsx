
import React, { useEffect, useRef } from "react";
import { Network } from "@/lib/simulation";

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

interface BeliefPropagationEffectsProps {
  network: Network;
  svgRef: React.RefObject<SVGSVGElement>;
}

const BeliefPropagationEffects: React.FC<BeliefPropagationEffectsProps> = ({ 
  network, 
  svgRef 
}) => {
  const beliefWavesRef = useRef<BeliefWave[]>([]);
  const influenceHalosRef = useRef<InfluenceHalo[]>([]);
  const conversionEffectsRef = useRef<ConversionEffect[]>([]);
  const animationRef = useRef<number>();
  const previousBeliefsRef = useRef<{ [key: number]: boolean }>({});
  const recentMessagesRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!svgRef.current || !network.nodes || network.nodes.length === 0) return;

    import("d3").then((d3) => {
      const svg = d3.select(svgRef.current);
      
      // Remove existing effects
      svg.selectAll(".belief-propagation-effects").remove();
      
      const effectsGroup = svg.append("g").attr("class", "belief-propagation-effects");

      // Check for belief changes and new messages
      const checkForEffects = () => {
        // Check for belief conversions
        network.nodes.forEach(node => {
          const previousBelief = previousBeliefsRef.current[node.id];
          if (previousBelief !== undefined && previousBelief !== node.believer && 
              node.x !== undefined && node.y !== undefined) {
            
            // Create conversion effect
            const conversionEffect: ConversionEffect = {
              id: `conversion-${node.id}-${Date.now()}`,
              x: node.x,
              y: node.y,
              particles: Array.from({ length: 12 }, (_, i) => {
                const angle = (i / 12) * Math.PI * 2;
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
              startTime: Date.now()
            };
            
            conversionEffectsRef.current.push(conversionEffect);

            // Create belief wave
            const beliefWave: BeliefWave = {
              id: `wave-${node.id}-${Date.now()}`,
              x: node.x,
              y: node.y,
              radius: 0,
              maxRadius: 120,
              opacity: 0.8,
              color: node.believer ? "#8B5CF6" : "#06B6D4",
              startTime: Date.now()
            };
            
            beliefWavesRef.current.push(beliefWave);
          }
          previousBeliefsRef.current[node.id] = node.believer;
        });

        // Check for new messages to create influence halos
        network.messageLog.slice(-5).forEach(message => {
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
                startTime: Date.now()
              };
              
              influenceHalosRef.current.push(influenceHalo);
            }
            recentMessagesRef.current.add(message.id);
          }
        });

        // Clean up old message IDs
        if (recentMessagesRef.current.size > 50) {
          const messageIds = Array.from(recentMessagesRef.current);
          recentMessagesRef.current = new Set(messageIds.slice(-25));
        }
      };

      // Animate effects
      const animateEffects = () => {
        const now = Date.now();
        
        // Update belief waves
        beliefWavesRef.current = beliefWavesRef.current.filter(wave => {
          const elapsed = now - wave.startTime;
          const progress = elapsed / 2000; // 2 second animation
          
          if (progress >= 1) return false;
          
          wave.radius = wave.maxRadius * progress;
          wave.opacity = 0.8 * (1 - progress);
          
          return true;
        });

        // Update influence halos
        influenceHalosRef.current = influenceHalosRef.current.filter(halo => {
          const elapsed = now - halo.startTime;
          const progress = elapsed / 1000; // 1 second animation
          
          if (progress >= 1) return false;
          
          halo.radius = halo.maxRadius * progress;
          halo.opacity = 0.6 * (1 - progress);
          
          return true;
        });

        // Update conversion effects
        conversionEffectsRef.current = conversionEffectsRef.current.filter(effect => {
          const elapsed = now - effect.startTime;
          if (elapsed > 1000) return false; // 1 second max life
          
          effect.particles.forEach(particle => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.life--;
            particle.vx *= 0.98; // Slight deceleration
            particle.vy *= 0.98;
          });
          
          effect.particles = effect.particles.filter(p => p.life > 0);
          
          return effect.particles.length > 0;
        });

        // Render belief waves
        const waves = effectsGroup.selectAll(".belief-wave")
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

        // Render influence halos
        const halos = effectsGroup.selectAll(".influence-halo")
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

        // Render conversion particles
        const allParticles = conversionEffectsRef.current.flatMap(effect => 
          effect.particles.map(particle => ({
            ...particle,
            effectId: effect.id
          }))
        );

        const particles = effectsGroup.selectAll(".conversion-particle")
          .data(allParticles, (d: any) => `${d.effectId}-${d.x}-${d.y}`);

        particles.enter()
          .append("circle")
          .attr("class", "conversion-particle")
          .attr("r", 3)
          .attr("fill", "#FCD34D")
          .style("filter", "url(#particleGlow)");

        particles
          .attr("cx", (d: any) => d.x)
          .attr("cy", (d: any) => d.y)
          .attr("opacity", (d: any) => d.life / d.maxLife);

        particles.exit().remove();

        animationRef.current = requestAnimationFrame(animateEffects);
      };

      // Start checking for effects and animating
      checkForEffects();
      animateEffects();

      // Set up interval to check for new effects
      const intervalId = setInterval(checkForEffects, 100);

      // Cleanup
      return () => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
        clearInterval(intervalId);
      };
    });
  }, [network, svgRef]);

  return null;
};

export default BeliefPropagationEffects;
