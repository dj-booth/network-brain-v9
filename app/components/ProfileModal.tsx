'use client';

import { Contact } from '@/lib/types';
import { X } from 'lucide-react';
import Image from 'next/image';

interface ProfileModalProps {
  contact: Contact;
  onClose: () => void;
}

export function ProfileModal({ contact, onClose }: ProfileModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-background rounded-lg shadow-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-background border-b p-4 flex items-center justify-between">
          <h2 className="text-2xl font-semibold">{contact.name}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-accent rounded-full transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-8">
          {/* Profile Header */}
          <div className="flex items-start space-x-6">
            <div className="relative h-24 w-24 flex-shrink-0">
              <Image
                src={contact.imageUrl}
                alt={contact.name}
                width={96}
                height={96}
                className="rounded-full"
                priority
              />
            </div>
            <div>
              <h3 className="text-xl font-medium">{contact.title}</h3>
              <p className="text-muted-foreground">{contact.company}</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Last contact: {contact.lastContact || 'Never'}
              </p>
              <p className="mt-2">{contact.email}</p>
            </div>
          </div>

          {/* Detailed Summary */}
          <div>
            <h3 className="text-lg font-semibold mb-3">About</h3>
            <p className="text-muted-foreground whitespace-pre-wrap">
              {contact.detailedSummary}
            </p>
          </div>

          {/* Intros Sought */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Looking to Connect With</h3>
            {Array.isArray(contact.introsSought) && contact.introsSought.length > 0 ? (
              <ul className="list-disc pl-5 space-y-1">
                {contact.introsSought.map((item, idx) => (
                  <li key={idx}>
                    <span className="font-medium">{item.title}:</span> {item.description}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground whitespace-pre-wrap">
                No connection preferences specified
              </p>
            )}
          </div>

          {/* Reasons to Introduce */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Ways {contact.name.split(' ')[0]} Can Help</h3>
            {Array.isArray(contact.reasonsToIntroduce) && contact.reasonsToIntroduce.length > 0 ? (
              <ul className="list-disc pl-5 space-y-1">
                {contact.reasonsToIntroduce.map((item, idx) => (
                  <li key={idx}>
                    <span className="font-medium">{item.title}:</span> {item.description}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground whitespace-pre-wrap">
                No ways to help specified
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 