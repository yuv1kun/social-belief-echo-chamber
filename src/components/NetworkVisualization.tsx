
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
  const simulationRef = useRef<any>(null);
  const [animationFrame, setAnimationFrame] = useState(0);
  const [energyField, setEnergyField] = useState<{x: number, y: number, intensity: number}[]>([]);
  
  // Animation loop for holographic effects
  useEffect(() => {
    const interval = setInterval(() => {
      setAnimationFrame(prev => prev + 1);
      
      // Generate energy field points around influential agents
      const believers = network.nodes.filter(n => n.believer);
      const fields = believers.slice(0, 3).map(node => ({
        x: Math.random() * 800,
        y: Math.random() * 600,
        intensity: Math.random() * 100 + 50,
      }));
      setEnergyField(fields);
    }, 100);
    
    return () => clearInterval(interval);
  }, [network]);
  
  useEffect(() => {
    if (!svgRef.current) return;

    // Dynamic import of d3 to avoid SSR issues
    import("d3").then((d3) => {
      const svg = d3.select(svgRef.current);
      const width = svgRef.current.clientWidth;
      const height = svgRef.current.clientHeight;
      
      // Clear previous visualization
      svg.selectAll("*").remove();

      // Create advanced gradient definitions and filters
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

      // Particle system gradient
      const particleGradient = defs.append("linearGradient")
        .attr("id", "particleGradient")
        .attr("x1", "0%")
        .attr("y1", "0%")
        .attr("x2", "100%")
        .attr("y2", "100%");
      
      particleGradient.append("stop")
        .attr("offset", "0%")
        .attr("stop-color", "#06b6d4")
        .attr("stop-opacity", "1");
      
      particleGradient.append("stop")
        .attr("offset", "100%")
        .attr("stop-color", "#8B5CF6")
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
          .attr("stroke-opacity", 0.1)
          .attr("stroke-dasharray", "2,4");
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
          .attr("stroke-opacity", 0.1)
          .attr("stroke-dasharray", "2,4");
      }

      // Energy field effects
      const energyGroup = svg.append("g").attr("class", "energy-fields");
      
      energyField.forEach((field, index) => {
        energyGroup.append("circle")
          .attr("cx", field.x)
          .attr("cy", field.y)
          .attr("r", field.intensity)
          .attr("fill", "url(#energyGradient)")
          .attr("opacity", 0.3 + Math.sin(animationFrame * 0.1 + index) * 0.2)
          .style("animation", `pulse 2s ease-in-out infinite`);
      });

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
          d3.forceLink(links).id((d: any) => d.id).distance(80)
        )
        .force("charge", d3.forceManyBody().strength(-100))
        .force("center", d3.forceCenter(width / 2, height / 2))
        .force("collision", d3.forceCollide().radius(25))
        .force("x", d3.forceX(width / 2).strength(0.1))
        .force("y", d3.forceY(height / 2).strength(0.1));

      // Create particle trails for information flow
      const particleGroup = svg.append("g").attr("class", "particle-system");
      
      // Create animated data streams
      const createDataStream = (startX: number, startY: number, endX: number, endY: number) => {
        const particles = [];
        for (let i = 0; i < 5; i++) {
          const t = i / 4;
          particles.push({
            x: startX + (endX - startX) * t,
            y: startY + (endY - startY) * t,
            delay: i * 200,
          });
        }
        return particles;
      };

      // Enhanced links with data flow animation
      const link = svg
        .append("g")
        .attr("class", "links")
        .selectAll("line")
        .data(links)
        .join("line")
        .attr("class", "link")
        .attr("stroke", "#3a3a3a")
        .attr("stroke-opacity", 0.4)
        .attr("stroke-width", 2)
        .style("filter", "url(#holographicGlow)");

      // Add animated data flow particles
      links.forEach((linkData, index) => {
        if (index % 3 === 0) { // Only animate some links to avoid clutter
          const particles = createDataStream(0, 0, 100, 100); // Will be updated in tick
          
          particles.forEach((particle, pIndex) => {
            particleGroup.append("circle")
              .attr("class", "data-particle")
              .attr("r", 2)
              .attr("fill", "url(#particleGradient)")
              .style("opacity", 0.8)
              .style("animation", `particleFlow 2s linear infinite ${particle.delay}ms`);
          });
        }
      });

      // Enhanced nodes with 3D-like effects
      const nodeGroup = svg.append("g").attr("class", "nodes");
      
      nodes.forEach((node) => {
        const nodeElement = nodeGroup.append("g").attr("class", "node-group");
        
        // Outer glow ring
        nodeElement.append("circle")
          .attr("r", 18)
          .attr("fill", "none")
          .attr("stroke", node.believer ? "#8B5CF6" : "#94A3B8")
          .attr("stroke-width", 1)
          .attr("stroke-opacity", 0.3)
          .style("animation", `pulse 3s ease-in-out infinite ${node.id * 100}ms`);
        
        // Inner core
        nodeElement.append("circle")
          .attr("r", 12)
          .attr("fill", node.believer ? "#8B5CF6" : "#94A3B8")
          .attr("stroke", node.id === selectedAgentId ? "#F97316" : "#1a1a1a")
          .attr("stroke-width", node.id === selectedAgentId ? 3 : 1)
          .style("filter", node.id === selectedAgentId ? "url(#holographicGlow)" : "none")
          .style("cursor", "pointer");
        
        // Central dot for 3D effect
        nodeElement.append("circle")
          .attr("r", 4)
          .attr("fill", "#ffffff")
          .attr("opacity", 0.8);
        
        // Node label with holographic styling
        nodeElement.append("text")
          .attr("class", "node-label")
          .attr("text-anchor", "middle")
          .attr("dy", "-20px")
          .attr("font-size", "10px")
          .attr("fill", "#06b6d4")
          .attr("font-weight", "bold")
          .text(node.id)
          .style("text-shadow", "0 0 10px #06b6d4")
          .style("pointer-events", "none");
      });

      const node = nodeGroup.selectAll(".node-group");

      // Add holographic HUD overlays for influential nodes
      const influentialNodes = nodes.filter(n => {
        const connections = links.filter(l => 
          (typeof l.source === 'object' ? l.source.id : l.source) === n.id || 
          (typeof l.target === 'object' ? l.target.id : l.target) === n.id
        );
        return connections.length > 3;
      });

      influentialNodes.forEach((node) => {
        const hudGroup = svg.append("g").attr("class", "hud-overlay");
        
        // Hexagonal HUD frame
        const hexPath = "M-15,-8 L-8,-15 L8,-15 L15,-8 L15,8 L8,15 L-8,15 L-15,8 Z";
        
        hudGroup.append("path")
          .attr("d", hexPath)
          .attr("fill", "none")
          .attr("stroke", "#06b6d4")
          .attr("stroke-width", 1)
          .attr("stroke-opacity", 0.6)
          .style("animation", `rotate 10s linear infinite`);
        
        // Info panel
        hudGroup.append("rect")
          .attr("x", 20)
          .attr("y", -10)
          .attr("width", 80)
          .attr("height", 20)
          .attr("fill", "rgba(6, 182, 212, 0.1)")
          .attr("stroke", "#06b6d4")
          .attr("stroke-width", 1)
          .attr("rx", 3);
        
        hudGroup.append("text")
          .attr("x", 25)
          .attr("y", 5)
          .attr("font-size", "8px")
          .attr("fill", "#06b6d4")
          .text(`Agent ${node.id} - HIGH INFLUENCE`);
      });

      // Update positions on each tick
      simulation.on("tick", () => {
        // Keep nodes within bounds
        nodes.forEach(function(d) {
          d.x = Math.max(30, Math.min(width - 30, d.x || width/2));
          d.y = Math.max(30, Math.min(height - 30, d.y || height/2));
        });

        link
          .attr("x1", (d: any) => d.source.x)
          .attr("y1", (d: any) => d.source.y)
          .attr("x2", (d: any) => d.target.x)
          .attr("y2", (d: any) => d.target.y);

        node.attr("transform", (d: any) => `translate(${d.x},${d.y})`);
        
        // Update HUD overlays
        svg.selectAll(".hud-overlay")
          .attr("transform", (d: any, i: number) => {
            const influentialNode = influentialNodes[i];
            const nodeData = nodes.find(n => n.id === influentialNode.id);
            return nodeData ? `translate(${nodeData.x},${nodeData.y})` : "";
          });

        // Update particle positions along links
        svg.selectAll(".data-particle")
          .attr("cx", function(d: any, i: number) {
            const linkIndex = Math.floor(i / 5);
            const particleIndex = i % 5;
            const link = links[linkIndex * 3]; // Since we only animate every 3rd link
            if (link && typeof link.source === 'object' && typeof link.target === 'object') {
              const t = (particleIndex / 4 + (animationFrame * 0.02)) % 1;
              return link.source.x + (link.target.x - link.source.x) * t;
            }
            return 0;
          })
          .attr("cy", function(d: any, i: number) {
            const linkIndex = Math.floor(i / 5);
            const particleIndex = i % 5;
            const link = links[linkIndex * 3];
            if (link && typeof link.source === 'object' && typeof link.target === 'object') {
              const t = (particleIndex / 4 + (animationFrame * 0.02)) % 1;
              return link.source.y + (link.target.y - link.source.y) * t;
            }
            return 0;
          });
      });

      // Enhanced drag interaction
      node.call(
        d3
          .drag()
          .on("start", (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on("drag", (event, d) => {
            d.fx = Math.max(30, Math.min(width - 30, event.x));
            d.fy = Math.max(30, Math.min(height - 30, event.y));
          })
          .on("end", (event, d) => {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          })
      );

      // Click interaction
      node.on("click", (event, d) => {
        onSelectAgent(d.id);
      });

      simulationRef.current = simulation;

      // Cleanup
      return () => {
        if (simulationRef.current) simulationRef.current.stop();
      };
    });
  }, [network, selectedAgentId, onSelectAgent, animationFrame, energyField]);

  // Update node colors when belief states change
  useEffect(() => {
    import("d3").then((d3) => {
      if (!svgRef.current) return;

      const svg = d3.select(svgRef.current);
      
      svg.selectAll(".node-group").each(function(d: any, i: number) {
        const node = network.nodes[i];
        const group = d3.select(this);
        
        group.select("circle:nth-child(2)")
          .attr("fill", node.believer ? "#8B5CF6" : "#94A3B8")
          .attr("stroke", node.id === selectedAgentId ? "#F97316" : "#1a1a1a")
          .style("filter", node.id === selectedAgentId ? "url(#holographicGlow)" : "none");
      });
    });
  }, [network.nodes, selectedAgentId]);

  return (
    <Card className="overflow-hidden h-full bg-gradient-to-br from-slate-900 to-slate-800 border-cyan-500/30 shadow-lg shadow-cyan-500/20">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2 text-cyan-400">
              <Share2 className="h-5 w-5" />
              3D Network Visualization
            </CardTitle>
            <CardDescription>
              {network.currentTopic && (
                <Badge variant="outline" className="bg-cyan-500/10 border-cyan-500/30 text-cyan-400 mt-2">
                  <Zap className="h-3 w-3 mr-1" />
                  Topic: {network.currentTopic}
                </Badge>
              )}
            </CardDescription>
          </div>
          <div className="flex gap-2">
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
        <div className="w-full h-[500px] overflow-hidden relative">
          <style>{`
            @keyframes pulse {
              0%, 100% { opacity: 0.3; transform: scale(1); }
              50% { opacity: 0.8; transform: scale(1.1); }
            }
            @keyframes rotate {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
            @keyframes particleFlow {
              0% { opacity: 0; }
              20% { opacity: 1; }
              80% { opacity: 1; }
              100% { opacity: 0; }
            }
          `}</style>
          <svg
            ref={svgRef}
            className="w-full h-full bg-gradient-to-br from-slate-900/50 to-slate-800/50"
            viewBox={`0 0 ${svgRef.current?.clientWidth || 800} ${svgRef.current?.clientHeight || 600}`}
          />
          
          {/* Holographic overlay effects */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-4 left-4 bg-cyan-500/10 border border-cyan-500/30 rounded p-2 text-xs text-cyan-400">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
                NEURAL NETWORK ACTIVE
              </div>
            </div>
            
            <div className="absolute top-4 right-4 bg-purple-500/10 border border-purple-500/30 rounded p-2 text-xs text-purple-400">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                INFLUENCE PROPAGATION
              </div>
            </div>
            
            <div className="absolute bottom-4 left-4 bg-green-500/10 border border-green-500/30 rounded p-2 text-xs text-green-400">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                REAL-TIME SIMULATION
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default NetworkVisualization;
