
import React from "react";

interface NetworkBackgroundProps {
  width: number;
  height: number;
  svgRef: React.RefObject<SVGSVGElement>;
}

const NetworkBackground: React.FC<NetworkBackgroundProps> = ({
  width,
  height,
  svgRef,
}) => {
  React.useEffect(() => {
    if (!svgRef.current) return;

    import("d3").then((d3) => {
      const svg = d3.select(svgRef.current);
      
      // Create gradient definitions and filters
      let defs = svg.select("defs");
      if (defs.empty()) {
        defs = svg.append("defs");
      }
      
      // Holographic glow filter
      if (defs.select("#holographicGlow").empty()) {
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
      }

      // Energy field gradient
      if (defs.select("#energyGradient").empty()) {
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
      }

      // Create holographic background grid
      const gridSize = 30;
      let gridGroup = svg.select(".holographic-grid");
      if (gridGroup.empty()) {
        gridGroup = svg.append("g").attr("class", "holographic-grid");
      } else {
        gridGroup.selectAll("*").remove();
      }
      
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
    });
  }, [width, height, svgRef]);

  return null;
};

export default NetworkBackground;
