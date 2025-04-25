import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
  const [hasMore, setHasMore] = useState(false);
  const INITIAL_PAGE_SIZE = 5;
  const LOAD_MORE_PAGE_SIZE = 10;

  const fetchTimelineItems = async (isInitialLoad = false) => {
    try {
      setLoading(true);
      const pageSize = isInitialLoad ? INITIAL_PAGE_SIZE : LOAD_MORE_PAGE_SIZE;
      
      // Fetch notes
      const notesResponse = await fetch(`/api/timeline?personId=${personId}&page=${page}&pageSize=${pageSize}&type=notes`);
      const notesData = await notesResponse.json();
      
      // Fetch events
      const eventsResponse = await fetch(`/api/timeline?personId=${personId}&page=${page}&pageSize=${pageSize}&type=events`);
      const eventsData = await eventsResponse.json();
      
      // Combine and sort items
      const newItems = [
        ...notesData.map((note: any) => ({
          id: note.id,
          type: 'note' as const,
          content: note.content,
          timestamp: note.created_at,
        })),
        ...eventsData.map((event: any) => ({
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
      setPage(prev => prev + 1);
    } catch (error) {
      console.error('Error fetching timeline items:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1); // Reset page when refreshing
    fetchTimelineItems(true);
  }, [personId, refreshTrigger]);

  const formatTimelineDate = (date: string) => {
    return format(new Date(date), 'MMM d, yyyy h:mm a');
  };

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
                </div>
              ) : (
                <div>
                  {item.content.length > 250 ? (
                    <>
                      <p>{item.content.slice(0, 250)}...</p>
                      <Button
                        variant="link"
                        className="px-0 text-sm"
                        onClick={() => {
                          // TODO: Implement full note view
                        }}
                      >
                        Read more
                      </Button>
                    </>
                  ) : (
                    <p>{item.content}</p>
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