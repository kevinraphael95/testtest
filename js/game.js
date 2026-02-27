// game.js - Main game controller, input, loop

class Game {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.world    = null;
    this.player   = null;
    this.renderer = null;
    this.ui       = null;
    this.craftUI  = null;
    this.keys     = {};
    this.mouse    = { x: 0, y: 0, left: false, right: false };
    this.mouseWorld = null;
    this.running  = false;
    this.lastTime = 0;
    this.frameId  = null;
    this.REACH    = 6;

    this._bindMenuEvents();
  }

  _bindMenuEvents() {
    document.getElementById('btn-play').addEventListener('click', () => this.startGame());
    document.getElementById('btn-controls').addEventListener('click', () => {
      document.getElementById('controls-panel').classList.toggle('hidden');
    });
  }

  startGame() {
    document.getElementById('screen-main-menu').classList.remove('active');
    document.getElementById('screen-game').classList.add('active');

    // Use rAF so DOM is painted before we read dimensions
    requestAnimationFrame(() => {
      this.world    = new World();
      this.player   = new Player(this.world);
      this.renderer = new Renderer(this.canvas);
      this.ui       = new UI(this.player);
      this.craftUI  = new CraftingUI(this.player, this.ui);

      this.renderer.scale = Math.max(1, Math.floor(window.innerHeight / (TILE * 15)));
      this.renderer.resize();

      // Snap camera to player immediately (no lag)
      const cx = this.player.cx - this.renderer.vw / (2 * this.renderer.scale);
      const cy = this.player.cy - this.renderer.vh / (2 * this.renderer.scale);
      const maxY = WORLD_H * TILE - this.renderer.vh / this.renderer.scale;
      this.renderer.camX = cx;
      this.renderer.camY = Math.max(0, Math.min(maxY, cy));

      this._bindInputs();
      this.running = true;
      this.lastTime = performance.now();
      this._loop(this.lastTime);
      this.ui.updateHotbar();
    });
  }

  _bindInputs() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.key] = true;

      if (e.key >= '1' && e.key <= '9') {
        this.player.hotbarIdx = parseInt(e.key) - 1;
        this.ui.updateHotbar();
      }

      if (e.key === 'e' || e.key === 'E') {
        if (this.craftUI.open) this.craftUI.close();
        else this.ui.toggleInventory();
      }
      // C = open crafting directly
      if (e.key === 'c' || e.key === 'C') {
        if (this.craftUI.open) this.craftUI.close();
        else { this.ui.closeInventory(); this.craftUI.openUI(); }
      }

      if (e.key === 'Escape') {
        if (this.craftUI.open) this.craftUI.close();
        else if (this.ui.invOpen) this.ui.closeInventory();
      }

      if ([' ', 'ArrowUp', 'ArrowDown'].includes(e.key)) e.preventDefault();
    });

    window.addEventListener('keyup', (e) => { this.keys[e.key] = false; });

    this.canvas.addEventListener('mousemove', (e) => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
      this.mouseWorld = this.renderer.screenToWorld(e.clientX, e.clientY);
    });

    this.canvas.addEventListener('mousedown', (e) => {
      if (this.ui.invOpen) return;
      if (e.button === 0) { this.mouse.left = true; }
      if (e.button === 2) { this._onRightClick(); }
      e.preventDefault();
    });

    this.canvas.addEventListener('mouseup', (e) => {
      if (e.button === 0) { this.mouse.left = false; this.player.stopMining(); }
      if (e.button === 2) { this.mouse.right = false; }
    });

    this.canvas.addEventListener('contextmenu', e => e.preventDefault());

    this.canvas.addEventListener('wheel', (e) => {
      const dir = e.deltaY > 0 ? 1 : -1;
      this.player.hotbarIdx = ((this.player.hotbarIdx + dir) + 9) % 9;
      this.ui.updateHotbar();
      e.preventDefault();
    }, { passive: false });
  }

  _onRightClick() {
    if (!this.mouseWorld) return;
    const tx = Math.floor(this.mouseWorld.wx / TILE);
    const ty = Math.floor(this.mouseWorld.wy / TILE);
    const id = this.world.get(tx, ty);

    // Open crafting table
    if (id === B.CRAFTING && this._inReach(tx, ty)) {
      this.craftUI.openUI();
      return;
    }

    // Otherwise place block
    this._placeBlock();
  }

  _loop(now) {
    if (!this.running) return;
    const dt = Math.min((now - this.lastTime) / 1000, 0.05);
    this.lastTime = now;
    this._update(dt);
    this._render();
    this.frameId = requestAnimationFrame(t => this._loop(t));
  }

  _update(dt) {
    if (this.ui.invOpen) return;

    this.player.update(this.keys);

    // Ensure chunks are loaded ahead of player
    this.world.ensureLoaded(this.player.cx / TILE);

    // Mining
    if (this.mouse.left && this.mouseWorld) {
      const tx = Math.floor(this.mouseWorld.wx / TILE);
      const ty = Math.floor(this.mouseWorld.wy / TILE);
      if (this._inReach(tx, ty)) {
        this.player.startMining(tx, ty);
        const mined = this.player.updateMining();
        if (mined) {
          const drop = this.world.mine(mined.x, mined.y);
          if (drop && drop !== B.AIR) {
            this.player.addItem(drop, 1);
            this.ui.updateHotbar();
          }
        }
      } else {
        this.player.stopMining();
      }
    }

    // Tooltip
    if (this.mouseWorld && !this.ui.invOpen) {
      const tx = Math.floor(this.mouseWorld.wx / TILE);
      const ty = Math.floor(this.mouseWorld.wy / TILE);
      const id = this.world.get(tx, ty);
      this.ui.showBlockTooltip(id, this.mouse.x, this.mouse.y);
    }

    this.renderer.updateCamera(this.player);
  }

  _placeBlock() {
    if (!this.mouseWorld) return;
    const tx = Math.floor(this.mouseWorld.wx / TILE);
    const ty = Math.floor(this.mouseWorld.wy / TILE);
    if (!this._inReach(tx, ty)) return;

    const held = this.player.getHeldItem();
    if (!held) return;

    // Only place "block" items (solid or torch)
    const bd = BLOCK_DATA[held.id];
    if (!bd || (!bd.solid && held.id !== B.TORCH && held.id !== B.CRAFTING && held.id !== B.FURNACE)) return;

    if (this._overlapsPlayer(tx, ty)) return;

    if (this.world.place(tx, ty, held.id)) {
      this.player.removeItem(this.player.hotbarIdx, 1);
      this.ui.updateHotbar();
    }
  }

  _overlapsPlayer(tx, ty) {
    const { x, y, w, h } = this.player;
    const bx1 = tx * TILE, by1 = ty * TILE;
    return x < bx1 + TILE && x + w > bx1 && y < by1 + TILE && y + h > by1;
  }

  _inReach(tx, ty) {
    const dx = tx - this.player.tx;
    const dy = ty - this.player.ty;
    return Math.sqrt(dx*dx + dy*dy) <= this.REACH;
  }

  _render() {
    this.renderer.render(this.world, this.player, this.ui.invOpen ? null : this.mouseWorld);
    this.ui.updateHealth();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.game = new Game();
});
