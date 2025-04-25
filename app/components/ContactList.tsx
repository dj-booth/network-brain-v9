'use client';

import Image from 'next/image';
import { Contact } from '@/lib/types';
import { useState } from 'react';
import { ProfileModal } from './ProfileModal';

interface ContactListProps {
  contacts: Contact[];
}

export function ContactList({ contacts }: ContactListProps) {
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

  return (
    <>
      <div className="divide-y divide-border">
        {contacts.map((contact) => (
          <div
            key={contact.id}
            onClick={() => setSelectedContact(contact)}
            className="flex items-start space-x-4 p-4 hover:bg-accent/5 cursor-pointer transition-colors"
          >
            <div className="relative h-12 w-12 flex-shrink-0 sm:h-14 sm:w-14">
              <Image
                src={contact.imageUrl}
                alt={contact.name}
                width={56}
                height={56}
                className="rounded-full"
                priority
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <h3 className="text-base font-medium truncate">{contact.name}</h3>
                <span className="text-sm text-muted-foreground shrink-0">
                  {contact.lastContact || 'Never'}
                </span>
              </div>
              <p className="text-sm text-muted-foreground truncate mt-1">
                {contact.title} at {contact.company}
              </p>
              <p className="text-sm text-foreground/80 mt-2 line-clamp-2 sm:line-clamp-1">
                {contact.summary}
              </p>
            </div>
          </div>
        ))}
      </div>

      {selectedContact && (
        <ProfileModal
          contact={selectedContact}
          onClose={() => setSelectedContact(null)}
        />
      )}
    </>
  );
} 