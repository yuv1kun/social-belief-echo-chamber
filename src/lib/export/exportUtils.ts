
import { Network } from "../network/networkTypes";

export function generateExportData(network: Network): string {
  const headers = ["Agent ID", "Name", "Gender", "Age", "Beliefs", "Susceptibility", "Openness", "Conscientiousness", "Extraversion", "Agreeableness", "Neuroticism"];
  
  const rows = network.nodes.map(agent => [
    agent.id.toString(),
    agent.name,
    agent.gender,
    agent.age.toString(),
    agent.beliefs.toFixed(3),
    agent.susceptibility.toFixed(3),
    agent.traits.openness.toFixed(3),
    agent.traits.conscientiousness.toFixed(3),
    agent.traits.extraversion.toFixed(3),
    agent.traits.agreeableness.toFixed(3),
    agent.traits.neuroticism.toFixed(3)
  ]);
  
  return [headers, ...rows].map(row => row.join(",")).join("\n");
}

export function downloadCSV(csvContent: string, filename: string): void {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
