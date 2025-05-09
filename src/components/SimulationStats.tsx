
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Network } from "@/lib/simulation";

interface SimulationStatsProps {
  network: Network;
  historyData: any[];
  statistics: {
    totalAgents: number;
    believers: number;
    nonBelievers: number;
    believerPercentage: number;
    averageSusceptibility: number;
    averageDegree: number;
  };
}

const SimulationStats: React.FC<SimulationStatsProps> = ({
  network,
  historyData,
  statistics,
}) => {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card className="w-full col-span-2">
        <CardHeader>
          <CardTitle>Belief Adoption Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={historyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis
                dataKey="step"
                stroke="#888888"
                label={{ value: "Step", position: "insideBottom", offset: -5 }}
              />
              <YAxis 
                stroke="#888888" 
                label={{ 
                  value: "Agent Count", 
                  angle: -90, 
                  position: "insideLeft" 
                }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#222",
                  borderColor: "#333",
                  color: "#fff",
                }}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="believers"
                name="Believers"
                stackId="1"
                stroke="#8B5CF6"
                fill="#8B5CF680"
              />
              <Area
                type="monotone"
                dataKey="nonBelievers"
                name="Non-Believers"
                stackId="1"
                stroke="#94A3B8"
                fill="#94A3B880"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="w-full">
        <CardHeader>
          <CardTitle>Current Belief Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-[200px] items-center justify-center">
            <div className="relative h-40 w-40">
              <div 
                className="absolute inset-0 rounded-full bg-simulation-believer"
                style={{ 
                  clipPath: `polygon(0 0, 100% 0, 100% 100%, 0% 100%)`,
                  opacity: 0.2
                }}
              ></div>
              <div 
                className="absolute inset-0 rounded-full bg-simulation-believer"
                style={{ 
                  clipPath: `polygon(50% 50%, 50% 0, ${50 + 50 * Math.cos(2 * Math.PI * statistics.believerPercentage / 100)}% ${50 - 50 * Math.sin(2 * Math.PI * statistics.believerPercentage / 100)}%, 50% 50%)`,
                }}
              ></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {statistics.believerPercentage.toFixed(1)}%
                  </div>
                  <div className="text-xs text-muted-foreground">Believers</div>
                </div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="bg-secondary/20 p-3 rounded-md">
              <div className="text-xs text-muted-foreground">Believers</div>
              <div className="text-xl font-medium">{statistics.believers}</div>
            </div>
            <div className="bg-secondary/20 p-3 rounded-md">
              <div className="text-xs text-muted-foreground">Non-Believers</div>
              <div className="text-xl font-medium">{statistics.nonBelievers}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="w-full">
        <CardHeader>
          <CardTitle>Network Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-secondary/20 p-3 rounded-md">
              <div className="text-xs text-muted-foreground">Total Agents</div>
              <div className="text-xl font-medium">{statistics.totalAgents}</div>
            </div>
            <div className="bg-secondary/20 p-3 rounded-md">
              <div className="text-xs text-muted-foreground">Network Connections</div>
              <div className="text-xl font-medium">{network.links.length}</div>
            </div>
            <div className="bg-secondary/20 p-3 rounded-md">
              <div className="text-xs text-muted-foreground">Avg. Connections</div>
              <div className="text-xl font-medium">{statistics.averageDegree.toFixed(1)}</div>
            </div>
            <div className="bg-secondary/20 p-3 rounded-md">
              <div className="text-xs text-muted-foreground">Avg. Susceptibility</div>
              <div className="text-xl font-medium">{(statistics.averageSusceptibility * 100).toFixed(1)}%</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SimulationStats;
