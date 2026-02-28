// game.js - Main game controller

class Game {
  constructor() {
    this.canvas     = document.getElementById('game-canvas');
    this.world      = null;
    this.player     = null;
    this.renderer   = null;
    this.ui         = null;
    this.craftUI    = null;
    this.mp         = null;
    this.keys       = {};
    this.mouse      = { x: 0, y: 0, left: false, right: false };
    this.mouseWorld = null;
    this.running    = false;
    this.lastTime   = 0;
    this.REACH      = 6;

    this._bindMenuEvents();
  }

  _bindMenuEvents() {
    // Solo
    document.getElementById('btn-solo').addEventListener('click', () => {
      this.startGame(false);
    });

    // Multijoueur → aller à l'écran multi
    document.getElementById('btn-multi').addEventListener('click', () => {
      document.getElementById('screen-main-menu').classList.remove('active');
      document.getElementById('screen-multi').classList.add('active');
    });

    // Retour menu depuis écran multi
    document.getElementById('btn-back-menu').addEventListener('click', () => {
      document.getElementById('screen-multi').classList.remove('active');
      document.getElementById('screen-main-menu').classList.add('active');
    });

    // Rejoindre en multi
    document.getElementById('btn-join-multi').addEventListener('click', () => {
      const url    = document.getElementById('input-url').value.trim();
      const key    = document.getElementById('input-key').value.trim();
      const pseudo = document.getElementById('input-pseudo').value.trim() || 'Joueur';

      if (!url || !key) {
        document.getElementById('multi-config-status').textContent = '⚠ Remplis URL et Key !';
        document.getElementById('multi-config-status').style.borderColor = '#f44';
        return;
      }
      document.getElementById('multi-config-status').textContent = '⏳ Connexion...';
      this.startGame(true, { url, key, pseudo });
    });

    // Contrôles
    document.getElementById('btn-controls').addEventListener('click', () => {
      document.getElementById('controls-panel').classList.toggle('hidden');
    });

    // Afficher les étapes de setup
    document.getElementById('btn-show-steps').addEventListener('click', () => {
      document.getElementById('multi-steps').classList.toggle('hidden');
    });

    // Copier le SQL
    document.getElementById('btn-copy-sql').addEventListener('click', () => {
      const sql = `create table blocks (
  key text primary key,
  id integer not null,
  updated_at timestamptz default now()
);
alter table blocks enable row level security;
create policy "pub read"   on blocks for select using (true);
create policy "pub write"  on blocks for insert with check (true);
create policy "pub update" on blocks for update using (true);
create policy "pub delete" on blocks for delete using (true);`;
      navigator.clipboard.writeText(sql).then(() => {
        document.getElementById('btn-copy-sql').textContent = '✅ Copié !';
        setTimeout(() => document.getElementById('btn-copy-sql').textContent = '📋 Copier le SQL', 2000);
      });
    });
  }

  startGame(multi = false, mpConfig = null) {
    document.getElementById('screen-main-menu').classList.remove('active');
    document.getElementById('screen-multi').classList.remove('active');
    document.getElementById('screen-game').classList.add('active');

    // Pre-fill from config.js if available
    if (window.CONFIG?.SUPABASE_URL) {
      const urlEl = document.getElementById('input-url');
      const keyEl = document.getElementById('input-key');
      if (urlEl && !urlEl.value) urlEl.value = CONFIG.SUPABASE_URL;
      if (keyEl && !keyEl.value) keyEl.value = CONFIG.SUPABASE_KEY;
    }
    // Double rAF: first paints the screen, second reads correct dimensions
    requestAnimationFrame(() => requestAnimationFrame(() => {
      this.world    = new World();
      this.player   = new Player(this.world);
      this.renderer = new Renderer(this.canvas);
      this.ui       = new UI(this.player);
      this.craftUI  = new CraftingUI(this.player, this.ui);

      // Multiplayer
      if (multi && mpConfig) {
        this.mp = new MultiplayerSync(this.world, mpConfig);
      } else {
        this.mp = new MultiplayerSync(this.world, null); // solo mode
      }

      this.renderer.scale = Math.max(1, Math.floor(window.innerHeight / (TILE * 15)));
      this.renderer.resize();

      // Snap camera to player
      const cx  = this.player.cx - this.renderer.vw / (2 * this.renderer.scale);
      const cy  = this.player.cy - this.renderer.vh / (2 * this.renderer.scale);
      const maxY = WORLD_H * TILE - this.renderer.vh / this.renderer.scale;
      this.renderer.camX = cx;
      this.renderer.camY = Math.max(0, Math.min(maxY, cy));

      this._bindInputs();
      this.running  = true;
      this.lastTime = performance.now();
      this._loop(this.lastTime);
      this.ui.updateHotbar();
    }));
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
      if (e.button === 0) this.mouse.left = true;
      if (e.button === 2) this._onRightClick();
      e.preventDefault();
    });

    this.canvas.addEventListener('mouseup', (e) => {
      if (e.button === 0) { this.mouse.left = false; this.player.stopMining(); }
      if (e.button === 2) this.mouse.right = false;
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
    if (!this.mouseWorld || this.ui.invOpen) return;
    const tx = Math.floor(this.mouseWorld.wx / TILE);
    const ty = Math.floor(this.mouseWorld.wy / TILE);
    if (this.world.get(tx, ty) === B.CRAFTING && this._inReach(tx, ty)) {
      this.craftUI.openUI();
      return;
    }
    this._placeBlock();
  }

  _loop(now) {
    if (!this.running) return;
    const dt = Math.min((now - this.lastTime) / 1000, 0.05);
    this.lastTime = now;
    this._update();
    this._render();
    requestAnimationFrame(t => this._loop(t));
  }

  _update() {
    if (this.ui.invOpen) return;

    this.player.update(this.keys);
    this.world.ensureLoaded(this.player.cx / TILE);
    this.world.tickGravity();

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
          this.world.scheduleGravity(mined.x, mined.y - 1);
          this.mp.syncBlock(mined.x, mined.y, B.AIR);
        }
      } else {
        this.player.stopMining();
      }
    }

    // Tooltip
    if (this.mouseWorld && !this.ui.invOpen) {
      const tx = Math.floor(this.mouseWorld.wx / TILE);
      const ty = Math.floor(this.mouseWorld.wy / TILE);
      this.ui.showBlockTooltip(this.world.get(tx, ty), this.mouse.x, this.mouse.y);
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
    const bd = BLOCK_DATA[held.id];
    if (!bd || (!bd.solid && held.id !== B.TORCH && held.id !== B.CRAFTING && held.id !== B.FURNACE)) return;
    if (this._overlapsPlayer(tx, ty)) return;

    if (this.world.place(tx, ty, held.id)) {
      this.player.removeItem(this.player.hotbarIdx, 1);
      this.ui.updateHotbar();
      this.world.scheduleGravity(tx, ty);
      this.mp.syncBlock(tx, ty, held.id);
    }
  }

  _overlapsPlayer(tx, ty) {
    const { x, y, w, h } = this.player;
    return x < (tx+1)*TILE && x+w > tx*TILE && y < (ty+1)*TILE && y+h > ty*TILE;
  }

  _inReach(tx, ty) {
    const dx = tx - this.player.tx, dy = ty - this.player.ty;
    return Math.sqrt(dx*dx + dy*dy) <= this.REACH;
  }

  _render() {
    this.renderer.render(this.world, this.player, this.ui.invOpen ? null : this.mouseWorld);
    this.ui.updateHealth();
  }
}

document.addEventListener('DOMContentLoaded', () => { window.game = new Game(); });
