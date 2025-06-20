
import React, { useEffect, useRef } from "react";
import { Network } from "@/lib/simulation";

interface RippleEffect {
  id: string;
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  opacity: number;
  color: string;
  startTime: number;
}

interface BeliefRipplesProps {
  network: Network;
  svgRef: React.RefObject<SVGSVGElement>;
}

const BeliefRipples: React.FC<BeliefRipplesProps> = ({ network, svgRef }) => {
  const ripplesRef = useRef<RippleEffect[]>([]);
  const animationRef = useRef<number>();
  const previousBeliefsRef = useRef<{ [key: number]: boolean }>({});

  useEffect(() => {
    if (!svgRef.current || !network.nodes || network.nodes.length === 0) return;

    import("d3").then((d3) => {
      const svg = d3.select(svgRef.current);
      
      // Remove existing ripples
      svg.selectAll(".belief-ripples").remove();
      
      const rippleGroup = svg.append("g").attr("class", "belief-ripples");

      // Check for belief changes and create ripples
      const checkBeliefChanges = () => {
        network.nodes.forEach(node => {
          const previousBelief = previousBeliefsRef.current[node.id];
          if (previousBelief !== undefined && previousBelief !== node.believer && 
              node.x !== undefined && node.y !== undefined) {
            
            const ripple: RippleEffect = {
              id: `ripple-${node.id}-${Date.now()}`,
              x: node.x,
              y: node.y,
              radius: 0,
              maxRadius: 60,
              opacity: 0.6,
              color: node.believer ? "#8B5CF6" : "#94A3B8",
              startTime: Date.now()
            };
            
            ripplesRef.current.push(ripple);
          }
          previousBeliefsRef.current[node.id] = node.believer;
        });
      };

      // Animate ripples
      const animateRipples = () => {
        const now = Date.now();
        
        // Update ripples
        ripplesRef.current = ripplesRef.current.filter(ripple => {
          const elapsed = now - ripple.startTime;
          const progress = elapsed / 1500; // 1.5 second animation
          
          if (progress >= 1) return false;
          
          ripple.radius = ripple.maxRadius * progress;
          ripple.opacity = 0.6 * (1 - progress);
          
          return true;
        });

        // Render ripples
        const ripples = rippleGroup.selectAll(".ripple")
          .data(ripplesRef.current, (d: any) => d.id);

        ripples.enter()
          .append("circle")
          .attr("class", "ripple")
          .attr("fill", "none")
          .attr("stroke-width", 2);

        ripples
          .attr("cx", (d: RippleEffect) => d.x)
          .attr("cy", (d: RippleEffect) => d.y)
          .attr("r", (d: RippleEffect) => d.radius)
          .attr("stroke", (d: RippleEffect) => d.color)
          .attr("opacity", (d: RippleEffect) => d.opacity);

        ripples.exit().remove();

        animationRef.current = requestAnimationFrame(animateRipples);
      };

      // Start checking for belief changes and animating
      checkBeliefChanges();
      animateRipples();

      // Set up interval to check for belief changes
      const intervalId = setInterval(checkBeliefChanges, 100);

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

export default BeliefRipples;
