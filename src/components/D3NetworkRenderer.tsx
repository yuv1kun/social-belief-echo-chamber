import React from "react";
import { Network } from "@/lib/simulation";

interface ForceNode {
  id: number;
  believer: boolean;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
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

  React.useEffect(() => {
    if (!svgRef.current || !network.nodes || network.nodes.length === 0) {
      console.log("D3NetworkRenderer: Missing requirements", {
        svg: !!svgRef.current,
        nodes: network.nodes?.length || 0
      });
      return;
    }

    console.log("D3NetworkRenderer: Starting render", {
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
        x: width / 2 + (Math.random() - 0.5) * 100,
        y: height / 2 + (Math.random() - 0.5) * 100,
      }));

      const links: ForceLink[] = network.links.map((link) => ({
        source: link.source,
        target: link.target,
      }));

      console.log("D3NetworkRenderer: Created simulation data", { 
        nodeCount: nodes.length, 
        linkCount: links.length 
      });

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

      // Create links
      const link = svg
        .append("g")
        .attr("class", "links")
        .selectAll("line")
        .data(links)
        .join("line")
        .attr("stroke", "#3a3a3a")
        .attr("stroke-opacity", 0.6)
        .attr("stroke-width", 2)
        .style("filter", "url(#holographicGlow)");

      // Create nodes
      const nodeGroup = svg.append("g").attr("class", "nodes");
      
      const nodeSelection = nodeGroup.selectAll(".node-group")
        .data(nodes)
        .join("g")
        .attr("class", "node-group")
        .style("cursor", "pointer");

      // Outer glow ring
      nodeSelection.append("circle")
        .attr("r", 18)
        .attr("fill", "none")
        .attr("stroke", (d: ForceNode) => d.believer ? "#8B5CF6" : "#94A3B8")
        .attr("stroke-width", 1)
        .attr("stroke-opacity", 0.5);
      
      // Inner core
      nodeSelection.append("circle")
        .attr("r", 12)
        .attr("fill", (d: ForceNode) => d.believer ? "#8B5CF6" : "#94A3B8")
        .attr("stroke", (d: ForceNode) => d.id === selectedAgentId ? "#F97316" : "#1a1a1a")
        .attr("stroke-width", (d: ForceNode) => d.id === selectedAgentId ? 3 : 1)
        .style("filter", (d: ForceNode) => d.id === selectedAgentId ? "url(#holographicGlow)" : "none");
      
      // Central dot for 3D effect
      nodeSelection.append("circle")
        .attr("r", 4)
        .attr("fill", "#ffffff")
        .attr("opacity", 0.8);
      
      // Node labels
      nodeSelection.append("text")
        .attr("text-anchor", "middle")
        .attr("dy", "-20px")
        .attr("font-size", "10px")
        .attr("fill", "#06b6d4")
        .attr("font-weight", "bold")
        .text((d: ForceNode) => d.id)
        .style("pointer-events", "none");

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

      // Drag interaction
      nodeSelection.call(
        d3
          .drag()
          .on("start", (event, d: any) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on("drag", (event, d: any) => {
            d.fx = Math.max(30, Math.min(width - 30, event.x));
            d.fy = Math.max(30, Math.min(height - 30, event.y));
          })
          .on("end", (event, d: any) => {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          })
      );

      // Click interaction
      nodeSelection.on("click", (event, d: ForceNode) => {
        console.log("D3NetworkRenderer: Node clicked:", d.id);
        onSelectAgent(d.id);
      });

      simulationRef.current = simulation;
      console.log("D3NetworkRenderer: Setup complete");
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
        
        group.select("circle:nth-child(2)")
          .attr("stroke", nodeData.id === selectedAgentId ? "#F97316" : "#1a1a1a")
          .attr("stroke-width", nodeData.id === selectedAgentId ? 3 : 1)
          .style("filter", nodeData.id === selectedAgentId ? "url(#holographicGlow)" : "none");
      });
    });
  }, [selectedAgentId, network.nodes, svgRef]);

  return null;
};

export default D3NetworkRenderer;
