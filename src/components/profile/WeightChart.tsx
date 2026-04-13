'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer } from 'recharts';

interface Measurement {
  date: string;
  value: number;
}

interface Props {
  measurements: Measurement[];
  startingWeight: number | null;
  goalWeight: number | null;
  goalDate: string | null;
}

export default function WeightChart({ measurements, startingWeight, goalWeight, goalDate }: Props) {
  if (measurements.length === 0 && !startingWeight) {
    return (
      <div className="bg-white rounded-2xl p-5 shadow-sm mb-4">
        <h2 className="font-semibold text-gray-800 mb-2">Weight Journey</h2>
        <p className="text-sm text-gray-400 text-center py-8">
          Log your first weight measurement to see your chart
        </p>
      </div>
    );
  }

  // Build chart data
  const chartData: { date: string; label: string; weight: number }[] = [];

  // Add starting weight as first point if we have it and no measurements before it
  if (startingWeight && (measurements.length === 0 || measurements[0].value !== startingWeight)) {
    const startDate = measurements.length > 0 ? measurements[0].date : new Date().toISOString().split('T')[0];
    const firstMeasDate = measurements.length > 0 ? measurements[0].date : null;
    if (!firstMeasDate || firstMeasDate >= startDate) {
      // Don't duplicate if first measurement IS the starting weight date
    }
  }

  // Add actual measurements
  for (const m of measurements) {
    chartData.push({
      date: m.date,
      label: formatDate(m.date),
      weight: m.value,
    });
  }

  // If no measurements but have starting weight, show just that point
  if (chartData.length === 0 && startingWeight) {
    const today = new Date().toISOString().split('T')[0];
    chartData.push({ date: today, label: formatDate(today), weight: startingWeight });
  }

  // Calculate Y axis range
  const weights = chartData.map((d) => d.weight);
  if (goalWeight) weights.push(goalWeight);
  if (startingWeight) weights.push(startingWeight);
  const minW = Math.floor(Math.min(...weights) - 5);
  const maxW = Math.ceil(Math.max(...weights) + 5);

  // Current weight (latest measurement or starting weight)
  const currentWeight = chartData.length > 0 ? chartData[chartData.length - 1].weight : startingWeight;
  const weightChange = startingWeight && currentWeight ? currentWeight - startingWeight : null;

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm mb-4">
      <div className="flex items-center justify-between mb-1">
        <h2 className="font-semibold text-gray-800">Weight Journey</h2>
        {currentWeight && (
          <span className="text-lg font-bold text-gray-900">{currentWeight} lbs</span>
        )}
      </div>

      {/* Summary stats */}
      <div className="flex gap-4 mb-4 text-sm">
        {startingWeight && (
          <span className="text-gray-500">Start: {startingWeight} lbs</span>
        )}
        {goalWeight && (
          <span className="text-gray-500">Goal: {goalWeight} lbs</span>
        )}
        {weightChange !== null && weightChange !== 0 && (
          <span className={weightChange < 0 ? 'text-green-600 font-medium' : 'text-red-500 font-medium'}>
            {weightChange > 0 ? '+' : ''}{weightChange.toFixed(1)} lbs
          </span>
        )}
      </div>

      {/* Chart */}
      {chartData.length > 1 ? (
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: '#9ca3af' }}
              interval="preserveStartEnd"
            />
            <YAxis
              domain={[minW, maxW]}
              tick={{ fontSize: 10, fill: '#9ca3af' }}
              tickFormatter={(v) => `${v}`}
            />
            <Tooltip
              contentStyle={{ borderRadius: '8px', fontSize: '14px' }}
              formatter={(value) => [`${value} lbs`, 'Weight']}
            />
            <Line
              type="monotone"
              dataKey="weight"
              stroke="#3b82f6"
              strokeWidth={2.5}
              dot={{ fill: '#3b82f6', r: 4 }}
              activeDot={{ r: 6 }}
            />
            {goalWeight && (
              <ReferenceLine
                y={goalWeight}
                stroke="#22c55e"
                strokeDasharray="5 5"
                strokeWidth={1.5}
                label={{ value: `Goal: ${goalWeight}`, position: 'right', fontSize: 10, fill: '#22c55e' }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div className="text-center py-6">
          <p className="text-3xl font-bold text-gray-900">{chartData[0]?.weight || startingWeight} lbs</p>
          <p className="text-sm text-gray-400 mt-1">Log more weights to see your trend</p>
        </div>
      )}

      {/* Goal date */}
      {goalWeight && goalDate && (
        <p className="text-xs text-gray-400 text-center mt-2">
          Target: {goalWeight} lbs by {formatDate(goalDate)}
        </p>
      )}
    </div>
  );
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
