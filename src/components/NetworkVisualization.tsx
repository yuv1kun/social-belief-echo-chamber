import React, { useEffect, useRef, useState } from "react";
import { Network } from "@/lib/simulation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Share2, Zap, Eye } from "lucide-react";

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
  const containerRef = useRef<HTMLDivElement>(null);
  const simulationRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dimensions, setDimensions] = useState({ width: 800, height: 500 });
  
  // Handle container resize
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({
          width: Math.max(rect.width, 400),
          height: Math.max(rect.height, 400)
        });
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Main D3 visualization effect - only re-run when network or dimensions change
  useEffect(() => {
    console.log("NetworkVisualization: Starting render with network:", {
      nodes: network.nodes.length,
      links: network.links.length,
      dimensions
    });

    if (!svgRef.current || !containerRef.current) {
      console.log("NetworkVisualization: Missing refs");
      return;
    }

    if (!network.nodes || network.nodes.length === 0) {
      console.log("NetworkVisualization: No nodes to render");
      setIsLoading(false);
      return;
    }

    // Dynamic import of d3
    import("d3").then((d3) => {
      setIsLoading(true);
      
      const svg = d3.select(svgRef.current);
      const { width, height } = dimensions;
      
      console.log("NetworkVisualization: D3 loaded, dimensions:", { width, height });
      
      // Clear previous visualization
      svg.selectAll("*").remove();

      // Create gradient definitions and filters
      const defs = svg.append("defs");
      
      // Holographic glow filter
      const glowFilter = defs.append("filter")
        .attr("id", "holographicGlow")
        .attr("x", "-100%")
        .attr("y", "-100%")
        .attr("width", "300%")
        .attr("height", "300%");
      
      glowFilter.append("feGaussianBlur")
        .attr("stdDeviation", "3")
        .attr("result", "coloredBlur");
      
      const feMerge = glowFilter.append("feMerge");
      feMerge.append("feMergeNode").attr("in", "coloredBlur");
      feMerge.append("feMergeNode").attr("in", "SourceGraphic");

      // Energy field gradient
      const energyGradient = defs.append("radialGradient")
        .attr("id", "energyGradient")
        .attr("cx", "50%")
        .attr("cy", "50%")
        .attr("r", "50%");
      
      energyGradient.append("stop")
        .attr("offset", "0%")
        .attr("stop-color", "#06b6d4")
        .attr("stop-opacity", "0.8");
      
      energyGradient.append("stop")
        .attr("offset", "70%")
        .attr("stop-color", "#8B5CF6")
        .attr("stop-opacity", "0.3");
      
      energyGradient.append("stop")
        .attr("offset", "100%")
        .attr("stop-color", "#06b6d4")
        .attr("stop-opacity", "0");

      // Create holographic background grid
      const gridSize = 30;
      const gridGroup = svg.append("g").attr("class", "holographic-grid");
      
      // Vertical lines
      for (let x = 0; x <= width; x += gridSize) {
        gridGroup.append("line")
          .attr("x1", x)
          .attr("y1", 0)
          .attr("x2", x)
          .attr("y2", height)
          .attr("stroke", "#06b6d4")
          .attr("stroke-width", 0.5)
          .attr("stroke-opacity", 0.1);
      }
      
      // Horizontal lines
      for (let y = 0; y <= height; y += gridSize) {
        gridGroup.append("line")
          .attr("x1", 0)
          .attr("y1", y)
          .attr("x2", width)
          .attr("y2", y)
          .attr("stroke", "#06b6d4")
          .attr("stroke-width", 0.5)
          .attr("stroke-opacity", 0.1);
      }

      // Create the force simulation data
      const nodes: ForceNode[] = network.nodes.map((agent) => ({
        id: agent.id,
        believer: agent.believer,
      }));

      const links: ForceLink[] = network.links.map((link) => ({
        source: link.source,
        target: link.target,
      }));

      console.log("NetworkVisualization: Created nodes and links:", { 
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

      console.log("NetworkVisualization: Created links:", link.size());

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

      console.log("NetworkVisualization: Created nodes:", nodeSelection.size());

      // Update positions on simulation tick
      simulation.on("tick", () => {
        // Keep nodes within bounds
        nodes.forEach(function(d) {
          if (d.x !== undefined && d.y !== undefined) {
            d.x = Math.max(30, Math.min(width - 30, d.x));
            d.y = Math.max(30, Math.min(height - 30, d.y));
          }
        });

        link
          .attr("x1", (d: any) => d.source.x || 0)
          .attr("y1", (d: any) => d.source.y || 0)
          .attr("x2", (d: any) => d.target.x || 0)
          .attr("y2", (d: any) => d.target.y || 0);

        nodeSelection.attr("transform", (d: any) => `translate(${d.x || 0},${d.y || 0})`);
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
        console.log("NetworkVisualization: Node clicked:", d.id);
        onSelectAgent(d.id);
      });

      simulationRef.current = simulation;
      setIsLoading(false);

      console.log("NetworkVisualization: Setup complete");

      // Cleanup
      return () => {
        if (simulationRef.current) simulationRef.current.stop();
      };
    }).catch((error) => {
      console.error("NetworkVisualization: Error loading D3:", error);
      setIsLoading(false);
    });
  }, [network, dimensions, selectedAgentId, onSelectAgent]);

  // Update node selection colors when selectedAgentId changes
  useEffect(() => {
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
  }, [selectedAgentId, network.nodes]);

  return (
    <Card className="overflow-hidden h-full bg-gradient-to-br from-slate-900 to-slate-800 border-cyan-500/30 shadow-lg shadow-cyan-500/20">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2 text-cyan-400">
              <Share2 className="h-5 w-5" />
              3D Network Visualization
            </CardTitle>
            <CardDescription className="text-gray-400">
              Interactive belief network simulation
            </CardDescription>
          </div>
          <div className="flex gap-2">
            {network.currentTopic && (
              <Badge variant="outline" className="bg-cyan-500/10 border-cyan-500/30 text-cyan-400">
                <Zap className="h-3 w-3 mr-1" />
                Topic: {network.currentTopic}
              </Badge>
            )}
            <Badge variant="default" className="bg-purple-600 text-white">
              <Eye className="h-3 w-3 mr-1" />
              {network.nodes.filter(n => n.believer).length} Believers
            </Badge>
            <Badge variant="secondary" className="bg-gray-600 text-white">
              {network.nodes.filter(n => !n.believer).length} Skeptics
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div 
          ref={containerRef}
          className="w-full h-[500px] overflow-hidden relative bg-gradient-to-br from-slate-900/50 to-slate-800/50"
        >
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50 z-10">
              <div className="text-cyan-400 animate-pulse">Loading Network...</div>
            </div>
          )}
          
          {!isLoading && network.nodes.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50 z-10">
              <div className="text-gray-400">No network data available</div>
            </div>
          )}
          
          <svg
            ref={svgRef}
            width={dimensions.width}
            height={dimensions.height}
            className="w-full h-full"
            style={{ display: 'block' }}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default NetworkVisualization;
