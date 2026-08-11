import React, { useState, useEffect, useRef } from 'react';

export default function AddressAutocomplete({
  name = 'residenceAddress',
  setValue,
  watch,
  placeholder = "Avenue, Numéro, Quartier, Commune...",
  error
}) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const containerRef = useRef(null);
  const debounceTimerRef = useRef(null);

  // Synchro avec React Hook Form
  const fieldValue = watch ? watch(name) : '';

  useEffect(() => {
    if (fieldValue !== undefined && fieldValue !== query) {
      setQuery(fieldValue || '');
    }
  }, [fieldValue]);

  // Fermeture clic extérieur
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchSuggestions = async (searchTerm) => {
    const cleanSearch = searchTerm ? searchTerm.trim() : '';

    if (cleanSearch.length < 3) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    try {
      // API OpenStreetMap / Photon
      const response = await fetch(
        `https://photon.komoot.io/api/?q=${encodeURIComponent(cleanSearch)}&limit=5`
      );

      if (!response.ok) throw new Error('Erreur réseau API Photon');

      const data = await response.json();

      if (data && data.features && data.features.length > 0) {
        const formatted = data.features.map((feat) => {
          const props = feat.properties;
          const parts = [props.name, props.street, props.district, props.city, props.country]
            .filter(Boolean);
          return parts.join(', ');
        });

        const uniqueSuggestions = [...new Set(formatted)];
        setSuggestions(uniqueSuggestions);
        setIsOpen(true);
      } else {
        setSuggestions([]);
        setIsOpen(true); // Ouvre pour afficher "Aucun résultat"
      }
    } catch (err) {
      console.error(' [Autocomplete Error]:', err);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);

    if (setValue) {
      setValue(name, value, { shouldValidate: true, shouldDirty: true });
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      fetchSuggestions(value);
    }, 350);
  };

  const handleSelect = (address) => {
    setQuery(address);
    if (setValue) {
      setValue(name, address, { shouldValidate: true, shouldDirty: true });
    }
    setIsOpen(false);
    setSelectedIndex(-1);
  };

  const handleKeyDown = (e) => {
    if (!isOpen || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Enter') {
      if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
        e.preventDefault();
        handleSelect(suggestions[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full z-30">
      <div className="relative flex items-center">
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => query.trim().length >= 3 && setIsOpen(true)}
          placeholder={placeholder}
          className={`w-full bg-zinc-950 border rounded-lg px-3.5 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-1 transition-colors ${
            error
              ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500'
              : 'border-zinc-800 focus:border-[#FF7900] focus:ring-[#FF7900]'
          }`}
        />

        {isLoading && (
          <div className="absolute right-3 pointer-events-none">
            <span className="w-4 h-4 border-2 border-[#FF7900] border-t-transparent rounded-full animate-spin block" />
          </div>
        )}
      </div>

      {/* Menu déroulant */}
      {isOpen && (
        <ul className="absolute top-full left-0 right-0 z-[9999] mt-1.5 bg-zinc-900 border border-zinc-800 rounded-lg shadow-2xl overflow-hidden max-h-60 overflow-y-auto">
          {suggestions.length > 0 ? (
            suggestions.map((item, index) => (
              <li
                key={index}
                onClick={() => handleSelect(item)}
                onMouseEnter={() => setSelectedIndex(index)}
                className={`px-3.5 py-2.5 text-xs cursor-pointer transition-colors flex items-center gap-2 ${
                  selectedIndex === index
                    ? 'bg-[#FF7900]/15 text-[#FF7900] font-medium'
                    : 'text-zinc-300 hover:bg-zinc-800/80'
                }`}
              >
                <svg className="w-4 h-4 shrink-0 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="truncate">{item}</span>
              </li>
            ))
          ) : (
            <li className="px-3.5 py-2.5 text-xs text-zinc-500 italic">
              {isLoading ? 'Recherche en cours...' : 'Aucune adresse trouvée'}
            </li>
          )}
        </ul>
      )}
    </div>
  );
}