"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import EyebrowBadge from "@/components/ui/EyebrowBadge";
import Button from "@/components/ui/Button";
import { CaretDown } from "@phosphor-icons/react";
import Link from "next/link";

const FRAME_COUNT = 100;
const FRAME_BASE_PATH = "/frames/frame-"; // frame-001.png

export default function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [images, setImages] = useState<HTMLImageElement[]>([]);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"]
  });

  // Derived Values for Real-Time Animation - Optimized for 170vh
  const frameIndex = useTransform(scrollYProgress, [0, 1], [0, FRAME_COUNT - 1]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.7, 1], [1, 1, 0]);
  const heroY = useTransform(scrollYProgress, [0, 1], [0, -150]);
  const canvasScale = useTransform(scrollYProgress, [0, 1], [1, 1.15]);

  // Preload frames
  useEffect(() => {
    let loadedCount = 0;
    const loadedImages: HTMLImageElement[] = [];

    const preloadImages = async () => {
      for (let i = 1; i <= FRAME_COUNT; i++) {
        const img = new Image();
        const indexStr = i.toString().padStart(3, "0");
        img.src = `${FRAME_BASE_PATH}${indexStr}.png`;
        img.onload = () => {
          loadedCount++;
          setLoadingProgress((loadedCount / FRAME_COUNT) * 100);
          if (loadedCount === FRAME_COUNT) {
            setImages(loadedImages);
            setIsLoaded(true);
          }
        };
        loadedImages.push(img);
      }
    };

    preloadImages();
  }, []);

  // Canvas Drawing and Sizing
  const drawFrame = (index: number) => {
    const canvas = canvasRef.current;
    if (!canvas || images.length === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = images[Math.floor(index)];
    if (!img) return;

    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    const imgWidth = img.width;
    const imgHeight = img.height;

    const ratio = Math.max(canvasWidth / imgWidth, canvasHeight / imgHeight);
    const newWidth = imgWidth * ratio;
    const newHeight = imgHeight * ratio;
    const x = (canvasWidth - newWidth) / 2;
    const y = (canvasHeight - newHeight) / 2;

    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    ctx.drawImage(img, x, y, newWidth, newHeight);
  };

  const handleResize = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = window.innerWidth * window.devicePixelRatio;
    canvas.height = window.innerHeight * window.devicePixelRatio;

    // Immediate redraw on resize
    drawFrame(frameIndex.get());
  };

  useEffect(() => {
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, [images]);

  // Reactive Canvas Update
  useEffect(() => {
    const unsubscribe = frameIndex.on("change", (latest) => {
      drawFrame(latest);
    });
    return () => unsubscribe();
  }, [images, frameIndex]);

  return (
    <section ref={sectionRef} id="overview" style={{ height: "130vh" }} className="relative">
      <div className="sticky top-0 h-screen overflow-hidden">
        {/* Canvas for frames with smooth scale */}
        <motion.div style={{ scale: canvasScale }} className="absolute inset-0 w-full h-full">
          <canvas ref={canvasRef} className="w-full h-full object-cover" />
        </motion.div>

        {/* Blurred Bottom Mix Border */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#f5f4f0] via-[#f5f4f0]/80 to-transparent z-20 pointer-events-none" />

        {/* Hero Text Overlay with Framer-driven opacity & parallax */}
        <motion.div
          style={{ opacity: heroOpacity, y: heroY }}
          className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 z-10"
        >
          <EyebrowBadge
            label="India-Specific Wildfire AI · MODIS + ConvLSTM"
            className="mb-6 shadow-sm"
          />
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-white leading-[1.05] mb-6 whitespace-pre-line drop-shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
            Predict <span className="bg-gradient-to-r from-white via-white to-amber-200 bg-clip-text text-transparent italic">Wildfire Risk</span>{"\n"}Before It Spreads
          </h1>
          <p className="max-w-2xl text-lg md:text-xl text-white/90 mb-10 font-bold leading-relaxed drop-shadow-sm">
            Deep learning on satellite imagery — real-time risk zones for Gujarat & Uttarakhand
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/dashboard">
              <Button
                variant="primary"
                className="min-w-[200px] py-4 text-lg shadow-lg shadow-fire-orange/20 group justify-center"
              >
                <span className="flex items-center gap-2">
                  <span>Dashboard</span>
                  <motion.span
                    className="inline-block"
                    animate={{ x: [0, 4, 0] }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                  >
                    →
                  </motion.span>
                </span>
              </Button>
            </Link>
            <Link href="/paper">
              <Button
                variant="secondary"
                className="min-w-[200px] py-4 text-lg bg-white/10 backdrop-blur-md border-white/20 text-white hover:bg-white/20 group justify-center"
              >
                <span className="flex items-center gap-2">
                  <span>Read Paper</span>
                  <motion.span
                    className="inline-block"
                    animate={{ x: [0, 4, 0] }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                  >
                    →
                  </motion.span>
                </span>
              </Button>
            </Link>
          </div>

          {/* Scroll Indicator */}
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="absolute bottom-12 flex flex-col items-center gap-2 text-zinc-400"
          >
            <span className="text-[10px] uppercase tracking-widest font-bold">Scroll to explore</span>
            <CaretDown size={20} weight="bold" />
          </motion.div>
        </motion.div>

        {/* Preloader */}
        <AnimatePresence>
          {!isLoaded && (
            <motion.div
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 bg-[#f5f4f0] flex flex-col items-center justify-center"
            >
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl animate-bounce">🔥</span>
                <span className="font-bold text-zinc-900 tracking-tight">Initializing FireSense Engine...</span>
              </div>
              <div className="w-48 h-1 bg-zinc-200 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-fire-orange"
                  initial={{ width: 0 }}
                  animate={{ width: `${loadingProgress}%` }}
                />
              </div>
              <span className="mt-2 text-[10px] text-zinc-400 font-bold uppercase tracking-widest">
                Loading Data {Math.round(loadingProgress)}%
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
