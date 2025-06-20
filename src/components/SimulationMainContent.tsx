
import React from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { MessageCircle } from "lucide-react";
import SystemDiagnostics from "./SystemDiagnostics";
import NetworkVisualization from "./NetworkVisualization";
import NetworkMessages from "./NetworkMessages";
import MetricsOverview from "./MetricsOverview";
import NetworkAnalytics from "./NetworkAnalytics";
import PredictiveAnalytics from "./PredictiveAnalytics";
import SimulationStats from "./SimulationStats";
import { Network } from "@/lib/simulation";

interface SimulationMainContentProps {
  network: Network;
  selectedAgentId: number | null;
  isRunning: boolean;
  historyData: any[];
  statistics: any;
  onSelectAgent: (id: number) => void;
  onProcessingMessage: (isProcessing: boolean) => void;
}

const SimulationMainContent: React.FC<SimulationMainContentProps> = ({
  network,
  selectedAgentId,
  isRunning,
  historyData,
  statistics,
  onSelectAgent,
  onProcessingMessage,
}) => {
  return (
    <div className="md:col-span-9 space-y-6">
      <SystemDiagnostics />
      
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3">
          <NetworkVisualization
            network={network}
            selectedAgentId={selectedAgentId}
            onSelectAgent={onSelectAgent}
          />
        </div>
        
        <div className="lg:col-span-2 hidden lg:block">
          <NetworkMessages 
            network={network} 
            isRunning={isRunning} 
            onProcessingMessage={onProcessingMessage}
          />
        </div>
      </div>
      
      <div className="lg:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button className="w-full gap-2">
              <MessageCircle className="h-4 w-4" />
              View Network Messages
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[80vh]">
            <div className="py-6">
              <NetworkMessages 
                network={network} 
                isRunning={isRunning}
                onProcessingMessage={onProcessingMessage}
              />
            </div>
          </SheetContent>
        </Sheet>
      </div>
      
      <MetricsOverview network={network} statistics={statistics} />
      
      <Tabs defaultValue="analytics" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="analytics">Network Analytics</TabsTrigger>
          <TabsTrigger value="predictions">AI Predictions</TabsTrigger>
          <TabsTrigger value="classic">Classic Stats</TabsTrigger>
        </TabsList>
        
        <TabsContent value="analytics" className="mt-6">
          <NetworkAnalytics network={network} />
        </TabsContent>
        
        <TabsContent value="predictions" className="mt-6">
          <PredictiveAnalytics network={network} historyData={historyData} />
        </TabsContent>
        
        <TabsContent value="classic" className="mt-6">
          <SimulationStats
            network={network}
            historyData={historyData}
            statistics={statistics}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SimulationMainContent;
