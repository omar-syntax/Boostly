
/**
 * Generates deterministic coordinates for a tree based on its index.
 * This ensures trees always appear in the same spot for a given session.
 * 
 * We use a grid-like system with some organic offset.
 * 
 * @param index The index of the tree in the session list
 * @param totalTrees Total number of trees (optional, for density adjustments)
 * @returns {x, y, scale} - x and y in percentages (0-100), scale factor (0.8-1.2)
 */
export const generateTreeCoordinates = (index: number) => {
  // Constants for our grid system
  const COLS = 6;
  // We don't strictly limit rows, they just grow downwards/upwards 
  // but we want to map them to a 0-100% viewport roughly.
  // Let's use a "random" but deterministic number generator based on index
  
  const seed = index * 9301 + 49297;
  const random = (seed: number) => {
      const x = Math.sin(seed) * 10000;
      return x - Math.floor(x);
  };
  
  // Grid position
  const row = Math.floor(index / COLS);
  const col = index % COLS;
  
  // Base position (cell center)
  // We want trees to be somewhat spread out.
  // 100% width / 6 cols = ~16.6% per col
  const colWidth = 100 / COLS;
  const xBase = (col * colWidth) + (colWidth / 2);
  
  // Y position. We want to fill from "back" (top) to "front" (bottom) or vice versa.
  // The user prompt says:
  // "Trees closer to the bottom appear slightly larger (depth illusion)"
  // "Trees higher up appear smaller and lighter"
  // So larger Y (bottom) = larger scale.
  
  // Let's map rows to Y. 
  // We can cycle through rows comfortably.
  // Say we have infinite scrolling or just a fixed area? 
  // User says "Fixed logical boundaries", "Overflow: hidden".
  // So we should try to fit them or maybe they just clutter?
  // Let's assume a fixed capacity or wrap around nicely?
  // Or maybe we just pick a random spot in 0-100 range deterministically.
  
  // Improved "Organic Spots" approach:
  // We define a set of slots in a 100x100 grid.
  // Actually, let's just use the hash to pick x,y but constrained to avoid overlap?
  // Constraints are hard without finding all.
  // Let's stick to the grid with jitter.
  
  // Row height approx 15%? matching col width.
  const rowHeight = 15; 
  // We want to fill from Top (0) to Bottom (100).
  // But if we have too many, they might overlap.
  // Let's just stack them in rows.
  
  // Add some jitter
  const r1 = random(index);
  const r2 = random(index + 1);
  const r3 = random(index + 2);

  const xJitter = (r1 - 0.5) * 10; // -5% to +5%
  const yJitter = (r2 - 0.5) * 10; // -5% to +5%
  
  // Loop rows if we exceed typical viewport, OR just let them cluster.
  // Let's try to fit 30-40 trees nicely?
  const maxRows = 6;
  const effectiveRow = row % maxRows;
  
  const yBase = 20 + (effectiveRow * rowHeight); // Start at 20% down to leave sky
  
  let x = xBase + xJitter;
  let y = yBase + yJitter;
  
  // Clamp
  x = Math.max(5, Math.min(95, x));
  y = Math.max(10, Math.min(90, y));

  // Scale based on Y (depth)
  // Higher Y (closer to 100) = Close to camera = Bigger
  // Lower Y (closer to 0) = Far away = Smaller
  const yPercent = (y - 10) / 80; // normalize roughly 0-1
  const scale = 0.6 + (yPercent * 0.6); // 0.6 to 1.2
  const zIndex = Math.floor(y * 10); // Lower trees overlap higher trees

  return { x, y, scale, zIndex };
};

export const getSessionProgress = (
  startTime: number | Date, 
  durationMinutes: number
): number => {
  if (!startTime) return 0;
  
  const start = new Date(startTime).getTime();
  const now = Date.now();
  const durationMs = durationMinutes * 60 * 1000;
  
  if (durationMs <= 0) return 0;
  
  const elapsed = now - start;
  const progress = Math.min(1, Math.max(0, elapsed / durationMs));
  
  return progress;
};
