
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

      // Reduce star count based on screen size for better performance
      const starDensity = Math.min(1, (width * height) / 500000); // Adaptive density
      const starCount = Math.floor(Math.min(50, (width * height) / 12000 * starDensity));
      
      const stars = Array.from({ length: starCount }, (_, i) => ({
        id: i,
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 1.5 + 0.5,
        opacity: Math.random() * 0.6 + 0.4,
        animationDelay: Math.random() * 3
      }));

      // Create stars with CSS animation instead of D3 transitions
      const starElements = constellationGroup.selectAll(".star")
        .data(stars)
        .join("circle")
        .attr("class", "star optimized-star")
        .attr("cx", d => d.x)
        .attr("cy", d => d.y)
        .attr("r", d => d.size)
        .attr("fill", "#06B6D4")
        .attr("opacity", d => d.opacity)
        .style("animation-delay", d => `${d.animationDelay}s`)
        .style("filter", "url(#starGlow)");

      // Create fewer constellation connections for better performance
      const connectionCount = Math.min(Math.floor(starCount / 12), 8);
      for (let i = 0; i < connectionCount; i++) {
        const star1 = stars[Math.floor(Math.random() * stars.length)];
        const star2 = stars[Math.floor(Math.random() * stars.length)];
        
        const distance = Math.sqrt(
          Math.pow(star1.x - star2.x, 2) + Math.pow(star1.y - star2.y, 2)
        );
        
        // Only connect nearby stars
        if (distance < Math.min(150, Math.min(width, height) / 4)) {
          constellationGroup.append("line")
            .attr("class", "constellation-line")
            .attr("x1", star1.x)
            .attr("y1", star1.y)
            .attr("x2", star2.x)
            .attr("y2", star2.y)
            .attr("stroke", "#06B6D4")
            .attr("stroke-width", 0.5)
            .attr("stroke-opacity", 0.15)
            .style("filter", "url(#constellationGlow)");
        }
      }

      // Add optimized filters
      let defs = svg.select("defs");
      if (defs.empty()) {
        defs = svg.append("defs");
      }

      if (defs.select("#starGlow").empty()) {
        const starFilter = defs.append("filter")
          .attr("id", "starGlow")
          .attr("x", "-50%")
          .attr("y", "-50%")
          .attr("width", "200%")
          .attr("height", "200%");

        starFilter.append("feGaussianBlur")
          .attr("stdDeviation", "0.8")
          .attr("result", "starBlur");

        const starMerge = starFilter.append("feMerge");
        starMerge.append("feMergeNode").attr("in", "starBlur");
        starMerge.append("feMergeNode").attr("in", "SourceGraphic");
      }

      if (defs.select("#constellationGlow").empty()) {
        const constellationFilter = defs.append("filter")
          .attr("id", "constellationGlow")
          .attr("x", "-50%")
          .attr("y", "-50%")
          .attr("width", "200%")
          .attr("height", "200%");

        constellationFilter.append("feGaussianBlur")
          .attr("stdDeviation", "0.3")
          .attr("result", "constellationBlur");

        const constellationMerge = constellationFilter.append("feMerge");
        constellationMerge.append("feMergeNode").attr("in", "constellationBlur");
        constellationMerge.append("feMergeNode").attr("in", "SourceGraphic");
      }
    });
  }, [width, height, svgRef]);

  return null;
};

export default OptimizedConstellationBackground;
