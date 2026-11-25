import { useEffect, useState } from 'react';
import { LocateFixed, MapPin, Search } from 'lucide-react';

interface AddressLocationPickerProps {
  id: string;
  label: string;
  value: string;
  onChange: (nextAddress: string) => void;
  placeholder?: string;
  required?: boolean;
  rows?: number;
}

interface NominatimSuggestion {
  place_id: number;
  display_name: string;
}

export function AddressLocationPicker({
  id,
  label,
  value,
  onChange,
  placeholder = 'e.g. Riverside Drive Suite 4B, Westlands, Nairobi',
  required = false,
  rows = 2,
}: AddressLocationPickerProps) {
  const [locating, setLocating] = useState(false);
  const [locationStatus, setLocationStatus] = useState<string | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searching, setSearching] = useState(false);
  const [suggestions, setSuggestions] = useState<NominatimSuggestion[]>([]);

  useEffect(() => {
    const q = searchTerm.trim();
    if (!searchOpen || q.length < 3) {
      setSuggestions([]);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&q=${encodeURIComponent(q)}`,
          {
            signal: controller.signal,
            headers: { Accept: 'application/json' },
          }
        );
        if (!res.ok) throw new Error('Lookup failed');
        const data = (await res.json()) as NominatimSuggestion[];
        setSuggestions(Array.isArray(data) ? data : []);
      } catch (err) {
        if ((err as { name?: string }).name !== 'AbortError') {
          setSuggestions([]);
        }
      } finally {
        setSearching(false);
      }
    }, 350);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [searchTerm, searchOpen]);

  const handleDetectLocation = () => {
    setLocationError(null);
    setLocationStatus(null);

    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setLocationError('Automatic GPS detection is not supported in this browser.');
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const coordText = `GPS: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`,
            { headers: { Accept: 'application/json' } }
          );
          if (res.ok) {
            const data = (await res.json()) as {
              display_name?: string;
              address?: {
                road?: string;
                neighbourhood?: string;
                suburb?: string;
                city?: string;
                town?: string;
                county?: string;
                country?: string;
              };
            };

            const parts = [
              data.address?.road,
              data.address?.neighbourhood || data.address?.suburb,
              data.address?.city || data.address?.town || data.address?.county,
              data.address?.country,
            ].filter(Boolean);

            const formatted = (
              parts.length > 0 ? parts.join(', ') : data.display_name || coordText
            ).slice(0, 300);

            onChange(formatted);
            setLocationStatus(`Pinpointed location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`);
            setLocating(false);
            return;
          }
        } catch {
          // Fall back cleanly to GPS coordinates below
        }

        onChange(coordText.slice(0, 300));
        setLocationStatus('GPS coordinates detected — add building or apartment details if needed.');
        setLocating(false);
      },
      (err) => {
        setLocating(false);
        if (err.code === err.PERMISSION_DENIED) {
          setLocationError('Location permission denied. Allow location access or search an address below.');
        } else {
          setLocationError('Unable to detect GPS coordinates right now. Please type or search your address.');
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label htmlFor={id} className="flex items-center gap-1.5 text-xs font-medium text-stone-700">
          <MapPin className="w-3.5 h-3.5 text-stone-400" />
          <span>{label}</span>
        </label>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={locating}
            onClick={handleDetectLocation}
            className="inline-flex items-center gap-1 text-[11px] font-medium text-zinc-900 hover:text-[#7C5C38] bg-[#FAF8F5] border border-stone-300 rounded-md px-2 py-1 cursor-pointer disabled:opacity-50 whitespace-nowrap"
          >
            <LocateFixed className="w-3 h-3" />
            {locating ? 'Detecting...' : 'Use My Location'}
          </button>

          <button
            type="button"
            onClick={() => setSearchOpen((s) => !s)}
            className="inline-flex items-center gap-1 text-[11px] font-medium text-stone-600 hover:text-zinc-900 bg-white border border-stone-300 rounded-md px-2 py-1 cursor-pointer whitespace-nowrap"
          >
            <Search className="w-3 h-3" />
            {searchOpen ? 'Close Search' : 'Find Address'}
          </button>
        </div>
      </div>

      {searchOpen && (
        <div className="bg-[#FAF8F5] border border-stone-200 rounded-lg p-2.5 space-y-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search street, estate, or mall (min 3 letters)..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-stone-300 rounded-md focus:outline-none focus:border-zinc-900"
            />
          </div>

          {searching && (
            <p className="text-[11px] text-stone-500 px-1">Searching matching addresses...</p>
          )}

          {!searching && suggestions.length > 0 && (
            <ul className="divide-y divide-stone-200 bg-white border border-stone-200 rounded-md max-h-40 overflow-y-auto">
              {suggestions.map((place) => (
                <li key={place.place_id}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(place.display_name.slice(0, 300));
                      setSearchOpen(false);
                      setSearchTerm('');
                      setSuggestions([]);
                      setLocationStatus('Address selected from location search.');
                      setLocationError(null);
                    }}
                    className="w-full text-left px-2.5 py-2 text-xs text-zinc-800 hover:bg-[#FAF8F5] cursor-pointer leading-snug"
                  >
                    {place.display_name}
                  </button>
                </li>
              ))}
            </ul>
          )}

          {!searching && searchTerm.trim().length >= 3 && suggestions.length === 0 && (
            <p className="text-[11px] text-stone-500 px-1">
              No matching places found. Try a broader street or area name.
            </p>
          )}
        </div>
      )}

      <textarea
        id={id}
        required={required}
        rows={rows}
        maxLength={300}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 text-sm bg-white border border-stone-300 rounded-lg focus:outline-none focus:border-zinc-900"
      />

      {locationStatus && (
        <p className="text-[11px] text-emerald-800">{locationStatus}</p>
      )}
      {locationError && (
        <p className="text-[11px] text-rose-700">{locationError}</p>
      )}
    </div>
  );
}
