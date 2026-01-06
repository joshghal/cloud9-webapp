'use client';

import { useEffect, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartOptions,
  ChartData,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import type { TradeTimeEntry, TiltData } from '@/types';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface TiltGraphProps {
  tradeTimeHistory: TradeTimeEntry[];
  currentTilt: TiltData | null;
  baseline?: number;
}

export function TiltGraph({ tradeTimeHistory, currentTilt, baseline = 6000 }: TiltGraphProps) {
  const chartRef = useRef<ChartJS<'line'>>(null);

  // Calculate actual baseline from data or use provided
  const actualBaseline = currentTilt?.trade_time_baseline || baseline;

  // Prepare chart data
  const labels = tradeTimeHistory.map(t => `R${t.round}`);
  const tradeTimes = tradeTimeHistory.map(t => t.trade_time_ms);

  // Create baseline array
  const baselineArray = new Array(tradeTimes.length).fill(actualBaseline);

  // Calculate tilt zone (150% of baseline)
  const tiltThreshold = actualBaseline * 1.5;

  const data: ChartData<'line'> = {
    labels,
    datasets: [
      {
        label: 'Trade Time (ms)',
        data: tradeTimes,
        borderColor: '#ff4757',
        backgroundColor: 'rgba(255, 71, 87, 0.1)',
        borderWidth: 3,
        tension: 0.3,
        fill: true,
        pointBackgroundColor: tradeTimes.map(t =>
          t > tiltThreshold ? '#ff4757' : '#2ed573'
        ),
        pointBorderColor: tradeTimes.map(t =>
          t > tiltThreshold ? '#ff4757' : '#2ed573'
        ),
        pointRadius: 6,
        pointHoverRadius: 8,
      },
      {
        label: 'Baseline',
        data: baselineArray,
        borderColor: '#2ed573',
        borderWidth: 2,
        borderDash: [5, 5],
        tension: 0,
        fill: false,
        pointRadius: 0,
      },
      {
        label: 'Tilt Zone',
        data: new Array(tradeTimes.length).fill(tiltThreshold),
        borderColor: 'rgba(255, 71, 87, 0.5)',
        borderWidth: 1,
        borderDash: [3, 3],
        tension: 0,
        fill: false,
        pointRadius: 0,
      },
    ],
  };

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 500,
      easing: 'easeOutQuart',
    },
    interaction: {
      intersect: false,
      mode: 'index',
    },
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          color: '#a0aec0',
          font: { size: 11 },
          usePointStyle: true,
          pointStyle: 'circle',
        },
      },
      tooltip: {
        backgroundColor: '#1a2744',
        titleColor: '#ffffff',
        bodyColor: '#a0aec0',
        borderColor: '#00a8e8',
        borderWidth: 1,
        padding: 12,
        displayColors: false,
        callbacks: {
          label: (context) => {
            const value = context.parsed.y ?? 0;
            const percentage = ((value / actualBaseline - 1) * 100).toFixed(0);
            if (context.datasetIndex === 0) {
              return [
                `Trade Time: ${(value / 1000).toFixed(1)}s`,
                value > actualBaseline
                  ? `+${percentage}% from baseline`
                  : `${percentage}% from baseline`,
              ].join('\n');
            }
            return `${context.dataset.label}: ${(value / 1000).toFixed(1)}s`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(160, 174, 192, 0.1)',
        },
        ticks: {
          color: '#a0aec0',
          font: { size: 11 },
        },
      },
      y: {
        min: 0,
        max: Math.max(...tradeTimes, tiltThreshold * 1.2, 20000),
        grid: {
          color: 'rgba(160, 174, 192, 0.1)',
        },
        ticks: {
          color: '#a0aec0',
          font: { size: 11 },
          callback: (value) => `${(Number(value) / 1000).toFixed(0)}s`,
        },
      },
    },
  };

  // Animate when new data arrives
  useEffect(() => {
    if (chartRef.current) {
      chartRef.current.update('default');
    }
  }, [tradeTimeHistory]);

  // Calculate current degradation
  const latestTradeTime = tradeTimes[tradeTimes.length - 1] || 0;
  const degradation = actualBaseline > 0
    ? ((latestTradeTime / actualBaseline - 1) * 100).toFixed(0)
    : '0';

  const diagnosis = currentTilt?.diagnosis || 'neutral';
  const diagnosisColors: Record<string, string> = {
    tilt: 'text-[#ff4757]',
    tactical: 'text-[#ffa502]',
    enemy_strong: 'text-[#ff4757]',
    locked_in: 'text-[#2ed573]',
    neutral: 'text-[#a0aec0]',
  };

  const diagnosisLabels: Record<string, string> = {
    tilt: 'TILT DETECTED',
    tactical: 'TACTICAL (PASSIVE)',
    enemy_strong: 'ENEMY STRONG',
    locked_in: 'LOCKED IN',
    neutral: 'MONITORING...',
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="card-header mb-0">Trade Time Analysis</h3>
        <div className="flex items-center gap-4">
          <span className={`text-sm font-semibold ${diagnosisColors[diagnosis]}`}>
            {diagnosisLabels[diagnosis]}
          </span>
          {Number(degradation) > 0 && (
            <span className="text-sm text-[#ff4757] font-mono">
              +{degradation}%
            </span>
          )}
        </div>
      </div>

      <div className="chart-container h-[200px]">
        {tradeTimeHistory.length > 0 ? (
          <Line ref={chartRef} data={data} options={options} />
        ) : (
          <div className="flex items-center justify-center h-full text-[#a0aec0]">
            <p>Waiting for trade time data...</p>
          </div>
        )}
      </div>

      {currentTilt?.has_data && (
        <div className="mt-4 pt-4 border-t border-white/10">
          <p className="text-sm text-[#a0aec0]">
            {currentTilt.insight}
          </p>
        </div>
      )}
    </div>
  );
}
