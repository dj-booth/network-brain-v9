export interface EventTemplate {
  id: string;
  name: string;
  title: string;
  description: string;
  startTime: string; // HH:MM format
  endTime: string;   // HH:MM format
}

const eventTemplates: EventTemplate[] = [
  {
    id: 'demo-1',
    name: 'Demo Template 1',
    title: 'Placeholder Event Title',
    description: 'This is a placeholder description for the event template.\n\nIt can include multiple lines.',
    startTime: '10:00',
    endTime: '11:30',
  },
  // Add more templates here
];

export default eventTemplates; 