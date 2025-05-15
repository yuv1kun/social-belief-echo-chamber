
import React, { useEffect, useRef } from "react";
import { Network } from "@/lib/simulation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Share2 } from "lucide-react";

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

      // Create gradient definitions
      const defs = svg.append("defs");
      
      // Add glow filter for selected nodes
      const filter = defs.append("filter")
        .attr("id", "glow")
        .attr("x", "-50%")
        .attr("y", "-50%")
        .attr("width", "200%")
        .attr("height", "200%");
      
      filter.append("feGaussianBlur")
        .attr("stdDeviation", "4")
        .attr("result", "coloredBlur");
      
      const feMerge = filter.append("feMerge");
      feMerge.append("feMergeNode")
        .attr("in", "coloredBlur");
      feMerge.append("feMergeNode")
        .attr("in", "SourceGraphic");

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
        .force("charge", d3.forceManyBody().strength(-70))
        .force("center", d3.forceCenter(width / 2, height / 2))
        .force("collision", d3.forceCollide().radius(18))
        .force("x", d3.forceX(width / 2).strength(0.05))
        .force("y", d3.forceY(height / 2).strength(0.05));

      // Add a subtle background grid pattern
      const gridSize = 20;
      svg.append("g")
        .attr("class", "grid")
        .selectAll("line.horizontal")
        .data(d3.range(0, height, gridSize))
        .enter()
        .append("line")
        .attr("class", "horizontal")
        .attr("x1", 0)
        .attr("y1", (d) => d)
        .attr("x2", width)
        .attr("y2", (d) => d)
        .style("stroke", "#3a3a3a")
        .style("stroke-width", 0.2)
        .style("stroke-opacity", 0.2);

      svg.select("g.grid")
        .selectAll("line.vertical")
        .data(d3.range(0, width, gridSize))
        .enter()
        .append("line")
        .attr("class", "vertical")
        .attr("x1", (d) => d)
        .attr("y1", 0)
        .attr("x2", (d) => d)
        .attr("y2", height)
        .style("stroke", "#3a3a3a")
        .style("stroke-width", 0.2)
        .style("stroke-opacity", 0.2);

      // Create the links with gradients
      const link = svg
        .append("g")
        .attr("class", "links")
        .selectAll("line")
        .data(links)
        .join("line")
        .attr("class", "link")
        .attr("stroke", "#3a3a3a")
        .attr("stroke-opacity", 0.6)
        .attr("stroke-width", 1);

      // Create the nodes
      const node = svg
        .append("g")
        .attr("class", "nodes")
        .selectAll("circle")
        .data(nodes)
        .join("circle")
        .attr("r", 10)
        .attr("class", "node")
        .attr("fill", (d) => (d.believer ? "#8B5CF6" : "#94A3B8"))
        .attr("stroke", (d) => (d.id === selectedAgentId ? "#F97316" : "#1a1a1a"))
        .attr("stroke-width", (d) => (d.id === selectedAgentId ? 3 : 1))
        .style("filter", (d) => (d.id === selectedAgentId ? "url(#glow)" : "none"))
        .on("click", (event, d) => {
          onSelectAgent(d.id);
        });

      // Add a subtle pulse animation to the nodes
      node.append("animate")
        .attr("attributeName", "r")
        .attr("values", (d) => d.believer ? "10;12;10" : "10;11;10")
        .attr("dur", (d) => d.believer ? "3s" : "4s")
        .attr("repeatCount", "indefinite");
      
      // Add node labels
      const labels = svg
        .append("g")
        .selectAll("text")
        .data(nodes)
        .join("text")
        .attr("class", "node-label")
        .attr("text-anchor", "middle")
        .attr("dy", ".35em")
        .attr("font-size", "8px")
        .attr("fill", "#ffffff")
        .text((d) => d.id)
        .style("pointer-events", "none");

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
        
        labels
          .attr("x", (d: any) => d.x)
          .attr("y", (d: any) => d.y);
      });

      // Allow drag and drop
      node.call(
        d3
          .drag()
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
        .attr("stroke", (d: any) => (d.id === selectedAgentId ? "#F97316" : "#1a1a1a"))
        .style("filter", (d: any) => (d.id === selectedAgentId ? "url(#glow)" : "none"));
    });
  }, [network.nodes, selectedAgentId]);

  return (
    <Card className="overflow-hidden h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Share2 className="h-5 w-5" />
              Network Visualization
            </CardTitle>
            <CardDescription>
              {network.currentTopic && (
                <Badge variant="outline" className="bg-slate-100 mt-2">
                  <span className="text-black">Topic: {network.currentTopic}</span>
                </Badge>
              )}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Badge variant="default">{network.nodes.filter(n => n.believer).length} Believers</Badge>
            <Badge variant="secondary">{network.nodes.filter(n => !n.believer).length} Skeptics</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="w-full h-[500px] overflow-hidden">
          <svg
            ref={svgRef}
            className="w-full h-full"
            viewBox={`0 0 ${svgRef.current?.clientWidth || 800} ${svgRef.current?.clientHeight || 600}`}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default NetworkVisualization;
