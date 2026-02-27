// renderer.js - Canvas rendering engine

class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.camX = 0;
    this.camY = 0;
    this.scale = 1;

    // Cache for block textures
    this.blockCache = new Map();

    // Lighting (simple)
    this.lightMap = null;

    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    this.canvas.width  = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.vw = this.canvas.width;
    this.vh = this.canvas.height;
  }

  // Convert world coords to screen
  worldToScreen(wx, wy) {
    return {
      sx: (wx - this.camX) * this.scale,
      sy: (wy - this.camY) * this.scale
    };
  }

  screenToWorld(sx, sy) {
    return {
      wx: sx / this.scale + this.camX,
      wy: sy / this.scale + this.camY,
    };
  }

  // Get or generate cached block texture
  _getBlockTex(id, size) {
    const key = `${id}_${size}`;
    if (this.blockCache.has(key)) {
      // Animated blocks always redraw
      if (id === B.WATER || id === B.LAVA || id === B.TORCH) {
        this.blockCache.delete(key);
      } else {
        return this.blockCache.get(key);
      }
    }
    const c = document.createElement('canvas');
    c.width = size; c.height = size;
    drawBlock(c.getContext('2d'), id, 0, 0, size);
    this.blockCache.set(key, c);
    return c;
  }

  // Follow player
  updateCamera(player) {
    const targetX = player.cx - this.vw / (2 * this.scale);
    const targetY = player.cy - this.vh / (2 * this.scale);

    // Clamp
    const maxX = WORLD_W * TILE - this.vw / this.scale;
    const maxY = WORLD_H * TILE - this.vh / this.scale;

    this.camX = Math.max(0, Math.min(maxX, targetX));
    this.camY = Math.max(0, Math.min(maxY, targetY));

    // Smooth
    this.camX += (targetX - this.camX) * 0.15;
    this.camY += (targetY - this.camY) * 0.15;
  }

  render(world, player, mouseWorld) {
    const ctx = this.ctx;
    const ts = TILE * this.scale;

    ctx.clearRect(0, 0, this.vw, this.vh);

    // Sky gradient
    this._drawSky(ctx);

    // Tiles
    const startX = Math.max(0, Math.floor(this.camX / TILE));
    const endX   = Math.min(WORLD_W - 1, Math.ceil((this.camX + this.vw / this.scale) / TILE));
    const startY = Math.max(0, Math.floor(this.camY / TILE));
    const endY   = Math.min(WORLD_H - 1, Math.ceil((this.camY + this.vh / this.scale) / TILE));

    ctx.save();
    ctx.scale(this.scale, this.scale);
    ctx.translate(-this.camX, -this.camY);

    for (let y = startY; y <= endY; y++) {
      for (let x = startX; x <= endX; x++) {
        const id = world.get(x, y);
        if (id === B.AIR) continue;

        const bx = x * TILE;
        const by = y * TILE;

        const tex = this._getBlockTex(id, TILE);
        ctx.drawImage(tex, bx, by, TILE, TILE);

        // Shading for depth (blocks below surface get darker)
        if (id !== B.AIR) {
          const depth = y - 40;
          if (depth > 0) {
            const alpha = Math.min(0.6, depth * 0.012);
            ctx.fillStyle = `rgba(0,0,0,${alpha})`;
            ctx.fillRect(bx, by, TILE, TILE);
          }
        }
      }
    }

    // Mining progress overlay
    if (player.mining.active) {
      const { x: mx, y: my, progress } = player.mining;
      if (mx >= startX && mx <= endX && my >= startY && my <= endY) {
        ctx.fillStyle = `rgba(0,0,0,${progress * 0.7})`;
        ctx.fillRect(mx * TILE, my * TILE, TILE, TILE);
        // Crack lines
        ctx.strokeStyle = `rgba(0,0,0,${progress})`;
        ctx.lineWidth = 2;
        for (let i = 0; i < Math.floor(progress * 5); i++) {
          const angle = (i / 5) * Math.PI * 2;
          ctx.beginPath();
          ctx.moveTo(mx * TILE + TILE/2, my * TILE + TILE/2);
          ctx.lineTo(
            mx * TILE + TILE/2 + Math.cos(angle) * TILE * 0.4,
            my * TILE + TILE/2 + Math.sin(angle) * TILE * 0.4
          );
          ctx.stroke();
        }
      }
    }

    // Hover highlight
    if (mouseWorld) {
      const hx = Math.floor(mouseWorld.wx / TILE);
      const hy = Math.floor(mouseWorld.wy / TILE);
      if (world.get(hx, hy) !== B.AIR) {
        ctx.strokeStyle = 'rgba(255,255,255,0.5)';
        ctx.lineWidth = 2;
        ctx.strokeRect(hx * TILE + 1, hy * TILE + 1, TILE - 2, TILE - 2);
      }
    }

    // Player
    this._drawPlayer(ctx, player);

    ctx.restore();

    // Crosshair
    ctx.strokeStyle = 'rgba(255,255,255,0.8)';
    ctx.lineWidth = 2;
    const cx = this.vw/2, cy = this.vh/2;
    ctx.beginPath();
    ctx.moveTo(cx-10, cy); ctx.lineTo(cx+10, cy);
    ctx.moveTo(cx, cy-10); ctx.lineTo(cx, cy+10);
    ctx.stroke();
  }

  _drawSky(ctx) {
    const grad = ctx.createLinearGradient(0, 0, 0, this.vh);
    grad.addColorStop(0, '#1a6db5');
    grad.addColorStop(0.6, '#4fc3f7');
    grad.addColorStop(1, '#b2ebf2');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, this.vw, this.vh);

    // Sun
    const sunScreenY = (30 * TILE - this.camY) * this.scale;
    if (sunScreenY > -50 && sunScreenY < this.vh + 50) {
      const sunX = this.vw * 0.8;
      ctx.fillStyle = '#fff9c4';
      ctx.beginPath();
      ctx.arc(sunX, sunScreenY, 28, 0, Math.PI*2);
      ctx.fill();
      ctx.fillStyle = '#fff176';
      ctx.beginPath();
      ctx.arc(sunX, sunScreenY, 20, 0, Math.PI*2);
      ctx.fill();
    }

    // Underground transition
    const underY = (SEA_LEVEL * TILE - this.camY) * this.scale;
    if (underY < this.vh) {
      const darkGrad = ctx.createLinearGradient(0, Math.max(0, underY), 0, Math.min(this.vh, underY + 100));
      darkGrad.addColorStop(0, 'rgba(0,0,0,0)');
      darkGrad.addColorStop(1, 'rgba(0,0,0,0.85)');
      ctx.fillStyle = darkGrad;
      ctx.fillRect(0, Math.max(0, underY), this.vw, this.vh - Math.max(0, underY));
    }
  }

  _drawPlayer(ctx, player) {
    const { x, y, w, h } = player;

    // Body (Steve-like pixel art)
    // Head
    ctx.fillStyle = '#FFCC80';
    ctx.fillRect(x + w*0.15, y, w*0.7, h*0.35);
    // Eyes
    ctx.fillStyle = '#333';
    ctx.fillRect(x + w*0.25, y + h*0.1, w*0.15, h*0.1);
    ctx.fillRect(x + w*0.6, y + h*0.1, w*0.15, h*0.1);
    // Hair
    ctx.fillStyle = '#5D4037';
    ctx.fillRect(x + w*0.15, y, w*0.7, h*0.07);
    ctx.fillRect(x + w*0.15, y, w*0.08, h*0.15);

    // Body
    ctx.fillStyle = '#1565C0';
    ctx.fillRect(x + w*0.1, y + h*0.35, w*0.8, h*0.4);
    // Shirt detail
    ctx.fillStyle = '#1976D2';
    ctx.fillRect(x + w*0.2, y + h*0.38, w*0.6, h*0.05);

    // Legs
    ctx.fillStyle = '#4E342E';
    ctx.fillRect(x + w*0.1,  y + h*0.75, w*0.35, h*0.25);
    ctx.fillRect(x + w*0.55, y + h*0.75, w*0.35, h*0.25);

    // Arms
    ctx.fillStyle = '#1565C0';
    ctx.fillRect(x - w*0.1, y + h*0.35, w*0.2, h*0.35);
    ctx.fillRect(x + w*0.9, y + h*0.35, w*0.2, h*0.35);

    // Held item (right arm)
    const held = player.getHeldItem();
    if (held) {
      const icon = getBlockIcon(held.id, 20);
      ctx.drawImage(icon, x + w*0.9, y + h*0.5, 20, 20);
    }
  }
}
