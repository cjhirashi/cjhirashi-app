'use client'

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts'
import { Card } from '@/components/ui/card'
import type { ActivityBreakdown } from '@/lib/types/analytics'

interface ActivityBreakdownChartProps {
  data: ActivityBreakdown[]
}

const COLORS = [
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#ec4899',
  '#14b8a6',
  '#f97316',
]

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: Array<{ value: number; name: string; percentage?: number; payload?: any }>
}) {
  if (active && payload && payload.length) {
    const data = payload[0].payload as ActivityBreakdown
    return (
      <div className="bg-background border border-border rounded-lg shadow-lg p-3 text-sm">
        <p className="font-semibold text-foreground">{data.category}</p>
        <p>
          Acciones:{' '}
          <span className="font-semibold">
            {data.count.toLocaleString('es-ES')}
          </span>
        </p>
        <p>
          Porcentaje:{' '}
          <span className="font-semibold">{data.percentage.toFixed(1)}%</span>
        </p>
      </div>
    )
  }
  return null
}

export function ActivityBreakdownChart({
  data,
}: ActivityBreakdownChartProps) {
  if (!data || data.length === 0) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">
          Desglose de Actividades
        </h3>
        <div className="h-64 flex items-center justify-center">
          <p className="text-muted-foreground">Sin datos disponibles</p>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Desglose de Actividades</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data as any}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={(entry: unknown) => {
              const item = entry as { percentage?: number }
              return item.percentage
                ? `${item.percentage.toFixed(1)}%`
                : ''
            }}
            outerRadius={100}
            fill="#8884d8"
            dataKey="count"
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="bottom"
            height={36}
            formatter={(value, entry: unknown) => {
              const item = entry as { payload?: ActivityBreakdown }
              return item.payload?.category || value
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </Card>
  )
}
