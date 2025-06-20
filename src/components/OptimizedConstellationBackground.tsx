
import React from "react";

interface OptimizedConstellationBackgroundProps {
  width: number;
  height: number;
  svgRef: React.RefObject<SVGSVGElement>;
}

const OptimizedConstellationBackground: React.FC<OptimizedConstellationBackgroundProps> = ({
  width,
  height,
  svgRef,
}) => {
  React.useEffect(() => {
    if (!svgRef.current) return;

    import("d3").then((d3) => {
      const svg = d3.select(svgRef.current);
      
      // Remove existing constellation
      svg.select(".constellation-background").remove();
      
      const constellationGroup = svg.insert("g", ":first-child")
        .attr("class", "constellation-background");

      // Drastically reduce star count for better performance
      const starDensity = Math.min(0.5, (width * height) / 1000000); // Even lower density
      const starCount = Math.floor(Math.min(25, (width * height) / 20000 * starDensity)); // Fewer stars
      
      const stars = Array.from({ length: starCount }, (_, i) => ({
        id: i,
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 1 + 0.5, // Smaller stars
        opacity: Math.random() * 0.4 + 0.3, // Lower opacity
        animationDelay: Math.random() * 4 // Longer delays
      }));

      // Create stars with minimal effects
      const starElements = constellationGroup.selectAll(".star")
        .data(stars)
        .join("circle")
        .attr("class", "star optimized-star")
        .attr("cx", d => d.x)
        .attr("cy", d => d.y)
        .attr("r", d => d.size)
        .attr("fill", "#06B6D4")
        .attr("opacity", d => d.opacity)
        .style("animation-delay", d => `${d.animationDelay}s`);

      // Minimal constellation connections
      const connectionCount = Math.min(Math.floor(starCount / 15), 4); // Fewer connections
      for (let i = 0; i < connectionCount; i++) {
        const star1 = stars[Math.floor(Math.random() * stars.length)];
        const star2 = stars[Math.floor(Math.random() * stars.length)];
        
        const distance = Math.sqrt(
          Math.pow(star1.x - star2.x, 2) + Math.pow(star1.y - star2.y, 2)
        );
        
        // Only connect very nearby stars
        if (distance < Math.min(100, Math.min(width, height) / 6)) {
          constellationGroup.append("line")
            .attr("class", "constellation-line")
            .attr("x1", star1.x)
            .attr("y1", star1.y)
            .attr("x2", star2.x)
            .attr("y2", star2.y)
            .attr("stroke", "#06B6D4")
            .attr("stroke-width", 0.3) // Thinner lines
            .attr("stroke-opacity", 0.1); // Very low opacity
        }
      }

      // Minimal filters for better performance
      let defs = svg.select("defs");
      if (defs.empty()) {
        defs = svg.append("defs");
      }

      if (defs.select("#starGlow").empty()) {
        const starFilter = defs.append("filter")
          .attr("id", "starGlow")
          .attr("x", "-25%")
          .attr("y", "-25%")
          .attr("width", "150%")
          .attr("height", "150%");

        starFilter.append("feGaussianBlur")
          .attr("stdDeviation", "0.5") // Reduced blur
          .attr("result", "starBlur");

        const starMerge = starFilter.append("feMerge");
        starMerge.append("feMergeNode").attr("in", "starBlur");
        starMerge.append("feMergeNode").attr("in", "SourceGraphic");
      }
    });
  }, [width, height, svgRef]);

  return null;
};

export default OptimizedConstellationBackground;
