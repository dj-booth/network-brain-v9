'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { UserPlus, Users, Building2, Mail } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { CreatePersonModal } from '@/app/components/CreatePersonModal';
import { ProfileDetail } from './components/ProfileDetail';
import { Contact } from '@/lib/types';

interface Person {
  id: string;
  name: string;
  email: string | null;
  title: string | null;
  company: string | null;
  summary: string | null;
  detailed_summary: string | null;
  image_url: string;
  last_contact: string | null;
  intros_sought: string | null;
  reasons_to_introduce: string | null;
  linkedin_url: string | null;
}

export default function HomePage() {
  const router = useRouter();
  const [people, setPeople] = useState<Person[]>([]);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const searchParams = useSearchParams();
  const selectedId = searchParams.get('selected');

  useEffect(() => {
    async function loadPeople() {
      setLoading(true);
      try {
        const { data: peopleData, error } = await supabase
          .from('people')
          .select('*')
          .is('deleted', false)
          .order('name');

        if (error) throw error;
        setPeople(peopleData || []);
        
        if (selectedId && peopleData) {
          const selected = peopleData.find(p => p.id === selectedId) || null;
          setSelectedPerson(selected);
        }
      } catch (error) {
        console.error('Error loading people:', error);
      } finally {
        setLoading(false);
      }
    }

    loadPeople();
  }, [selectedId]);

  // Convert Person to Contact type for ProfileDetail
  const selectedContact: Contact | null = selectedPerson ? {
    id: selectedPerson.id,
    name: selectedPerson.name,
    email: selectedPerson.email || '',
    title: selectedPerson.title || '',
    company: selectedPerson.company || '',
    summary: selectedPerson.summary || '',
    detailedSummary: selectedPerson.detailed_summary || '',
    imageUrl: selectedPerson.image_url,
    lastContact: selectedPerson.last_contact || undefined,
    linkedinUrl: selectedPerson.linkedin_url || '',
    introsSought: selectedPerson.intros_sought
      ? [{ title: 'Connection', description: selectedPerson.intros_sought }]
      : [],
    reasonsToIntroduce: selectedPerson.reasons_to_introduce
      ? [{ title: 'Reason', description: selectedPerson.reasons_to_introduce }]
      : [],
  } : null;

  const PeopleList = () => (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-auto p-4">
        {loading && !people.length ? (
          <div className="text-center py-8">Loading people...</div>
        ) : people.length === 0 ? (
          <Card className="bg-muted">
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">No people found.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {people.map((person) => (
              <Link
                key={person.id}
                href={`/?selected=${person.id}`}
                className={`block rounded-lg border bg-card text-card-foreground shadow-sm hover:bg-muted/50 transition-colors ${
                  selectedPerson?.id === person.id ? 'ring-2 ring-primary ring-offset-2' : ''
                }`}
              >
                <div className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-muted flex-shrink-0">
                      {person.image_url ? (
                        <img
                          src={person.image_url}
                          alt={person.name}
                          className="h-full w-full rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full rounded-full bg-primary/10 flex items-center justify-center">
                          <Users className="h-5 w-5 text-primary" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate">{person.name}</h3>
                      {(person.title || person.company) && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          {person.title && (
                            <div className="flex items-center gap-1 truncate">
                              <Building2 className="h-3 w-3" />
                              <span>{person.title}</span>
                            </div>
                          )}
                          {person.company && (
                            <div className="flex items-center gap-1 truncate">
                              <Mail className="h-3 w-3" />
                              <span>{person.company}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  {person.summary && (
                    <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                      {person.summary}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="p-4 border-t sticky bottom-0 bg-background">
        <Button className="w-full" onClick={() => setIsCreateModalOpen(true)}>
          <UserPlus className="h-4 w-4 mr-2" />
          Add New Person
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      <div className="w-[400px] border-r bg-muted/10 flex flex-col">
        <PeopleList />
      </div>
      <div className="flex-1 overflow-auto">
        {selectedContact ? (
          <ProfileDetail contact={selectedContact} />
        ) : (
          <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
            Select a person to view details
          </div>
        )}
      </div>

      <CreatePersonModal 
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        onPersonCreated={() => {
          // Reload people list
          router.refresh();
        }}
      />
    </div>
  );
}
