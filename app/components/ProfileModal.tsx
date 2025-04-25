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
            <div className="space-y-4">
              {contact.introsSought.map((intro, index) => (
                <div key={index} className="bg-accent/10 rounded-lg p-4">
                  <h4 className="font-medium mb-2">{intro.title}</h4>
                  <p className="text-sm text-muted-foreground">{intro.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Reasons to Introduce */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Ways {contact.name.split(' ')[0]} Can Help</h3>
            <div className="space-y-4">
              {contact.reasonsToIntroduce.map((reason, index) => (
                <div key={index} className="bg-accent/10 rounded-lg p-4">
                  <h4 className="font-medium mb-2">{reason.title}</h4>
                  <p className="text-sm text-muted-foreground">{reason.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 