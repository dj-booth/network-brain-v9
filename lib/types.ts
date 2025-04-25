export interface Contact {
  id: string;
  name: string;
  title: string;
  company: string;
  summary: string;
  imageUrl: string;
  email: string;
  lastContact?: string;
  detailedSummary: string;
  introsSought: {
    title: string;
    description: string;
  }[];
  reasonsToIntroduce: {
    title: string;
    description: string;
  }[];
} 