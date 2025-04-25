'use client';

import React, { useRef, useEffect, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label'; // Optional: if you want to include label within this component

interface LocationAutocompleteInputProps {
  label: string; // Pass label text as a prop
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

let isLoaded = false;

export function LocationAutocompleteInput({ 
  label,
  value,
  onChange,
  placeholder 
}: LocationAutocompleteInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [isApiLoaded, setIsApiLoaded] = useState(isLoaded);
  const [apiKeyError, setApiKeyError] = useState(false);

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;
    
    // Add this console log for debugging
    console.log('NEXT_PUBLIC_GOOGLE_PLACES_API_KEY:', apiKey ? `Key found (length: ${apiKey.length})` : 'Key NOT found');

    if (!apiKey) {
      console.error('ERROR: NEXT_PUBLIC_GOOGLE_PLACES_API_KEY is not set.');
      setApiKeyError(true);
      return;
    }
    
    if (isLoaded) {
      setIsApiLoaded(true);
      return; // Already loaded in this session
    }

    const loader = new Loader({
      apiKey: apiKey,
      version: 'weekly',
      libraries: ['places'],
    });

    loader.load().then(() => {
      console.log('Google Maps Places API loaded.');
      isLoaded = true;
      setIsApiLoaded(true);
    }).catch(e => {
      console.error('Error loading Google Maps API:', e);
      // Handle loading errors (e.g., show a message)
    });

    // Basic cleanup function, might need more robust handling depending on lifecycle
    return () => {
      // Potential cleanup if needed when component unmounts during load?
    };
  }, []); // Run only once on mount

  useEffect(() => {
    if (isApiLoaded && inputRef.current && !autocompleteRef.current) {
      // Initialize Autocomplete
      autocompleteRef.current = new google.maps.places.Autocomplete(inputRef.current, {
        fields: ['formatted_address', 'name', 'geometry'], // Request fields you need
        types: ['address'], // You can restrict types (e.g., 'address', 'establishment', '(cities)')
      });

      // Add listener for place selection
      autocompleteRef.current.addListener('place_changed', () => {
        const place = autocompleteRef.current?.getPlace();
        if (place?.formatted_address) {
          onChange(place.formatted_address);
        } else if (place?.name) {
          // Fallback to name if formatted_address isn't available?
          onChange(place.name);
        } else {
          // Handle cases where place is not found or doesn't have the needed fields
          console.log('Autocomplete selected place has no formatted address or name.');
           // Optionally keep the user's typed input if no place selected?
           // onChange(inputRef.current?.value || ''); 
        }
      });
    }
    
    // Potential cleanup for the listener (not strictly necessary if component persists)
    // return () => {
    //   if (autocompleteRef.current) {
    //     google.maps.event.clearInstanceListeners(autocompleteRef.current);
    //   }
    // };

  }, [isApiLoaded, onChange]);
  
  // Prevent form submission when Enter key is pressed inside the autocomplete input
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
    }
  };
  
  if (apiKeyError) {
     return (
        <div className="space-y-2">
          <Label htmlFor="location-error">Location</Label>
          <Input id="location-error" disabled value="Error: API Key Missing" className="border-red-500" />
          <p className="text-xs text-red-600">Google Places API Key is not configured.</p>
        </div>
      );
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="location">{label}</Label>
      <Input
        ref={inputRef}
        id="location"
        name="location"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)} // Update state on manual typing
        onKeyDown={handleKeyDown} // Prevent Enter submission
        disabled={!isApiLoaded} // Disable input until API is loaded
      />
      {!isApiLoaded && !apiKeyError && <p className="text-xs text-muted-foreground">Loading location service...</p>}
    </div>
  );
} 