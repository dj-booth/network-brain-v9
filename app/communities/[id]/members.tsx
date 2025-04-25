import { MembersList } from '@/components/ui/MembersList';

interface PageProps {
  params: {
    id: string;
  };
}

type Member = {
  id: string;
  name: string;
  title: string;
  company: string;
  status: 'Prospect' | 'Applied' | 'Approved';
};

export default function CommunityMembersPage({ params }: PageProps) {
  // This would typically come from your API/database
  const members: Member[] = [
    {
      id: '1',
      name: 'Bob Johnson',
      title: 'Marketing Director',
      company: 'Growth Marketing Co.',
      status: 'Prospect',
    },
    {
      id: '2',
      name: 'Emma Thompson',
      title: 'Founder & CEO',
      company: 'Sustainable Fashion Collective',
      status: 'Prospect',
    },
    {
      id: '3',
      name: 'James Wilson',
      title: 'Managing Partner',
      company: 'Sustainable Finance Partners',
      status: 'Prospect',
    },
    {
      id: '4',
      name: 'John Doe',
      title: 'Software Engineer',
      company: 'Tech Solutions Inc.',
      status: 'Prospect',
    },
    {
      id: '5',
      name: 'Michael Chang',
      title: 'Security Architect',
      company: 'CyberSec AI',
      status: 'Applied',
    },
    {
      id: '6',
      name: 'Alex Rivera',
      title: 'Principal',
      company: 'ScaleUp Ventures',
      status: 'Applied',
    },
    {
      id: '7',
      name: 'Maya Patel',
      title: 'Chief Technology Officer',
      company: 'AI Health Solutions',
      status: 'Approved',
    },
    {
      id: '8',
      name: "Sarah O'Connor",
      title: 'Biotech Entrepreneur',
      company: 'BioPharma Ventures',
      status: 'Approved',
    },
  ];

  const handleStatusChange = async (memberId: string, newStatus: 'Prospect' | 'Applied' | 'Approved') => {
    // Here you would typically make an API call to update the member's status
    console.log(`Updating member ${memberId} to status ${newStatus}`);
  };

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Community Members</h1>
        <p className="text-gray-600">Drag and drop members to change their status</p>
      </div>
      
      <MembersList
        initialMembers={members}
        onStatusChange={handleStatusChange}
      />
    </div>
  );
} 