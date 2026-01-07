'use client';

import { useEffect, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
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

  const rawDiagnosis = currentTilt?.diagnosis || 'neutral';

  const diagnosisConfig: Record<string, { color: string; bg: string; label: string; glow: string }> = {
    tilt: {
      color: 'text-[#ff4757]',
      bg: 'bg-[#ff4757]/20',
      label: 'TILT DETECTED',
      glow: 'shadow-[0_0_30px_rgba(255,71,87,0.3)]'
    },
    tactical: {
      color: 'text-[#ffa502]',
      bg: 'bg-[#ffa502]/20',
      label: 'TACTICAL (PASSIVE)',
      glow: ''
    },
    enemy_strong: {
      color: 'text-[#ff4757]',
      bg: 'bg-[#ff4757]/20',
      label: 'ENEMY DOMINANT',
      glow: 'shadow-[0_0_30px_rgba(255,71,87,0.3)]'
    },
    locked_in: {
      color: 'text-[#2ed573]',
      bg: 'bg-[#2ed573]/20',
      label: 'LOCKED IN',
      glow: 'shadow-[0_0_20px_rgba(46,213,115,0.2)]'
    },
    neutral: {
      color: 'text-[#a0aec0]',
      bg: 'bg-white/5',
      label: 'MONITORING...',
      glow: ''
    },
  };

  // Fallback to neutral if diagnosis not in config
  const diagnosis = rawDiagnosis in diagnosisConfig ? rawDiagnosis : 'neutral';
  const config = diagnosisConfig[diagnosis];
  const isTilting = diagnosis === 'tilt' || diagnosis === 'enemy_strong';
  const isLockedIn = diagnosis === 'locked_in';

  return (
    <motion.div
      className={`glass-card p-6 relative overflow-hidden ${isTilting ? config.glow : ''}`}
      animate={isTilting ? { borderColor: ['rgba(255,71,87,0.3)', 'rgba(255,71,87,0.6)', 'rgba(255,71,87,0.3)'] } : {}}
      transition={{ duration: 2, repeat: Infinity }}
    >
      {/* Tilt warning background pulse */}
      {isTilting && (
        <motion.div
          className="absolute inset-0 bg-[#ff4757]/5 pointer-events-none"
          animate={{ opacity: [0, 0.5, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-4 relative">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-bold text-white">Trade Time Analysis</h3>
          <span className="text-[10px] text-[#00a8e8] bg-[#00a8e8]/10 px-2 py-0.5 rounded-full font-medium">
            KEY METRIC
          </span>
        </div>
        <div className="flex items-center gap-3">
          {/* Diagnosis badge */}
          <motion.span
            className={`px-3 py-1 rounded-full text-xs font-bold ${config.color} ${config.bg}`}
            animate={isTilting ? { scale: [1, 1.05, 1] } : {}}
            transition={{ duration: 1, repeat: Infinity }}
          >
            {config.label}
          </motion.span>
          {/* Degradation percentage */}
          {Number(degradation) > 0 && (
            <motion.span
              className="text-xl font-bold text-[#ff4757] font-mono"
              key={degradation}
              initial={{ scale: 1.2, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
            >
              +{degradation}%
            </motion.span>
          )}
          {Number(degradation) < 0 && (
            <span className="text-xl font-bold text-[#2ed573] font-mono">
              {degradation}%
            </span>
          )}
        </div>
      </div>

      {/* Chart - Larger for hero status */}
      <div className="chart-container h-[250px]">
        {tradeTimeHistory.length > 0 ? (
          <Line ref={chartRef} data={data} options={options} />
        ) : (
          <div className="flex items-center justify-center h-full text-[#a0aec0]">
            <div className="text-center">
              <p className="text-lg mb-2">Waiting for trade time data...</p>
              <p className="text-sm text-white/40">Trade time measures team coordination under pressure</p>
            </div>
          </div>
        )}
      </div>

      {/* Insight text */}
      {currentTilt?.has_data && currentTilt.insight && (
        <motion.div
          className="mt-4 pt-4 border-t border-white/10"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <p className={`text-sm ${isTilting ? 'text-[#ff4757]/90' : 'text-[#a0aec0]'}`}>
            {currentTilt.insight}
          </p>
        </motion.div>
      )}

      {/* Bottom accent line for tilt state */}
      {isTilting && (
        <motion.div
          className="absolute bottom-0 left-0 right-0 h-1 bg-[#ff4757]"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1, repeat: Infinity }}
        />
      )}
      {isLockedIn && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#2ed573]" />
      )}
    </motion.div>
  );
}
