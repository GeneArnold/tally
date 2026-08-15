import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { db, schema } from '@/lib/db';
import { eq } from 'drizzle-orm';
import Link from 'next/link';
import { Pencil } from 'lucide-react';
import BackLink from '@/components/food/BackLink';
import DeleteFoodButton from '@/components/food/DeleteFoodButton';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string }>;
}

export default async function FoodDetailPage({ params, searchParams }: Props) {
  const session = await getSession();
  if (!session) redirect('/login');

  const { id } = await params;
  const { from } = await searchParams;
  const backHref = from || '/my-foods';
  const backLabel = from?.startsWith('/diary') ? 'Back to Diary' : 'My Foods';

  const foodRow = db.select().from(schema.foods).where(eq(schema.foods.id, id)).get();
  if (!foodRow) redirect('/my-foods');

  const tagRows = db.select({
    id: schema.foodTags.id,
    name: schema.foodTags.name,
    color: schema.foodTags.color,
  })
    .from(schema.foodsToFoodTags)
    .innerJoin(schema.foodTags, eq(schema.foodsToFoodTags.foodTagId, schema.foodTags.id))
    .where(eq(schema.foodsToFoodTags.foodId, id))
    .all();

  const food = {
    id: foodRow.id,
    description: foodRow.description,
    brand_name: foodRow.brandName,
    energy_kcal: foodRow.energyKcal,
    protein_g: foodRow.proteinG,
    fat_g: foodRow.totalFatG,
    carbs_g: foodRow.carbohydrateG,
    fiber_g: foodRow.dietaryFiberG,
    sugar_g: foodRow.totalSugarsG,
    sodium_mg: foodRow.sodiumMg,
    default_serving_size: foodRow.defaultServingSize,
    default_serving_unit: foodRow.defaultServingUnit,
    barcode: foodRow.upcCode,
    deleted_at: foodRow.deletedAt,
  };

  return (
    <div>
      <BackLink href={backHref} label={backLabel} />

      {food.deleted_at && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
          <p className="text-sm font-medium text-red-800">This food has been deleted</p>
          <p className="text-xs text-red-600 mt-1">It may still appear in past diary entries.</p>
        </div>
      )}

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{food.description}</h1>
          {food.brand_name && <p className="text-gray-500 mt-1">{food.brand_name}</p>}
        </div>
        <Link
          href={`/my-foods/${id}/edit`}
          className="shrink-0 bg-brand-600 text-white rounded-lg px-3 py-2 text-sm font-medium flex items-center gap-1.5 active:bg-brand-800 min-h-[44px]"
        >
          <Pencil size={16} />
          Edit
        </Link>
      </div>

      <div className="mt-4 bg-white rounded-xl p-4 shadow-sm">
        <h2 className="font-semibold text-gray-800 mb-3">Nutrition (per serving)</h2>
        {food.default_serving_size && (
          <p className="text-sm text-gray-500 mb-3">
            Serving: {food.default_serving_size} {food.default_serving_unit || ''}
          </p>
        )}

        <div className="grid grid-cols-2 gap-y-2 text-sm">
          <span className="text-gray-500">Calories</span>
          <span className="text-right font-medium text-gray-900">{food.energy_kcal ?? '—'}</span>
          <span className="text-gray-500">Protein</span>
          <span className="text-right font-medium text-gray-900">{food.protein_g != null ? `${food.protein_g}g` : '—'}</span>
          <span className="text-gray-500">Total Fat</span>
          <span className="text-right font-medium text-gray-900">{food.fat_g != null ? `${food.fat_g}g` : '—'}</span>
          <span className="text-gray-500">Carbs</span>
          <span className="text-right font-medium text-gray-900">{food.carbs_g != null ? `${food.carbs_g}g` : '—'}</span>
          <span className="text-gray-500">Fiber</span>
          <span className="text-right font-medium text-gray-900">{food.fiber_g != null ? `${food.fiber_g}g` : '—'}</span>
          <span className="text-gray-500">Sugar</span>
          <span className="text-right font-medium text-gray-900">{food.sugar_g != null ? `${food.sugar_g}g` : '—'}</span>
          <span className="text-gray-500">Sodium</span>
          <span className="text-right font-medium text-gray-900">{food.sodium_mg != null ? `${food.sodium_mg}mg` : '—'}</span>
        </div>
      </div>

      {tagRows.length > 0 && (
        <div className="mt-4 flex gap-2 flex-wrap">
          {tagRows.map((tag) => (
            <span key={tag.id} className="text-sm rounded-full px-3 py-1 text-white" style={{ backgroundColor: tag.color || '#2EA96B' }}>{tag.name}</span>
          ))}
        </div>
      )}

      {food.barcode && (
        <p className="mt-4 text-xs text-gray-400">Barcode: {food.barcode}</p>
      )}

      <div className="mt-8">
        <DeleteFoodButton foodId={food.id} foodName={food.description} />
      </div>
    </div>
  );
}
