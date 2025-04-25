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
  introsSought: string;
  reasonsToIntroduce: string;
}

// Add the new type for community membership status
export type CommunityMembershipStatus = 
  | 'prospect' 
  | 'applied' 
  | 'nominated' 
  | 'approved' 
  | 'inactive'; 