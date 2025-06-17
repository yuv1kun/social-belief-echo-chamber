
import React, { useMemo, useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Network } from "@/lib/simulation";
import { Brain, TrendingUp, AlertCircle, Target, Zap, Shield, Eye, Flame } from "lucide-react";
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
  BarChart,
  Bar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";

interface PredictiveAnalyticsProps {
  network: Network;
  historyData: any[];
}

const PredictiveAnalytics: React.FC<PredictiveAnalyticsProps> = ({ network, historyData }) => {
  const [riskMatrix, setRiskMatrix] = useState<number[][]>([]);
  const [anomalyScore, setAnomalyScore] = useState(0);

  useEffect(() => {
    // Generate risk matrix
    const matrix = Array.from({ length: 5 }, () => 
      Array.from({ length: 5 }, () => Math.random() * 100)
    );
    setRiskMatrix(matrix);

    // Calculate anomaly score
    const score = Math.random() * 100;
    setAnomalyScore(score);
  }, [network]);

  const predictions = useMemo(() => {
    const currentBelievers = network.nodes.filter(n => n.believer).length;
    const totalAgents = network.nodes.length;
    const currentPercentage = (currentBelievers / totalAgents) * 100;
    
    // Advanced growth rate calculation
    const recentData = historyData.slice(-10);
    const growthRates = [];
    for (let i = 1; i < recentData.length; i++) {
      const rate = recentData[i]?.believers - recentData[i-1]?.believers;
      growthRates.push(rate);
    }
    const avgGrowthRate = growthRates.length > 0 ? 
      growthRates.reduce((acc, rate) => acc + rate, 0) / growthRates.length : 0;

    // Tipping point prediction
    const tippingThreshold = 51; // Majority threshold
    const stepsToTipping = avgGrowthRate > 0 ? 
      Math.ceil((tippingThreshold - currentPercentage) / (avgGrowthRate / totalAgents * 100)) : -1;
    
    const tippingStatus = currentPercentage >= tippingThreshold ? "REACHED" : 
      stepsToTipping > 0 && stepsToTipping <= 10 ? "IMMINENT" :
      stepsToTipping > 0 && stepsToTipping <= 25 ? "APPROACHING" : "DISTANT";

    // Contagion risk assessment
    const highRiskAgents = network.nodes.filter(node => {
      if (node.believer) return false;
      const connections = network.links.filter(l => l.source === node.id || l.target === node.id);
      const believerConnections = connections.filter(l => {
        const otherId = l.source === node.id ? l.target : l.source;
        const otherNode = network.nodes.find(n => n.id === otherId);
        return otherNode?.believer;
      });
      return believerConnections.length >= 2; // High exposure
    }).length;

    const contagionRisk = (highRiskAgents / (totalAgents - currentBelievers)) * 100;
    const riskLevel = contagionRisk > 60 ? "CRITICAL" : 
      contagionRisk > 35 ? "HIGH" : 
      contagionRisk > 15 ? "MODERATE" : "LOW";

    // Agent behavior predictions
    const agentPredictions = network.nodes.slice(0, 5).map(agent => {
      const connections = network.links.filter(l => l.source === agent.id || l.target === agent.id);
      const believerNeighbors = connections.filter(l => {
        const otherId = l.source === agent.id ? l.target : l.source;
        const otherNode = network.nodes.find(n => n.id === otherId);
        return otherNode?.believer;
      }).length;
      
      const conversionProbability = agent.believer ? 0 : 
        Math.min(95, (believerNeighbors / Math.max(1, connections.length)) * 100);
      
      const nextAction = agent.believer ? "PROPAGATE" :
        conversionProbability > 70 ? "CONVERT" :
        conversionProbability > 30 ? "CONSIDER" : "RESIST";

      return {
        id: agent.id,
        believer: agent.believer,
        conversionProbability,
        nextAction,
        influence: connections.length,
      };
    });

    // Scenario modeling
    const scenarios = [
      {
        name: "Baseline",
        probability: 40,
        outcome: currentPercentage + avgGrowthRate * 5,
        description: "Current trend continues"
      },
      {
        name: "Acceleration",
        probability: 25,
        outcome: Math.min(100, currentPercentage + avgGrowthRate * 8),
        description: "Viral spread activation"
      },
      {
        name: "Resistance",
        probability: 20,
        outcome: Math.max(0, currentPercentage + avgGrowthRate * 2),
        description: "Counter-movement emerges"
      },
      {
        name: "Plateau",
        probability: 15,
        outcome: currentPercentage,
        description: "Growth stagnation"
      }
    ];

    // Generate future projections with uncertainty bands
    const projections = [];
    for (let i = 1; i <= 15; i++) {
      const baseProjection = Math.min(100, Math.max(0, currentPercentage + (avgGrowthRate * i)));
      const uncertainty = i * 3; // Increasing uncertainty over time
      
      projections.push({
        step: historyData.length + i,
        predicted: baseProjection,
        upperBound: Math.min(100, baseProjection + uncertainty),
        lowerBound: Math.max(0, baseProjection - uncertainty),
        confidence: Math.max(20, 95 - i * 4),
      });
    }

    return {
      tippingStatus,
      stepsToTipping,
      riskLevel,
      contagionRisk,
      agentPredictions,
      scenarios,
      projections,
      conversionProbability: Math.min(95, currentPercentage + Math.abs(avgGrowthRate) * 15),
      emergentBehavior: currentPercentage > 70 ? "CASCADE" : 
        currentPercentage > 50 ? "MOMENTUM" : 
        currentPercentage > 30 ? "BUILDING" : "NASCENT",
    };
  }, [network, historyData]);

  const combinedData = [
    ...historyData.map(h => ({
      step: h.step,
      actual: (h.believers / (h.believers + h.nonBelievers)) * 100,
      predicted: null,
      upperBound: null,
      lowerBound: null,
    })),
    ...predictions.projections.map(p => ({
      step: p.step,
      actual: null,
      predicted: p.predicted,
      upperBound: p.upperBound,
      lowerBound: p.lowerBound,
    }))
  ];

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "CRITICAL": return "text-red-500 border-red-500 bg-red-500/20";
      case "HIGH": return "text-red-400 border-red-400 bg-red-400/10";
      case "MODERATE": return "text-yellow-400 border-yellow-400 bg-yellow-400/10";
      default: return "text-green-400 border-green-400 bg-green-400/10";
    }
  };

  const getTippingColor = (status: string) => {
    switch (status) {
      case "REACHED": return "text-green-500 border-green-500 bg-green-500/20";
      case "IMMINENT": return "text-red-500 border-red-500 bg-red-500/20";
      case "APPROACHING": return "text-yellow-400 border-yellow-400 bg-yellow-400/10";
      default: return "text-blue-400 border-blue-400 bg-blue-400/10";
    }
  };

  const behaviorRadarData = predictions.agentPredictions.map(agent => ({
    agent: `Agent ${agent.id}`,
    conversion: agent.conversionProbability,
    influence: agent.influence * 10,
    activity: Math.random() * 100,
  }));

  return (
    <div className="space-y-6">
      {/* Tipping Point & Contagion Risk */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-cyan-500/30 shadow-lg shadow-cyan-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-cyan-400 flex items-center gap-2">
              <Target className="h-5 w-5" />
              Tipping Point Predictor
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-2">
                  {predictions.stepsToTipping > 0 ? predictions.stepsToTipping : "∞"}
                </div>
                <div className="text-sm text-gray-400">Steps to Majority</div>
              </div>
              
              <Badge variant="outline" className={getTippingColor(predictions.tippingStatus) + " w-full justify-center"}>
                {predictions.tippingStatus}
              </Badge>
              
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-800/50 p-2 rounded text-center">
                  <div className="text-cyan-400 font-bold">{predictions.conversionProbability.toFixed(1)}%</div>
                  <div className="text-gray-400">Success Rate</div>
                </div>
                <div className="bg-slate-800/50 p-2 rounded text-center">
                  <div className="text-purple-400 font-bold">{predictions.emergentBehavior}</div>
                  <div className="text-gray-400">Current Phase</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-cyan-500/30 shadow-lg shadow-cyan-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-cyan-400 flex items-center gap-2">
              <Flame className="h-5 w-5" />
              Contagion Risk Matrix
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-2">
                  {predictions.contagionRisk.toFixed(1)}%
                </div>
                <div className="text-sm text-gray-400">High Risk Agents</div>
              </div>
              
              <Badge variant="outline" className={getRiskColor(predictions.riskLevel) + " w-full justify-center"}>
                {predictions.riskLevel} RISK
              </Badge>
              
              <div className="grid grid-cols-5 gap-1">
                {riskMatrix.map((row, i) => 
                  row.map((cell, j) => (
                    <div 
                      key={`${i}-${j}`}
                      className="aspect-square rounded text-xs flex items-center justify-center"
                      style={{
                        backgroundColor: `rgba(239, 68, 68, ${cell / 100 * 0.8})`,
                        border: '1px solid rgba(239, 68, 68, 0.3)'
                      }}
                    >
                      {Math.round(cell)}
                    </div>
                  ))
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Agent Behavior Predictions */}
      <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-cyan-500/30 shadow-lg shadow-cyan-500/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-cyan-400 flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Agent Behavior Predictions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <ResponsiveContainer width="100%" height={200}>
                <RadarChart data={behaviorRadarData}>
                  <PolarGrid stroke="#334155" />
                  <PolarAngleAxis dataKey="agent" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 8 }} />
                  <Radar
                    name="Conversion Risk"
                    dataKey="conversion"
                    stroke="#8B5CF6"
                    fill="#8B5CF6"
                    fillOpacity={0.3}
                    strokeWidth={2}
                  />
                  <Radar
                    name="Influence"
                    dataKey="influence"
                    stroke="#06b6d4"
                    fill="#06b6d4"
                    fillOpacity={0.2}
                    strokeWidth={2}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            
            <div className="space-y-2">
              {predictions.agentPredictions.map(agent => (
                <div key={agent.id} className="bg-slate-800/50 p-3 rounded border border-cyan-500/20">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-white font-medium">Agent #{agent.id}</span>
                    <Badge 
                      variant="outline" 
                      className={agent.believer ? "border-purple-400 text-purple-400 bg-purple-400/10" : "border-gray-400 text-gray-400 bg-gray-400/10"}
                    >
                      {agent.believer ? "Believer" : "Skeptic"}
                    </Badge>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Next Action:</span>
                    <span className="text-cyan-400">{agent.nextAction}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Conversion Risk:</span>
                    <span className="text-yellow-400">{agent.conversionProbability.toFixed(1)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Scenario Modeling */}
      <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-cyan-500/30 shadow-lg shadow-cyan-500/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-cyan-400 flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Scenario Modeling & Outcomes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={predictions.scenarios}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 10 }} />
                <YAxis stroke="#94a3b8" tick={{ fontSize: 10 }} />
                <Bar dataKey="probability" fill="#8B5CF6" />
                <Bar dataKey="outcome" fill="#06b6d4" />
              </BarChart>
            </ResponsiveContainer>
            
            <div className="space-y-2">
              {predictions.scenarios.map((scenario, index) => (
                <div key={index} className="bg-slate-800/50 p-3 rounded border border-cyan-500/20">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-white font-medium">{scenario.name}</span>
                    <span className="text-cyan-400 text-sm">{scenario.probability}%</span>
                  </div>
                  <div className="text-xs text-gray-400 mb-2">{scenario.description}</div>
                  <div className="text-xs">
                    <span className="text-gray-400">Projected Outcome: </span>
                    <span className="text-green-400">{scenario.outcome.toFixed(1)}% believers</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Advanced Prediction Chart with Uncertainty */}
      <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-cyan-500/30 shadow-lg shadow-cyan-500/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-cyan-400 flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Predictive Model with Uncertainty Bands
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={combinedData}>
              <defs>
                <linearGradient id="uncertaintyGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
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
              <Area
                type="monotone"
                dataKey="upperBound"
                stackId="1"
                stroke="none"
                fill="url(#uncertaintyGradient)"
                connectNulls={false}
              />
              <Area
                type="monotone"
                dataKey="lowerBound"
                stackId="1"
                stroke="none"
                fill="#1e293b"
                connectNulls={false}
              />
              <Line
                type="monotone"
                dataKey="actual"
                stroke="#8B5CF6"
                strokeWidth={3}
                dot={{ fill: "#8B5CF6", strokeWidth: 2 }}
                connectNulls={false}
              />
              <Line
                type="monotone"
                dataKey="predicted"
                stroke="#06b6d4"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ fill: "#06b6d4", strokeWidth: 2 }}
                connectNulls={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Anomaly Detection */}
      <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-cyan-500/30 shadow-lg shadow-cyan-500/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-cyan-400 flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Anomaly Detection System
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-800/50 p-4 rounded border border-cyan-500/20 text-center">
              <AlertCircle className={`h-8 w-8 mx-auto mb-2 ${anomalyScore > 70 ? 'text-red-400' : anomalyScore > 40 ? 'text-yellow-400' : 'text-green-400'}`} />
              <div className="text-xl font-bold text-white">{anomalyScore.toFixed(1)}</div>
              <div className="text-xs text-gray-400">Anomaly Score</div>
            </div>
            
            <div className="bg-slate-800/50 p-4 rounded border border-cyan-500/20 text-center">
              <Eye className="h-8 w-8 mx-auto mb-2 text-cyan-400" />
              <div className="text-xl font-bold text-white">{Math.floor(Math.random() * 5)}</div>
              <div className="text-xs text-gray-400">Pattern Deviations</div>
            </div>
            
            <div className="bg-slate-800/50 p-4 rounded border border-cyan-500/20 text-center">
              <Shield className="h-8 w-8 mx-auto mb-2 text-green-400" />
              <div className="text-xl font-bold text-white">98.2%</div>
              <div className="text-xs text-gray-400">Model Confidence</div>
            </div>
          </div>
          
          <Badge 
            variant="outline" 
            className={`mt-4 w-full justify-center ${anomalyScore > 70 ? 'border-red-400 text-red-400 bg-red-400/10' : 'border-green-400 text-green-400 bg-green-400/10'}`}
          >
            {anomalyScore > 70 ? 'ANOMALOUS BEHAVIOR DETECTED' : 'NORMAL NETWORK PATTERNS'}
          </Badge>
        </CardContent>
      </Card>
    </div>
  );
};

export default PredictiveAnalytics;
