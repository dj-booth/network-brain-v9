declare namespace google.maps {
  class places {
    static Autocomplete: {
      new (
        inputField: HTMLInputElement,
        opts?: AutocompleteOptions
      ): Autocomplete;
    };
  }

  interface AutocompleteOptions {
    types?: string[];
    fields?: string[];
  }

  interface Autocomplete {
    addListener(eventName: string, handler: () => void): void;
    getPlace(): {
      formatted_address?: string;
      name?: string;
      geometry?: {
        location: {
          lat(): number;
          lng(): number;
        };
      };
    };
  }
} 