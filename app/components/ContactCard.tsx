'use client';

import Image from 'next/image';
import { Contact } from '@/lib/types';
import { useState } from 'react';
import { ProfileModal } from './ProfileModal';

interface ContactCardProps {
  contact: Contact;
  hideModal?: boolean;
}

export function ContactCard({ contact, hideModal }: ContactCardProps) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <div className="p-4">
        {/* Header with image and title */}
        <div className="flex items-start gap-4">
          <div className="relative h-12 w-12 flex-shrink-0">
            <Image
              src={contact.imageUrl}
              alt={contact.name}
              width={48}
              height={48}
              className="rounded-full object-cover"
              priority
            />
          </div>
          <div className="flex-1 min-w-0 space-y-1">
            <h3 className="font-medium leading-none truncate">{contact.name}</h3>
            <p className="text-sm text-muted-foreground">
              {contact.title} {contact.company && `• ${contact.company}`}
            </p>
          </div>
        </div>
        
        {/* Summary that extends full width */}
        <p className="mt-3 text-sm text-muted-foreground/90 line-clamp-2">
          {contact.summary}
        </p>
      </div>

      {!hideModal && showModal && (
        <ProfileModal contact={contact} onClose={() => setShowModal(false)} />
      )}
    </>
  );
} 