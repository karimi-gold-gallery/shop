"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type WheelEvent as ReactWheelEvent,
} from "react";
import { Minus, Plus } from "lucide-react";

import { FLOOR_PLANS, type FloorId, type FloorPlan } from "@/lib/floor-guide";
import { cn } from "@/lib/utils";

const BRAND = "#9A1619";

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

function FloorButtonText({
  floorId,
  shortLabel,
}: {
  floorId: FloorId;
  shortLabel: string;
}) {
  if (floorId === "ground") return <>همکف</>;
  return (
    <span dir="ltr" className="inline-block">
      {shortLabel}
    </span>
  );
}

function FloorButton({
  floor,
  isActive,
  onSelect,
}: {
  floor: FloorPlan;
  isActive: boolean;
  onSelect: (id: FloorId) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(floor.id)}
      aria-pressed={isActive}
      className={cn(
        "shrink-0 snap-center rounded-lg border px-3 py-2 text-xs font-bold transition-all min-w-11",
        "sm:min-w-0 sm:max-w-16 sm:flex-1 sm:rounded-xl sm:px-2 sm:py-1.5 sm:text-sm",
        isActive
          ? "border-transparent text-white shadow-md"
          : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300",
      )}
      style={isActive ? { backgroundColor: BRAND } : undefined}
    >
      <FloorButtonText floorId={floor.id} shortLabel={floor.shortLabel} />
    </button>
  );
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
  const floorNavRef = useRef<HTMLElement>(null);

  const activeFloor =
    FLOOR_PLANS.find((floor) => floor.id === activeId) ??
    FLOOR_PLANS.find((floor) => floor.id === "ground")!;

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

  useEffect(() => {
    const nav = floorNavRef.current;
    if (!nav) return;
    const activeButton = nav.querySelector<HTMLElement>('[aria-pressed="true"]');
    activeButton?.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
  }, [activeId]);

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
    <div className="relative flex h-dvh max-h-dvh flex-col overflow-hidden bg-white text-neutral-800">
      <header className="relative z-20 shrink-0 px-4 pb-2 pt-[max(0.5rem,env(safe-area-inset-top))] sm:px-6 sm:pb-1.5">
        <p className="text-[10px] font-medium tracking-wide text-neutral-500 sm:text-[11px]">
          پاساژ دلگشا
        </p>
        <h1 className="mt-0.5 text-base font-extrabold leading-tight text-balance text-neutral-900 sm:text-lg">
          راهنمای طبقات پاساژ دلگشا
        </h1>
      </header>

      <div className="relative z-10 flex min-h-0 flex-1 flex-col gap-2 overflow-hidden px-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:mx-auto sm:max-w-6xl sm:gap-2.5 sm:px-5 sm:pb-3">
        <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-100 shadow-sm">
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
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-neutral-100">
                <div
                  className="size-9 animate-pulse rounded-full border-2 border-neutral-200"
                  style={{ borderTopColor: BRAND }}
                />
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

          <div className="absolute inset-e-2 bottom-2 z-20 flex flex-col overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-md sm:inset-e-3 sm:bottom-3 sm:rounded-xl">
            <button
              type="button"
              onClick={() => zoomBy(ZOOM_STEP)}
              disabled={view.scale >= MAX_SCALE}
              className="flex size-10 items-center justify-center transition-colors hover:bg-neutral-50 active:bg-neutral-100 disabled:pointer-events-none disabled:opacity-35 sm:size-11"
              style={{ color: BRAND }}
              aria-label="بزرگ‌نمایی"
            >
              <Plus className="size-4 sm:size-5" />
            </button>
            <div className="h-px bg-neutral-200" />
            <button
              type="button"
              onClick={() => zoomBy(-ZOOM_STEP)}
              disabled={view.scale <= MIN_SCALE}
              className="flex size-10 items-center justify-center transition-colors hover:bg-neutral-50 active:bg-neutral-100 disabled:pointer-events-none disabled:opacity-35 sm:size-11"
              style={{ color: BRAND }}
              aria-label="کوچک‌نمایی"
            >
              <Minus className="size-4 sm:size-5" />
            </button>
          </div>

          <div
            className="pointer-events-none absolute inset-s-2 top-2 rounded-md px-2 py-0.5 text-[11px] font-bold text-white shadow-md sm:inset-s-3 sm:top-3 sm:rounded-lg sm:px-2.5 sm:py-1 sm:text-xs"
            style={{ backgroundColor: BRAND }}
          >
            {activeFloor.label}
          </div>
        </div>

        <div className="relative shrink-0" dir="ltr">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-white via-white/80 to-transparent sm:hidden"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-white via-white/80 to-transparent sm:hidden"
          />

          <nav
            ref={floorNavRef}
            aria-label="انتخاب طبقه"
            className="flex gap-1.5 overflow-x-auto overscroll-x-contain scroll-smooth px-3 pb-0.5 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:justify-center sm:overflow-x-visible sm:px-0 sm:pb-0 sm:snap-none"
          >
            {FLOOR_PLANS.map((floor) => (
              <FloorButton
                key={floor.id}
                floor={floor}
                isActive={floor.id === activeId}
                onSelect={selectFloor}
              />
            ))}
          </nav>

          <p className="mt-1 text-center text-[10px] text-neutral-400 sm:hidden">
            برای دیدن همه طبقات، انگشت را بکشید
          </p>
        </div>
      </div>
    </div>
  );
}
