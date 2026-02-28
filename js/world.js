// world.js - Infinite world using chunk system

class Chunk {
  constructor(cx, seed) {
    this.cx = cx;           // chunk X index
    this.seed = seed;
    this.tiles = new Uint8Array(CHUNK_W * WORLD_H);
    this._generate();
  }

  idx(lx, y) { return y * CHUNK_W + lx; }
  get(lx, y) { return this.tiles[this.idx(lx, y)]; }
  set(lx, y, id) { this.tiles[this.idx(lx, y)] = id; }

  _noise(x) {
    // Deterministic pseudo-random based on world seed + position
    const s = this.seed;
    const n1 = Math.sin(x * 0.04 + s * 0.1 + 1.3) * 5;
    const n2 = Math.sin(x * 0.09 + s * 0.07 + 2.7) * 3;
    const n3 = Math.sin(x * 0.22 + s * 0.13 + 0.9) * 2;
    const n4 = Math.sin(x * 0.5  + s * 0.19 + 5.1) * 1;
    return Math.round(SEA_LEVEL - 6 + n1 + n2 + n3 + n4);
  }

  _surfaceAt(wx) {
    return Math.max(5, Math.min(WORLD_H - 10, this._noise(wx)));
  }

  _caveAt(wx, y) {
    const v1 = Math.sin(wx * 0.3 + y * 0.2 + this.seed) * Math.cos(wx * 0.1 - y * 0.35);
    const v2 = Math.sin(wx * 0.15 - y * 0.1 + 3 + this.seed * 0.5) * Math.cos(wx * 0.25 + y * 0.18 + 1);
    return (v1 * v2 > 0.18);
  }

  _rng(wx, y) {
    // Deterministic per-tile random [0,1)
    let h = (wx * 374761393 + y * 1000003 + this.seed * 2246822519) >>> 0;
    h ^= h >>> 15; h = Math.imul(h, 2246822519); h ^= h >>> 13;
    h = Math.imul(h, 3266489917); h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  }

  _generate() {
    const startWX = this.cx * CHUNK_W;
    // Heights for whole chunk
    const heights = [];
    for (let lx = 0; lx < CHUNK_W; lx++) heights.push(this._surfaceAt(startWX + lx));

    for (let lx = 0; lx < CHUNK_W; lx++) {
      const wx = startWX + lx;
      const surface = heights[lx];

      for (let y = 0; y < WORLD_H; y++) {
        let id = B.AIR;

        if (y >= WORLD_H - 1) {
          id = B.BEDROCK;
        } else if (y > surface) {
          if (this._caveAt(wx, y) && y < WORLD_H - 3) {
            id = B.AIR;
          } else if (y <= surface + 3) {
            id = B.DIRT;
          } else {
            const r = this._rng(wx, y);
            id = B.STONE;
            if      (y > surface + 25 && r < 0.006) id = B.DIAMOND;
            else if (y > surface + 15 && r < 0.015) id = B.GOLD;
            else if (y > surface + 6  && r < 0.03)  id = B.IRON;
            else if (r < 0.04) id = B.COAL;
          }
        } else if (y === surface) {
          id = B.GRASS;
        }

        this.set(lx, y, id);
      }

      // Beach (sand near sea level)
      if (surface >= SEA_LEVEL - 2 && surface <= SEA_LEVEL + 2) {
        for (let y = surface; y <= Math.min(surface + 4, WORLD_H - 2); y++) this.set(lx, y, B.SAND);
      }
    }

    // Gravel patches
    for (let lx = 1; lx < CHUNK_W - 1; lx++) {
      const wx = startWX + lx;
      const r = this._rng(wx, 999);
      if (r < 0.04) {
        const gy = heights[lx] + 2 + Math.floor(this._rng(wx, 998) * 6);
        if (this.get(lx, gy) === B.STONE) {
          for (let dx = -1; dx <= 1; dx++)
            for (let dy = -1; dy <= 1; dy++) {
              const nlx = lx + dx;
              if (nlx >= 0 && nlx < CHUNK_W && this._rng(wx + dx, gy + dy + 500) < 0.6)
                this.set(nlx, gy + dy, B.GRAVEL);
            }
        }
      }
    }

    // Trees (only place trunk+base here; leaves may extend into adjacent chunk)
    for (let lx = 2; lx < CHUNK_W - 2; lx++) {
      const wx = startWX + lx;
      const surface = heights[lx];
      if (surface < SEA_LEVEL - 2 && this._rng(wx, 777) < 0.06) {
        this._placeTree(lx, surface);
      }
    }
  }

  _placeTree(lx, surfaceY) {
    const trunkH = 4 + Math.floor(this._rng(this.cx * CHUNK_W + lx, 111) * 3);
    for (let i = 1; i <= trunkH; i++) {
      if (surfaceY - i >= 0) this.set(lx, surfaceY - i, B.WOOD);
    }
    const topY = surfaceY - trunkH;
    const radius = 2;
    for (let dy = -2; dy <= 1; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const dist = Math.abs(dx) + Math.abs(dy);
        if (dist <= radius + (dy < 0 ? 1 : 0) && !(dx === 0 && dy >= 0)) {
          const nlx = lx + dx;
          const ny  = topY + dy;
          if (nlx >= 0 && nlx < CHUNK_W && ny >= 0 && ny < WORLD_H) {
            if (this.get(nlx, ny) === B.AIR) this.set(nlx, ny, B.LEAVES);
          }
        }
      }
    }
  }
}

// ---- World ----
class World {
  constructor() {
    this.seed   = Math.floor(Math.random() * 100000);
    this.chunks = new Map();  // key: chunk X index
    this._modifications = new Map(); // key: "wx,y" => block id (player edits override gen)
    this._gravityPending = new Set();
    // Pre-generate around spawn
    for (let cx = -4; cx <= 4; cx++) this._loadChunk(cx);
  }

  _chunkKey(cx) { return cx; }

  _loadChunk(cx) {
    if (!this.chunks.has(cx)) {
      const chunk = new Chunk(cx, this.seed);
      this.chunks.set(cx, chunk);
    }
    return this.chunks.get(cx);
  }

  _getChunkAndLocal(wx) {
    const cx  = Math.floor(wx / CHUNK_W);
    const lx  = ((wx % CHUNK_W) + CHUNK_W) % CHUNK_W;
    return { cx, lx };
  }

  get(wx, y) {
    if (y < 0 || y >= WORLD_H) return B.BEDROCK;
    // Check modifications first
    const key = `${wx},${y}`;
    if (this._modifications.has(key)) return this._modifications.get(key);
    // Then chunk
    const { cx, lx } = this._getChunkAndLocal(wx);
    const chunk = this._loadChunk(cx);
    return chunk.get(lx, y);
  }

  set(wx, y, id) {
    if (y < 0 || y >= WORLD_H) return;
    const key = `${wx},${y}`;
    this._modifications.set(key, id);
    // Also update chunk data for consistency
    const { cx, lx } = this._getChunkAndLocal(wx);
    const chunk = this._loadChunk(cx);
    chunk.set(lx, y, id);
  }

  isSolid(wx, y) {
    const id = this.get(wx, y);
    return BLOCK_DATA[id] && BLOCK_DATA[id].solid;
  }

  getSurface(wx) {
    // Load chunk if needed
    const { cx } = this._getChunkAndLocal(wx);
    this._loadChunk(cx);
    for (let y = 0; y < WORLD_H; y++) {
      if (this.isSolid(wx, y)) return y;
    }
    return WORLD_H - 1;
  }

  mine(wx, y) {
    const id = this.get(wx, y);
    if (!id || id === B.BEDROCK) return null;
    const data = BLOCK_DATA[id];
    if (!data) return null;
    const drop = data.drops !== undefined ? data.drops : id;
    this.set(wx, y, B.AIR);
    return drop;
  }

  place(wx, y, id) {
    if (this.get(wx, y) !== B.AIR) return false;
    this.set(wx, y, id);
    return true;
  }


  // ---- Gravity (sand, gravel) ----
  scheduleGravity(wx, y) {
    if (y < 0 || y >= WORLD_H) return;
    const id = this.get(wx, y);
    if (id === B.SAND || id === B.GRAVEL) {
      this._gravityPending.add(`${wx},${y}`);
    }
  }

  tickGravity() {
    if (!this._gravityPending) this._gravityPending = new Set();
    if (this._gravityPending.size === 0) return;
    const toProcess = [...this._gravityPending];
    this._gravityPending.clear();
    for (const key of toProcess) {
      const [wx, y] = key.split(',').map(Number);
      const id = this.get(wx, y);
      if (id !== B.SAND && id !== B.GRAVEL) continue;
      if (y + 1 >= WORLD_H) continue;
      if (this.get(wx, y + 1) === B.AIR) {
        this.set(wx, y + 1, id);
        this.set(wx, y, B.AIR);
        this._gravityPending.add(`${wx},${y + 1}`);
      }
    }
  }

  // Ensure chunks are loaded around a world X position
  ensureLoaded(centerWX) {
    const cx = Math.floor(centerWX / CHUNK_W);
    for (let dcx = -RENDER_DIST; dcx <= RENDER_DIST; dcx++) {
      this._loadChunk(cx + dcx);
    }
  }
}
