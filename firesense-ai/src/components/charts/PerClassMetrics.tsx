"use client";

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const data = [
  { name: 'LOW', precision: 0.95, recall: 0.96, f1: 0.94 },
  { name: 'MEDIUM', precision: 0.92, recall: 0.91, f1: 0.91 },
  { name: 'HIGH', precision: 0.94, recall: 0.95, f1: 0.94 },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-zinc-100 shadow-xl rounded-lg text-xs">
        <p className="font-bold text-zinc-800 mb-2">{label} Class</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} style={{ color: entry.color }} className="font-medium">
            {entry.name.toUpperCase()}: {entry.value.toFixed(2)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function PerClassMetrics() {
  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h4 className="text-lg font-bold text-zinc-900 tracking-tight">Model Reliability</h4>
          <p className="text-[10px] font-medium text-zinc-400 uppercase tracking-[0.2em]">Precision · Recall · F1-Score</p>
        </div>
      </div>

      <div className="flex-1 min-h-[220px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 0, right: 10, left: -25, bottom: 0 }}
            barGap={4}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f5" />
            <XAxis 
              dataKey="name" 
              tick={{ fontSize: 9, fontWeight: 700, fill: '#a1a1aa' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis 
              domain={[0.80, 1.00]} 
              tick={{ fontSize: 9, fill: '#a1a1aa' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
            
            <Bar name="precision" dataKey="precision" fill="#7F77DD" radius={[2, 2, 0, 0]} barSize={12} />
            <Bar name="recall" dataKey="recall" fill="#1D9E75" radius={[2, 2, 0, 0]} barSize={12} />
            <Bar name="f1" dataKey="f1" fill="#ff4500" radius={[2, 2, 0, 0]} barSize={12} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 pt-6 border-t border-zinc-50">
        {[
          { label: 'Precision', color: '#7F77DD' },
          { label: 'Recall', color: '#1D9E75' },
          { label: 'F1 Score', color: '#ff4500' },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
            <span className="text-[10px] font-bold text-zinc-800 uppercase tracking-tight">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
