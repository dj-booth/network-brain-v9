import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

interface TimelineItem {
  id: string;
  type: 'note' | 'event';
  content: string;
  timestamp: string;
  eventStatus?: string;
  eventTitle?: string;
}

interface TimelineProps {
  personId: string;
  refreshTrigger?: number;
}

export function Timeline({ personId, refreshTrigger = 0 }: TimelineProps) {
  const [items, setItems] = useState<TimelineItem[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());
  const INITIAL_PAGE_SIZE = 5;
  const LOAD_MORE_PAGE_SIZE = 10;
  const NOTE_PREVIEW_LENGTH = 250;

  const fetchTimelineItems = useCallback(async (isInitialLoad = false) => {
    try {
      setLoading(true);
      setError(null);
      const pageSize = isInitialLoad ? INITIAL_PAGE_SIZE : LOAD_MORE_PAGE_SIZE;
      const currentPage = isInitialLoad ? 1 : page;
      
      // Fetch notes
      const notesResponse = await fetch(`/api/timeline?personId=${personId}&page=${currentPage}&pageSize=${pageSize}&type=notes`);
      if (!notesResponse.ok) {
        throw new Error(`Failed to fetch notes: ${notesResponse.statusText}`);
      }
      const notesData = await notesResponse.json();
      
      // Fetch events
      const eventsResponse = await fetch(`/api/timeline?personId=${personId}&page=${currentPage}&pageSize=${pageSize}&type=events`);
      if (!eventsResponse.ok) {
        throw new Error(`Failed to fetch events: ${eventsResponse.statusText}`);
      }
      const eventsData = await eventsResponse.json();
      
      // Combine and sort items
      const newItems = [
        ...notesData.map((note: Record<string, unknown>) => ({
          id: note.id,
          type: 'note' as const,
          content: note.content,
          timestamp: note.created_at,
        })),
        ...eventsData.map((event: Record<string, unknown>) => ({
          id: event.id,
          type: 'event' as const,
          content: event.description,
          timestamp: event.start_time,
          eventStatus: event.response_status,
          eventTitle: event.title,
        })),
      ]
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, pageSize);

      if (isInitialLoad) {
        setItems(newItems);
      } else {
        setItems(prev => [...prev, ...newItems]);
      }
      
      setHasMore(newItems.length === pageSize);
      if (!isInitialLoad) {
        setPage(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error fetching timeline items:', error);
      setError(error instanceof Error ? error : new Error('Failed to load timeline'));
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  }, [personId, page, INITIAL_PAGE_SIZE, LOAD_MORE_PAGE_SIZE]);

  useEffect(() => {
    setItems([]); // Clear items before fetching
    setPage(1);
    setInitialLoading(true);
    fetchTimelineItems(true);
  }, [personId, refreshTrigger, fetchTimelineItems]);

  const toggleNoteExpansion = (noteId: string) => {
    setExpandedNotes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(noteId)) {
        newSet.delete(noteId);
      } else {
        newSet.add(noteId);
      }
      return newSet;
    });
  };

  const formatTimelineDate = (date: string) => {
    return format(new Date(date), 'MMM d, yyyy h:mm a');
  };

  if (initialLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-start space-x-4">
            <Skeleton className="h-2 w-2 rounded-full mt-3" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-24 w-full rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-8 space-y-4">
        <p className="text-red-500">Failed to load timeline: {error.message}</p>
        <Button
          variant="outline"
          onClick={() => {
            setError(null);
            setPage(1);
            fetchTimelineItems(true);
          }}
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Retry loading timeline
        </Button>
      </div>
    );
  }

  if (items.length === 0 && !loading) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No timeline items yet
      </div>
    );
  }

  return (
    <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:h-full before:w-0.5 before:-translate-x-1/2 before:bg-gray-200">
      {items.map((item, index) => (
        <div key={item.id} className="relative flex items-start">
          <div className="absolute left-0 h-2 w-2 rounded-full bg-gray-200 mt-3"></div>
          
          <div className="ml-10 space-y-1">
            <time className="block text-sm text-gray-400">
              {formatTimelineDate(item.timestamp)}
            </time>
            
            <div className="rounded-lg border bg-card p-4">
              {item.type === 'event' ? (
                <div>
                  <h4 className="font-medium">{item.eventTitle}</h4>
                  <p className="text-sm text-muted-foreground">Status: {item.eventStatus}</p>
                  {item.content && <p className="mt-2">{item.content}</p>}
                </div>
              ) : (
                <div>
                  {item.content.length > NOTE_PREVIEW_LENGTH && !expandedNotes.has(item.id) ? (
                    <>
                      <p className="whitespace-pre-wrap">{item.content.slice(0, NOTE_PREVIEW_LENGTH)}...</p>
                      <Button
                        variant="link"
                        className="px-0 text-sm flex items-center gap-1 mt-2 text-blue-600 hover:text-blue-800"
                        onClick={() => toggleNoteExpansion(item.id)}
                      >
                        Read more
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <p className="whitespace-pre-wrap">{item.content}</p>
                      {item.content.length > NOTE_PREVIEW_LENGTH && (
                        <Button
                          variant="link"
                          className="px-0 text-sm flex items-center gap-1 mt-2 text-blue-600 hover:text-blue-800"
                          onClick={() => toggleNoteExpansion(item.id)}
                        >
                          Show less
                          <ChevronUp className="h-4 w-4" />
                        </Button>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
      
      {hasMore && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            size="sm"
            className="w-[200px]"
            onClick={() => fetchTimelineItems(false)}
            disabled={loading}
          >
            {loading ? (
              'Loading...'
            ) : (
              <>
                Load more
                <ChevronDown className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
} 