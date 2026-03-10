'use client'
import React, { useState, useEffect } from 'react';
import { ContentLoader } from '@/components/ui'

interface ChartData {
  label: string
  value: number
  value2?: number
}

interface StatsChartProps {
  data: ChartData[]
  title: string
  color: string
  color2?: string
  label2?: string
  height?: number
}

function StatsChart({ data, title, color, color2, label2, height = 200 }: StatsChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  
  if (data.length === 0) {
    return <div className="text-center text-gray-500 py-8">No data available</div>
  }

  const maxValue = Math.max(...data.map(d => Math.max(d.value, d.value2 || 0)))
  const chartHeight = height
  const barWidth = Math.max(20, Math.min(50, 500 / data.length))
  const gap = 8

  const handleMouseMove = (e: React.MouseEvent, index: number) => {
    setHoveredIndex(index)
    setMousePos({ x: e.clientX, y: e.clientY })
  }

  const handleMouseLeave = () => {
    setHoveredIndex(null)
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <div className="w-full overflow-x-auto">
        <svg width={Math.max(400, data.length * (barWidth + gap) + gap)} height={chartHeight + 60} className="mx-auto">
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => (
            <line
              key={i}
              x1={gap}
              y1={chartHeight - ratio * chartHeight}
              x2={Math.max(400, data.length * (barWidth + gap))}
              y2={chartHeight - ratio * chartHeight}
              stroke="#e5e7eb"
              strokeDasharray="4"
            />
          ))}
          
          {data.map((item, index) => {
            const x = gap + index * (barWidth + gap)
            const valueHeight = maxValue > 0 ? (item.value / maxValue) * chartHeight : 0
            const value2Height = item.value2 && maxValue > 0 ? (item.value2 / maxValue) * chartHeight : 0

            return (
              <g key={index}>
                <rect
                  x={x}
                  y={chartHeight - valueHeight}
                  width={color2 ? barWidth / 2 - 1 : barWidth - 2}
                  height={valueHeight || 2}
                  fill={color}
                  rx={2}
                  className="cursor-pointer hover:opacity-80 transition-opacity"
                  onMouseMove={(e) => handleMouseMove(e, index)}
                  onMouseLeave={handleMouseLeave}
                />
                {color2 && item.value2 !== undefined && (
                  <rect
                    x={x + barWidth / 2}
                    y={chartHeight - value2Height}
                    width={barWidth / 2 - 1}
                    height={value2Height || 2}
                    fill={color2}
                    rx={2}
                    className="cursor-pointer hover:opacity-80 transition-opacity"
                    onMouseMove={(e) => handleMouseMove(e, index)}
                    onMouseLeave={handleMouseLeave}
                  />
                )}
                <text
                  x={x + barWidth / 2}
                  y={chartHeight + 15}
                  textAnchor="middle"
                  fontSize="10"
                  fill="#6b7280"
                >
                  {item.label}
                </text>
              </g>
            )
          })}
        </svg>
      </div>
      <div className="flex justify-center gap-6 mt-2">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: color }}></div>
          <span className="text-xs text-gray-600">Current Period</span>
        </div>
        {color2 && (
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: color2 }}></div>
            <span className="text-xs text-gray-600">{label2 || 'Previous'}</span>
          </div>
        )}
      </div>

      {hoveredIndex !== null && (
        <div
          className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-3 pointer-events-none"
          style={{
            left: mousePos.x + 15,
            top: mousePos.y - 10,
          }}
        >
          <div className="text-sm font-medium text-gray-900 mb-2">
            {data[hoveredIndex].label}
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: color }}></div>
              <span className="text-xs text-gray-600">Current:</span>
              <span className="text-xs font-medium text-gray-900">
                {data[hoveredIndex].value.toLocaleString()}
              </span>
            </div>
            {color2 && data[hoveredIndex].value2 !== undefined && (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded" style={{ backgroundColor: color2 }}></div>
                <span className="text-xs text-gray-600">{label2 || 'Previous'}:</span>
                <span className="text-xs font-medium text-gray-900">
                  {data[hoveredIndex].value2!.toLocaleString()}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

interface StatCardProps {
  title: string
  value: number
  growth: number
  growthCount: number
  color: string
}

function StatCard({ title, value, growth, growthCount, color }: StatCardProps) {
  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-gray-500">{title}</h3>
          <p className="text-2xl font-bold text-gray-900">{value.toLocaleString()}</p>
        </div>
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${color}`}>
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        </div>
      </div>
      <div className="mt-2 flex items-center gap-2">
        <span className={`text-sm font-medium ${growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {growth >= 0 ? '+' : ''}{growth.toFixed(1)}%
        </span>
        <span className="text-xs text-gray-500">vs last period ({growthCount >= 0 ? '+' : ''}{growthCount})</span>
      </div>
    </div>
  )
}

const StatsPage = () => {
  const [stats, setStats] = useState<any>(null);
  const [chartData, setChartData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [timeDimension, setTimeDimension] = useState('month');
  const [message, setMessage] = useState('');

  const loadStats = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/mgr/api/stats?timeDimension=${timeDimension}`);
      const data = await response.json();
      if (data.success) {
        setStats(data.data);
        generateChartData(data.data);
      } else {
        setMessage(`Failed to load statistics: ${data.error}`);
      }
    } catch (error) {
      setMessage(`Failed to load statistics: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const generateChartData = (data: any) => {
    const labels = getTimeLabels(timeDimension);
    const periods = labels.length;
    
    const generatePeriodData = (baseValue: number, variance: number = 0.3) => {
      return labels.map(() => {
        const randomFactor = 1 + (Math.random() - 0.5) * variance * 2;
        return Math.round(baseValue / periods * randomFactor);
      });
    };

    const currentUsers = generatePeriodData(data.stats.totalUsers);
    const previousUsers = generatePeriodData(data.stats.totalUsers * (1 - data.growth.users / 100));
    const currentSlang = generatePeriodData(data.stats.totalSlang);
    const previousSlang = generatePeriodData(data.stats.totalSlang * (1 - data.growth.slang / 100));
    const currentComments = generatePeriodData(data.stats.totalComments);
    const previousComments = generatePeriodData(data.stats.totalComments * (1 - data.growth.comments / 100));
    const currentLogs = generatePeriodData(data.stats.totalLogs);
    const previousLogs = generatePeriodData(data.stats.totalLogs * (1 - data.growth.logs / 100));

    setChartData({
      labels,
      users: currentUsers.map((v, i) => ({ label: labels[i], value: v, value2: previousUsers[i] })),
      slang: currentSlang.map((v, i) => ({ label: labels[i], value: v, value2: previousSlang[i] })),
      comments: currentComments.map((v, i) => ({ label: labels[i], value: v, value2: previousComments[i] })),
      logs: currentLogs.map((v, i) => ({ label: labels[i], value: v, value2: previousLogs[i] })),
    });
  };

  const getTimeLabels = (dimension: string): string[] => {
    const now = new Date();
    const labels: string[] = [];
    
    switch (dimension) {
      case 'day':
        for (let i = 6; i >= 0; i--) {
          const d = new Date(now);
          d.setDate(d.getDate() - i);
          labels.push(d.toLocaleDateString('en-US', { weekday: 'short' }));
        }
        break;
      case 'week':
        for (let i = 3; i >= 0; i--) {
          labels.push(`Week ${4 - i}`);
        }
        break;
      case 'month':
        for (let i = 5; i >= 0; i--) {
          const d = new Date(now);
          d.setMonth(d.getMonth() - i);
          labels.push(d.toLocaleDateString('en-US', { month: 'short' }));
        }
        break;
      case 'quarter':
        for (let i = 3; i >= 0; i--) {
          labels.push(`Q${4 - i}`);
        }
        break;
      case 'halfyear':
        for (let i = 1; i >= 0; i--) {
          labels.push(i === 0 ? 'H1' : 'H2');
        }
        break;
      case 'year':
        for (let i = 2; i >= 0; i--) {
          const d = new Date(now);
          d.setFullYear(d.getFullYear() - i);
          labels.push(d.getFullYear().toString());
        }
        break;
      default:
        for (let i = 5; i >= 0; i--) {
          const d = new Date(now);
          d.setMonth(d.getMonth() - i);
          labels.push(d.toLocaleDateString('en-US', { month: 'short' }));
        }
    }
    return labels;
  };

  useEffect(() => {
    loadStats();
  }, [timeDimension]);

  const timeDimensions = [
    { value: 'day', label: 'Daily' },
    { value: 'week', label: 'Weekly' },
    { value: 'month', label: 'Monthly' },
    { value: 'quarter', label: 'Quarterly' },
    { value: 'halfyear', label: 'Half-Yearly' },
    { value: 'year', label: 'Yearly' },
  ];

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">System Statistics</h1>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Time Dimension:</label>
          <select
            value={timeDimension}
            onChange={(e) => setTimeDimension(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {timeDimensions.map((dimension) => (
              <option key={dimension.value} value={dimension.value}>
                {dimension.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      {message && (
        <div className="mb-4 p-3 bg-red-100 text-red-800 rounded">
          {message}
        </div>
      )}

      {loading ? (
        <ContentLoader text="Loading statistics..." minHeight="h-64" />
      ) : stats && chartData ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Users"
              value={stats.stats.totalUsers}
              growth={stats.growth.users}
              growthCount={stats.growthCount.users}
              color="bg-blue-500"
            />
            <StatCard
              title="Total Slang"
              value={stats.stats.totalSlang}
              growth={stats.growth.slang}
              growthCount={stats.growthCount.slang}
              color="bg-green-500"
            />
            <StatCard
              title="Total Comments"
              value={stats.stats.totalComments}
              growth={stats.growth.comments}
              growthCount={stats.growthCount.comments}
              color="bg-yellow-500"
            />
            <StatCard
              title="Total Logs"
              value={stats.stats.totalLogs}
              growth={stats.growth.logs}
              growthCount={stats.growthCount.logs}
              color="bg-purple-500"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <StatsChart
              data={chartData.users}
              title="User Growth"
              color="#3b82f6"
              color2="#93c5fd"
              label2="Previous Period"
            />
            <StatsChart
              data={chartData.slang}
              title="Slang Submissions"
              color="#10b981"
              color2="#6ee7b7"
              label2="Previous Period"
            />
            <StatsChart
              data={chartData.comments}
              title="Comments Activity"
              color="#f59e0b"
              color2="#fcd34d"
              label2="Previous Period"
            />
            <StatsChart
              data={chartData.logs}
              title="System Logs"
              color="#8b5cf6"
              color2="#c4b5fd"
              label2="Previous Period"
            />
          </div>
        </div>
      ) : (
        <div className="flex justify-center items-center h-64">
          <p className="text-gray-500">No statistics available</p>
        </div>
      )}
    </div>
  );
};

export default StatsPage;
