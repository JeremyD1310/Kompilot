/**
 * FunnelCanvas — Interactive visual flowchart of the sales funnel.
 * Renders nodes in a horizontal flow with directional SVG arrows.
 * Falls back to vertical stack on mobile.
 */
import { useState, useRef } from 'react';
import { cn } from '@blinkdotnew/ui';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { FunnelNode } from './FunnelNode';
import type { FunnelNodeData } from './FunnelNode';
import type { FunnelData } from './types';
import { FUNNEL_ADS } from './funnelMockData';

const MAIN_FLOW: Array<FunnelNodeData['type']> = ['ad_source', 'opt_in', 'vsl', 'checkout'];
const NODE_W = 220;
const NODE_GAP = 56; // space between nodes for arrows
const ARROW_COLOR = '#0D9488'; // primary teal

interface ArrowProps {
  x1: number; y1: number; x2: number; y2: number;
  dashed?: boolean;
}

function Arrow({ x1, y1, x2, y2, dashed }: ArrowProps) {
  const midX = (x1 + x2) / 2;
  const d = `M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`;
  return (
    <g>
      <path
        d={d}
        fill="none"
        stroke={ARROW_COLOR}
        strokeWidth="2"
        strokeDasharray={dashed ? '6 4' : undefined}
        opacity={0.6}
      />
      {/* Arrowhead */}
      <polygon
        points={`${x2},${y2} ${x2 - 7},${y2 - 4} ${x2 - 7},${y2 + 4}`}
        fill={ARROW_COLOR}
        opacity={0.7}
      />
    </g>
  );
}

interface FunnelCanvasProps {
  funnel: FunnelData;
  selectedNodeId?: string;
  onSelectNode?: (nodeId: string) => void;
  profitableAdsOnly?: boolean;
}

export function FunnelCanvas({ funnel, selectedNodeId, onSelectNode, profitableAdsOnly = false }: FunnelCanvasProps) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const panStart = useRef({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('[data-node]')) return;
    isDragging.current = true;
    dragStart.current = { x: e.clientX, y: e.clientY };
    panStart.current = { ...pan };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    setPan({ x: panStart.current.x + dx, y: panStart.current.y + dy });
  };

  const handleMouseUp = () => { isDragging.current = false; };

  const zoomIn = () => setZoom(z => Math.min(z + 0.15, 2));
  const zoomOut = () => setZoom(z => Math.max(z - 0.15, 0.4));
  const resetView = () => { setZoom(1); setPan({ x: 0, y: 0 }); };

  // Split nodes
  const mainNodes = MAIN_FLOW
    .map(type => funnel.nodes.find(n => n.type === type))
    .filter(Boolean) as FunnelNodeData[];
  const emailNode = funnel.nodes.find(n => n.type === 'email_sequence');

  // Get ads for this funnel (for longevity filter on ad_source node)
  const funnelAds = FUNNEL_ADS[funnel.id] ?? [];

  // Layout calculations
  const NODE_H = 200; // approximate node card height
  const CANVAS_W = mainNodes.length * (NODE_W + NODE_GAP) + NODE_GAP;
  const EMAIL_Y_OFFSET = NODE_H + 60;
  const CANVAS_H = NODE_H + EMAIL_Y_OFFSET + 120;

  // Node positions
  const nodePos = mainNodes.map((_, i) => ({
    x: NODE_GAP / 2 + i * (NODE_W + NODE_GAP),
    y: 20,
  }));

  // Opt-in position (for email branch)
  const optInIdx = mainNodes.findIndex(n => n.type === 'opt_in');
  const optInPos = optInIdx >= 0 ? nodePos[optInIdx] : null;

  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden">
      {/* Zoom controls */}
      <div className="absolute top-3 right-3 z-20 flex flex-col gap-1">
        <button
          onClick={zoomIn}
          className="w-8 h-8 rounded-lg border border-border bg-card flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shadow-sm"
          title="Zoom avant"
        >
          <ZoomIn size={14} />
        </button>
        <button
          onClick={zoomOut}
          className="w-8 h-8 rounded-lg border border-border bg-card flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shadow-sm"
          title="Zoom arrière"
        >
          <ZoomOut size={14} />
        </button>
        <button
          onClick={resetView}
          className="w-8 h-8 rounded-lg border border-border bg-card flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shadow-sm"
          title="Réinitialiser la vue"
        >
          <Maximize2 size={14} />
        </button>
      </div>

      {/* Zoom indicator */}
      <div className="absolute bottom-3 left-3 z-20 text-[10px] font-mono text-muted-foreground bg-card/80 border border-border rounded-md px-2 py-1">
        {Math.round(zoom * 100)}%
      </div>

      {/* Canvas viewport */}
      <div
        className="flex-1 w-full overflow-hidden cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Mobile: vertical stack */}
        <div className="md:hidden flex flex-col items-center gap-4 py-4 px-4 overflow-y-auto h-full">
          {mainNodes.map((node) => (
            <div key={node.id} className="flex flex-col items-center gap-2">
              <div data-node>
                <FunnelNode
                  node={node}
                  isSelected={node.id === selectedNodeId}
                  onClick={() => onSelectNode?.(node.id)}
                  ads={node.type === 'ad_source' ? funnelAds : []}
                  profitableAdsOnly={profitableAdsOnly}
                />
              </div>
              <div className="w-0.5 h-6 bg-primary/30 rounded-full" />
            </div>
          ))}
          {emailNode && (
            <div data-node>
              <FunnelNode
                node={emailNode}
                isSelected={emailNode.id === selectedNodeId}
                onClick={() => onSelectNode?.(emailNode.id)}
                isEmailSide
              />
            </div>
          )}
        </div>

        {/* Desktop: horizontal canvas with SVG arrows */}
        <div
          className="hidden md:block"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: 'center center',
            width: CANVAS_W,
            height: CANVAS_H,
            position: 'relative',
          }}
        >
          {/* SVG arrows layer */}
          <svg
            className="absolute inset-0 pointer-events-none"
            width={CANVAS_W}
            height={CANVAS_H}
            style={{ overflow: 'visible' }}
          >
            {/* Main flow arrows */}
            {mainNodes.slice(0, -1).map((_, i) => {
              const from = nodePos[i];
              const to = nodePos[i + 1];
              return (
                <Arrow
                  key={`main-${i}`}
                  x1={from.x + NODE_W}
                  y1={from.y + NODE_H / 2}
                  x2={to.x}
                  y2={to.y + NODE_H / 2}
                />
              );
            })}

            {/* Email branch arrow (from opt-in, going down) */}
            {emailNode && optInPos && (
              <Arrow
                x1={optInPos.x + NODE_W / 2}
                y1={optInPos.y + NODE_H}
                x2={optInPos.x + NODE_W / 2}
                y2={optInPos.y + EMAIL_Y_OFFSET}
                dashed
              />
            )}
          </svg>

          {/* Main flow nodes */}
          {mainNodes.map((node, i) => (
            <div
              key={node.id}
              data-node
              style={{
                position: 'absolute',
                left: nodePos[i].x,
                top: nodePos[i].y,
              }}
            >
              <FunnelNode
                node={node}
                isSelected={node.id === selectedNodeId}
                onClick={() => onSelectNode?.(node.id)}
                ads={node.type === 'ad_source' ? funnelAds : []}
                profitableAdsOnly={profitableAdsOnly}
              />
            </div>
          ))}

          {/* Email side node */}
          {emailNode && optInPos && (
            <div
              key={emailNode.id}
              data-node
              style={{
                position: 'absolute',
                left: optInPos.x + (NODE_W - 200) / 2,
                top: optInPos.y + EMAIL_Y_OFFSET,
              }}
            >
              <FunnelNode
                node={emailNode}
                isSelected={emailNode.id === selectedNodeId}
                onClick={() => onSelectNode?.(emailNode.id)}
                isEmailSide
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Empty state ─────────────────────────────────────────────────────────────

export function FunnelCanvasEmpty() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-5 text-center px-8 py-16">
      {/* Animated dotted node grid */}
      <div className="relative w-64 h-32 flex items-center justify-center">
        <div className="absolute flex items-center gap-8">
          {[0, 1, 2, 3].map(i => (
            <div key={i} className="flex flex-col items-center gap-1">
              <div
                className={cn(
                  'w-12 h-12 rounded-xl border-2 border-dashed flex items-center justify-center transition-all',
                  i === 0 ? 'border-orange-300 bg-orange-50 dark:bg-orange-950/20' :
                  i === 1 ? 'border-teal-300 bg-teal-50 dark:bg-teal-950/20' :
                  i === 2 ? 'border-purple-300 bg-purple-50 dark:bg-purple-950/20' :
                  'border-green-300 bg-green-50 dark:bg-green-950/20'
                )}
                style={{ animationDelay: `${i * 200}ms` }}
              >
                <div className={cn(
                  'w-4 h-4 rounded-md animate-pulse',
                  i === 0 ? 'bg-orange-200 dark:bg-orange-800' :
                  i === 1 ? 'bg-teal-200 dark:bg-teal-800' :
                  i === 2 ? 'bg-purple-200 dark:bg-purple-800' :
                  'bg-green-200 dark:bg-green-800'
                )} />
              </div>
              {i < 3 && (
                <div className="absolute" style={{ left: `${48 + i * 64 + 12}px`, top: '22px' }}>
                  <div className="w-8 h-0.5 bg-gradient-to-r from-muted-foreground/30 to-transparent" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      <div>
        <p className="text-base font-bold text-foreground">Analysez un tunnel concurrent</p>
        <p className="text-sm text-muted-foreground mt-1 max-w-xs">
          Entrez l'URL ou le nom d'un créateur pour visualiser la carte complète de son tunnel de vente.
        </p>
      </div>
    </div>
  );
}
