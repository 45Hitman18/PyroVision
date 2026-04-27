"use client";

import React from 'react';
import { Check } from "@phosphor-icons/react";

const matrix = [
  [8420, 312, 48],   // LOW
  [289, 6103, 201],  // MEDIUM
  [67, 198, 4882]    // HIGH
];

const labels = ["LOW", "MEDIUM", "HIGH"];

export default function ConfusionMatrix() {
  const rowTotals = matrix.map(row => row.reduce((a, b) => a + b, 0));

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h4 className="text-lg font-bold text-zinc-900 tracking-tight">Classification Density</h4>
          <p className="text-[10px] font-medium text-zinc-400 uppercase tracking-[0.2em]">Confusion Matrix (n=20,520)</p>
        </div>
      </div>
      
      <div className="flex-1 flex flex-col justify-center">
        <div className="grid grid-cols-[30px_1fr_1fr_1fr] gap-2 items-center max-w-[280px] mx-auto w-full">
        {/* Top Spacer */}
        <div />
        {labels.map(label => (
          <div key={label} className="text-center py-2">
            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{label}</span>
          </div>
        ))}

        {/* Rows */}
        {labels.map((rowLabel, rowIndex) => (
          <React.Fragment key={rowLabel}>
            <div className="text-right pr-2">
              <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest [writing-mode:vertical-lr] rotate-180">{rowLabel}</span>
            </div>
            
            {matrix[rowIndex].map((value, colIndex) => {
              const total = rowTotals[rowIndex];
              const percentage = ((value / total) * 100).toFixed(1);
              const isDiagonal = rowIndex === colIndex;
              const intensity = value / total;
              
              const bgColor = intensity > 0.8 ? '#422006' : intensity > 0.4 ? '#92400e' : intensity > 0.1 ? '#fef3c7' : '#fffcf0';
              const textColor = intensity > 0.4 ? '#FFFFFF' : '#92400e';

              return (
                <div 
                  key={`${rowIndex}-${colIndex}`}
                  className="aspect-square rounded-xl flex flex-col items-center justify-center relative border border-zinc-100 transition-transform hover:scale-[1.02] cursor-default"
                  style={{ backgroundColor: bgColor }}
                >
                  <span className="text-xs font-mono font-bold" style={{ color: textColor }}>{value.toLocaleString()}</span>
                  <span className="text-[8px] font-medium opacity-70" style={{ color: textColor }}>{percentage}%</span>
                  
                  {isDiagonal && (
                    <div className="absolute top-1 right-1 opacity-40">
                      <Check size={8} weight="bold" style={{ color: textColor }} />
                    </div>
                  )}
                </div>
              );
            })}
          </React.Fragment>
        ))}
        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-zinc-50 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Predicted ➔</span>
        </div>
        <div className="flex gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-sm bg-[#422006]" />
            <span className="text-[9px] font-bold text-zinc-500 uppercase">Correct</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-sm bg-[#fef3c7] border border-zinc-200" />
            <span className="text-[9px] font-bold text-zinc-500 uppercase">Deviation</span>
          </div>
        </div>
      </div>
    </div>
  );
}
