import { useRef, useEffect, useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ConstellationUser, Connection, StarColor } from '@/types';

const STAR_COLOR_MAP: Record<StarColor, string> = {
  blue: '#60a5fa',
  white: '#f1f5f9',
  yellow: '#fbbf24',
  orange: '#fb923c',
  red: '#f87171',
};

interface ConstellationCanvasProps {
  users: ConstellationUser[];
  connections: Connection[];
  currentUserId: string;
  selectedUserId: string | null;
  onSelectUser: (userId: string | null) => void;
  onWriteLetter: (userId: string) => void;
}

export function ConstellationCanvas({
  users,
  connections,
  currentUserId,
  selectedUserId,
  onSelectUser,
  onWriteLetter,
}: ConstellationCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [hoveredUser, setHoveredUser] = useState<string | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const lastTouchDist = useRef(0);

  const layoutPositions = useCallback(() => {
    const currentUser = users.find(u => u.id === currentUserId);
    const others = users.filter(u => u.id !== currentUserId);
    const cx = dimensions.width / 2;
    const cy = dimensions.height / 2;
    const radius = Math.min(dimensions.width, dimensions.height) * 0.35;

    const positions: Record<string, { x: number; y: number }> = {};

    if (currentUser) {
      positions[currentUser.id] = { x: cx, y: cy };
    }

    others.forEach((user, i) => {
      if (user.x && user.y && user.x !== 0 && user.y !== 0) {
        positions[user.id] = {
          x: cx + (user.x - 0.5) * radius * 2,
          y: cy + (user.y - 0.5) * radius * 2,
        };
      } else {
        const angle = (2 * Math.PI * i) / others.length;
        const r = radius * (0.6 + ((user.id.charCodeAt(0) % 5) / 10));
        positions[user.id] = {
          x: cx + Math.cos(angle) * r,
          y: cy + Math.sin(angle) * r,
        };
      }
    });

    return positions;
  }, [users, currentUserId, dimensions]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        setDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || dimensions.width === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = dimensions.width * window.devicePixelRatio;
    canvas.height = dimensions.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    const positions = layoutPositions();
    const relevantConnections = selectedUserId
      ? connections.filter(c => c.userAId === selectedUserId || c.userBId === selectedUserId)
      : connections;

    ctx.clearRect(0, 0, dimensions.width, dimensions.height);

    ctx.save();
    ctx.translate(offset.x, offset.y);
    ctx.scale(scale, scale);

    connections.forEach(conn => {
      const posA = positions[conn.userAId];
      const posB = positions[conn.userBId];
      if (!posA || !posB) return;

      const isRelevant = selectedUserId
        ? conn.userAId === selectedUserId || conn.userBId === selectedUserId
        : true;
      const isHighlighted = isRelevant && selectedUserId !== null;
      const isMyConnection = conn.userAId === currentUserId || conn.userBId === currentUserId;

      ctx.beginPath();
      ctx.moveTo(posA.x, posA.y);
      ctx.lineTo(posB.x, posB.y);
      ctx.strokeStyle = isHighlighted
        ? `rgba(255, 255, 255, ${Math.min(0.6, 0.2 + conn.letterCount * 0.1)})`
        : isMyConnection
          ? `rgba(255, 255, 255, ${Math.min(0.3, 0.1 + conn.letterCount * 0.05)})`
          : 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = isHighlighted ? 2 : (isMyConnection ? 1.5 : 0.8);
      ctx.stroke();

      if (isHighlighted) {
        ctx.beginPath();
        ctx.moveTo(posA.x, posA.y);
        ctx.lineTo(posB.x, posB.y);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 6;
        ctx.stroke();
      }
    });

    Object.entries(positions).forEach(([userId, pos]) => {
      const user = users.find(u => u.id === userId);
      if (!user) return;

      const isSelected = userId === selectedUserId;
      const isCurrent = userId === currentUserId;

      const color = STAR_COLOR_MAP[user.starColor] ?? '#ffffff';
      const starRadius = isSelected ? 10 : (isCurrent ? 9 : 7);
      const glowRadius = isSelected ? 25 : (isCurrent ? 20 : 12);

      const gradient = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, glowRadius);
      gradient.addColorStop(0, isSelected ? color : `${color}80`);
      gradient.addColorStop(1, 'transparent');
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, glowRadius, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();

      const points = 5;
      const outerR = starRadius;
      const innerR = starRadius * 0.4;

      ctx.beginPath();
      for (let i = 0; i < points * 2; i++) {
        const r = i % 2 === 0 ? outerR : innerR;
        const angle = (i * Math.PI) / points - Math.PI / 2;
        const x = pos.x + Math.cos(angle) * r;
        const y = pos.y + Math.sin(angle) * r;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();

      if (isSelected) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    });

    ctx.restore();
  }, [dimensions, users, connections, selectedUserId, currentUserId, layoutPositions, scale, offset]);

  const getStarAtPosition = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    const x = (clientX - rect.left - offset.x) / scale;
    const y = (clientY - rect.top - offset.y) / scale;

    const positions = layoutPositions();

    for (const [userId, pos] of Object.entries(positions)) {
      const dist = Math.sqrt((x - pos.x) ** 2 + (y - pos.y) ** 2);
      if (dist < 20) return userId;
    }
    return null;
  }, [layoutPositions, scale, offset]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    const userId = getStarAtPosition(e.clientX, e.clientY);
    if (userId) {
      onSelectUser(userId === selectedUserId ? null : userId);
      if (userId !== currentUserId) onWriteLetter(userId);
    } else {
      setIsDragging(true);
      setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
    }
  }, [getStarAtPosition, selectedUserId, currentUserId, onSelectUser, onWriteLetter, offset]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (isDragging) {
      setOffset({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
      return;
    }
    const userId = getStarAtPosition(e.clientX, e.clientY);
    if (userId) {
      setHoveredUser(userId);
      const user = users.find(u => u.id === userId);
      if (user) {
        setTooltipPos({ x: e.clientX, y: e.clientY - 40 });
        setShowTooltip(true);
      }
    } else {
      setHoveredUser(null);
      setShowTooltip(false);
    }
  }, [isDragging, dragStart, getStarAtPosition, users]);

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      lastTouchDist.current = dist;
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const delta = dist / lastTouchDist.current;
      setScale(prev => Math.max(0.5, Math.min(3, prev * delta)));
      lastTouchDist.current = dist;
    }
  }, []);

  const hoveredUserData = hoveredUser ? users.find(u => u.id === hoveredUser) : null;

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden">
      <canvas
        ref={canvasRef}
        className="w-full h-full touch-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={() => { handlePointerUp(); setHoveredUser(null); setShowTooltip(false); }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
      />

      <AnimatePresence>
        {showTooltip && hoveredUserData && (
          <motion.div
            className="absolute z-40 px-3 py-1.5 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 text-sm text-white whitespace-nowrap pointer-events-none"
            style={{ left: tooltipPos.x, top: tooltipPos.y, transform: 'translateX(-50%)' }}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
          >
            {hoveredUserData.username}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedUserId && selectedUserId !== currentUserId && (
          <motion.div
            className="absolute bottom-24 left-1/2 -translate-x-1/2 z-40"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            <button
              onClick={() => onWriteLetter(selectedUserId)}
              className="px-6 py-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 text-white font-medium shadow-lg shadow-purple-500/20 active:scale-95 transition-transform"
            >
              Escribir una carta
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute bottom-6 right-4 flex flex-col gap-2 z-30">
        <button
          onClick={() => setScale(prev => Math.min(3, prev * 1.2))}
          className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/70 hover:text-white active:scale-95 transition-all"
          aria-label="Acercar"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
        <button
          onClick={() => setScale(prev => Math.max(0.5, prev / 1.2))}
          className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/70 hover:text-white active:scale-95 transition-all"
          aria-label="Alejar"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
        <button
          onClick={() => { setScale(1); setOffset({ x: 0, y: 0 }); onSelectUser(null); }}
          className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/70 hover:text-white active:scale-95 transition-all"
          aria-label="Centrar"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3" /><path d="M12 2v4m0 12v4m10-10h-4M6 12H2" />
          </svg>
        </button>
      </div>
    </div>
  );
}