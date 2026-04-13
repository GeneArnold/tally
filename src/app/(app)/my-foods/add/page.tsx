'use client';

import { useState, useRef, lazy, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Search, Keyboard, ScanBarcode, Sparkles, Camera, ClipboardPaste } from 'lucide-react';
import type { StrippedFood } from '@/lib/usda';

const BarcodeScanner = lazy(() => import('@/components/food/BarcodeScanner'));

type AddMode = 'choose' | 'manual' | 'usda' | 'barcode' | 'barcode-scan' | 'ai-choose' | 'ai-text' | 'ai-photo';

interface ParsedFood {
  description: string;
  brand_name: string | null;
  default_serving_size: number | null;
  default_serving_unit: string | null;
  energy_kcal: number | null;
  protein_g: number | null;
  fat_g: number | null;
  saturated_fat_g: number | null;
  carbs_g: number | null;
  fiber_g: number | null;
  sugar_g: number | null;
  sodium_mg: number | null;
  cholesterol_mg: number | null;
  tags: string[];
}

export default function AddFoodPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<AddMode>('choose');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // USDA search state
  const [usdaQuery, setUsdaQuery] = useState('');
  const [usdaResults, setUsdaResults] = useState<StrippedFood[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);

  // Barcode state
  const [barcodeInput, setBarcodeInput] = useState('');
  const [barcodeResult, setBarcodeResult] = useState<StrippedFood | null>(null);
  const [barcodeSearching, setBarcodeSearching] = useState(false);
  const [barcodeSource, setBarcodeSource] = useState('');
  const [barcodeStep, setBarcodeStep] = useState('');

  // AI state
  const [aiText, setAiText] = useState('');
  const [aiParsing, setAiParsing] = useState(false);

  // Form state (shared by all modes)
  const [form, setForm] = useState({
    description: '',
    brand_name: '',
    barcode: '',
    default_serving_size: '',
    default_serving_unit: 'g',
    energy_kcal: '',
    protein_g: '',
    fat_g: '',
    saturated_fat_g: '',
    carbs_g: '',
    fiber_g: '',
    sugar_g: '',
    sodium_mg: '',
    cholesterol_mg: '',
    tags: '',
  });

  function updateForm(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function populateFromParsed(food: ParsedFood) {
    setForm({
      description: food.description || '',
      brand_name: food.brand_name || '',
      barcode: '',
      default_serving_size: food.default_serving_size?.toString() || '',
      default_serving_unit: food.default_serving_unit || 'g',
      energy_kcal: food.energy_kcal?.toString() || '',
      protein_g: food.protein_g?.toString() || '',
      fat_g: food.fat_g?.toString() || '',
      saturated_fat_g: food.saturated_fat_g?.toString() || '',
      carbs_g: food.carbs_g?.toString() || '',
      fiber_g: food.fiber_g?.toString() || '',
      sugar_g: food.sugar_g?.toString() || '',
      sodium_mg: food.sodium_mg?.toString() || '',
      cholesterol_mg: food.cholesterol_mg?.toString() || '',
      tags: food.tags?.join(', ') || '',
    });
    setMode('manual');
  }

  function populateFromUSDA(food: StrippedFood) {
    setForm({
      description: food.description,
      brand_name: food.brand,
      barcode: food.upc,
      default_serving_size: food.serving_size?.toString() || '',
      default_serving_unit: food.serving_unit || 'g',
      energy_kcal: food.calories.toString(),
      protein_g: food.protein_g.toString(),
      fat_g: food.fat_g.toString(),
      saturated_fat_g: '',
      carbs_g: food.carbs_g.toString(),
      fiber_g: food.fiber_g.toString(),
      sugar_g: food.sugar_g.toString(),
      sodium_mg: food.sodium_mg.toString(),
      cholesterol_mg: '',
      tags: '',
    });
    setMode('manual');
  }

  async function searchUSDA(e: React.FormEvent) {
    e.preventDefault();
    if (!usdaQuery.trim()) return;
    setSearching(true);
    setSearched(false);
    setError('');
    try {
      const res = await fetch(`/api/food/search?q=${encodeURIComponent(usdaQuery.trim())}&limit=15`);
      if (!res.ok) throw new Error('Search failed');
      const data = await res.json();
      setUsdaResults(data.results || []);
      setSearched(true);
    } catch {
      setError('USDA search failed');
    } finally {
      setSearching(false);
    }
  }

  async function lookupBarcode(e: React.FormEvent) {
    e.preventDefault();
    if (!barcodeInput.trim()) return;
    setBarcodeSearching(true);
    setBarcodeResult(null);
    setBarcodeSource('');
    setError('');

    const upc = barcodeInput.trim();

    try {
      setBarcodeStep('Searching USDA & Open Food Facts...');

      const res = await fetch(`/api/food/barcode-lookup?upc=${encodeURIComponent(upc)}`);
      const data = await res.json();

      if (res.ok && data.food) {
        setBarcodeResult(data.food);
        setBarcodeSource(data.source || 'Found');
        setBarcodeSearching(false);
        return;
      }

      setBarcodeStep('');
      setError('Not found in USDA or Open Food Facts. Try photographing the nutrition label instead.');
    } catch (err) {
      setError(`Lookup error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setBarcodeSearching(false);
    }
  }

  async function parseText(e: React.FormEvent) {
    e.preventDefault();
    if (!aiText.trim()) return;
    setAiParsing(true);
    setError('');
    try {
      const res = await fetch('/api/ai/parse-food', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'text', content: aiText.trim() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'AI parsing failed');
        setAiParsing(false);
        return;
      }
      const data = await res.json();
      populateFromParsed(data.food);
    } catch {
      setError('Failed to parse text');
    } finally {
      setAiParsing(false);
    }
  }

  async function handlePhotoCapture(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAiParsing(true);
    setError('');
    setMode('ai-photo');

    try {
      // Convert to base64
      const buffer = await file.arrayBuffer();
      const base64 = btoa(
        new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), ''),
      );

      const mediaType = file.type as 'image/jpeg' | 'image/png' | 'image/webp';

      const res = await fetch('/api/ai/parse-food', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'image',
          content: base64,
          mediaType,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'AI parsing failed');
        setAiParsing(false);
        return;
      }

      const data = await res.json();
      populateFromParsed(data.food);
    } catch {
      setError('Failed to process image');
      setAiParsing(false);
    }
  }

  async function saveFood(e: React.FormEvent) {
    e.preventDefault();
    if (!form.description.trim()) {
      setError('Food name is required');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/my-foods/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: form.description.trim(),
          brand_name: form.brand_name.trim() || null,
          barcode: form.barcode.trim() || null,
          default_serving_size: form.default_serving_size ? parseFloat(form.default_serving_size) : null,
          default_serving_unit: form.default_serving_unit || null,
          energy_kcal: form.energy_kcal ? parseFloat(form.energy_kcal) : null,
          protein_g: form.protein_g ? parseFloat(form.protein_g) : null,
          fat_g: form.fat_g ? parseFloat(form.fat_g) : null,
          saturated_fat_g: form.saturated_fat_g ? parseFloat(form.saturated_fat_g) : null,
          carbs_g: form.carbs_g ? parseFloat(form.carbs_g) : null,
          fiber_g: form.fiber_g ? parseFloat(form.fiber_g) : null,
          sugar_g: form.sugar_g ? parseFloat(form.sugar_g) : null,
          sodium_mg: form.sodium_mg ? parseFloat(form.sodium_mg) : null,
          cholesterol_mg: form.cholesterol_mg ? parseFloat(form.cholesterol_mg) : null,
          tags: form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : null,
          source: form.barcode ? 'usda' : 'manual',
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Failed to save');
        setSaving(false);
        return;
      }
      router.push('/my-foods');
    } catch {
      setError('Failed to save food');
      setSaving(false);
    }
  }

  // Hidden file input for camera
  const cameraInput = (
    <input
      ref={fileInputRef}
      type="file"
      accept="image/*"
      capture="environment"
      onChange={handlePhotoCapture}
      className="hidden"
    />
  );

  // === MODE CHOOSER ===
  if (mode === 'choose') {
    return (
      <div>
        {cameraInput}
        <button onClick={() => router.back()} className="flex items-center gap-1 text-blue-600 font-medium mb-4 min-h-[44px]">
          <ArrowLeft size={20} /> Back
        </button>
        <h1 className="text-xl font-bold text-gray-900 mb-6">Add a Food</h1>

        <div className="space-y-3">
          <button
            onClick={() => setMode('ai-choose')}
            className="w-full bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200 rounded-xl p-5 active:bg-purple-100 text-left flex items-center gap-4 min-h-[72px]"
          >
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center shrink-0">
              <Sparkles size={24} className="text-purple-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-base">AI Assist</p>
              <p className="text-sm text-gray-500">Paste text, snap a label, or photograph food</p>
            </div>
          </button>

          <button
            onClick={() => setMode('usda')}
            className="w-full bg-white rounded-xl p-5 shadow-sm active:bg-gray-50 text-left flex items-center gap-4 min-h-[72px]"
          >
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center shrink-0">
              <Search size={24} className="text-green-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-base">Search USDA Database</p>
              <p className="text-sm text-gray-500">Find and import from USDA</p>
            </div>
          </button>

          <button
            onClick={() => setMode('barcode')}
            className="w-full bg-white rounded-xl p-5 shadow-sm active:bg-gray-50 text-left flex items-center gap-4 min-h-[72px]"
          >
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center shrink-0">
              <ScanBarcode size={24} className="text-orange-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-base">Scan Barcode</p>
              <p className="text-sm text-gray-500">Scan a UPC barcode</p>
            </div>
          </button>

          <button
            onClick={() => setMode('manual')}
            className="w-full bg-white rounded-xl p-5 shadow-sm active:bg-gray-50 text-left flex items-center gap-4 min-h-[72px]"
          >
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
              <Keyboard size={24} className="text-blue-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-base">Enter Manually</p>
              <p className="text-sm text-gray-500">Type in name, nutrition, serving info</p>
            </div>
          </button>
        </div>
      </div>
    );
  }

  // === AI CHOOSER ===
  if (mode === 'ai-choose') {
    return (
      <div>
        {cameraInput}
        <button onClick={() => setMode('choose')} className="flex items-center gap-1 text-blue-600 font-medium mb-4 min-h-[44px]">
          <ArrowLeft size={20} /> Back
        </button>
        <h1 className="text-xl font-bold text-gray-900 mb-2">AI Assist</h1>
        <p className="text-gray-500 text-sm mb-6">Choose how to add your food</p>

        <div className="space-y-3">
          <button
            onClick={() => setMode('ai-text')}
            className="w-full bg-white rounded-xl p-5 shadow-sm active:bg-gray-50 text-left flex items-center gap-4 min-h-[72px]"
          >
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center shrink-0">
              <ClipboardPaste size={24} className="text-purple-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-base">Paste Nutrition Info</p>
              <p className="text-sm text-gray-500">Copy from Google, a website, or anywhere</p>
            </div>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full bg-white rounded-xl p-5 shadow-sm active:bg-gray-50 text-left flex items-center gap-4 min-h-[72px]"
          >
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center shrink-0">
              <Camera size={24} className="text-orange-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-base">Photo of Nutrition Label</p>
              <p className="text-sm text-gray-500">Snap the back of a package</p>
            </div>
          </button>

          <button
            onClick={() => {
              if (fileInputRef.current) {
                fileInputRef.current.removeAttribute('capture');
                fileInputRef.current.click();
                fileInputRef.current.setAttribute('capture', 'environment');
              }
            }}
            className="w-full bg-white rounded-xl p-5 shadow-sm active:bg-gray-50 text-left flex items-center gap-4 min-h-[72px]"
          >
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center shrink-0">
              <Camera size={24} className="text-green-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-base">Photo of Food</p>
              <p className="text-sm text-gray-500">Photograph your meal for AI identification</p>
            </div>
          </button>
        </div>
      </div>
    );
  }

  // === AI TEXT PASTE ===
  if (mode === 'ai-text') {
    return (
      <div>
        <button onClick={() => setMode('ai-choose')} className="flex items-center gap-1 text-blue-600 font-medium mb-4 min-h-[44px]">
          <ArrowLeft size={20} /> Back
        </button>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Paste Nutrition Info</h1>
        <p className="text-gray-500 text-sm mb-4">
          Paste anything — Google results, nutrition label text, a description of food. AI will extract the data.
        </p>

        <form onSubmit={parseText}>
          <textarea
            value={aiText}
            onChange={(e) => setAiText(e.target.value)}
            placeholder="e.g. Hard-boiled egg: 78 cal, 6.3g protein, 5.3g fat, 0.6g carbs, 62mg sodium..."
            rows={6}
            autoFocus
            className="w-full rounded-lg border-2 border-gray-300 px-4 py-3 text-base text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
          />

          {error && <div className="bg-red-50 text-red-700 text-base rounded-lg p-3 mt-3">{error}</div>}

          <button
            type="submit"
            disabled={aiParsing || !aiText.trim()}
            className="w-full mt-4 bg-purple-600 text-white rounded-lg px-4 py-4 text-lg font-semibold active:bg-purple-800 disabled:opacity-50 min-h-[52px] flex items-center justify-center gap-2"
          >
            <Sparkles size={20} />
            {aiParsing ? 'AI is reading...' : 'Extract Nutrition'}
          </button>
        </form>
      </div>
    );
  }

  // === AI PHOTO PROCESSING ===
  if (mode === 'ai-photo' && aiParsing) {
    return (
      <div>
        {cameraInput}
        <div className="text-center py-16">
          <Sparkles size={40} className="text-purple-500 mx-auto animate-pulse" />
          <p className="text-lg font-medium text-gray-700 mt-4">AI is analyzing your photo...</p>
          <p className="text-sm text-gray-500 mt-2">This takes a few seconds</p>
        </div>
      </div>
    );
  }

  // === USDA SEARCH ===
  if (mode === 'usda') {
    return (
      <div>
        <button onClick={() => setMode('choose')} className="flex items-center gap-1 text-blue-600 font-medium mb-4 min-h-[44px]">
          <ArrowLeft size={20} /> Back
        </button>
        <h1 className="text-xl font-bold text-gray-900 mb-4">Search USDA Database</h1>
        <form onSubmit={searchUSDA} className="flex gap-2 mb-4">
          <input type="text" value={usdaQuery} onChange={(e) => setUsdaQuery(e.target.value)} placeholder="e.g. chicken breast, banana..." autoFocus
            className="flex-1 rounded-lg border-2 border-gray-300 px-4 py-3 text-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
          <button type="submit" disabled={searching || !usdaQuery.trim()}
            className="bg-green-600 text-white rounded-lg px-4 min-w-[52px] min-h-[52px] flex items-center justify-center disabled:opacity-50 active:bg-green-800">
            <Search size={22} />
          </button>
        </form>
        {error && <div className="bg-red-50 text-red-700 text-base rounded-lg p-3 mb-4">{error}</div>}
        {searching && <p className="text-center text-gray-500 py-8">Searching USDA...</p>}
        {searched && usdaResults.length === 0 && <p className="text-center text-gray-500 py-8">No results found</p>}
        <div className="space-y-2">
          {usdaResults.map((food) => (
            <button key={food.fdc_id} onClick={() => populateFromUSDA(food)}
              className="w-full text-left bg-white rounded-xl p-4 shadow-sm active:bg-gray-50 min-h-[44px]">
              <p className="font-medium text-gray-900 text-base">{food.description}</p>
              {food.brand && <p className="text-sm text-gray-500 mt-0.5">{food.brand}</p>}
              <div className="flex gap-4 mt-2 text-sm text-gray-600">
                <span className="text-orange-600 font-medium">{food.calories} cal</span>
                <span>P {food.protein_g}g</span>
                <span>C {food.carbs_g}g</span>
                <span>F {food.fat_g}g</span>
              </div>
              <p className="text-xs text-blue-600 mt-2 font-medium">Tap to import &rarr;</p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // === BARCODE CAMERA SCAN ===
  if (mode === 'barcode-scan') {
    return (
      <Suspense fallback={<div className="fixed inset-0 bg-black z-50 flex items-center justify-center"><p className="text-white">Loading camera...</p></div>}>
      <BarcodeScanner
        onScan={async (code: string) => {
          setBarcodeInput(code);
          setMode('barcode');
          // Auto-lookup
          setBarcodeSearching(true);
          setBarcodeResult(null);
          setError('');
          try {
            const res = await fetch(`/api/food/barcode/${encodeURIComponent(code)}`);
            if (res.status === 404) {
              setError(`No food found for barcode ${code}. Try searching by name.`);
            } else if (res.ok) {
              setBarcodeResult(await res.json());
            }
          } catch {
            setError('Barcode lookup failed');
          } finally {
            setBarcodeSearching(false);
          }
        }}
        onClose={() => setMode('barcode')}
      />
      </Suspense>
    );
  }

  // === BARCODE ===
  if (mode === 'barcode') {
    return (
      <div>
        <button onClick={() => setMode('choose')} className="flex items-center gap-1 text-blue-600 font-medium mb-4 min-h-[44px]">
          <ArrowLeft size={20} /> Back
        </button>
        <h1 className="text-xl font-bold text-gray-900 mb-4">Barcode Lookup</h1>

        {/* Camera scan button */}
        <button
          onClick={() => setMode('barcode-scan')}
          className="w-full bg-orange-600 text-white rounded-xl px-4 py-4 text-lg font-semibold active:bg-orange-800 min-h-[56px] flex items-center justify-center gap-2 mb-4"
        >
          <ScanBarcode size={22} />
          Open Camera Scanner
        </button>

        <div className="relative mb-4">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
          <div className="relative flex justify-center"><span className="bg-gray-50 px-3 text-sm text-gray-400">or type barcode</span></div>
        </div>

        <form onSubmit={lookupBarcode} className="flex gap-2 mb-4">
          <input type="text" inputMode="numeric" value={barcodeInput} onChange={(e) => setBarcodeInput(e.target.value)}
            placeholder="Enter UPC number"
            className="flex-1 rounded-lg border-2 border-gray-300 px-4 py-3 text-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
          <button type="submit" disabled={barcodeSearching || !barcodeInput.trim()}
            className="bg-gray-700 text-white rounded-lg px-4 min-w-[52px] min-h-[52px] flex items-center justify-center disabled:opacity-50 active:bg-gray-900">
            <Search size={22} />
          </button>
        </form>
        {error && <div className="bg-red-50 text-red-700 text-base rounded-lg p-3 mb-4">{error}</div>}

        {barcodeSearching && (
          <div className="py-8">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-4 border-gray-200 border-t-orange-600 rounded-full animate-spin" />
              <p className="text-base text-gray-700 font-medium text-center">{barcodeStep}</p>
              {barcodeStep.includes('Open Food') && (
                <p className="text-xs text-gray-400">This can take up to 15 seconds...</p>
              )}
            </div>
            <div className="mt-6 space-y-3 px-4">
              <div className="flex items-center gap-3 text-sm">
                <div className={`w-3 h-3 rounded-full ${barcodeStep.includes('Not in USDA') ? 'bg-red-400' : barcodeStep.includes('USDA') ? 'bg-orange-500 animate-pulse' : 'bg-green-500'}`} />
                <span className="text-gray-700">USDA FoodData Central</span>
                {barcodeStep.includes('Not in USDA') && <span className="text-xs text-red-400 ml-auto">not found</span>}
                {!barcodeStep.includes('USDA') && !barcodeStep.includes('Not in USDA') && <span className="text-xs text-green-500 ml-auto">found!</span>}
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className={`w-3 h-3 rounded-full ${barcodeStep.includes('Open Food') ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
                <span className={barcodeStep.includes('Open Food') ? 'text-gray-700' : 'text-gray-400'}>Open Food Facts (800K+ products)</span>
              </div>
            </div>
          </div>
        )}

        {barcodeResult && (
          <div>
            {barcodeSource && (
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-xs font-medium text-green-700">Found in {barcodeSource}</span>
              </div>
            )}
            <button onClick={() => populateFromUSDA(barcodeResult)}
              className="w-full text-left bg-white rounded-xl p-4 shadow-sm active:bg-gray-50">
              <p className="font-medium text-gray-900 text-base">{barcodeResult.description}</p>
              {barcodeResult.brand && <p className="text-sm text-gray-500 mt-0.5">{barcodeResult.brand}</p>}
              <div className="flex gap-4 mt-2 text-sm text-gray-600">
                <span className="text-orange-600 font-medium">{barcodeResult.calories} cal</span>
                <span>P {barcodeResult.protein_g}g</span>
                <span>C {barcodeResult.carbs_g}g</span>
                <span>F {barcodeResult.fat_g}g</span>
              </div>
              <p className="text-xs text-blue-600 mt-2 font-medium">Tap to import &rarr;</p>
            </button>
          </div>
        )}
      </div>
    );
  }

  // === MANUAL ENTRY / REVIEW FORM ===
  return (
    <div>
      <button onClick={() => setMode('choose')} className="flex items-center gap-1 text-blue-600 font-medium mb-4 min-h-[44px]">
        <ArrowLeft size={20} /> Back
      </button>
      <h1 className="text-xl font-bold text-gray-900 mb-4">
        {form.description ? 'Review & Save' : 'Enter Food Details'}
      </h1>

      <form onSubmit={saveFood} className="space-y-4">
        {error && <div className="bg-red-50 text-red-700 text-base rounded-lg p-3">{error}</div>}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Food Name *</label>
          <input type="text" required value={form.description} onChange={(e) => updateForm('description', e.target.value)}
            placeholder="e.g. Chicken Breast, Grilled"
            className="w-full rounded-lg border-2 border-gray-300 px-4 py-3 text-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Brand (optional)</label>
          <input type="text" value={form.brand_name} onChange={(e) => updateForm('brand_name', e.target.value)}
            placeholder="e.g. Tyson, Applebee's"
            className="w-full rounded-lg border-2 border-gray-300 px-4 py-3 text-base text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Serving Size</label>
            <input type="number" step="any" value={form.default_serving_size} onChange={(e) => updateForm('default_serving_size', e.target.value)}
              placeholder="100"
              className="w-full rounded-lg border-2 border-gray-300 px-4 py-3 text-base text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
            <select value={form.default_serving_unit} onChange={(e) => updateForm('default_serving_unit', e.target.value)}
              className="w-full rounded-lg border-2 border-gray-300 px-4 py-3 text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option value="g">grams (g)</option>
              <option value="ml">milliliters (ml)</option>
              <option value="oz">ounces (oz)</option>
              <option value="cup">cup</option>
              <option value="tbsp">tablespoon</option>
              <option value="tsp">teaspoon</option>
              <option value="piece">piece</option>
              <option value="slice">slice</option>
              <option value="large egg">large egg</option>
              <option value="sandwich">sandwich</option>
              <option value="bowl">bowl</option>
              <option value="can">can (12 oz)</option>
              <option value="bottle">bottle</option>
            </select>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h2 className="font-semibold text-gray-800 mb-3">Nutrition (per serving)</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { key: 'energy_kcal', label: 'Calories' },
              { key: 'protein_g', label: 'Protein (g)' },
              { key: 'fat_g', label: 'Total Fat (g)' },
              { key: 'saturated_fat_g', label: 'Sat. Fat (g)' },
              { key: 'carbs_g', label: 'Carbs (g)' },
              { key: 'fiber_g', label: 'Fiber (g)' },
              { key: 'sugar_g', label: 'Sugar (g)' },
              { key: 'cholesterol_mg', label: 'Cholesterol (mg)' },
            ].map(({ key, label }) => (
              <div key={key}>
                <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
                <input type="number" step="any" value={form[key as keyof typeof form]}
                  onChange={(e) => updateForm(key, e.target.value)} placeholder="0"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
            ))}
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-500 mb-1">Sodium (mg)</label>
              <input type="number" step="any" value={form.sodium_mg} onChange={(e) => updateForm('sodium_mg', e.target.value)}
                placeholder="0"
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma-separated)</label>
          <input type="text" value={form.tags} onChange={(e) => updateForm('tags', e.target.value)}
            placeholder="e.g. dinner, protein, homemade"
            className="w-full rounded-lg border-2 border-gray-300 px-4 py-3 text-base text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
        </div>

        {form.barcode && (
          <p className="text-xs text-gray-400">Barcode: {form.barcode}</p>
        )}

        <button type="submit" disabled={saving}
          className="w-full bg-blue-600 text-white rounded-lg px-4 py-4 text-lg font-semibold hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 min-h-[52px]">
          {saving ? 'Saving...' : 'Save to My Foods'}
        </button>
      </form>
    </div>
  );
}
