import { Contact } from '@/lib/types';
import { ContactCard } from './ContactCard';
import { ProfileDetail } from './ProfileDetail';

interface DirectoryLayoutProps {
  contacts: Contact[];
  selectedContact: Contact | null;
  onSelectContact: (contact: Contact) => void;
}

export function DirectoryLayout({ contacts, selectedContact, onSelectContact }: DirectoryLayoutProps) {
  return (
    <div className="flex flex-col lg:flex-row w-full gap-6 min-h-[calc(100vh-12rem)]">
      {/* Left column - Contact list (1/3) */}
      <div className="lg:w-1/3 space-y-1 overflow-y-auto">
        {contacts.map((contact) => (
          <div
            key={contact.id}
            onClick={() => onSelectContact(contact)}
            className={`cursor-pointer rounded-lg transition-colors ${
              selectedContact?.id === contact.id 
                ? 'bg-accent/80 hover:bg-accent/90'
                : 'hover:bg-accent/40'
            }`}
          >
            <ContactCard contact={contact} hideModal />
          </div>
        ))}
      </div>

      {/* Right column - Profile detail (2/3) */}
      <div className="lg:w-2/3 bg-card rounded-xl border shadow-sm overflow-hidden">
        {selectedContact ? (
          <ProfileDetail contact={selectedContact} />
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground p-8">
            <p>Select a profile to view details</p>
          </div>
        )}
      </div>
    </div>
  );
} 