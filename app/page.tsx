'use client';

import { useState } from 'react';
import { ContactCard } from './components/ContactCard';
import { ContactList } from './components/ContactList';
import { ViewToggle } from './components/ViewToggle';
import { mockContacts } from '@/lib/mock-data';

export default function DirectoryPage() {
  const [view, setView] = useState<'grid' | 'list'>('grid');

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold">Directory</h1>
        <ViewToggle view={view} onViewChange={setView} />
      </div>

      <div className="w-full">
        {view === 'list' ? (
          <div className="bg-card rounded-lg border shadow-sm overflow-hidden">
            <ContactList contacts={mockContacts} />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mockContacts.map((contact) => (
              <ContactCard key={contact.id} contact={contact} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
