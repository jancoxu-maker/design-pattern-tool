import { useState, useRef, useEffect } from 'react';
import { RefreshCw, Download } from 'lucide-react';

type Point = { x: number; y: number };
type Polygon = Point[];

const SIZE = 500;

const generatePattern = (type: 'X' | '田', numRegions: number): { polygon: Polygon; angles: number[] }[] => {
  const regions = [];
  if (type === 'X') {
    const center = { x: SIZE / 2, y: SIZE / 2 };
    const corners = [
      { x: 0, y: 0 },
      { x: SIZE, y: 0 },
      { x: SIZE, y: SIZE },
      { x: 0, y: SIZE },
    ];
    for (let i = 0; i < 4; i++) {
      regions.push({
        polygon: [center, corners[i], corners[(i + 1) % 4]],
        angles: [Math.floor(Math.random() * 4) * 45],
      });
    }
  } else {
    // 田 shape: n x n grid
    const n = Math.ceil(Math.sqrt(numRegions));
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (regions.length < numRegions) {
          const x1 = (i * SIZE) / n;
          const x2 = ((i + 1) * SIZE) / n;
          const y1 = (j * SIZE) / n;
          const y2 = ((j + 1) * SIZE) / n;
          regions.push({
            polygon: [
              { x: x1, y: y1 },
              { x: x2, y: y1 },
              { x: x2, y: y2 },
              { x: x1, y: y2 },
            ],
            angles: [Math.floor(Math.random() * 4) * 45],
          });
        }
      }
    }
  }
  return regions;
};

export default function App() {
  const [patternType, setPatternType] = useState<'X' | '田'>('X');
  const [numRegions, setNumRegions] = useState(4);
  const [regions, setRegions] = useState(generatePattern('X', 4));
  const [strokeWidth, setStrokeWidth] = useState(1);
  const [density, setDensity] = useState(20);
  const [showCutLines, setShowCutLines] = useState(true);
  const [cutLinesFollowStroke, setCutLinesFollowStroke] = useState(true);
  const [globalOffset, setGlobalOffset] = useState(0);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp') setDensity(prev => Math.min(prev + 1, 50));
      if (e.key === 'ArrowDown') setDensity(prev => Math.max(prev - 1, 5));
      if (e.key === 'ArrowRight') setStrokeWidth(prev => Math.min(prev + 0.5, 20));
      if (e.key === 'ArrowLeft') setStrokeWidth(prev => Math.max(prev - 0.5, 0.5));
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleGenerate = () => {
    setRegions(generatePattern(patternType, numRegions));
    setGlobalOffset(Math.random());
  };
  
  const handleRegenerateRegion = (index: number) => {
    setRegions(prev => prev.map((region, i) => 
      i === index ? { ...region, angles: [Math.floor(Math.random() * 4) * 45] } : region
    ));
  };
  
  const handleToggleMixedMode = (index: number) => {
    const n = Math.ceil(Math.sqrt(numRegions));
    const i = Math.floor(index / n);
    const j = index % n;
    
    const newAngle = regions[index].angles[0] === 0 ? 45 : 0;
    const symAngle = newAngle === 0 ? 0 : 315;
    
    setRegions(prev => prev.map((region, idx) => {
      if (idx === index) {
        return { ...region, angles: [newAngle] };
      }
      
      // Check adjacency
      let isNeighbor = false;
      if (patternType === 'X') {
        isNeighbor = true; // All regions are neighbors in X pattern
      } else {
        const ni = Math.floor(idx / n);
        const nj = idx % n;
        isNeighbor = Math.abs(ni - i) + Math.abs(nj - j) === 1;
      }
      
      return isNeighbor ? { ...region, angles: [symAngle] } : region;
    }));
  };
  
  const handleTypeChange = (type: 'X' | '田', regionsCount: number = numRegions) => {
    setPatternType(type);
    setRegions(generatePattern(type, regionsCount));
  };

  const handleExport = () => {
    if (!svgRef.current) return;
    const svgData = new XMLSerializer().serializeToString(svgRef.current);
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'pattern.svg';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center p-4">
      <h1 className="text-3xl font-bold mb-6">Geometric Pattern Generator</h1>
      
      <div className="flex flex-wrap gap-6 mb-6 bg-white p-4 rounded-lg shadow">
        <label className="flex items-center gap-2">
          分割方式:
          <button onClick={() => handleTypeChange('X')} className={`px-3 py-1 rounded ${patternType === 'X' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>X</button>
          <button onClick={() => handleTypeChange('田')} className={`px-3 py-1 rounded ${patternType === '田' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>田</button>
        </label>
        {patternType === '田' && (
          <label className="flex items-center gap-2">
            分割数量:
            <input type="range" min="1" max="16" value={numRegions} onChange={(e) => {
              const val = Number(e.target.value);
              setNumRegions(val);
              handleTypeChange(patternType, val);
            }} />
            {numRegions}
          </label>
        )}
        <label className="flex items-center gap-2">
          线条粗细:
          <input type="range" min="0.5" max="20" step="0.5" value={strokeWidth} onChange={(e) => setStrokeWidth(Number(e.target.value))} />
          {strokeWidth}
        </label>
        <label className="flex items-center gap-2">
          线条密度:
          <input type="range" min="5" max="50" value={density} onChange={(e) => setDensity(Number(e.target.value))} />
          {density}
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={showCutLines} onChange={(e) => setShowCutLines(e.target.checked)} />
          显示切割线
        </label>
        {showCutLines && (
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={cutLinesFollowStroke} onChange={(e) => setCutLinesFollowStroke(e.target.checked)} />
            切割线跟随粗细
          </label>
        )}
      </div>

      <div className="bg-white p-4 rounded-lg shadow-lg">
        <svg key={JSON.stringify(regions) + strokeWidth + density + showCutLines + cutLinesFollowStroke + globalOffset} ref={svgRef} width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="border border-gray-300">
          {regions.map((region, i) => {
            // Clip path to ensure lines stay within the triangle
            const id = `clip-${i}`;
            return (
              <g key={i} onClick={() => handleToggleMixedMode(i)} onContextMenu={(e) => { e.preventDefault(); handleRegenerateRegion(i); }} className="cursor-pointer">
                <defs>
                  <clipPath id={id}>
                    <polygon points={region.polygon.map(p => `${p.x},${p.y}`).join(' ')} />
                  </clipPath>
                </defs>
                {showCutLines && (
                  <polygon points={region.polygon.map(p => `${p.x},${p.y}`).join(' ')} fill="white" stroke="black" strokeWidth={cutLinesFollowStroke ? strokeWidth : 2} />
                )}
                <g clipPath={`url(#${id})`}>
                  {region.angles.map((angle, angleIndex) => (
                    <g key={angleIndex}>
                      {(() => {
                        const spacing = SIZE / density;
                        const angleRad = (angle * Math.PI) / 180;
                        const cos = Math.cos(angleRad);
                        const sin = Math.sin(angleRad);
                        
                        // Center of the SVG
                        const cx = SIZE / 2;
                        const cy = SIZE / 2;
                        
                        // Max distance from center to cover the whole SVG
                        const maxDist = (SIZE * Math.sqrt(2)) / 2;
                        const numLines = Math.ceil(maxDist / spacing) + 1;
                        
                        const lines = [];
                        for (let k = -numLines; k <= numLines; k++) {
                          // Offset relative to center
                          const offset = (k + globalOffset) * spacing;
                          
                          // Line equation: (x - cx)*cos + (y - cy)*sin = offset
                          // A point on the line:
                          const px = cx + offset * cos;
                          const py = cy + offset * sin;
                          
                          // Direction vector of the line
                          const dx = -sin;
                          const dy = cos;
                          
                          // Use a large enough distance to cover the SVG
                          const dist = SIZE * 2;
                          const x1 = px + dx * dist;
                          const y1 = py + dy * dist;
                          const x2 = px - dx * dist;
                          const y2 = py - dy * dist;
                          
                          lines.push(<line key={k} x1={x1} y1={y1} x2={x2} y2={y2} stroke="black" strokeWidth={strokeWidth} />);
                        }
                        return lines;
                      })()}
                    </g>
                  ))}
                </g>
              </g>
            );
          })}
        </svg>
      </div>
      <div className="mt-6 flex gap-4">
        <button onClick={handleGenerate} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          <RefreshCw size={20} /> Generate
        </button>
        <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
          <Download size={20} /> Export SVG
        </button>
      </div>
    </div>
  );
}
