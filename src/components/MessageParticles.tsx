
import React, { useEffect, useRef } from "react";
import { Network } from "@/lib/simulation";

interface MessageParticle {
  id: string;
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  progress: number;
  speed: number;
  color: string;
  size: number;
}

interface MessageParticlesProps {
  network: Network;
  width: number;
  height: number;
  svgRef: React.RefObject<SVGSVGElement>;
}

const MessageParticles: React.FC<MessageParticlesProps> = ({
  network,
  width,
  height,
  svgRef,
}) => {
  const particlesRef = useRef<MessageParticle[]>([]);
  const animationRef = useRef<number>();

  useEffect(() => {
    if (!svgRef.current || !network.nodes || network.nodes.length === 0) return;

    import("d3").then((d3) => {
      const svg = d3.select(svgRef.current);
      
      // Remove existing particles
      svg.selectAll(".message-particles").remove();
      
      const particleGroup = svg.append("g").attr("class", "message-particles");

      // Generate particles for recent messages
      const generateParticles = () => {
        const recentMessages = network.messageLog.slice(-10); // Last 10 messages
        
        recentMessages.forEach((message, index) => {
          const sourceNode = network.nodes.find(n => n.id === message.senderId);
          const targetNode = network.nodes.find(n => n.id === message.receiverId);
          
          if (sourceNode && targetNode && sourceNode.x !== undefined && sourceNode.y !== undefined && 
              targetNode.x !== undefined && targetNode.y !== undefined) {
            
            const particle: MessageParticle = {
              id: `particle-${message.id}-${index}`,
              sourceX: sourceNode.x,
              sourceY: sourceNode.y,
              targetX: targetNode.x,
              targetY: targetNode.y,
              progress: 0,
              speed: 0.02 + Math.random() * 0.02,
              color: message.belief ? "#8B5CF6" : "#06B6D4",
              size: 3 + Math.random() * 2
            };
            
            particlesRef.current.push(particle);
          }
        });
      };

      // Animate particles
      const animateParticles = () => {
        particlesRef.current = particlesRef.current.filter(particle => particle.progress < 1);
        
        // Update particle positions
        particlesRef.current.forEach(particle => {
          particle.progress += particle.speed;
        });

        // Render particles
        const particles = particleGroup.selectAll(".particle")
          .data(particlesRef.current, (d: any) => d.id);

        particles.enter()
          .append("circle")
          .attr("class", "particle")
          .attr("r", (d: MessageParticle) => d.size)
          .attr("fill", (d: MessageParticle) => d.color)
          .attr("opacity", 0.8)
          .style("filter", "url(#particleGlow)");

        particles
          .attr("cx", (d: MessageParticle) => d.sourceX + (d.targetX - d.sourceX) * d.progress)
          .attr("cy", (d: MessageParticle) => d.sourceY + (d.targetY - d.sourceY) * d.progress)
          .attr("opacity", (d: MessageParticle) => 0.8 * (1 - d.progress));

        particles.exit().remove();

        animationRef.current = requestAnimationFrame(animateParticles);
      };

      // Generate initial particles and start animation
      generateParticles();
      animateParticles();

      // Cleanup
      return () => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
      };
    });
  }, [network, width, height, svgRef]);

  return null;
};

export default MessageParticles;
