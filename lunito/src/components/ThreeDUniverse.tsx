import React, { useEffect, useRef, useState } from "react";

interface Node3D {
  x: number;
  y: number;
  z: number;
  baseX: number;
  baseY: number;
  baseZ: number;
  size: number;
  color: string;
  speed: number;
}

export default function ThreeDUniverse() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dimensions, setDimensions] = useState({ width: 500, height: 500 });
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0, active: false });

  // Handle resizing dynamically using ResizeObserver for perfect canvas scaling
  useEffect(() => {
    if (!containerRef.current) return;
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width, height } = entry.contentRect;
        const size = Math.min(width, height) || 500;
        setDimensions({ width: size, height: size });
      }
    });
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = dimensions.width;
    const height = dimensions.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) * 0.38;

    // Set canvas high-DPI scaling
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    // Initialise 3D points inside a sphere for the holographic learning nebula
    const nodeCount = 180;
    const nodes: Node3D[] = [];

    // Create a core cluster (Socratic Brain Core)
    for (let i = 0; i < nodeCount; i++) {
      // Golden spiral distribution for perfect spherical distribution (Fibonacci Sphere)
      const phi = Math.acos(-1 + (2 * i) / nodeCount);
      const theta = Math.sqrt(nodeCount * Math.PI) * phi;

      // Add slight randomness to make it feel natural and organic
      const r = radius * (0.6 + Math.random() * 0.4);
      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);

      const color = i % 3 === 0 
        ? "rgb(139, 92, 246)" // Violet
        : i % 3 === 1 
          ? "rgb(56, 189, 248)" // Cyan/Sky
          : "rgb(99, 102, 241)"; // Indigo

      nodes.push({
        x,
        y,
        z,
        baseX: x,
        baseY: y,
        baseZ: z,
        size: 1.5 + Math.random() * 2.5,
        color,
        speed: 0.1 + Math.random() * 0.5,
      });
    }

    // Floating thoughts (satellites)
    const satellites: Node3D[] = [];
    const satelliteCount = 12;
    for (let i = 0; i < satelliteCount; i++) {
      const angle = (i / satelliteCount) * Math.PI * 2;
      const r = radius * 1.35;
      const x = r * Math.cos(angle);
      const y = (Math.random() - 0.5) * 60;
      const z = r * Math.sin(angle);
      satellites.push({
        x,
        y,
        z,
        baseX: x,
        baseY: y,
        baseZ: z,
        size: 3.5,
        color: "#22d3ee", // Vibrant Cyan
        speed: 0.5,
      });
    }

    let angleX = 0.003;
    let angleY = 0.0045;
    let angleZ = 0.0015;

    let localMouseX = 0;
    let localMouseY = 0;
    let animationFrameId: number;

    const handleMouseMove = (e: MouseEvent) => {
      if (!canvas || typeof canvas.getBoundingClientRect !== "function") return;
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left - centerX;
      const my = e.clientY - rect.top - centerY;
      mouseRef.current.targetX = mx;
      mouseRef.current.targetY = my;
      mouseRef.current.active = true;
    };

    const handleMouseLeave = () => {
      mouseRef.current.targetX = 0;
      mouseRef.current.targetY = 0;
      mouseRef.current.active = false;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!canvas || typeof canvas.getBoundingClientRect !== "function" || e.touches.length === 0) return;
      const rect = canvas.getBoundingClientRect();
      const mx = e.touches[0].clientX - rect.left - centerX;
      const my = e.touches[0].clientY - rect.top - centerY;
      mouseRef.current.targetX = mx;
      mouseRef.current.targetY = my;
      mouseRef.current.active = true;
    };

    if (canvas && typeof canvas.addEventListener === "function") {
      canvas.addEventListener("mousemove", handleMouseMove);
      canvas.addEventListener("mouseleave", handleMouseLeave);
      canvas.addEventListener("touchmove", handleTouchMove, { passive: true });
      canvas.addEventListener("touchend", handleMouseLeave);
    }

    const render = () => {
      // Clear with a tiny trails effect for futuristic motion blur
      ctx.fillStyle = "rgba(7, 7, 10, 0.15)";
      ctx.fillRect(0, 0, width, height);

      // Smooth interpolation for mouse movement coordinates (inertial physics)
      localMouseX += (mouseRef.current.targetX - localMouseX) * 0.06;
      localMouseY += (mouseRef.current.targetY - localMouseY) * 0.06;

      // Update rotation angles dynamically based on interactive cursor inertia
      const currentAngleY = angleY + localMouseX * 0.00003;
      const currentAngleX = angleX + localMouseY * 0.00003;

      // Sin and Cos calculations for 3D coordinate rotation transformation matrices
      const cosX = Math.cos(currentAngleX);
      const sinX = Math.sin(currentAngleX);
      const cosY = Math.cos(currentAngleY);
      const sinY = Math.sin(currentAngleY);
      const cosZ = Math.cos(angleZ);
      const sinZ = Math.sin(angleZ);

      // Transform core points
      nodes.forEach((node) => {
        // Base rotations around the axes
        let x = node.x;
        let y = node.y;
        let z = node.z;

        // Apply interactive micro-floating wave mechanics
        const offset = Date.now() * 0.001 * node.speed;
        x += Math.sin(offset) * 0.12;
        y += Math.cos(offset) * 0.12;

        // Yaw (Y-axis rotation)
        const x1 = x * cosY - z * sinY;
        const z1 = z * cosY + x * sinY;

        // Pitch (X-axis rotation)
        const y2 = y * cosX - z1 * sinX;
        const z2 = z1 * cosX + y * sinX;

        // Roll (Z-axis rotation)
        const x3 = x1 * cosZ - y2 * sinZ;
        const y3 = y2 * cosZ + x1 * sinZ;

        node.x = x3;
        node.y = y3;
        node.z = z2;
      });

      // Transform satellites in opposite direction to create depth parallax
      satellites.forEach((sat, idx) => {
        let x = sat.x;
        let y = sat.y;
        let z = sat.z;

        // Orbit calculation
        const orbitSpeed = 0.008;
        const satCos = Math.cos(orbitSpeed);
        const satSin = Math.sin(orbitSpeed);

        const x1 = x * satCos - z * satSin;
        const z1 = z * satCos + x * satSin;

        sat.x = x1;
        sat.z = z1;
      });

      // Combine and depth-sort sorting points (highly critical for correct 3D overlapping transparency)
      const allPoints = [
        ...nodes.map((n) => ({ ...n, type: "core" })),
        ...satellites.map((s) => ({ ...s, type: "satellite" })),
      ].sort((a, b) => b.z - a.z);

      const fov = 380; // Field of View (distance parameter for perspective projection)

      // 1. Draw connecting synapses wireframe (for core neural nodes within close depth range)
      ctx.lineWidth = 0.45;
      for (let i = 0; i < nodes.length; i++) {
        const ptA = nodes[i];
        
        let connections = 0;
        // Limit connections per node to preserve multi-threading/GPU drawing rates
        for (let j = i + 1; j < nodes.length; j++) {
          if (connections > 2) break;
          const ptB = nodes[j];

          const dx = ptA.x - ptB.x;
          const dy = ptA.y - ptB.y;
          const dz = ptA.z - ptB.z;
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

          if (dist < radius * 0.48) {
            connections++;
            // Calculate perspective projection points for both vertices
            const scaleA = fov / (fov + ptA.z);
            const scaleB = fov / (fov + ptB.z);

            const projXA = ptA.x * scaleA + centerX;
            const projYA = ptA.y * scaleA + centerY;
            const projXB = ptB.x * scaleB + centerX;
            const projYB = ptB.y * scaleB + centerY;

            // Fade opacity based on distance and depth (far connections are beautifully attenuated)
            const depthFactor = Math.min(1, Math.max(0, (ptA.z + ptB.z + radius * 2) / (radius * 4)));
            const proximityFactor = 1 - (dist / (radius * 0.48));
            const opacity = 0.18 * depthFactor * proximityFactor;

            const gradient = ctx.createLinearGradient(projXA, projYA, projXB, projYB);
            gradient.addColorStop(0, ptA.color.replace("rgb", "rgba").replace(")", `, ${opacity})`));
            gradient.addColorStop(1, ptB.color.replace("rgb", "rgba").replace(")", `, ${opacity})`));

            ctx.strokeStyle = gradient;
            ctx.beginPath();
            ctx.moveTo(projXA, projYA);
            ctx.lineTo(projXB, projYB);
            ctx.stroke();
          }
        }
      }

      // 2. Draw nodes with correct perspective and physical radial lights
      allPoints.forEach((pt) => {
        const scale = fov / (fov + pt.z);
        const projX = pt.x * scale + centerX;
        const projY = pt.y * scale + centerY;

        // Depth of field size attenuation
        const size = pt.size * scale;

        // Discard if project goes totally out of bounds
        if (projX < 0 || projX > width || projY < 0 || projY > height) return;

        // Determine glow & depth transparency values
        const depthOpacity = Math.min(1, Math.max(0.12, (pt.z + radius * 1.5) / (radius * 3)));
        
        ctx.beginPath();
        ctx.arc(projX, projY, size, 0, Math.PI * 2);

        if (pt.type === "satellite") {
          // Glow effect for interactive floating knowledge cores
          const glowRad = size * 2.8;
          const radialGlow = ctx.createRadialGradient(projX, projY, size * 0.3, projX, projY, glowRad);
          radialGlow.addColorStop(0, "rgba(34, 211, 238, 1)");
          radialGlow.addColorStop(0.3, "rgba(14, 165, 233, 0.4)");
          radialGlow.addColorStop(1, "rgba(14, 165, 233, 0)");
          
          ctx.fillStyle = radialGlow;
          ctx.arc(projX, projY, glowRad, 0, Math.PI * 2);
          ctx.fill();

          // Core point solid
          ctx.beginPath();
          ctx.arc(projX, projY, size * 0.8, 0, Math.PI * 2);
          ctx.fillStyle = "#ffffff";
          ctx.fill();

          // Add a subtle orbiting light label ring
          ctx.strokeStyle = "rgba(34, 211, 238, 0.15)";
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.arc(projX, projY, size * 1.8, 0, Math.PI * 2);
          ctx.stroke();
        } else {
          // Core point
          const alphaColor = pt.color.replace("rgb", "rgba").replace(")", `, ${depthOpacity})`);
          ctx.fillStyle = alphaColor;
          ctx.fill();

          // Subtle core highlight on closest nodes
          if (pt.z < -radius * 0.4) {
            ctx.beginPath();
            ctx.arc(projX, projY, size * 0.35, 0, Math.PI * 2);
            ctx.fillStyle = "#ffffff";
            ctx.fill();
          }
        }
      });

      // 3. Draw a gorgeous central glowing nucleus (the Supercharged AI Core of Lunito)
      const coreScale = fov / (fov - 20); // neutral depth
      const coreGlowRad = radius * 0.42 * coreScale;
      const coreGlow = ctx.createRadialGradient(centerX, centerY, 2, centerX, centerY, coreGlowRad);
      coreGlow.addColorStop(0, "rgba(99, 102, 241, 0.18)"); // Indigo glow center
      coreGlow.addColorStop(0.4, "rgba(139, 92, 246, 0.1)"); // Violet outer glow
      coreGlow.addColorStop(1, "rgba(139, 92, 246, 0)");

      ctx.beginPath();
      ctx.arc(centerX, centerY, coreGlowRad, 0, Math.PI * 2);
      ctx.fillStyle = coreGlow;
      ctx.fill();

      // Slow idle loop rotation offsets
      angleX += 0.0001;
      angleY += 0.00035;

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      if (canvas && typeof canvas.removeEventListener === "function") {
        canvas.removeEventListener("mousemove", handleMouseMove);
        canvas.removeEventListener("mouseleave", handleMouseLeave);
        canvas.removeEventListener("touchmove", handleTouchMove);
        canvas.removeEventListener("touchend", handleMouseLeave);
      }
    };
  }, [dimensions]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full min-h-[360px] md:min-h-[460px] flex items-center justify-center relative touch-none select-none select-none"
    >
      <canvas
        ref={canvasRef}
        style={{ width: dimensions.width, height: dimensions.height }}
        className="max-w-full max-h-full cursor-grab active:cursor-grabbing transition-opacity duration-700 ease-out animate-fadeIn"
      />
      {/* Decorative center orb vector */}
      <div className="absolute inset-0 m-auto w-12 h-12 rounded-full bg-violet-600/10 border border-violet-500/20 blur-md pointer-events-none flex items-center justify-center">
        <div className="w-4 h-4 rounded-full bg-cyan-400/40 animate-ping absolute" />
        <div className="w-5 h-5 rounded-full bg-violet-500/20 animate-pulse absolute" />
      </div>
    </div>
  );
}
