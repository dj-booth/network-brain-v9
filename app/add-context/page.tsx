'use client';

import { useState, useEffect } from 'react';
import { Search, Building2, Briefcase } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Person } from '@/lib/supabase';
import { AudioRecorder } from '@/app/components/AudioRecorder';

export default function AddContextPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [noteContent, setNoteContent] = useState('');
  const [people, setPeople] = useState<Person[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [noteType, setNoteType] = useState<'text' | 'transcription'>('text');

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
        setError('Failed to search people');
      } finally {
        setIsLoading(false);
      }
    };

    const debounceTimeout = setTimeout(searchPeople, 300);
    return () => clearTimeout(debounceTimeout);
  }, [searchQuery]);

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

  const handleTranscriptionComplete = (transcribedText: string) => {
    setNoteContent(transcribedText);
    setNoteType('transcription');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPerson || !noteContent.trim()) return;

    try {
      setIsLoading(true);
      setError(null);
      setSuccessMessage(null);

      const { error } = await supabase
        .from('notes')
        .insert({
          person_id: selectedPerson.id,
          content: noteContent.trim(),
          type: noteType,
        });

      if (error) throw error;

      // Show success message
      setSuccessMessage(`Note added for ${selectedPerson.name}`);

      // Clear form on success
      setNoteContent('');
      setSelectedPerson(null);
      setSearchQuery('');
      setIsDropdownOpen(false);
      setNoteType('text');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Error saving note:', err);
      setError('Failed to save note');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-4xl font-bold mb-2">Add Context</h1>
        <p className="text-muted-foreground">
          Search for a person and add notes or context about your interactions.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded-lg">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-2 rounded-lg">
          {successMessage}
        </div>
      )}

      <div className="space-y-6">
        {/* Search Section */}
        <div className="relative">
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

          {/* Search Results */}
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

        {/* Note Creation Section */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="note" className="block text-sm font-medium text-gray-700 mb-2">
              {selectedPerson ? (
                <span className="flex items-center gap-2">
                  Add Note for <span className="font-semibold">{selectedPerson.name}</span>
                  {selectedPerson.title && <span className="text-gray-500">({selectedPerson.title})</span>}
                </span>
              ) : (
                'Add Note'
              )}
            </label>
            <textarea
              id="note"
              rows={6}
              className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={selectedPerson ? 
                `Write your note about ${selectedPerson.name} here...` : 
                "Select a person to add a note..."
              }
              value={noteContent}
              onChange={(e) => {
                setNoteContent(e.target.value);
                setNoteType('text');
              }}
              disabled={!selectedPerson}
            />
          </div>

          <div className="flex items-center gap-3">
            <AudioRecorder onTranscriptionComplete={handleTranscriptionComplete} />
            <button
              type="submit"
              disabled={!selectedPerson || !noteContent.trim() || isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Saving...' : 'Save Note'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 