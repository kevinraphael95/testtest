// player.js - Player entity, physics, inventory

class Player {
  constructor(world) {
    this.world = world;
    this.w = TILE * 0.8;
    this.h = TILE * 1.8;
    // Spawn above surface
    const sx = 0;
    const sy = world.getSurface(sx) - 3;
    this.x = sx * TILE;
    this.y = sy * TILE;
    this.vx = 0;
    this.vy = 0;
    this.onGround = false;
    this.health = 20;
    this.maxHealth = 20;

    // Inventory: 36 slots (hotbar = 0-8)
    this.inventory = new Array(36).fill(null);
    this.hotbarIdx = 0;

    // Mining state
    this.mining = { active: false, x: 0, y: 0, startTime: 0, progress: 0 };

    // Give starter items
    this._giveStarterItems();
  }

  _giveStarterItems() {
    this.addItem(B.WOOD, 32);
    this.addItem(B.DIRT, 32);
    this.addItem(B.PLANKS, 16);
    this.addItem(B.STONE, 16);
    this.addItem(B.TORCH, 8);
  }

  addItem(id, count = 1) {
    if (!id || id === B.AIR) return;
    // Try to stack
    for (let i = 0; i < 36; i++) {
      if (this.inventory[i] && this.inventory[i].id === id && this.inventory[i].count < 64) {
        const add = Math.min(count, 64 - this.inventory[i].count);
        this.inventory[i].count += add;
        count -= add;
        if (count <= 0) return;
      }
    }
    // Empty slot
    for (let i = 0; i < 36; i++) {
      if (!this.inventory[i]) {
        this.inventory[i] = { id, count: Math.min(count, 64) };
        count -= Math.min(count, 64);
        if (count <= 0) return;
      }
    }
  }

  removeItem(slot, count = 1) {
    if (!this.inventory[slot]) return;
    this.inventory[slot].count -= count;
    if (this.inventory[slot].count <= 0) this.inventory[slot] = null;
  }

  getHeldItem() {
    return this.inventory[this.hotbarIdx];
  }

  // Physics update
  update(keys) {
    // Horizontal movement
    this.vx = 0;
    if (keys['ArrowLeft'] || keys['q'] || keys['Q']) this.vx = -PLAYER_SPEED;
    if (keys['ArrowRight'] || keys['d'] || keys['D']) this.vx = PLAYER_SPEED;

    // Jump
    if ((keys['ArrowUp'] || keys['z'] || keys['Z'] || keys[' ']) && this.onGround) {
      this.vy = JUMP_FORCE;
      this.onGround = false;
    }

    // Gravity
    this.vy += GRAVITY;
    if (this.vy > 20) this.vy = 20;

    // Move X
    this.x += this.vx;
    this._resolveX();

    // Move Y
    this.y += this.vy;
    this._resolveY();


    // Fall damage (simplified)
    if (this.onGround && this.vy > 14) {
      this.health -= Math.floor((this.vy - 14) * 2);
    }
  }

  _resolveX() {
    const left = Math.floor(this.x / TILE);
    const right = Math.floor((this.x + this.w - 1) / TILE);
    const top = Math.floor(this.y / TILE);
    const bottom = Math.floor((this.y + this.h - 1) / TILE);

    for (let ty = top; ty <= bottom; ty++) {
      if (this.vx > 0 && this.world.isSolid(right, ty)) {
        this.x = right * TILE - this.w;
        this.vx = 0; break;
      }
      if (this.vx < 0 && this.world.isSolid(left, ty)) {
        this.x = (left + 1) * TILE;
        this.vx = 0; break;
      }
    }
  }

  _resolveY() {
    const left = Math.floor(this.x / TILE);
    const right = Math.floor((this.x + this.w - 1) / TILE);
    const top = Math.floor(this.y / TILE);
    const bottom = Math.floor((this.y + this.h - 1) / TILE);

    this.onGround = false;

    if (this.vy > 0) {
      // Falling down
      for (let tx = left; tx <= right; tx++) {
        if (this.world.isSolid(tx, bottom)) {
          this.y = bottom * TILE - this.h;
          this.vy = 0;
          this.onGround = true;
          break;
        }
      }
    } else if (this.vy < 0) {
      // Moving up
      for (let tx = left; tx <= right; tx++) {
        if (this.world.isSolid(tx, top)) {
          this.y = (top + 1) * TILE;
          this.vy = 0;
          break;
        }
      }
    }

    // Extra grounded check
    if (!this.onGround) {
      for (let tx = left; tx <= right; tx++) {
        if (this.world.isSolid(tx, bottom + 1)) {
          // Nearly on ground
        }
      }
    }
  }

  // Center position
  get cx() { return this.x + this.w / 2; }
  get cy() { return this.y + this.h / 2; }

  // Tile position of center
  get tx() { return Math.floor(this.cx / TILE); }
  get ty() { return Math.floor(this.cy / TILE); }

  startMining(wx, wy) {
    const bd = BLOCK_DATA[this.world.get(wx, wy)];
    if (!bd || bd.hardness <= 0) { this.mining.active = false; return; }
    if (this.mining.active && this.mining.x === wx && this.mining.y === wy) return;
    this.mining = { active: true, x: wx, y: wy, startTime: Date.now(), progress: 0 };
  }

  stopMining() {
    this.mining.active = false;
  }

  updateMining() {
    if (!this.mining.active) return null;
    const id = this.world.get(this.mining.x, this.mining.y);
    if (!id || id === B.AIR) { this.mining.active = false; return null; }
    const bd = BLOCK_DATA[id];
    if (!bd) return null;
    const elapsed = Date.now() - this.mining.startTime;
    const needed = bd.hardness * MINE_TIME;
    this.mining.progress = Math.min(1, elapsed / needed);
    if (this.mining.progress >= 1) {
      this.mining.active = false;
      return { x: this.mining.x, y: this.mining.y };
    }
    return null;
  }
}
