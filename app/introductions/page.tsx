'use client';

import { useState, useEffect } from 'react';
import { Search, Building2, Briefcase } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Person } from '@/lib/supabase';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { IntroductionEmailDialog } from '@/app/components/IntroductionEmailDialog';

interface SuggestedIntroduction {
  person: Person;
  reasons: {
    source: string;
    target: string;
  };
}

export default function IntroductionsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [people, setPeople] = useState<Person[]>([]);
  const [suggestedIntroductions, setSuggestedIntroductions] = useState<SuggestedIntroduction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [emailDialogProps, setEmailDialogProps] = useState<{
    sourcePerson: Person;
    targetPerson: Person;
    reasons: {
      source: string;
      target: string;
    };
  } | null>(null);

  // Search people in Supabase
  useEffect(() => {
    const searchPeople = async () => {
      if (!searchQuery.trim()) {
        setPeople([]);
        setIsDropdownOpen(false);
        return;
      }

      try {
        setIsLoading(true);
        setIsDropdownOpen(true);
        const { data, error } = await supabase
          .from('people')
          .select('*')
          .ilike('name', `%${searchQuery}%`)
          .order('name')
          .limit(10);

        if (error) throw error;
        setPeople(data || []);
      } catch (err) {
        console.error('Error searching people:', err);
      } finally {
        setIsLoading(false);
      }
    };

    const debounceTimeout = setTimeout(searchPeople, 300);
    return () => clearTimeout(debounceTimeout);
  }, [searchQuery]);

  // Generate dummy suggested introductions when a person is selected
  useEffect(() => {
    if (selectedPerson) {
      // This is dummy data - will be replaced with AI recommendations later
      const dummyIntroductions: SuggestedIntroduction[] = [
        {
          person: {
            id: '1',
            name: 'Sarah Johnson',
            title: 'Product Manager',
            company: 'TechCorp',
            image_url: '/placeholder-avatar.svg',
          } as Person,
          reasons: {
            source: 'Both work in product management and share interest in AI',
            target: 'Looking to expand network in enterprise software',
          },
        },
        {
          person: {
            id: '2',
            name: 'Michael Chen',
            title: 'Engineering Lead',
            company: 'StartupCo',
            image_url: '/placeholder-avatar.svg',
          } as Person,
          reasons: {
            source: 'Has experience scaling engineering teams',
            target: 'Seeking mentorship in technical leadership',
          },
        },
        {
          person: {
            id: '3',
            name: 'Emma Davis',
            title: 'VP of Sales',
            company: 'GrowthInc',
            image_url: '/placeholder-avatar.svg',
          } as Person,
          reasons: {
            source: 'Strong network in enterprise sales',
            target: 'Looking to connect with product leaders',
          },
        },
        {
          person: {
            id: '4',
            name: 'Alex Thompson',
            title: 'Startup Founder',
            company: 'InnovateLabs',
            image_url: '/placeholder-avatar.svg',
          } as Person,
          reasons: {
            source: 'Experience in startup ecosystem',
            target: 'Seeking advisors in tech industry',
          },
        },
        {
          person: {
            id: '5',
            name: 'Rachel Kim',
            title: 'Investment Associate',
            company: 'VentureFund',
            image_url: '/placeholder-avatar.svg',
          } as Person,
          reasons: {
            source: 'Deep knowledge of startup funding',
            target: 'Looking to expand portfolio in tech',
          },
        },
      ];

      setSuggestedIntroductions(dummyIntroductions);
    } else {
      setSuggestedIntroductions([]);
    }
  }, [selectedPerson]);

  const handlePersonSelect = (person: Person) => {
    setSelectedPerson(person);
    setSearchQuery(person.name);
    setIsDropdownOpen(false);
  };

  const handleSearchFocus = () => {
    if (searchQuery.trim()) {
      setIsDropdownOpen(true);
    }
  };

  const handleSuggestIntroduction = (sourcePerson: Person, targetPerson: Person, reasons: { source: string; target: string }) => {
    setEmailDialogProps({
      sourcePerson,
      targetPerson,
      reasons,
    });
    setShowEmailDialog(true);
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Introductions</h1>
        <p className="text-muted-foreground">
          Search for someone and discover potential introductions based on mutual interests and goals.
        </p>
      </div>

      {/* Search Section */}
      <div className="relative mb-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Search people by name..."
            className="w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={handleSearchFocus}
          />
        </div>

        {/* Search Results Dropdown */}
        {isDropdownOpen && searchQuery && (
          <div className="absolute w-full mt-1 bg-white border rounded-lg shadow-lg max-h-80 overflow-y-auto z-10 divide-y">
            {isLoading ? (
              <div className="px-4 py-3 text-gray-500">Searching...</div>
            ) : people.length === 0 ? (
              <div className="px-4 py-3 text-gray-500">No results found</div>
            ) : (
              people.map(person => (
                <button
                  key={person.id}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 focus:outline-none focus:bg-gray-50 transition-colors"
                  onClick={() => handlePersonSelect(person)}
                >
                  <div className="flex flex-col gap-1">
                    <div className="font-medium">{person.name}</div>
                    {(person.title || person.company) && (
                      <div className="text-sm text-gray-500 flex items-center gap-4">
                        {person.title && (
                          <span className="flex items-center gap-1">
                            <Briefcase className="h-4 w-4" />
                            {person.title}
                          </span>
                        )}
                        {person.company && (
                          <span className="flex items-center gap-1">
                            <Building2 className="h-4 w-4" />
                            {person.company}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* Selected Person Profile */}
      {selectedPerson && (
        <div className="space-y-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={selectedPerson.image_url} alt={selectedPerson.name} />
                  <AvatarFallback>
                    {selectedPerson.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-2xl font-bold">{selectedPerson.name}</h2>
                  {selectedPerson.title && (
                    <p className="text-muted-foreground">{selectedPerson.title}</p>
                  )}
                  {selectedPerson.company && (
                    <p className="text-muted-foreground">{selectedPerson.company}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Suggested Introductions */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Suggested Introductions</h3>
            <div className="grid gap-4">
              {suggestedIntroductions.map((intro) => (
                <Card key={intro.person.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={intro.person.image_url} alt={intro.person.name} />
                        <AvatarFallback>
                          {intro.person.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-semibold">{intro.person.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {intro.person.title} at {intro.person.company}
                            </p>
                          </div>
                        </div>
                        <div className="mt-4 grid grid-cols-2 gap-4">
                          <div>
                            <h5 className="text-sm font-medium text-muted-foreground mb-1">
                              Why {selectedPerson.name.split(' ')[0]} should connect
                            </h5>
                            <p className="text-sm">{intro.reasons.source}</p>
                          </div>
                          <div>
                            <h5 className="text-sm font-medium text-muted-foreground mb-1">
                              Why {intro.person.name.split(' ')[0]} would be interested
                            </h5>
                            <p className="text-sm">{intro.reasons.target}</p>
                          </div>
                        </div>
                        <div className="mt-4 flex gap-2 justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSuggestIntroduction(selectedPerson, intro.person, intro.reasons)}
                          >
                            Suggest to {selectedPerson.name.split(' ')[0]}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSuggestIntroduction(intro.person, selectedPerson, {
                              source: intro.reasons.target,
                              target: intro.reasons.source,
                            })}
                          >
                            Suggest to {intro.person.name.split(' ')[0]}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Email Dialog */}
      {emailDialogProps && (
        <IntroductionEmailDialog
          open={showEmailDialog}
          onOpenChange={setShowEmailDialog}
          sourcePerson={emailDialogProps.sourcePerson}
          targetPerson={emailDialogProps.targetPerson}
          reasons={emailDialogProps.reasons}
        />
      )}
    </div>
  );
} 