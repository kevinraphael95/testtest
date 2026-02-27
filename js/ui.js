// ui.js - HUD, hotbar, inventory UI

class UI {
  constructor(player) {
    this.player = player;
    this.hotbarEl = document.getElementById('hotbar');
    this.inventoryEl = document.getElementById('inventory-screen');
    this.inventoryGrid = document.getElementById('inventory-grid');
    this.healthEl = document.getElementById('health-display');
    this.tooltipEl = document.getElementById('tooltip');
    this.invOpen = false;

    this._buildHotbar();
    this._setupInventory();
  }

  _buildHotbar() {
    this.hotbarEl.innerHTML = '';
    this.slotEls = [];
    for (let i = 0; i < 9; i++) {
      const slot = document.createElement('div');
      slot.className = 'hotbar-slot';
      if (i === this.player.hotbarIdx) slot.classList.add('active');
      slot.addEventListener('click', () => {
        this.player.hotbarIdx = i;
        this.updateHotbar();
      });
      this.hotbarEl.appendChild(slot);
      this.slotEls.push(slot);
    }
  }

  updateHotbar() {
    for (let i = 0; i < 9; i++) {
      const slot = this.slotEls[i];
      slot.classList.toggle('active', i === this.player.hotbarIdx);
      slot.innerHTML = '';
      const item = this.player.inventory[i];
      if (item && item.id !== B.AIR) {
        const icon = getBlockIcon(item.id, 36);
        slot.appendChild(icon);
        if (item.count > 1) {
          const cnt = document.createElement('span');
          cnt.className = 'slot-count';
          cnt.textContent = item.count;
          slot.appendChild(cnt);
        }
      }
    }
    this.updateHealth();
  }

  updateHealth() {
    const { health, maxHealth } = this.player;
    const hearts = Math.ceil(health / 2);
    const maxHearts = Math.ceil(maxHealth / 2);
    let str = '';
    for (let i = 0; i < maxHearts; i++) {
      if (i < hearts) str += '❤';
      else str += '♡';
    }
    this.healthEl.textContent = str;
  }

  _setupInventory() {
    const closeBtn = document.getElementById('btn-close-inv');
    closeBtn.addEventListener('click', () => this.closeInventory());
    this.inventoryEl.addEventListener('click', (e) => {
      if (e.target === this.inventoryEl) this.closeInventory();
    });
  }

  openInventory() {
    this.invOpen = true;
    this.inventoryEl.classList.add('open');
    this._renderInventory();
  }

  closeInventory() {
    this.invOpen = false;
    this.inventoryEl.classList.remove('open');
  }

  toggleInventory() {
    if (this.invOpen) this.closeInventory();
    else this.openInventory();
  }

  _renderInventory() {
    this.inventoryGrid.innerHTML = '';
    for (let i = 0; i < 36; i++) {
      const slot = document.createElement('div');
      slot.className = 'inv-slot';
      const item = this.player.inventory[i];
      if (item && item.id !== B.AIR) {
        const icon = getBlockIcon(item.id, 36);
        slot.appendChild(icon);
        const bd = BLOCK_DATA[item.id];
        slot.title = (bd ? bd.name : '?') + ` x${item.count}`;
        if (item.count > 1) {
          const cnt = document.createElement('span');
          cnt.className = 'slot-count';
          cnt.textContent = item.count;
          slot.appendChild(cnt);
        }
      }
      slot.addEventListener('mouseenter', (e) => {
        if (item && item.id) {
          const bd = BLOCK_DATA[item.id];
          this.showTooltip(bd ? bd.name : '?', e.clientX, e.clientY);
        }
      });
      slot.addEventListener('mouseleave', () => this.hideTooltip());
      this.inventoryGrid.appendChild(slot);
    }
  }

  showTooltip(text, x, y) {
    this.tooltipEl.style.display = 'block';
    this.tooltipEl.textContent = text;
    this.tooltipEl.style.left = (x + 12) + 'px';
    this.tooltipEl.style.top  = (y + 12) + 'px';
  }

  hideTooltip() {
    this.tooltipEl.style.display = 'none';
  }

  showBlockTooltip(id, x, y) {
    if (!id || id === B.AIR) { this.hideTooltip(); return; }
    const bd = BLOCK_DATA[id];
    if (!bd) return;
    this.showTooltip(bd.name, x, y);
  }
}
