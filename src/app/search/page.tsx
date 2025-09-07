"use client";

import { useState } from "react";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userFile, setUserFile] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [result, setResult] = useState<string | null>(null);

  const SCRAPER_URL = (process?.env?.NEXT_PUBLIC_SCRAPER_URL as string) || "http://localhost:4000";

  const toDataUrl = (file: File) => {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const fetchImageToDataUrl = async (url: string) => {
    const r = await fetch(url);
    const blob = await r.blob();
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(blob as any);
    });
  };

  const search = async () => {
    setError(null);
    setItems([]);
    if (!query.trim()) {
      setError("Please enter a search query.");
      return;
    }
    setLoading(true);
    try {
      const resp = await fetch(`${SCRAPER_URL}/search?q=${encodeURIComponent(query)}`);
      const data = await resp.json();
      if (!resp.ok) throw new Error(data?.error || "Search failed");
      setItems(data.items || []);
    } catch (err: any) {
      setError(String(err?.message || err));
    } finally {
      setLoading(false);
    }
  };

  const generate = async () => {
    setError(null);
    setResult(null);
    if (!userFile) {
      setError("Please upload your photo first.");
      return;
    }
    if (selectedIndex === null || !items[selectedIndex]) {
      setError("Please select an item to try on.");
      return;
    }

    try {
      setLoading(true);
      const clothImageUrl = items[selectedIndex].image;
      if (!clothImageUrl) throw new Error("Selected item has no image.");
      const clothDataUrl = await fetchImageToDataUrl(clothImageUrl);

      const resp = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userImage: userFile, clothImage: clothDataUrl }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data?.error || 'Generation failed');
      setResult(data.image);
    } catch (err: any) {
      setError(String(err?.message || err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-6 text-white bg-black flex flex-col gap-6">
      <header className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-semibold">Search Amazon (Try-on)</h1>
        <p className="text-sm text-gray-300 mt-1">Upload your photo, search Amazon for clothing, select an item and generate a try-on image.</p>
      </header>

      <main className="max-w-3xl mx-auto grid gap-4">
        <label className="p-4 bg-[#0a0a0a] border border-gray-800 rounded">
          <div className="text-sm text-gray-300 mb-2">Your photo</div>
          <input
            aria-label="Your photo"
            type="file"
            accept="image/*"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (f) setUserFile(await toDataUrl(f));
            }}
          />
          {userFile && <img src={userFile} alt="you" className="mt-2 max-h-40 object-contain" />}
        </label>

        <div className="flex gap-2">
          <input className="flex-1 p-2 rounded bg-[#0a0a0a] border border-gray-800" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="e.g. women's red dress" />
          <button onClick={search} disabled={loading} className="bg-white text-black px-4 py-2 rounded">{loading ? 'Searching...' : 'Search'}</button>
        </div>

        {error && <div className="text-red-400">{error}</div>}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {items.map((it, i) => (
            <div key={i} className={`p-2 bg-[#0a0a0a] border ${selectedIndex === i ? 'border-white' : 'border-gray-800'} rounded`} onClick={() => setSelectedIndex(i)}>
              <img src={it.image || ''} alt={it.title} className="w-full h-32 object-contain" />
              <div className="text-xs text-gray-300 mt-1">{it.title}</div>
              <div className="text-xs text-gray-400">{it.price !== null ? (typeof it.price === 'number' ? `$${it.price}` : it.price) : ''}</div>
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <button onClick={generate} disabled={loading} className="bg-white text-black px-4 py-2 rounded">{loading ? 'Generating...' : 'Generate Try-On'}</button>
        </div>

        {result && (
          <div className="p-4 bg-[#0a0a0a] border border-gray-800 rounded">
            <div className="text-sm text-gray-300 mb-2">Result</div>
            <img src={result} alt="result" className="max-w-full h-auto" />
            <div className="mt-2">
              <a href={result} download="result.png" className="text-sm text-gray-300 underline">Download</a>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
