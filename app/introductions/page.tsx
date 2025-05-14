'use client';

import { useState, useEffect } from 'react';
import { Search, Building2, Briefcase, Check } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Person } from '@/lib/supabase';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { IntroductionEmailDialog } from '@/app/components/IntroductionEmailDialog';
import { Textarea } from '@/components/ui/textarea';
import ReactMarkdown from 'react-markdown';
import { useToast } from "@/components/ui/use-toast";
import { Input } from '@/components/ui/input';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';

interface SuggestedIntroduction {
  id: string;
  person: Person;
  reasons: {
    source: string;
    target: string;
  };
  matching_score: number;
}

interface APIIntroduction {
  id: string;
  person_a_id: string;
  person_b_id: string;
  matching_score: number;
  status: string;
  matching_rationale: {
    source_reason: string;
    target_reason: string;
  };
  people: Person;
}

interface APIResponse {
  success: boolean;
  introductions: APIIntroduction[];
}

export default function IntroductionsPage() {
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [personContext, setPersonContext] = useState('');
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
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [feedbackNotes, setFeedbackNotes] = useState<{ [key: string]: string }>({});
  const [savedNotes, setSavedNotes] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(true);
  const personId = searchParams.get('personId');
  const [popoverOpen, setPopoverOpen] = useState(false);

  useEffect(() => {
    async function loadPeople() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('people')
          .select('*')
          .is('deleted', false)
          .order('name');

        if (error) throw error;
        setPeople(data || []);

        if (personId) {
          const selectedPerson = data?.find(p => p.id === personId);
          if (selectedPerson) {
            setSelectedPerson(selectedPerson);
          }
        }
      } catch (error) {
        console.error('Error loading people:', error);
      } finally {
        setLoading(false);
      }
    }

    loadPeople();
  }, [personId]);

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

  // Load existing introductions when a person is selected
  useEffect(() => {
    async function fetchExistingIntroductions() {
      if (!selectedPerson) {
        setSuggestedIntroductions([]);
        return;
      }

      try {
        const { data: introductions, error } = await supabase
          .from('introductions')
          .select(`
            *,
            people:person_b_id (*)
          `)
          .eq('person_a_id', selectedPerson.id)
          .neq('status', 'skipped');

        if (error) throw error;

        if (introductions && introductions.length > 0) {
          console.log('Raw introductions from DB:', introductions);
          const transformedIntroductions: SuggestedIntroduction[] = introductions.map((intro) => {
            console.log('Processing introduction:', {
              id: intro.id,
              raw_score: intro.matching_score,
              score_type: typeof intro.matching_score
            });
            
            // Ensure we have a valid number and convert if needed
            let score = 0;
            if (typeof intro.matching_score === 'string') {
              score = parseFloat(intro.matching_score);
            } else if (typeof intro.matching_score === 'number') {
              score = intro.matching_score;
            }
            console.log('Processed score:', score);

            return {
              id: intro.id,
              person: intro.people,
              reasons: {
                source: intro.matching_rationale.source_reason,
                target: intro.matching_rationale.target_reason
              },
              matching_score: score
            };
          });

          console.log('Transformed introductions:', transformedIntroductions);
          setSuggestedIntroductions(transformedIntroductions);
        } else {
          setSuggestedIntroductions([]);
        }
      } catch (err) {
        console.error('Error fetching existing introductions:', err);
        setSuggestedIntroductions([]);
      }
    }

    fetchExistingIntroductions();
  }, [selectedPerson]);

  const handlePersonSelect = (person: Person) => {
    setSelectedPerson(person);
    setSearchQuery(person.name);
    setIsDropdownOpen(false);
  };

  const handleSearchFocus = () => {
    if (searchQuery.trim() && (!selectedPerson || searchQuery !== selectedPerson.name)) {
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

  const generateIntroductions = async () => {
    if (!selectedPerson) return;
    
    setIsGenerating(true);
    try {
      // First, generate embeddings for the selected person
      const embeddingResponse = await fetch('/api/embeddings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          personId: selectedPerson.id,
          additionalContext: personContext.trim() || undefined
        }),
      });

      if (!embeddingResponse.ok) throw new Error('Failed to generate embeddings');

      // Now generate introductions using the updated embedding
      const introResponse = await fetch('/api/introductions/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ personId: selectedPerson.id }),
      });

      if (!introResponse.ok) throw new Error('Failed to generate introductions');

      const data = await introResponse.json();
      console.log('API Response:', data);

      if (!data?.introductions || !Array.isArray(data.introductions)) {
        throw new Error('Invalid response format from API');
      }

      // Transform the data to match our UI format
      const transformedIntroductions: SuggestedIntroduction[] = data.introductions.map((intro: APIIntroduction) => {
        if (!intro?.people) {
          console.error('Missing people data in introduction:', intro);
          return null;
        }

        console.log('Processing API introduction:', {
          id: intro.id,
          raw_score: intro.matching_score,
          score_type: typeof intro.matching_score
        });

        // Ensure we have a valid number and convert if needed
        let score = 0;
        if (typeof intro.matching_score === 'string') {
          score = parseFloat(intro.matching_score);
        } else if (typeof intro.matching_score === 'number') {
          score = intro.matching_score;
        }
        console.log('Processed API score:', score);

        return {
          id: intro.id,
          person: intro.people,
          reasons: {
            source: intro.matching_rationale.source_reason,
            target: intro.matching_rationale.target_reason
          },
          matching_score: score
        };
      }).filter(Boolean) as SuggestedIntroduction[];

      setSuggestedIntroductions(transformedIntroductions);
      toast({
        title: "Introductions Generated",
        description: `Found ${transformedIntroductions.length} potential introductions.`,
      });
    } catch (error) {
      console.error('Error generating introductions:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate introductions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUpdateIntroduction = async (introId: string, status: string, notes?: string) => {
    console.log(`Attempting to update introduction ${introId} with status: ${status}, notes: ${notes || feedbackNotes[introId]}`);
    try {
      const updatePayload = { 
        status: status,
        admin_notes: notes || feedbackNotes[introId] || null,
        updated_at: new Date().toISOString()
      };
      console.log('Supabase update payload:', updatePayload);

      const { data, error } = await supabase
        .from('introductions')
        .update(updatePayload)
        .eq('id', introId);

      console.log('Supabase update response:', { data, error });

      if (error) {
        console.error('Supabase update error:', error);
        throw error;
      }

      console.log(`Successfully updated introduction ${introId} in DB.`);

      // Remove the processed introduction from the list
      console.log('Updating local state to remove introduction:', introId);
      setSuggestedIntroductions(prev => {
        const newState = prev.filter(intro => intro.id !== introId);
        console.log('New local state (suggestedIntroductions):', newState);
        return newState;
      });

      // Clear the feedback for this introduction
      setFeedbackNotes(prev => {
        const newNotes = { ...prev };
        delete newNotes[introId];
        return newNotes;
      });

      toast({
        title: "Success",
        description: `Introduction ${status === 'skipped' ? 'skipped' : 'suggested'} successfully.`,
      });
    } catch (err) {
      console.error('Error in handleUpdateIntroduction:', err);
      toast({
        title: "Error",
        description: "Failed to update introduction. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSkip = (intro: SuggestedIntroduction) => {
    handleUpdateIntroduction(intro.id, 'skipped');
  };

  const handleSuggest = async (sourcePerson: Person, targetPerson: Person, reasons: { source: string; target: string }, introId: string) => {
    // First update the introduction status
    await handleUpdateIntroduction(introId, 'suggested');
    
    // Then show the email dialog
    setEmailDialogProps({
      sourcePerson,
      targetPerson,
      reasons,
    });
    setShowEmailDialog(true);
  };

  const handleSaveNotes = async (introId: string) => {
    try {
      const notes = feedbackNotes[introId];
      if (!notes?.trim()) return;

      const { error } = await supabase
        .from('introductions')
        .update({ 
          admin_notes: notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', introId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Feedback saved successfully.",
      });
    } catch (err) {
      console.error('Error saving feedback:', err);
      toast({
        title: "Error",
        description: "Failed to save feedback. Please try again.",
        variant: "destructive",
      });
    }
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
        {isDropdownOpen && searchQuery && (!selectedPerson || searchQuery !== selectedPerson.name) && (
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
                    <div className="font-medium">
                      <Link 
                        href={`/?selected=${person.id}`}
                        className="hover:underline"
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent the button's onClick from firing
                        }}
                      >
                        {person.name}
                      </Link>
                    </div>
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

      {/* Selected Person Profile and Context */}
      {selectedPerson && (
        <div className="space-y-8">
          <Card>
            <CardContent className="pt-6 space-y-6">
              <div className="flex items-start gap-8">
                <div className="flex items-start gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={selectedPerson.image_url} alt={selectedPerson.name} />
                    <AvatarFallback>
                      {selectedPerson.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <Link 
                      href={`/?selected=${selectedPerson.id}`}
                      className="text-2xl font-bold hover:underline"
                    >
                      {selectedPerson.name}
                    </Link>
                    {selectedPerson.title && (
                      <p className="text-muted-foreground">{selectedPerson.title}</p>
                    )}
                    {selectedPerson.company && (
                      <p className="text-muted-foreground">{selectedPerson.company}</p>
                    )}
                  </div>
                </div>
                
                {selectedPerson.summary && (
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">{selectedPerson.summary}</p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-8 pt-4 border-t">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Looking for introductions to:</h3>
                  <div className="text-sm prose prose-sm max-w-none">
                    <ReactMarkdown>
                      {selectedPerson.intros_sought || 'Not specified'}
                    </ReactMarkdown>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Reasons to introduce:</h3>
                  <div className="text-sm prose prose-sm max-w-none">
                    <ReactMarkdown>
                      {selectedPerson.reasons_to_introduce || 'Not specified'}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t">
                <Textarea
                  placeholder={`Add any extra context you have around ${selectedPerson.name.split(' ')[0]}'s current needs or asks.`}
                  value={personContext}
                  onChange={(e) => setPersonContext(e.target.value)}
                  className="min-h-[100px] resize-none"
                />
              </div>

              <div
                className="flex justify-end pt-4"
                onMouseEnter={() => setPopoverOpen(true)}
                onMouseLeave={() => setPopoverOpen(false)}
              >
                <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                  <PopoverTrigger asChild>
                    <div className="relative group">
                      <Button 
                        size="lg" 
                        onClick={generateIntroductions}
                        disabled={isGenerating}
                      >
                        {isGenerating ? "Generating..." : "Generate Introductions"}
                      </Button>
                    </div>
                  </PopoverTrigger>
                  <PopoverContent
                    align="end"
                    sideOffset={8}
                    className="w-64 p-0"
                    side="top"
                    onOpenAutoFocus={e => e.preventDefault()}
                  >
                    <div className="flex flex-col divide-y divide-muted-foreground/10">
                      <div className="px-4 py-3 hover:bg-accent cursor-pointer text-sm">Similar profiles</div>
                      <div className="px-4 py-3 hover:bg-accent cursor-pointer text-sm">Matches "looking for"</div>
                      <div className="px-4 py-3 hover:bg-accent cursor-pointer text-sm">Matches "can help with"</div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </CardContent>
          </Card>

          {/* Suggested Introductions */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Suggested Introductions</h3>
            <div className="grid gap-4">
              {suggestedIntroductions.map((intro) => (
                <Card key={intro.id}>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
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
                              <Link 
                                href={`/?selected=${intro.person.id}`}
                                className="font-semibold hover:underline"
                              >
                                {intro.person.name}
                              </Link>
                              <p className="text-sm text-muted-foreground">
                                {intro.person.title} at {intro.person.company}
                              </p>
                            </div>
                            <div 
                              className="px-3 py-1 rounded-md bg-blue-100/50 border border-blue-300 text-sm"
                              title="Match score based on shared interests and goals"
                            >
                              {(() => {
                                const score = typeof intro.matching_score === 'number' ? intro.matching_score : 0;
                                return `Match Score: ${Math.round(score * 100)}%`;
                              })()}
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
                        </div>
                      </div>
                      
                      <div className="pt-4 border-t flex items-start gap-4">
                        <div className="flex flex-col gap-2 w-[300px]">
                          <Textarea 
                            placeholder="share feedback on this recommendation with the AI"
                            className="min-h-[60px] resize-none w-full"
                            value={feedbackNotes[intro.id] || ''}
                            onChange={(e) => {
                              const newValue = e.target.value;
                              setFeedbackNotes(prev => ({
                                ...prev,
                                [intro.id]: newValue
                              }));
                              // Clear saved status if the new value is different from saved value
                              if (newValue !== savedNotes[intro.id]) {
                                setSavedNotes(prev => {
                                  const newSaved = { ...prev };
                                  delete newSaved[intro.id];
                                  return newSaved;
                                });
                              }
                            }}
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            className={`w-full relative transition-colors ${
                              savedNotes[intro.id] === feedbackNotes[intro.id] && feedbackNotes[intro.id]?.trim()
                                ? 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100'
                                : 'bg-gray-50 hover:bg-gray-100'
                            }`}
                            onClick={async () => {
                              const notes = feedbackNotes[intro.id];
                              console.log('Saving feedback for intro:', intro.id);
                              console.log('Notes content:', notes);
                              
                              if (!notes?.trim()) return;

                              const { data, error } = await supabase
                                .from('introductions')
                                .update({ 
                                  admin_notes: notes,
                                  updated_at: new Date().toISOString()
                                })
                                .eq('id', intro.id);

                              if (error) {
                                console.error('Error saving feedback:', error);
                                toast({
                                  title: "Error",
                                  description: "Failed to save feedback. Please try again.",
                                  variant: "destructive",
                                });
                                return;
                              }

                              console.log('Feedback saved successfully:', data);
                              setSavedNotes(prev => ({
                                ...prev,
                                [intro.id]: notes
                              }));
                              toast({
                                title: "Success",
                                description: "Feedback saved successfully.",
                              });
                            }}
                          >
                            <span className="flex items-center gap-2">
                              Save Feedback
                              {savedNotes[intro.id] === feedbackNotes[intro.id] && feedbackNotes[intro.id]?.trim() && (
                                <Check className="h-4 w-4 text-green-600" />
                              )}
                            </span>
                          </Button>
                        </div>
                        <div className="flex-1" />
                        <div className="flex items-center gap-4">
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 bg-red-50 hover:bg-red-100 border-red-200"
                            onClick={() => handleSkip(intro)}
                          >
                            Skip (with feedback)
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="bg-blue-50 hover:bg-blue-100 border-blue-200"
                            onClick={() => handleSuggest(selectedPerson, intro.person, intro.reasons, intro.id)}
                          >
                            Suggest to {selectedPerson.name.split(' ')[0]}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="bg-indigo-50 hover:bg-indigo-100 border-indigo-200"
                            onClick={() => handleSuggest(intro.person, selectedPerson, {
                              source: intro.reasons.target,
                              target: intro.reasons.source,
                            }, intro.id)}
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