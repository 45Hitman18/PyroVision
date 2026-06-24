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
  ReferenceLine,
} from 'recharts';

const generateTrainingData = () => {
  const points = [];
  for (let i = 0; i < 50; i++) {
    const train_loss = 1.42 * Math.exp(-i * 0.065) + 0.31 + 0.02 * Math.sin(i * 0.8);
    const val_loss = 1.38 * Math.exp(-i * 0.058) + 0.34 + 0.025 * Math.sin(i * 0.7 + 1.2);
    points.push({
      epoch: i + 1,
      train: train_loss,
      val: val_loss,
    });
  }
  return points;
};

const data = generateTrainingData();
const bestEpoch = data.reduce((prev, curr) => (prev.val < curr.val ? prev : curr)).epoch;

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-zinc-100 shadow-xl rounded-lg text-xs">
        <p className="font-bold text-zinc-800 mb-2">Epoch {label}</p>
        <p className="text-fire-orange font-medium">Train Loss: {payload[0].value.toFixed(4)}</p>
        <p className="text-teal-600 font-medium">Val Loss: {payload[1].value.toFixed(4)}</p>
      </div>
    );
  }
  return null;
};

export default function TrainingCurveChart() {
  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h4 className="text-lg font-bold text-zinc-900 tracking-tight">Optimization Trajectory</h4>
          <p className="text-[10px] font-medium text-zinc-400 uppercase tracking-[0.2em]">Loss Convergence (50 Epochs)</p>
        </div>
      </div>

      <div className="flex-1 min-h-[220px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 0, right: 10, left: -25, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f5" />
            <XAxis 
              dataKey="epoch" 
              tick={{ fontSize: 9, fill: '#a1a1aa' }}
              interval={9}
              axisLine={{ stroke: '#e4e4e7', strokeWidth: 1 }}
              tickLine={false}
            />
            <YAxis 
              tick={{ fontSize: 9, fill: '#a1a1aa' }}
              domain={[0, 1.5]}
              axisLine={{ stroke: '#e4e4e7', strokeWidth: 1 }}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            
            <ReferenceLine 
              x={bestEpoch} 
              stroke="#BA7517" 
              strokeDasharray="3 3" 
              label={{ value: 'OPTIMAL', position: 'top', fill: '#BA7517', fontSize: 8, fontWeight: 900, letterSpacing: '1px' }} 
            />
            <Line 
              name="train" 
              type="monotone" 
              dataKey="train" 
              stroke="#ff4500" 
              strokeWidth={1.5} 
              dot={false} 
              activeDot={{ r: 4, strokeWidth: 0 }}
            />
            <Line 
              name="val" 
              type="monotone" 
              dataKey="val" 
              stroke="#1D9E75" 
              strokeWidth={1.5} 
              dot={false} 
              activeDot={{ r: 4, strokeWidth: 0 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 pt-6 border-t border-zinc-50">
        {[
          { label: 'Train Loss', color: '#ff4500' },
          { label: 'Val Loss', color: '#1D9E75' },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
            <span className="text-[10px] font-bold text-zinc-800 uppercase tracking-tight">{item.label}</span>
          </div>
        ))}
        <div className="flex items-center gap-2 ml-auto">
          <div className="w-2 h-2 rounded-full bg-[#BA7517]" />
          <span className="text-[10px] font-bold text-zinc-800 uppercase tracking-tight">Best Checkpoint</span>
        </div>
      </div>
    </div>
  );
}
