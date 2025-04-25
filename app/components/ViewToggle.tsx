'use client';

import { LayoutGrid, List } from 'lucide-react';

interface ViewToggleProps {
  view: 'grid' | 'list';
  onViewChange: (view: 'grid' | 'list') => void;
}

export function ViewToggle({ view, onViewChange }: ViewToggleProps) {
  return (
    <div className="flex items-center space-x-2 bg-accent/10 rounded-lg p-1">
      <button
        onClick={() => onViewChange('list')}
        className={`p-2 rounded-md transition-colors ${
          view === 'list'
            ? 'bg-background text-foreground'
            : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        <List className="h-5 w-5" />
      </button>
      <button
        onClick={() => onViewChange('grid')}
        className={`p-2 rounded-md transition-colors ${
          view === 'grid'
            ? 'bg-background text-foreground'
            : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        <LayoutGrid className="h-5 w-5" />
      </button>
    </div>
  );
} 