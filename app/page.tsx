'use client';

import { useEffect, useState } from 'react';
import { ContactCard } from './components/ContactCard';
import { ContactList } from './components/ContactList';
import { ViewToggle } from './components/ViewToggle';
import { supabase } from '@/lib/supabase';
import type { Contact } from '@/lib/types';

export default function DirectoryPage() {
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadContacts() {
      try {
        setLoading(true);
        
        // Fetch people with their intros and reasons
        const { data: people, error: peopleError } = await supabase
          .from('people')
          .select(`
            *,
            intros_sought(title, description),
            reasons_to_introduce(title, description)
          `);

        if (peopleError) throw peopleError;

        // Map the Supabase data to our Contact type
        const mappedContacts: Contact[] = (people || []).map(person => ({
          id: person.id,
          name: person.name,
          title: person.title || '',
          company: person.company || '',
          summary: person.summary || '',
          detailedSummary: person.detailed_summary || '',
          imageUrl: person.image_url || '/placeholder-avatar.svg',
          email: person.email || '',
          lastContact: person.last_contact || undefined,
          introsSought: person.intros_sought || [],
          reasonsToIntroduce: person.reasons_to_introduce || [],
        }));

        setContacts(mappedContacts);
        setError(null);
      } catch (err) {
        console.error('Error loading contacts:', err);
        setError('Failed to load contacts');
      } finally {
        setLoading(false);
      }
    }

    loadContacts();
  }, []);

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold">Directory</h1>
        <ViewToggle view={view} onViewChange={setView} />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded-lg mb-6">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      ) : (
        <div className="w-full">
          {view === 'list' ? (
            <div className="bg-card rounded-lg border shadow-sm overflow-hidden">
              <ContactList contacts={contacts} />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {contacts.map((contact) => (
                <ContactCard key={contact.id} contact={contact} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
