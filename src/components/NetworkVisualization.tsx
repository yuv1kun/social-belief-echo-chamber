
import React, { useEffect, useRef } from "react";
import { Network } from "@/lib/simulation";
import { Card } from "@/components/ui/card";

interface NetworkVisualizationProps {
  network: Network;
  selectedAgentId: number | null;
  onSelectAgent: (id: number) => void;
}

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

const NetworkVisualization: React.FC<NetworkVisualizationProps> = ({
  network,
  selectedAgentId,
  onSelectAgent,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const simulationRef = useRef<any>(null);
  
  useEffect(() => {
    if (!svgRef.current) return;

    // Dynamic import of d3 to avoid SSR issues
    import("d3").then((d3) => {
      const svg = d3.select(svgRef.current);
      const width = svgRef.current.clientWidth;
      const height = svgRef.current.clientHeight;
      
      // Clear previous visualization
      svg.selectAll("*").remove();

      // Create the force simulation
      const nodes: ForceNode[] = network.nodes.map((agent) => ({
        id: agent.id,
        believer: agent.believer,
      }));

      const links: ForceLink[] = network.links.map((link) => ({
        source: link.source,
        target: link.target,
      }));

      const simulation = d3
        .forceSimulation(nodes)
        .force(
          "link",
          d3.forceLink(links).id((d: any) => d.id)
        )
        .force("charge", d3.forceManyBody().strength(-60))
        .force("center", d3.forceCenter(width / 2, height / 2))
        .force("collision", d3.forceCollide().radius(15));

      // Create the links
      const link = svg
        .append("g")
        .attr("stroke", "#3a3a3a")
        .attr("stroke-opacity", 0.6)
        .selectAll("line")
        .data(links)
        .join("line")
        .attr("class", "link");

      // Create the nodes
      const node = svg
        .append("g")
        .selectAll("circle")
        .data(nodes)
        .join("circle")
        .attr("r", 8)
        .attr("class", "node")
        .attr("fill", (d) => (d.believer ? "#8B5CF6" : "#94A3B8"))
        .attr("stroke", (d) => (d.id === selectedAgentId ? "#F97316" : "#1a1a1a"))
        .attr("stroke-width", (d) => (d.id === selectedAgentId ? 3 : 1))
        .on("click", (event, d) => {
          onSelectAgent(d.id);
        });

      // Add titles for tooltip effect
      node.append("title").text((d) => `Agent #${d.id} (${d.believer ? "Believer" : "Non-Believer"})`);

      // Update the positions on each tick
      simulation.on("tick", () => {
        link
          .attr("x1", (d: any) => d.source.x)
          .attr("y1", (d: any) => d.source.y)
          .attr("x2", (d: any) => d.target.x)
          .attr("y2", (d: any) => d.target.y);

        node.attr("cx", (d: any) => d.x).attr("cy", (d: any) => d.y);
      });

      // Allow drag and drop
      node.call(
        d3
          .drag<SVGCircleElement, ForceNode>()
          .on("start", (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on("drag", (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on("end", (event, d) => {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          })
      );

      simulationRef.current = simulation;

      // Cleanup
      return () => {
        if (simulationRef.current) simulationRef.current.stop();
      };
    });
  }, [network, selectedAgentId, onSelectAgent]);

  // Update node colors when only belief states change
  useEffect(() => {
    import("d3").then((d3) => {
      if (!svgRef.current) return;

      const svg = d3.select(svgRef.current);
      
      svg.selectAll("circle")
        .data(network.nodes)
        .attr("fill", (d: any) => (d.believer ? "#8B5CF6" : "#94A3B8"))
        .attr("stroke", (d: any) => (d.id === selectedAgentId ? "#F97316" : "#1a1a1a"));
    });
  }, [network.nodes, selectedAgentId]);

  return (
    <Card className="w-full h-[600px] overflow-hidden">
      <svg
        ref={svgRef}
        className="w-full h-full"
        viewBox={`0 0 ${svgRef.current?.clientWidth || 800} ${svgRef.current?.clientHeight || 600}`}
      />
    </Card>
  );
};

export default NetworkVisualization;
