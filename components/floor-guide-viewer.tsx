"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type WheelEvent as ReactWheelEvent,
} from "react";
import Link from "next/link";
import { Minus, Plus, Sparkles } from "lucide-react";

import { FLOOR_PLANS, type FloorId } from "@/lib/floor-guide";
import { cn } from "@/lib/utils";

const MIN_SCALE = 1;
const MAX_SCALE = 5;
const ZOOM_STEP = 0.4;

type ViewState = {
  scale: number;
  x: number;
  y: number;
};

const INITIAL_VIEW: ViewState = { scale: 1, x: 0, y: 0 };

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function distance(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function FloorGuideViewer() {
  const [activeId, setActiveId] = useState<FloorId>("ground");
  const [view, setView] = useState<ViewState>(INITIAL_VIEW);
  const [imageReady, setImageReady] = useState(false);

  const viewportRef = useRef<HTMLDivElement>(null);
  const pointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const pinchRef = useRef<{
    startDistance: number;
    startScale: number;
    startX: number;
    startY: number;
    midX: number;
    midY: number;
  } | null>(null);
  const panRef = useRef<{
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  } | null>(null);
  const viewRef = useRef(view);

  const activeFloor =
    FLOOR_PLANS.find((floor) => floor.id === activeId) ?? FLOOR_PLANS[2];

  useEffect(() => {
    viewRef.current = view;
  }, [view]);

  useEffect(() => {
    let cancelled = false;
    setImageReady(false);

    const preload = new window.Image();
    preload.onload = () => {
      if (!cancelled) setImageReady(true);
    };
    preload.onerror = () => {
      if (!cancelled) setImageReady(true);
    };
    preload.src = activeFloor.image;
    if (preload.complete && preload.naturalWidth > 0) {
      setImageReady(true);
    }

    return () => {
      cancelled = true;
    };
  }, [activeFloor.image]);

  const selectFloor = useCallback((id: FloorId) => {
    setActiveId(id);
    setView(INITIAL_VIEW);
  }, []);

  const zoomBy = useCallback((delta: number, origin?: { x: number; y: number }) => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const rect = viewport.getBoundingClientRect();
    const ox = origin?.x ?? rect.width / 2;
    const oy = origin?.y ?? rect.height / 2;
    const current = viewRef.current;
    const nextScale = clamp(current.scale + delta, MIN_SCALE, MAX_SCALE);

    if (nextScale === current.scale) return;

    const ratio = nextScale / current.scale;
    setView({
      scale: nextScale,
      x: ox - (ox - current.x) * ratio,
      y: oy - (oy - current.y) * ratio,
    });
  }, []);

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    const target = event.currentTarget;
    target.setPointerCapture(event.pointerId);
    pointersRef.current.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
    });

    if (pointersRef.current.size === 2) {
      const [a, b] = Array.from(pointersRef.current.values());
      const current = viewRef.current;
      pinchRef.current = {
        startDistance: distance(a, b),
        startScale: current.scale,
        startX: current.x,
        startY: current.y,
        midX: (a.x + b.x) / 2,
        midY: (a.y + b.y) / 2,
      };
      panRef.current = null;
      return;
    }

    if (viewRef.current.scale > 1) {
      panRef.current = {
        startX: event.clientX,
        startY: event.clientY,
        originX: viewRef.current.x,
        originY: viewRef.current.y,
      };
    }
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!pointersRef.current.has(event.pointerId)) return;
    pointersRef.current.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
    });

    if (pointersRef.current.size === 2 && pinchRef.current) {
      const viewport = viewportRef.current;
      if (!viewport) return;

      const [a, b] = Array.from(pointersRef.current.values());
      const rect = viewport.getBoundingClientRect();
      const pinch = pinchRef.current;
      const nextScale = clamp(
        pinch.startScale * (distance(a, b) / pinch.startDistance),
        MIN_SCALE,
        MAX_SCALE,
      );
      const midX = (a.x + b.x) / 2 - rect.left;
      const midY = (a.y + b.y) / 2 - rect.top;
      const startMidX = pinch.midX - rect.left;
      const startMidY = pinch.midY - rect.top;
      const ratio = nextScale / pinch.startScale;

      setView({
        scale: nextScale,
        x: midX - (startMidX - pinch.startX) * ratio,
        y: midY - (startMidY - pinch.startY) * ratio,
      });
      return;
    }

    if (panRef.current && pointersRef.current.size === 1) {
      const pan = panRef.current;
      setView((prev) => ({
        ...prev,
        x: pan.originX + (event.clientX - pan.startX),
        y: pan.originY + (event.clientY - pan.startY),
      }));
    }
  };

  const endPointer = (event: ReactPointerEvent<HTMLDivElement>) => {
    pointersRef.current.delete(event.pointerId);
    if (pointersRef.current.size < 2) pinchRef.current = null;
    if (pointersRef.current.size === 0) panRef.current = null;
  };

  const onWheel = (event: ReactWheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    const viewport = viewportRef.current;
    if (!viewport) return;
    const rect = viewport.getBoundingClientRect();
    zoomBy(event.deltaY < 0 ? ZOOM_STEP * 0.5 : -ZOOM_STEP * 0.5, {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    });
  };

  return (
    <div className="beige-texture relative flex min-h-dvh flex-1 flex-col bg-background text-foreground">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 70% 50% at 50% -10%, rgba(201,161,74,0.28), transparent 55%), radial-gradient(ellipse 40% 30% at 100% 100%, rgba(1,3,78,0.08), transparent 50%)",
        }}
      />

      <header className="relative z-20 flex items-start justify-between gap-3 px-4 pb-2 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-6">
        <div className="min-w-0">
          <p className="text-[11px] font-medium tracking-wide text-primary sm:text-xs">
            پاساژ دلگشا
          </p>
          <h1 className="mt-0.5 text-lg font-extrabold leading-snug text-balance text-navy sm:text-2xl">
            راهنمای طبقات پاساژ دلگشا
          </h1>
          {/* <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
            {activeFloor.label} را ببینید · انگشت دو‌تایی یا دکمه‌ها برای بزرگ‌نمایی
          </p> */}
        </div>

        <Link
          href="/"
          className="animate-invite group mt-0.5 inline-flex max-w-28 shrink-0 flex-col items-center gap-1 rounded-2xl gold-gradient px-3 py-2.5 text-center text-[11px] font-extrabold leading-tight text-white shadow-[0_10px_24px_rgba(176,136,67,0.45)] ring-2 ring-gold/50 sm:max-w-none sm:flex-row sm:gap-1.5 sm:px-4 sm:text-xs"
        >
          <Sparkles className="size-3.5 shrink-0 text-white" />
          <span>گالری طلای کریمی</span>
        </Link>
      </header>

      <div className="relative z-10 flex min-h-0 flex-1 gap-2 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-1 sm:gap-3 sm:px-5 sm:pb-5">
        {/* First in RTL flex → appears on the right, matching the mall directory UI */}
        <nav
          aria-label="انتخاب طبقه"
          className="flex w-19 shrink-0 flex-col gap-1.5 overflow-y-auto overscroll-contain sm:w-40 sm:gap-2"
        >
          {FLOOR_PLANS.map((floor) => {
            const isActive = floor.id === activeId;
            return (
              <button
                key={floor.id}
                type="button"
                onClick={() => selectFloor(floor.id)}
                aria-pressed={isActive}
                className={cn(
                  "relative flex min-h-12.5 flex-1 items-center justify-center rounded-xl border px-1 py-1.5 text-center text-[11px] font-bold leading-tight transition-all sm:min-h-12 sm:flex-none sm:px-3 sm:text-sm",
                  isActive
                    ? "border-gold bg-navy text-navy-foreground shadow-[0_8px_20px_rgba(1,3,78,0.28)]"
                    : "border-border bg-card text-navy/80 hover:border-gold/50 hover:bg-accent hover:text-navy",
                )}
              >
                {floor.label}
              </button>
            );
          })}
        </nav>

        <div className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-gold/30 bg-navy shadow-[0_20px_50px_rgba(1,3,78,0.18)]">
          <div
            ref={viewportRef}
            className={cn(
              "relative min-h-0 w-full flex-1 touch-none overflow-hidden",
              view.scale > 1 ? "cursor-grab active:cursor-grabbing" : "cursor-zoom-in",
            )}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endPointer}
            onPointerCancel={endPointer}
            onWheel={onWheel}
            role="img"
            aria-label={`نقشه ${activeFloor.label}`}
          >
            {!imageReady && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-navy">
                <div className="size-9 animate-pulse rounded-full border-2 border-gold/30 border-t-gold" />
              </div>
            )}

            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              key={activeFloor.id}
              src={activeFloor.image}
              alt={`نقشه ${activeFloor.label} پاساژ دلگشا`}
              draggable={false}
              onLoad={() => setImageReady(true)}
              className={cn(
                "h-full w-full select-none object-contain transition-opacity duration-300",
                imageReady ? "opacity-100" : "opacity-0",
              )}
              style={{
                transform: `translate3d(${view.x}px, ${view.y}px, 0) scale(${view.scale})`,
                transformOrigin: "0 0",
                willChange: "transform",
              }}
            />
          </div>

          <div className="absolute inset-e-3 bottom-3 z-20 flex flex-col overflow-hidden rounded-xl border border-gold/30 bg-card/90 shadow-lg backdrop-blur-md">
            <button
              type="button"
              onClick={() => zoomBy(ZOOM_STEP)}
              disabled={view.scale >= MAX_SCALE}
              className="flex size-11 items-center justify-center text-navy transition-colors hover:bg-accent active:bg-gold/20 disabled:pointer-events-none disabled:opacity-35"
              aria-label="بزرگ‌نمایی"
            >
              <Plus className="size-5" />
            </button>
            <div className="h-px bg-border" />
            <button
              type="button"
              onClick={() => zoomBy(-ZOOM_STEP)}
              disabled={view.scale <= MIN_SCALE}
              className="flex size-11 items-center justify-center text-navy transition-colors hover:bg-accent active:bg-gold/20 disabled:pointer-events-none disabled:opacity-35"
              aria-label="کوچک‌نمایی"
            >
              <Minus className="size-5" />
            </button>
          </div>

          <div className="pointer-events-none absolute inset-s-3 top-3 rounded-lg gold-gradient px-2.5 py-1 text-xs font-bold text-white shadow-md sm:text-sm">
            {activeFloor.label}
          </div>
        </div>
      </div>
    </div>
  );
}
