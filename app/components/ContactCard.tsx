'use client';

import Image from 'next/image';
import { Contact } from '@/lib/types';
import { useState } from 'react';
import { ProfileModal } from './ProfileModal';

interface ContactCardProps {
  contact: Contact;
}

export function ContactCard({ contact }: ContactCardProps) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <div
        className="bg-card rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer"
        onClick={() => setShowModal(true)}
      >
        <div className="flex items-start space-x-4">
          <div className="relative h-16 w-16 flex-shrink-0">
            <Image
              src={contact.imageUrl}
              alt={contact.name}
              width={64}
              height={64}
              className="rounded-full"
              priority
            />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold truncate">{contact.name}</h3>
            <p className="text-sm text-muted-foreground">
              {contact.title} at {contact.company}
            </p>
            <p className="mt-2 text-sm line-clamp-3">{contact.summary}</p>
            <div className="mt-3 flex items-center text-sm text-muted-foreground">
              <span>Last contact: {contact.lastContact || 'Never'}</span>
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <ProfileModal contact={contact} onClose={() => setShowModal(false)} />
      )}
    </>
  );
} 