
export interface Message {
  id: string;
  senderId: number;
  content: string;
  timestamp: number;
  type?: string;
}
