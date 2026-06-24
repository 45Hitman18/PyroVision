"use client";

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import './FireHero.css';

export default function FireHero() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let particles: any[] = [];

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    
    window.addEventListener('resize', resize);
    resize();

    const W = () => canvas.width;
    const H = () => canvas.height;

    function spawnParticle() {
      return {
        x: Math.random() * W(),
        y: H(),
        vx: (Math.random() - 0.5) * 0.6,
        vy: -(1.2 + Math.random() * 2.2),
        life: 0,
        maxLife: 60 + Math.random() * 80,
        size: 4 + Math.random() * 18,
        type: Math.random() > 0.35 ? 'fire' : 'smoke'
      };
    }

    for (let i = 0; i < 120; i++) {
      const p = spawnParticle();
      p.y = Math.random() * H();
      p.life = Math.random() * p.maxLife;
      particles.push(p);
    }

    function draw() {
      ctx!.clearRect(0, 0, W(), H());

      while (particles.length < 140) particles.push(spawnParticle());

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx + Math.sin(p.life * 0.08) * 0.3;
        p.y += p.vy;
        p.life++;
        if (p.life > p.maxLife) { particles.splice(i, 1); continue; }

        const t = p.life / p.maxLife;
        const alpha = t < 0.15 ? t / 0.15 : t > 0.7 ? (1 - t) / 0.3 : 1;
        const s = p.size * (1 + t * 0.6);

        ctx!.save();
        ctx!.globalAlpha = alpha * (p.type === 'fire' ? 0.85 : 0.22);
        ctx!.filter = 'blur(' + (p.type === 'smoke' ? 6 : 1) + 'px)';

        if (p.type === 'fire') {
          const grad = ctx!.createRadialGradient(p.x, p.y, 0, p.x, p.y, s);
          if (t < 0.3) {
            grad.addColorStop(0, '#fff8c0');
            grad.addColorStop(0.3, '#ffaa00');
            grad.addColorStop(1, 'rgba(255,78,0,0)');
          } else {
            grad.addColorStop(0, '#ff6a00');
            grad.addColorStop(0.5, '#ff2200');
            grad.addColorStop(1, 'rgba(100,0,0,0)');
          }
          ctx!.fillStyle = grad;
        } else {
          const grad = ctx!.createRadialGradient(p.x, p.y, 0, p.x, p.y, s * 1.5);
          grad.addColorStop(0, 'rgba(80,70,60,0.6)');
          grad.addColorStop(1, 'rgba(20,15,10,0)');
          ctx!.fillStyle = grad;
        }

        ctx!.beginPath();
        ctx!.arc(p.x, p.y, s, 0, Math.PI * 2);
        ctx!.fill();
        ctx!.restore();
      }

      animationFrameId = requestAnimationFrame(draw);
    }
    draw();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="fire-hero-container">
      <div className="hero-wrap">
        <div className="fire-bg">
          <canvas ref={canvasRef} className="fire-canvas"></canvas>
          <div className="grad-top"></div>
          <div className="grad-left"></div>
        </div>

        <section className="fire-hero">
          <div className="status-badge">
            <span className="live-dot"></span>
            SYSTEM ACTIVE — 120ms latency · 100% accuracy
          </div>

          <h1 className="headline">
            Real-Time Fire Detection,<br />
            <em>Before the Smoke Clears.</em>
          </h1>

          <p className="subhead">
            PyroVision fuses MobileNetV2 deep learning with NASA FIRMS satellite telemetry — delivering millisecond-level alerts for industrial, residential, and wildland environments.
          </p>

          <div className="cta-row">
            <Link href="/dashboard">
              <button className="btn-primary">Explore Live Dashboard</button>
            </Link>
            <Link href="/paper">
              <button className="btn-secondary">Read Research Paper →</button>
            </Link>
          </div>

          <div className="stats-row">
            <div className="stat-card">
              <div className="stat-val">100%</div>
              <div className="stat-label">Accuracy</div>
            </div>
            <div className="stat-card">
              <div className="stat-val">98.5%</div>
              <div className="stat-label">Precision</div>
            </div>
            <div className="stat-card">
              <div className="stat-val">99.0%</div>
              <div className="stat-label">Recall</div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
