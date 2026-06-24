const fs = require('fs');
const file = 'c:/Users/thaka/OneDrive/Desktop/PyroVision/firesense-ai/src/app/dashboard/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// Global Background
content = content.replace(/min-h-screen bg-\[#f8f9fa\]/g, 'min-h-screen bg-slate-50 font-sans');

// Corners and borders
content = content.replace(/rounded-\[2\.5rem\]/g, 'rounded-sm');
content = content.replace(/rounded-3xl/g, 'rounded-sm');
content = content.replace(/rounded-2xl/g, 'rounded-sm');
content = content.replace(/rounded-xl/g, 'rounded-sm');
content = content.replace(/border-zinc-100/g, 'border-slate-200');
content = content.replace(/border-zinc-50/g, 'border-slate-100');

// Shadows
content = content.replace(/shadow-premium/g, 'shadow-sm');
content = content.replace(/shadow-2xl/g, 'shadow-sm');
content = content.replace(/shadow-xl/g, 'shadow-sm');
content = content.replace(/shadow-md/g, 'shadow-sm');

// Blurs
content = content.replace(/backdrop-blur-md/g, '');
content = content.replace(/backdrop-blur-xl/g, '');
content = content.replace(/backdrop-blur-2xl/g, '');
content = content.replace(/backdrop-blur-3xl/g, '');

// Typography adjustments
content = content.replace(/tracking-\[0\.[23456]em\]/g, 'tracking-widest');
content = content.replace(/uppercase tracking-widest/g, 'uppercase tracking-widest font-mono text-slate-500');
content = content.replace(/font-black/g, 'font-bold');

// Colors
content = content.replace(/zinc/g, 'slate');
content = content.replace(/fire-orange/g, 'red-600');

// Hover effects
content = content.replace(/hover:-translate-y-1/g, '');
content = content.replace(/group-hover:scale-110/g, '');

// Remove pulsing if we want
// content = content.replace(/animate-pulse/g, '');

fs.writeFileSync(file, content);
console.log("Restyle complete");
