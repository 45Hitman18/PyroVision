"use client";

import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface DataPoint {
  fpr: number;
  low: number;
  medium: number;
  high: number;
  baseline: number;
}

const generateROCPoints = (auc: number, points: number = 20): number[] => {
  const values: number[] = [];
  for (let i = 0; i <= points; i++) {
    const x = i / points;
    // Simple power curve to simulate ROC: y = x^(1/k) where k is related to AUC
    // AUC approx = k / (k + 1) -> k = AUC / (1 - AUC)
    const k = auc / (1 - auc + 1e-6);
    values.push(Math.pow(x, 1 / k));
  }
  return values;
};

const fprPoints = Array.from({ length: 21 }, (_, i) => i / 20);
const lowTPR = generateROCPoints(0.94);
const mediumTPR = generateROCPoints(0.87);
const highTPR = generateROCPoints(0.89);

const data: DataPoint[] = fprPoints.map((fpr, i) => ({
  fpr,
  low: lowTPR[i],
  medium: mediumTPR[i],
  high: highTPR[i],
  baseline: fpr,
}));

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-zinc-100 shadow-xl rounded-lg text-xs">
        <p className="font-bold text-zinc-500 mb-2">FPR: {label.toFixed(2)}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} style={{ color: entry.color }} className="font-medium">
            {entry.name}: {entry.value.toFixed(3)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function ROCCurveChart() {
  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h4 className="text-lg font-bold text-zinc-900 tracking-tight">Performance Vectors</h4>
          <p className="text-[10px] font-medium text-zinc-400 uppercase tracking-[0.2em]">Receiver Operating Characteristic</p>
        </div>
      </div>

      <div className="flex-1 min-h-[240px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 0, right: 10, left: -25, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f5" />
            <XAxis 
              dataKey="fpr" 
              tick={{ fontSize: 9, fontWeight: 500, fill: '#a1a1aa' }}
              axisLine={{ stroke: '#e4e4e7', strokeWidth: 1 }}
              tickLine={false}
              tickFormatter={(v) => v.toFixed(1)}
            />
            <YAxis 
              tick={{ fontSize: 9, fontWeight: 500, fill: '#a1a1aa' }}
              axisLine={{ stroke: '#e4e4e7', strokeWidth: 1 }}
              tickLine={false}
              tickFormatter={(v) => v.toFixed(1)}
            />
            <Tooltip content={<CustomTooltip />} />
            
            <Line 
              name="low" 
              type="monotone" 
              dataKey="low" 
              stroke="#1D9E75" 
              strokeWidth={1.5} 
              dot={false} 
              activeDot={{ r: 4, strokeWidth: 0 }} 
            />
            <Line 
              name="medium" 
              type="monotone" 
              dataKey="medium" 
              stroke="#BA7517" 
              strokeWidth={1.5} 
              dot={false} 
              activeDot={{ r: 4, strokeWidth: 0 }} 
            />
            <Line 
              name="high" 
              type="monotone" 
              dataKey="high" 
              stroke="#E24B4A" 
              strokeWidth={1.5} 
              dot={false} 
              activeDot={{ r: 4, strokeWidth: 0 }} 
            />
            <Line 
              name="baseline" 
              type="monotone" 
              dataKey="baseline" 
              stroke="#e4e4e7" 
              strokeDasharray="4 4" 
              strokeWidth={1} 
              dot={false} 
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 pt-6 border-t border-zinc-50">
        {[
          { label: 'LOW', color: '#1D9E75', auc: '0.94' },
          { label: 'MEDIUM', color: '#BA7517', auc: '0.87' },
          { label: 'HIGH', color: '#E24B4A', auc: '0.89' },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
            <span className="text-[10px] font-bold text-zinc-800">{item.label}</span>
            <span className="text-[10px] font-medium text-zinc-400">AUC {item.auc}</span>
          </div>
        ))}
        <div className="flex items-center gap-2 ml-auto">
          <div className="w-3 h-0.5 border-t border-dashed border-zinc-300" />
          <span className="text-[10px] font-medium text-zinc-400 italic">Baseline</span>
        </div>
      </div>
    </div>
  );
}
