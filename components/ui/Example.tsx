import React, { useState } from 'react';
import { SortableList } from './SortableList';

interface Item {
  id: string;
  content: React.ReactNode;
}

export function Example() {
  const [items, setItems] = useState<Item[]>([
    { id: '1', content: <div>Item 1</div> },
    { id: '2', content: <div>Item 2</div> },
    { id: '3', content: <div>Item 3</div> },
    { id: '4', content: <div>Item 4</div> },
  ]);

  return (
    <div className="max-w-md mx-auto p-4">
      <h2 className="text-xl font-semibold mb-4">Sortable List Example</h2>
      <SortableList
        items={items}
        onReorder={setItems}
        className="space-y-2"
      />
    </div>
  );
} 