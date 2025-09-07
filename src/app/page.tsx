"use client";

import { useState } from "react";

export default function Home() {
  const [userFile, setUserFile] = useState<string | null>(null);
  const [clothFile, setClothFile] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toDataUrl = (file: File) => {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const submit = async () => {
    setError(null);
    setResult(null);
    if (!userFile || !clothFile) {
      setError("Please select both images.");
      return;
    }
    setLoading(true);
    try {
      const resp = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userImage: userFile, clothImage: clothFile }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data?.error || "Generation failed");
      setResult(data.image);
    } catch (err: any) {
      setError(err?.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-6 text-white bg-black flex flex-col gap-6">
      <header className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-semibold">Virtual Try-On (Minimal)</h1>
        <p className="text-sm text-gray-300 mt-1">Upload a photo of yourself and a photo of clothing. The app will generate an image of you wearing it using Gemini.</p>
      </header>

      <main className="max-w-3xl mx-auto grid gap-4">
        <div className="flex gap-4 flex-col sm:flex-row">
          <label className="flex-1 p-4 bg-[#0a0a0a] border border-gray-800 rounded">
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

          <label className="flex-1 p-4 bg-[#0a0a0a] border border-gray-800 rounded">
            <div className="text-sm text-gray-300 mb-2">Clothing photo</div>
            <input
              aria-label="Clothing photo"
              type="file"
              accept="image/*"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (f) setClothFile(await toDataUrl(f));
              }}
            />
            {clothFile && <img src={clothFile} alt="cloth" className="mt-2 max-h-40 object-contain" />}
          </label>
        </div>

        <div className="flex gap-3">
          <button onClick={submit} disabled={loading} className="bg-white text-black px-4 py-2 rounded">
            {loading ? "Generating..." : "Generate"}
          </button>
          <button
            onClick={() => {
              setUserFile(null);
              setClothFile(null);
              setResult(null);
              setError(null);
            }}
            className="px-4 py-2 border rounded text-gray-300"
          >
            Reset
          </button>
        </div>

        {error && <div className="text-red-400">{error}</div>}

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

      <footer className="max-w-3xl mx-auto text-xs text-gray-500">Images are sent to a generative model for processing. Do not upload private or sensitive images.</footer>
    </div>
  );
}
