
import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Network } from "@/lib/simulation";
import { Brain, TrendingUp, AlertCircle, Target, Zap, Shield } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";

interface PredictiveAnalyticsProps {
  network: Network;
  historyData: any[];
}

const PredictiveAnalytics: React.FC<PredictiveAnalyticsProps> = ({ network, historyData }) => {
  const predictions = useMemo(() => {
    const currentBelievers = network.nodes.filter(n => n.believer).length;
    const totalAgents = network.nodes.length;
    const currentPercentage = (currentBelievers / totalAgents) * 100;
    
    // Calculate growth rate from history
    const recentData = historyData.slice(-5);
    const growthRate = recentData.length > 1 ? 
      (recentData[recentData.length - 1]?.believers - recentData[0]?.believers) / recentData.length : 0;

    // Predict tipping point
    const tippingPoint = currentPercentage > 60 ? "REACHED" : 
      currentPercentage > 40 ? "APPROACHING" : "DISTANT";
    
    // Calculate risk factors
    const highInfluenceNonBelievers = network.nodes.filter(node => {
      if (node.believer) return false;
      const connections = network.links.filter(l => l.source === node.id || l.target === node.id);
      return connections.length > 3;
    }).length;

    const riskLevel = highInfluenceNonBelievers > totalAgents * 0.2 ? "HIGH" : 
      highInfluenceNonBelievers > totalAgents * 0.1 ? "MEDIUM" : "LOW";

    // Generate future projections
    const projections = [];
    for (let i = 1; i <= 10; i++) {
      const projected = Math.min(100, Math.max(0, currentPercentage + (growthRate * i) + (Math.random() - 0.5) * 5));
      projections.push({
        step: historyData.length + i,
        predicted: projected,
        confidence: Math.max(40, 95 - i * 8), // Decreasing confidence over time
      });
    }

    return {
      tippingPoint,
      riskLevel,
      growthRate: growthRate.toFixed(1),
      projections,
      conversionProbability: Math.min(95, currentPercentage + Math.abs(growthRate) * 10),
      influenceThreshold: 75 - currentPercentage,
      emergentBehavior: currentPercentage > 70 ? "CASCADE" : 
        currentPercentage > 50 ? "MOMENTUM" : "BUILDING",
    };
  }, [network, historyData]);

  const combinedData = [
    ...historyData.map(h => ({
      step: h.step,
      actual: (h.believers / (h.believers + h.nonBelievers)) * 100,
      predicted: null,
      confidence: null,
    })),
    ...predictions.projections.map(p => ({
      step: p.step,
      actual: null,
      predicted: p.predicted,
      confidence: p.confidence,
    }))
  ];

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "HIGH": return "text-red-400 border-red-400 bg-red-400/10";
      case "MEDIUM": return "text-yellow-400 border-yellow-400 bg-yellow-400/10";
      default: return "text-green-400 border-green-400 bg-green-400/10";
    }
  };

  const getTippingColor = (point: string) => {
    switch (point) {
      case "REACHED": return "text-red-400 border-red-400 bg-red-400/10";
      case "APPROACHING": return "text-yellow-400 border-yellow-400 bg-yellow-400/10";
      default: return "text-blue-400 border-blue-400 bg-blue-400/10";
    }
  };

  return (
    <div className="space-y-6">
      {/* Predictive Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-cyan-500/30 shadow-lg shadow-cyan-500/20">
          <CardContent className="p-4 text-center">
            <Brain className="h-8 w-8 text-cyan-400 mx-auto mb-2" />
            <div className="text-xl font-bold text-white">{predictions.conversionProbability.toFixed(1)}%</div>
            <div className="text-xs text-gray-400">Conversion Probability</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-cyan-500/30 shadow-lg shadow-cyan-500/20">
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-8 w-8 text-green-400 mx-auto mb-2" />
            <div className="text-xl font-bold text-white">{predictions.growthRate}%</div>
            <div className="text-xs text-gray-400">Growth Rate/Step</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-cyan-500/30 shadow-lg shadow-cyan-500/20">
          <CardContent className="p-4 text-center">
            <Target className="h-8 w-8 text-purple-400 mx-auto mb-2" />
            <div className="text-xl font-bold text-white">{predictions.influenceThreshold.toFixed(1)}%</div>
            <div className="text-xs text-gray-400">Threshold Distance</div>
          </CardContent>
        </Card>
      </div>

      {/* Status Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-cyan-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-5 w-5 text-cyan-400" />
              <span className="text-sm text-gray-300">Tipping Point Status</span>
            </div>
            <Badge variant="outline" className={getTippingColor(predictions.tippingPoint)}>
              {predictions.tippingPoint}
            </Badge>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-cyan-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="h-5 w-5 text-cyan-400" />
              <span className="text-sm text-gray-300">Risk Assessment</span>
            </div>
            <Badge variant="outline" className={getRiskColor(predictions.riskLevel)}>
              {predictions.riskLevel} RISK
            </Badge>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-cyan-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="h-5 w-5 text-cyan-400" />
              <span className="text-sm text-gray-300">Emergent Behavior</span>
            </div>
            <Badge variant="outline" className="border-cyan-400 text-cyan-400 bg-cyan-400/10">
              {predictions.emergentBehavior}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Prediction Chart */}
      <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-cyan-500/30 shadow-lg shadow-cyan-500/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-cyan-400 flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Predictive Model - Belief Adoption Forecast
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={combinedData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis 
                dataKey="step" 
                stroke="#94a3b8"
                label={{ value: "Simulation Step", position: "insideBottom", offset: -5, fill: "#94a3b8" }}
              />
              <YAxis 
                stroke="#94a3b8"
                label={{ value: "Belief Adoption %", angle: -90, position: "insideLeft", fill: "#94a3b8" }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1e293b",
                  borderColor: "#06b6d4",
                  color: "#fff",
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="actual"
                name="Historical Data"
                stroke="#8B5CF6"
                strokeWidth={2}
                dot={{ fill: "#8B5CF6", strokeWidth: 2 }}
                connectNulls={false}
              />
              <Line
                type="monotone"
                dataKey="predicted"
                name="AI Prediction"
                stroke="#06b6d4"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ fill: "#06b6d4", strokeWidth: 2 }}
                connectNulls={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default PredictiveAnalytics;
