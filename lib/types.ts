export interface ProfileFields {
  id: string;
  name: string;
  email?: string;
  title?: string;
  company?: string;
  location?: string;
  phone?: string;
  linkedinUrl?: string;
  imageUrl: string;
  summary?: string;
  detailedSummary?: string;
  currentFocus?: string;
  startupExperience?: string;
  lastStartupRole?: string;
  preferredRole?: string;
  preferredCompanyStage?: string;
  longTermGoal?: string;
  skills?: string[];
  interests?: string[];
  introsSought?: string;
  reasonsToIntroduce?: string;
  referralSource?: string;
  internalNotes?: string;
  lastContact?: string;
}

export interface Contact extends Partial<Omit<ProfileFields, 'id' | 'name' | 'imageUrl'>> {
  id: string;
  name: string;
  imageUrl: string;
}

// Add the new type for community membership status
export type CommunityMembershipStatus = 
  | 'prospect' 
  | 'applied' 
  | 'nominated' 
  | 'approved' 
  | 'inactive'; 