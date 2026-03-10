'use client'
import React, { useState } from 'react'

interface ChartData {
  label: string
  views: number
  clicks: number
}

interface SimpleChartProps {
  data: ChartData[]
  groupBy: 'day' | 'week' | 'month'
}

export default function SimpleChart({ data, groupBy }: SimpleChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })

  if (data.length === 0) {
    return <div className="text-center text-gray-500 py-8">No data available</div>
  }

  const maxValue = Math.max(...data.map(d => Math.max(d.views, d.clicks)))
  const chartHeight = 200
  const barWidth = Math.max(20, Math.min(60, 600 / data.length))
  const gap = 10

  const handleMouseMove = (e: React.MouseEvent, index: number) => {
    setHoveredIndex(index)
    setMousePos({ x: e.clientX, y: e.clientY })
  }

  const handleMouseLeave = () => {
    setHoveredIndex(null)
  }

  return (
    <>
      <div className="w-full overflow-x-auto">
        <div className="min-w-max">
          {/* Chart */}
          <svg width={data.length * (barWidth + gap) + gap} height={chartHeight + 60} className="mx-auto">
            {/* Grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => (
              <line
                key={i}
                x1={gap}
                y1={chartHeight - ratio * chartHeight}
                x2={data.length * (barWidth + gap)}
                y2={chartHeight - ratio * chartHeight}
                stroke="#e5e7eb"
                strokeDasharray="4"
              />
            ))}

            {/* Bars */}
            {data.map((item, index) => {
              const x = gap + index * (barWidth + gap)
              const viewsHeight = maxValue > 0 ? (item.views / maxValue) * chartHeight : 0
              const clicksHeight = maxValue > 0 ? (item.clicks / maxValue) * chartHeight : 0

              return (
                <g key={index}>
                  {/* Views bar */}
                  <rect
                    x={x}
                    y={chartHeight - viewsHeight}
                    width={barWidth / 2 - 2}
                    height={viewsHeight}
                    fill="#3b82f6"
                    rx={2}
                    className="cursor-pointer hover:opacity-80 transition-opacity"
                    onMouseMove={(e) => handleMouseMove(e, index)}
                    onMouseLeave={handleMouseLeave}
                  />
                  {/* Clicks bar */}
                  <rect
                    x={x + barWidth / 2}
                    y={chartHeight - clicksHeight}
                    width={barWidth / 2 - 2}
                    height={clicksHeight}
                    fill="#10b981"
                    rx={2}
                    className="cursor-pointer hover:opacity-80 transition-opacity"
                    onMouseMove={(e) => handleMouseMove(e, index)}
                    onMouseLeave={handleMouseLeave}
                  />
                  {/* Label */}
                  <text
                    x={x + barWidth / 2}
                    y={chartHeight + 20}
                    textAnchor="middle"
                    fontSize="10"
                    fill="#6b7280"
                    transform={`rotate(-45, ${x + barWidth / 2}, ${chartHeight + 20})`}
                  >
                    {item.label}
                  </text>
                </g>
              )
            })}

            {/* Y-axis label */}
            <text x={5} y={10} fontSize="10" fill="#6b7280">Views/Clicks</text>
          </svg>

          {/* Legend */}
          <div className="flex justify-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-400 rounded"></div>
              <span className="text-sm text-gray-600">Views</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <span className="text-sm text-gray-600">Clicks</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tooltip */}
      {hoveredIndex !== null && (
        <div
          className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-3 pointer-events-none"
          style={{
            left: mousePos.x + 10,
            top: mousePos.y - 10,
          }}
        >
          <div className="text-sm font-medium text-gray-900 mb-2">
            {data[hoveredIndex].label}
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-400 rounded"></div>
              <span className="text-sm text-gray-600">Views:</span>
              <span className="text-sm font-medium text-gray-900">
                {data[hoveredIndex].views.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span className="text-sm text-gray-600">Clicks:</span>
              <span className="text-sm font-medium text-gray-900">
                {data[hoveredIndex].clicks.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center gap-2 pt-1 border-t">
              <span className="text-sm text-gray-600">CTR:</span>
              <span className="text-sm font-medium text-gray-900">
                {data[hoveredIndex].views > 0
                  ? ((data[hoveredIndex].clicks / data[hoveredIndex].views) * 100).toFixed(2)
                  : '0.00'}%
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
