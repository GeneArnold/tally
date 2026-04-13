'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Save } from 'lucide-react';
import TagPicker from '@/components/food/TagPicker';

export default function EditFoodPage() {
  const router = useRouter();
  const params = useParams();
  const foodId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

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
  });
  const [editTags, setEditTags] = useState<string[]>([]);

  useEffect(() => {
    async function loadFood() {
      try {
        const res = await fetch(`/api/my-foods/${foodId}?_t=${Date.now()}`);
        if (!res.ok) { router.push('/my-foods'); return; }
        const data = await res.json();
        const f = data.food;
        setForm({
          description: f.description || '',
          brand_name: f.brand_name || '',
          barcode: f.barcode || '',
          default_serving_size: f.default_serving_size?.toString() || '',
          default_serving_unit: f.default_serving_unit || 'g',
          energy_kcal: f.energy_kcal?.toString() || '',
          protein_g: f.protein_g?.toString() || '',
          fat_g: f.fat_g?.toString() || '',
          saturated_fat_g: f.saturated_fat_g?.toString() || '',
          carbs_g: f.carbs_g?.toString() || '',
          fiber_g: f.fiber_g?.toString() || '',
          sugar_g: f.sugar_g?.toString() || '',
          sodium_mg: f.sodium_mg?.toString() || '',
          cholesterol_mg: f.cholesterol_mg?.toString() || '',
        });
        setEditTags(Array.isArray(f.tag_ids) ? f.tag_ids : []);
      } catch {
        router.push('/my-foods');
      } finally {
        setLoading(false);
      }
    }
    loadFood();
  }, [foodId, router]);

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.description.trim()) { setError('Food name is required'); return; }
    setSaving(true);
    setError('');
    setSaved(false);

    try {
      const res = await fetch(`/api/my-foods/${foodId}`, {
        method: 'PATCH',
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
          tag_ids: editTags,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Failed to save');
        setSaving(false);
        return;
      }

      setSaved(true);
      // Reload after brief delay so user sees "Saved!"
      setTimeout(() => { window.location.href = `/my-foods/${foodId}`; }, 800);
    } catch {
      setError('Failed to save');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Loading...</div>;
  }

  return (
    <div>
      <button onClick={() => router.back()} className="flex items-center gap-1 text-blue-600 font-medium mb-4 min-h-[44px]">
        <ArrowLeft size={20} /> Back
      </button>
      <h1 className="text-xl font-bold text-gray-900 mb-4">Edit Food</h1>

      <form onSubmit={handleSave} className="space-y-4">
        {error && <div className="bg-red-50 text-red-700 text-base rounded-lg p-3">{error}</div>}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Food Name *</label>
          <input type="text" required value={form.description} onChange={(e) => update('description', e.target.value)}
            className="w-full rounded-lg border-2 border-gray-300 px-4 py-3 text-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
          <input type="text" value={form.brand_name} onChange={(e) => update('brand_name', e.target.value)}
            className="w-full rounded-lg border-2 border-gray-300 px-4 py-3 text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Serving Size</label>
            <input type="number" step="any" value={form.default_serving_size} onChange={(e) => update('default_serving_size', e.target.value)}
              className="w-full rounded-lg border-2 border-gray-300 px-4 py-3 text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
            <select value={form.default_serving_unit} onChange={(e) => update('default_serving_unit', e.target.value)}
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
                  onChange={(e) => update(key, e.target.value)} placeholder="0"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
            ))}
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-500 mb-1">Sodium (mg)</label>
              <input type="number" step="any" value={form.sodium_mg} onChange={(e) => update('sodium_mg', e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            </div>
          </div>
        </div>

        <TagPicker selectedIds={editTags} onChange={setEditTags} />

        {form.barcode && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Barcode</label>
            <input type="text" value={form.barcode} onChange={(e) => update('barcode', e.target.value)}
              className="w-full rounded-lg border-2 border-gray-300 px-4 py-3 text-base text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
          </div>
        )}

        <button type="submit" disabled={saving}
          className={`w-full flex items-center justify-center gap-2 rounded-xl px-4 py-4 text-lg font-semibold min-h-[52px] ${
            saved ? 'bg-green-600 text-white' : 'bg-blue-600 text-white active:bg-blue-800 disabled:opacity-50'
          }`}>
          <Save size={20} />
          {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
}
