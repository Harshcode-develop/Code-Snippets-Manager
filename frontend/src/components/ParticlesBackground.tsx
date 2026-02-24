import React, { useEffect, useRef } from "react";

export const ParticlesBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };
    window.addEventListener("resize", handleResize);

    const numParticles = 1000;
    const particles: any[] = [];

    // Theme colors perfectly matching the CSS variables
    const colors = [
      "#6366f1", // primary
      "#ec4899", // secondary
      "#06b6d4", // accent
      "#818cf8", // primary-hover
      "#cbd5e1", // text-secondary
    ];

    // Fibonacci sphere distribution
    const phi = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < numParticles; i++) {
      const y = 1 - (i / (numParticles - 1)) * 2;
      const radius = Math.sqrt(1 - y * y);
      const theta = phi * i;

      const x = Math.cos(theta) * radius;
      const z = Math.sin(theta) * radius;

      particles.push({
        baseX: x,
        baseY: y,
        baseZ: z,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 1.5 + 0.8,
        randomOffset: Math.random() * Math.PI * 2,
      });
    }

    let mouseX = width / 2;
    let mouseY = height / 2;
    let targetRotationX = 0;
    let targetRotationY = 0;
    let rotationX = 0;
    let rotationY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      // Cursor displacement effects rotation slightly
      targetRotationY = (mouseX - width / 2) * 0.001;
      targetRotationX = (mouseY - height / 2) * 0.001;
    };
    window.addEventListener("mousemove", handleMouseMove);

    let animationFrameId: number;
    let time = 0;

    const render = () => {
      time += 0.0015;
      ctx.clearRect(0, 0, width, height);

      rotationX += (targetRotationX - rotationX) * 0.05;
      rotationY += (targetRotationY - rotationY) * 0.05;

      // Base idle rotation + mouse offset
      const rX = rotationX + time * 0.3;
      const rY = rotationY + time * 0.5;

      const cosX = Math.cos(rX);
      const sinX = Math.sin(rX);
      const cosY = Math.cos(rY);
      const sinY = Math.sin(rY);

      // Sphere radius based on screen size, breathing slightly
      const baseRadius = Math.min(width, height) * 0.45;
      const breathing = Math.sin(time * 3) * 0.03;

      const projected = particles.map((p) => {
        // Subtle organic movement for each particle
        const wave = Math.sin(time * 5 + p.randomOffset) * 0.03;
        const px = p.baseX * (1 + wave);
        const py = p.baseY * (1 + wave);
        const pz = p.baseZ * (1 + wave);

        // 3D Rotation along X
        const y1 = py * cosX - pz * sinX;
        const z1 = py * sinX + pz * cosX;

        // 3D Rotation along Y
        const x2 = px * cosY + z1 * sinY;
        const z2 = -px * sinY + z1 * cosY;

        return {
          ...p,
          x3d: x2,
          y3d: y1,
          z3d: z2,
        };
      });

      // Z-sorting for proper overlap and alpha mapping (draw back to front: highest z3d first)
      projected.sort((a, b) => b.z3d - a.z3d);

      let drawnCircle = false;

      projected.forEach((p) => {
        // Render the white central space circle exactly in the middle of the sorting
        if (!drawnCircle && p.z3d <= 0) {
          drawnCircle = true;
          const circleBase = Math.min(width, height) * 0.12;
          const pulse = Math.sin(time * 2) * 0.05;
          const outerRadius = circleBase * 2.5;

          ctx.beginPath();
          ctx.arc(width / 2, height / 2, outerRadius, 0, Math.PI * 2);

          const gradient = ctx.createRadialGradient(
            width / 2,
            height / 2,
            circleBase * (1 + pulse),
            width / 2,
            height / 2,
            outerRadius,
          );

          // Get the current theme to adapt colors
          const isLight =
            document.documentElement.getAttribute("data-theme") === "light";

          if (isLight) {
            // Very subtle color for light mode so it doesn't stand out too much
            gradient.addColorStop(0, "rgba(99, 102, 241, 0.12)"); // primary color
            gradient.addColorStop(0.3, "rgba(236, 72, 153, 0.05)"); // secondary color
            gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
          } else {
            // Ambient dark mode nebula
            gradient.addColorStop(0, "rgba(99, 102, 241, 0.2)"); // primary color
            gradient.addColorStop(0.3, "rgba(236, 72, 153, 0.1)"); // secondary color
            gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
          }

          ctx.fillStyle = gradient;
          ctx.globalAlpha = 1;
          ctx.fill();
        }

        const radius = baseRadius * (1 + breathing);
        const fov = 400; // Field of view
        const scale = fov / (fov + p.z3d * radius);

        let x2d = width / 2 + p.x3d * radius * scale;
        let y2d = height / 2 + p.y3d * radius * scale;

        // Dynamic mouse repulsion
        const dx = x2d - mouseX;
        const dy = y2d - mouseY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const repelRadius = 150;
        if (dist < repelRadius) {
          const force = Math.pow((repelRadius - dist) / repelRadius, 2);
          // Scale repulsion based on depth so background doesn't move weirdly compared to foreground
          x2d += (dx / dist) * force * 35 * scale;
          y2d += (dy / dist) * force * 35 * scale;
        }

        // Depth dimming (closer is brighter)
        const alpha = Math.max(0.05, Math.min(0.8, scale * 1.5 - 0.5));

        ctx.beginPath();
        // Point size gets smaller to zero if further away
        ctx.arc(
          x2d,
          y2d,
          Math.min(1.5, Math.max(0, p.size * scale * 1.5)),
          0,
          Math.PI * 2,
        );
        ctx.fillStyle = p.color;
        ctx.globalAlpha = alpha;
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0, opacity: 0.7 }}
      aria-hidden="true"
    />
  );
};
