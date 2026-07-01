import { useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';

export interface NeuralMeshProps {
  isLocked: boolean;
  value: string;
}

export const NeuralMesh = ({ isLocked, value }: NeuralMeshProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nodesRef = useRef<{ x: number; y: number; offset: number }[]>([]);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrame: number;
    const size = 33;
    const padding = 40;
    
    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      
      // Initialize stable nodes
      const cellSize = (canvas.offsetWidth - padding * 2) / size;
      const newNodes = [];
      for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
          const isFinder = (i < 7 && j < 7) || (i < 7 && j > size - 8) || (i > size - 8 && j < 7);
          if (isFinder || Math.random() > 0.9) {
            newNodes.push({
              x: padding + j * cellSize + cellSize / 2,
              y: padding + i * cellSize + cellSize / 2,
              offset: Math.random() * Math.PI * 2
            });
          }
        }
      }
      nodesRef.current = newNodes;
    };
    
    window.addEventListener('resize', resize);
    resize();

    const draw = (time: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const color = isLocked ? '#FFB300' : '#FF6B00';
      ctx.strokeStyle = color;
      ctx.lineWidth = 0.75;

      // Draw Stable Neural Mesh
      nodesRef.current.forEach((node, idx) => {
        const flicker = Math.sin(time * 0.002 + node.offset) * 0.5 + 0.5;
        
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.1 + flicker * 0.5;
        ctx.beginPath();
        ctx.arc(node.x, node.y, 2, 0, Math.PI * 2);
        ctx.fill();

        // Connect to nearby nodes (simulating mesh)
        ctx.globalAlpha = 0.05;
        const nextNode = nodesRef.current[idx + 1];
        if (nextNode && Math.abs(nextNode.x - node.x) < 30 && Math.abs(nextNode.y - node.y) < 30) {
          ctx.beginPath();
          ctx.moveTo(node.x, node.y);
          ctx.lineTo(nextNode.x, nextNode.y);
          ctx.stroke();
        }
      });

      // Floating Particles
      const particleCount = 20;
      for (let i = 0; i < particleCount; i++) {
        const speed = 0.0002 + (i * 0.00005);
        const px = (Math.sin(time * speed + i) * 0.7 + 0.5) * canvas.offsetWidth;
        const py = (Math.cos(time * speed * 0.8 + i * 2) * 0.7 + 0.5) * canvas.offsetHeight;
        
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.1;
        ctx.beginPath();
        ctx.arc(px, py, 2, 0, Math.PI * 2);
        ctx.fill();
      }

      animationFrame = requestAnimationFrame(draw);
    };

    animationFrame = requestAnimationFrame(draw);
    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrame);
    };
  }, [isLocked]);

  return (
    <div className="relative w-full aspect-square max-w-[340px] mx-auto">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />
      <div className="hidden">
        <QRCodeSVG id="hidden-qr" value={value} size={33} />
      </div>
    </div>
  );
};
