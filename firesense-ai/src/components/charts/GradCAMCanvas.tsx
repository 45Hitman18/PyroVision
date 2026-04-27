"use client";

import React, { useRef, useEffect } from 'react';

export default function GradCAMCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear background
    ctx.fillStyle = '#1a3a1a'; // Dark green forest canopy
    ctx.fillRect(0, 0, 200, 200);

    // Draw realistic terrain pattern (forest patches)
    ctx.fillStyle = '#2d5a2d';
    
    // Patch 1
    ctx.beginPath();
    ctx.ellipse(50, 40, 40, 25, Math.PI / 4, 0, Math.PI * 2);
    ctx.fill();

    // Patch 2
    ctx.beginPath();
    ctx.ellipse(150, 140, 50, 30, -Math.PI / 6, 0, Math.PI * 2);
    ctx.fill();

    // Patch 3
    ctx.beginPath();
    ctx.ellipse(80, 120, 30, 40, Math.PI / 3, 0, Math.PI * 2);
    ctx.fill();

    // Draw Grid Lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let i = 40; i < 200; i += 40) {
      // Horizontal
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(200, i);
      ctx.stroke();
      // Vertical
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, 200);
      ctx.stroke();
    }

    // Draw Risk Hotspot Gradient (Primary)
    const gradient1 = ctx.createRadialGradient(130, 80, 0, 130, 80, 55);
    gradient1.addColorStop(0, 'rgba(255, 69, 0, 0.85)');
    gradient1.addColorStop(1, 'rgba(255, 69, 0, 0)');
    ctx.fillStyle = gradient1;
    ctx.fillRect(0, 0, 200, 200);

    // Draw Risk Hotspot Gradient (Secondary)
    const gradient2 = ctx.createRadialGradient(60, 150, 0, 60, 150, 35);
    gradient2.addColorStop(0, 'rgba(255, 140, 0, 0.7)');
    gradient2.addColorStop(1, 'rgba(255, 140, 0, 0)');
    ctx.fillStyle = gradient2;
    ctx.fillRect(0, 0, 200, 200);

    // Add noise texture for "satellite" look
    const imageData = ctx.getImageData(0, 0, 200, 200);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      const noise = (Math.random() - 0.5) * 5;
      data[i] = Math.min(255, Math.max(0, data[i] + noise));
      data[i+1] = Math.min(255, Math.max(0, data[i+1] + noise));
      data[i+2] = Math.min(255, Math.max(0, data[i+2] + noise));
    }
    ctx.putImageData(imageData, 0, 0);

  }, []);

  return (
    <div className="flex flex-col items-center gap-4">
      <canvas 
        ref={canvasRef} 
        width={200} 
        height={200} 
        className="rounded-lg border border-zinc-200 shadow-inner"
      />
      
      <div className="flex flex-col gap-2 items-center">
        <div 
          className="w-[200px] h-2.5 rounded-full" 
          style={{ background: 'linear-gradient(to right, #1a3a1a, #ff4500)' }}
        />
        <div className="w-[200px] flex justify-between px-1">
          <span className="text-[8px] font-black text-zinc-400 uppercase tracking-tighter">Low Activation</span>
          <span className="text-[8px] font-black text-zinc-400 uppercase tracking-tighter">High Activation</span>
        </div>
      </div>
      
      <div className="text-[10px] font-mono text-zinc-400 mt-1 uppercase tracking-widest">
        Grad-CAM · NDVI Channel · Dahod Sector 14-B
      </div>
    </div>
  );
}
