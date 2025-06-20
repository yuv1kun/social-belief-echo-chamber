
import React from "react";
import { Network } from "@/lib/simulation";
import MessageParticles from "./MessageParticles";
import BeliefRipples from "./BeliefRipples";
import EnhancedNetworkEffects from "./EnhancedNetworkEffects";

interface ForceNode {
  id: number;
  believer: boolean;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
  traits?: {
    openness: number;
    conscientiousness: number;
    extraversion: number;
    agreeableness: number;
    neuroticism: number;
  };
}

interface ForceLink {
  source: number | ForceNode;
  target: number | ForceNode;
}

interface D3NetworkRendererProps {
  network: Network;
  selectedAgentId: number | null;
  onSelectAgent: (id: number) => void;
  width: number;
  height: number;
  svgRef: React.RefObject<SVGSVGElement>;
}

const D3NetworkRenderer: React.FC<D3NetworkRendererProps> = ({
  network,
  selectedAgentId,
  onSelectAgent,
  width,
  height,
  svgRef,
}) => {
  const simulationRef = React.useRef<any>(null);

  // Function to get personality-based node shape
  const getNodeShape = (traits: any) => {
    if (!traits) return "circle";
    
    const { openness, extraversion, conscientiousness } = traits;
    
    if (openness > 0.7) return "star";
    if (extraversion > 0.7) return "diamond";
    if (conscientiousness > 0.7) return "square";
    return "circle";
  };

  // Function to get node size based on traits
  const getNodeSize = (traits: any) => {
    if (!traits) return 12;
    
    const { extraversion, neuroticism } = traits;
    const baseSize = 12;
    const sizeModifier = (extraversion * 0.3) + (neuroticism * 0.2);
    
    return Math.max(8, Math.min(16, baseSize + sizeModifier * 6));
  };

  React.useEffect(() => {
    if (!svgRef.current || !network.nodes || network.nodes.length === 0) {
      console.log("D3NetworkRenderer: Missing requirements", {
        svg: !!svgRef.current,
        nodes: network.nodes?.length || 0
      });
      return;
    }

    console.log("D3NetworkRenderer: Starting enhanced render", {
      nodes: network.nodes.length,
      links: network.links.length,
      dimensions: { width, height }
    });

    import("d3").then((d3) => {
      const svg = d3.select(svgRef.current);
      
      // Clear previous network elements (but keep background)
      svg.selectAll(".links").remove();
      svg.selectAll(".nodes").remove();

      // Create the force simulation data
      const nodes: ForceNode[] = network.nodes.map((agent) => ({
        id: agent.id,
        believer: agent.believer,
        traits: agent.traits,
        x: width / 2 + (Math.random() - 0.5) * 100,
        y: height / 2 + (Math.random() - 0.5) * 100,
      }));

      const links: ForceLink[] = network.links.map((link) => ({
        source: link.source,
        target: link.target,
      }));

      // Create the force simulation
      const simulation = d3
        .forceSimulation(nodes)
        .force(
          "link",
          d3.forceLink(links).id((d: any) => d.id).distance(80)
        )
        .force("charge", d3.forceManyBody().strength(-200))
        .force("center", d3.forceCenter(width / 2, height / 2))
        .force("collision", d3.forceCollide().radius(25));

      // Create enhanced links with gradient colors
      const link = svg
        .append("g")
        .attr("class", "links")
        .selectAll("line")
        .data(links)
        .join("line")
        .attr("stroke", "url(#linkGradient)")
        .attr("stroke-opacity", 0.4)
        .attr("stroke-width", 2)
        .style("filter", "url(#holographicGlow)")
        .style("transition", "all 0.3s ease");

      // Create link gradient
      const linkGradient = svg.select("defs").append("linearGradient")
        .attr("id", "linkGradient")
        .attr("gradientUnits", "userSpaceOnUse");

      linkGradient.append("stop")
        .attr("offset", "0%")
        .attr("stop-color", "#06B6D4")
        .attr("stop-opacity", 0.6);

      linkGradient.append("stop")
        .attr("offset", "100%")
        .attr("stop-color", "#8B5CF6")
        .attr("stop-opacity", 0.3);

      // Create enhanced nodes
      const nodeGroup = svg.append("g").attr("class", "nodes");
      
      const nodeSelection = nodeGroup.selectAll(".node-group")
        .data(nodes)
        .join("g")
        .attr("class", "node-group")
        .style("cursor", "pointer");

      // Enhanced outer glow ring with pulsing animation
      nodeSelection.append("circle")
        .attr("class", "outer-glow")
        .attr("r", (d: ForceNode) => getNodeSize(d.traits) + 8)
        .attr("fill", "none")
        .attr("stroke", (d: ForceNode) => d.believer ? "#8B5CF6" : "#94A3B8")
        .attr("stroke-width", 1)
        .attr("stroke-opacity", 0.5)
        .style("animation", "pulse 2s ease-in-out infinite");
      
      // Enhanced inner core with personality-based gradients
      nodeSelection.append("circle")
        .attr("class", "inner-core")
        .attr("r", (d: ForceNode) => getNodeSize(d.traits))
        .attr("fill", (d: ForceNode) => d.believer ? "url(#believerGradient)" : "url(#skepticGradient)")
        .attr("stroke", (d: ForceNode) => d.id === selectedAgentId ? "#F97316" : "#1a1a1a")
        .attr("stroke-width", (d: ForceNode) => d.id === selectedAgentId ? 3 : 1)
        .style("filter", (d: ForceNode) => d.id === selectedAgentId ? "url(#pulseGlow)" : "url(#holographicGlow)")
        .style("transition", "all 0.3s ease");
      
      // Personality indicator dots
      nodeSelection.each(function(d: ForceNode) {
        const group = d3.select(this);
        if (d.traits) {
          const { openness, extraversion, conscientiousness } = d.traits;
          
          // Add small dots for high personality traits
          if (openness > 0.7) {
            group.append("circle")
              .attr("class", "trait-indicator")
              .attr("cx", -8)
              .attr("cy", -8)
              .attr("r", 2)
              .attr("fill", "#FCD34D")
              .attr("opacity", 0.8);
          }
          
          if (extraversion > 0.7) {
            group.append("circle")
              .attr("class", "trait-indicator")
              .attr("cx", 8)
              .attr("cy", -8)
              .attr("r", 2)
              .attr("fill", "#F97316")
              .attr("opacity", 0.8);
          }
          
          if (conscientiousness > 0.7) {
            group.append("circle")
              .attr("class", "trait-indicator")
              .attr("cx", 0)
              .attr("cy", -10)
              .attr("r", 2)
              .attr("fill", "#10B981")
              .attr("opacity", 0.8);
          }
        }
      });
      
      // Central highlight for 3D effect
      nodeSelection.append("circle")
        .attr("class", "highlight")
        .attr("r", 3)
        .attr("fill", "#ffffff")
        .attr("opacity", 0.9)
        .attr("cx", -2)
        .attr("cy", -2);
      
      // Enhanced node labels with better styling
      nodeSelection.append("text")
        .attr("class", "node-label")
        .attr("text-anchor", "middle")
        .attr("dy", (d: ForceNode) => -(getNodeSize(d.traits) + 12) + "px")
        .attr("font-size", "11px")
        .attr("fill", "#06b6d4")
        .attr("font-weight", "bold")
        .attr("stroke", "#000")
        .attr("stroke-width", 0.5)
        .text((d: ForceNode) => d.id)
        .style("pointer-events", "none")
        .style("text-shadow", "0 0 3px rgba(0,0,0,0.8)");

      // Update positions on simulation tick
      simulation.on("tick", () => {
        // Keep nodes within bounds with proper null checks
        nodes.forEach(function(d) {
          if (d.x !== undefined && d.y !== undefined) {
            d.x = Math.max(30, Math.min(width - 30, d.x));
            d.y = Math.max(30, Math.min(height - 30, d.y));
          }
        });

        link
          .attr("x1", (d: any) => (d.source && d.source.x) || 0)
          .attr("y1", (d: any) => (d.source && d.source.y) || 0)
          .attr("x2", (d: any) => (d.target && d.target.x) || 0)
          .attr("y2", (d: any) => (d.target && d.target.y) || 0);

        nodeSelection.attr("transform", (d: any) => {
          const x = d.x || width / 2;
          const y = d.y || height / 2;
          return `translate(${x},${y})`;
        });
      });

      // Enhanced drag interaction with visual feedback
      nodeSelection.call(
        d3
          .drag()
          .on("start", (event, d: any) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
            
            // Add visual feedback for dragging
            d3.select(event.sourceEvent.target.parentNode)
              .select(".inner-core")
              .style("filter", "url(#pulseGlow)")
              .attr("stroke-width", 3);
          })
          .on("drag", (event, d: any) => {
            d.fx = Math.max(30, Math.min(width - 30, event.x));
            d.fy = Math.max(30, Math.min(height - 30, event.y));
          })
          .on("end", (event, d: any) => {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
            
            // Remove visual feedback
            d3.select(event.sourceEvent.target.parentNode)
              .select(".inner-core")
              .style("filter", "url(#holographicGlow)")
              .attr("stroke-width", 1);
          })
      );

      // Enhanced click interaction with ripple effect
      nodeSelection.on("click", (event, d: ForceNode) => {
        console.log("D3NetworkRenderer: Node clicked:", d.id);
        onSelectAgent(d.id);
        
        // Create selection ripple effect
        const clickGroup = d3.select(event.currentTarget);
        const ripple = clickGroup.append("circle")
          .attr("class", "click-ripple")
          .attr("r", 0)
          .attr("fill", "none")
          .attr("stroke", "#F97316")
          .attr("stroke-width", 2)
          .attr("opacity", 0.8);
        
        ripple.transition()
          .duration(600)
          .attr("r", 30)
          .attr("opacity", 0)
          .on("end", function() {
            d3.select(this).remove();
          });
      });

      simulationRef.current = simulation;
      console.log("D3NetworkRenderer: Enhanced setup complete");
    }).catch((error) => {
      console.error("D3NetworkRenderer: Error loading D3:", error);
    });

    // Cleanup
    return () => {
      if (simulationRef.current) {
        simulationRef.current.stop();
      }
    };
  }, [network, width, height, svgRef, onSelectAgent]);

  // Update node selection when selectedAgentId changes
  React.useEffect(() => {
    if (!svgRef.current) return;

    import("d3").then((d3) => {
      const svg = d3.select(svgRef.current);
      
      svg.selectAll(".node-group").each(function(d: any) {
        const nodeData = network.nodes.find(n => n.id === d.id);
        if (!nodeData) return;
        
        const group = d3.select(this);
        
        group.select(".inner-core")
          .attr("stroke", nodeData.id === selectedAgentId ? "#F97316" : "#1a1a1a")
          .attr("stroke-width", nodeData.id === selectedAgentId ? 3 : 1)
          .style("filter", nodeData.id === selectedAgentId ? "url(#pulseGlow)" : "url(#holographicGlow)");
      });
    });
  }, [selectedAgentId, network.nodes, svgRef]);

  return (
    <>
      <EnhancedNetworkEffects svgRef={svgRef} />
      <MessageParticles 
        network={network} 
        width={width} 
        height={height} 
        svgRef={svgRef} 
      />
      <BeliefRipples network={network} svgRef={svgRef} />
    </>
  );
};

export default D3NetworkRenderer;
