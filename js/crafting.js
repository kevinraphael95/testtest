// crafting.js - Crafting system

// ---- Recipes ----
// pattern: 3x3 array of block IDs (0 = empty)
const RECIPES = [
  { name:'Planches x4',    result:{id:B.PLANKS,    count:4},  pattern:[[0,0,0],[0,B.WOOD,0],[0,0,0]] },
  { name:'Bâtons x4',      result:{id:B.STICK,     count:4},  pattern:[[0,B.PLANKS,0],[0,B.PLANKS,0],[0,0,0]] },
  { name:'Table de craft', result:{id:B.CRAFTING,  count:1},  pattern:[[0,0,0],[0,B.PLANKS,B.PLANKS],[0,B.PLANKS,B.PLANKS]] },
  { name:'Torche x4',      result:{id:B.TORCH,     count:4},  pattern:[[0,0,0],[0,B.COAL,0],[0,B.STICK,0]] },
  { name:'Verre x1',       result:{id:B.GLASS,     count:1},  pattern:[[0,0,0],[0,B.SAND,0],[0,0,0]] },
  { name:'Fourneau',       result:{id:B.FURNACE,   count:1},  pattern:[[B.STONE,B.STONE,B.STONE],[B.STONE,0,B.STONE],[B.STONE,B.STONE,B.STONE]] },
  { name:'Pioche bois',    result:{id:B.WOOD_PICK, count:1},  pattern:[[B.PLANKS,B.PLANKS,B.PLANKS],[0,B.STICK,0],[0,B.STICK,0]] },
  { name:'Pioche pierre',  result:{id:B.STONE_PICK,count:1},  pattern:[[B.STONE,B.STONE,B.STONE],[0,B.STICK,0],[0,B.STICK,0]] },
  { name:'Pioche fer',     result:{id:B.IRON_PICK, count:1},  pattern:[[B.IRON_INGOT,B.IRON_INGOT,B.IRON_INGOT],[0,B.STICK,0],[0,B.STICK,0]] },
  { name:'Hache bois',     result:{id:B.WOOD_AXE,  count:1},  pattern:[[B.PLANKS,B.PLANKS,0],[B.PLANKS,B.STICK,0],[0,B.STICK,0]] },
  { name:'Hache pierre',   result:{id:B.STONE_AXE, count:1},  pattern:[[B.STONE,B.STONE,0],[B.STONE,B.STICK,0],[0,B.STICK,0]] },
  { name:'Hache fer',      result:{id:B.IRON_AXE,  count:1},  pattern:[[B.IRON_INGOT,B.IRON_INGOT,0],[B.IRON_INGOT,B.STICK,0],[0,B.STICK,0]] },
  { name:'Épée bois',      result:{id:B.WOOD_SWORD,count:1},  pattern:[[0,B.PLANKS,0],[0,B.PLANKS,0],[0,B.STICK,0]] },
  { name:'Épée pierre',    result:{id:B.STONE_SWORD,count:1}, pattern:[[0,B.STONE,0],[0,B.STONE,0],[0,B.STICK,0]] },
  { name:'Épée fer',       result:{id:B.IRON_SWORD,count:1},  pattern:[[0,B.IRON_INGOT,0],[0,B.IRON_INGOT,0],[0,B.STICK,0]] },
];

// Match grid (array of 9 block IDs, 0=empty) against all recipes
function matchRecipe(grid) {
  for (const recipe of RECIPES) {
    if (_gridMatches(grid, recipe.pattern)) return recipe;
  }
  return null;
}

function _gridMatches(grid, pattern) {
  // Try all 9 offsets (rowOff 0-2, colOff 0-2)
  const patRows = [];
  const patCols = [];
  // Find bounding box of pattern
  for (let r = 0; r < 3; r++)
    for (let c = 0; c < 3; c++)
      if (pattern[r][c]) { patRows.push(r); patCols.push(c); }

  if (patRows.length === 0) return grid.every(v => !v);

  const minPR = Math.min(...patRows), maxPR = Math.max(...patRows);
  const minPC = Math.min(...patCols), maxPC = Math.max(...patCols);
  const ph = maxPR - minPR + 1;
  const pw = maxPC - minPC + 1;

  // Try placing pattern at each valid offset
  for (let ro = 0; ro <= 3 - ph; ro++) {
    for (let co = 0; co <= 3 - pw; co++) {
      if (_tryPlace(grid, pattern, minPR, minPC, ro, co)) return true;
    }
  }
  return false;
}

function _tryPlace(grid, pattern, minPR, minPC, ro, co) {
  // Check every grid cell
  for (let gr = 0; gr < 3; gr++) {
    for (let gc = 0; gc < 3; gc++) {
      const pr = gr - ro + minPR;
      const pc = gc - co + minPC;
      const patVal = (pr >= 0 && pr < 3 && pc >= 0 && pc < 3) ? pattern[pr][pc] : 0;
      const gridVal = grid[gr * 3 + gc] || 0;
      if (patVal !== gridVal) return false;
    }
  }
  return true;
}

// ---- Crafting UI ----
class CraftingUI {
  constructor(player, ui) {
    this.player = player;
    this.ui = ui;
    this.grid = new Array(9).fill(0); // grid of block IDs, 0=empty
    this.open = false;
    this._build();
  }

  _build() {
    this.el = document.createElement('div');
    this.el.id = 'crafting-screen';
    this.el.innerHTML = `
      <div id="crafting-panel">
        <div class="craft-header">⚒ TABLE DE CRAFT</div>

        <div class="craft-main">
          <div class="craft-left">
            <div class="craft-section-title">Grille 3×3</div>
            <div id="craft-grid"></div>
          </div>
          <div class="craft-middle">
            <div class="craft-arrow-wrap">
              <div class="craft-arrow">⟹</div>
              <button id="btn-craft" class="btn-craft-action">CRAFT</button>
              <button id="btn-craft-all" class="btn-craft-action">TOUT</button>
            </div>
          </div>
          <div class="craft-right">
            <div class="craft-section-title">Résultat</div>
            <div id="craft-result-slot" class="craft-slot result-slot"></div>
            <div id="craft-result-name"></div>
          </div>
        </div>

        <div class="craft-section-title" style="margin-top:10px">Recettes (cliquer pour auto-remplir)</div>
        <div id="craft-recipe-list"></div>

        <div class="craft-section-title" style="margin-top:10px">Inventaire</div>
        <div id="craft-inv-grid"></div>

        <button id="btn-close-craft">✕ Fermer (E)</button>
      </div>
    `;
    document.body.appendChild(this.el);

    // Build 3x3 grid
    const gridEl = this.el.querySelector('#craft-grid');
    this.slotEls = [];
    for (let i = 0; i < 9; i++) {
      const slot = document.createElement('div');
      slot.className = 'craft-slot';
      slot.title = 'Cliquer pour placer/retirer';
      slot.addEventListener('click', () => this._clickGrid(i));
      gridEl.appendChild(slot);
      this.slotEls.push(slot);
    }

    this.resultSlotEl  = this.el.querySelector('#craft-result-slot');
    this.resultNameEl  = this.el.querySelector('#craft-result-name');
    this.el.querySelector('#btn-craft').addEventListener('click', () => this._craft());
    this.el.querySelector('#btn-craft-all').addEventListener('click', () => this._craftAll());
    this.el.querySelector('#btn-close-craft').addEventListener('click', () => this.close());
    this.el.addEventListener('click', e => { if (e.target === this.el) this.close(); });

    this._buildRecipeList();
  }

  openUI() {
    this.open = true;
    this.ui.invOpen = true;
    this.el.classList.add('open');
    this._render();
  }

  close() {
    // Return grid items to inventory
    for (let i = 0; i < 9; i++) {
      if (this.grid[i]) { this.player.addItem(this.grid[i], 1); this.grid[i] = 0; }
    }
    this.open = false;
    this.ui.invOpen = false;
    this.el.classList.remove('open');
    this.ui.updateHotbar();
  }

  _clickGrid(i) {
    if (this.grid[i]) {
      // Return item to inventory
      this.player.addItem(this.grid[i], 1);
      this.grid[i] = 0;
    } else {
      // Take from selected hotbar slot
      const held = this.player.getHeldItem();
      if (!held) return;
      this.grid[i] = held.id;
      this.player.removeItem(this.player.hotbarIdx, 1);
    }
    this.ui.updateHotbar();
    this._render();
  }

  _craft() {
    const recipe = matchRecipe(this.grid);
    if (!recipe) return;
    // Remove one of each ingredient
    for (let i = 0; i < 9; i++) {
      if (this.grid[i]) this.grid[i] = 0;
    }
    this.player.addItem(recipe.result.id, recipe.result.count);
    this.ui.updateHotbar();
    this._render();
  }

  _craftAll() {
    for (let n = 0; n < 64; n++) {
      const recipe = matchRecipe(this.grid);
      if (!recipe) break;
      // Check we still have inventory stock (simplified: just craft once per loop)
      for (let i = 0; i < 9; i++) {
        if (this.grid[i]) this.grid[i] = 0;
      }
      this.player.addItem(recipe.result.id, recipe.result.count);
    }
    this.ui.updateHotbar();
    this._render();
  }

  _render() {
    // Render grid slots
    for (let i = 0; i < 9; i++) {
      this._renderSlot(this.slotEls[i], this.grid[i]);
    }
    // Render result
    const recipe = matchRecipe(this.grid);
    if (recipe) {
      this._renderSlot(this.resultSlotEl, recipe.result.id, recipe.result.count);
      this.resultSlotEl.classList.add('craftable');
      this.resultNameEl.textContent = recipe.name;
    } else {
      this.resultSlotEl.innerHTML = '';
      this.resultSlotEl.classList.remove('craftable');
      this.resultNameEl.textContent = '';
    }
    // Render inventory
    this._renderInv();
  }

  _renderSlot(el, id, count) {
    el.innerHTML = '';
    if (!id) return;
    const icon = getBlockIcon(id, 36);
    el.appendChild(icon);
    if (count > 1) {
      const cnt = document.createElement('span');
      cnt.className = 'slot-count';
      cnt.textContent = count;
      el.appendChild(cnt);
    }
  }

  _renderInv() {
    const invEl = this.el.querySelector('#craft-inv-grid');
    invEl.innerHTML = '';
    for (let i = 0; i < 36; i++) {
      const slot = document.createElement('div');
      slot.className = 'inv-slot craft-inv-slot';
      const item = this.player.inventory[i];
      if (item) {
        slot.appendChild(getBlockIcon(item.id, 28));
        if (item.count > 1) {
          const cnt = document.createElement('span');
          cnt.className = 'slot-count';
          cnt.textContent = item.count;
          slot.appendChild(cnt);
        }
        const bd = BLOCK_DATA[item.id];
        slot.title = (bd ? bd.name : '?') + ' x' + item.count;
        slot.addEventListener('click', () => {
          // Move to first empty grid slot
          const empty = this.grid.indexOf(0);
          if (empty !== -1) {
            this.grid[empty] = item.id;
            this.player.removeItem(i, 1);
            this.ui.updateHotbar();
            this._render();
          }
        });
      }
      invEl.appendChild(slot);
    }
  }

  _buildRecipeList() {
    const listEl = this.el.querySelector('#craft-recipe-list');
    listEl.innerHTML = '';
    for (const recipe of RECIPES) {
      const item = document.createElement('div');
      item.className = 'recipe-item';
      item.appendChild(getBlockIcon(recipe.result.id, 22));
      const name = document.createElement('span');
      name.textContent = recipe.name;
      item.appendChild(name);
      item.title = 'Cliquer pour auto-remplir';
      item.addEventListener('click', () => this._autoFill(recipe));
      listEl.appendChild(item);
    }
  }

  _autoFill(recipe) {
    // Return current grid to inventory
    for (let i = 0; i < 9; i++) {
      if (this.grid[i]) { this.player.addItem(this.grid[i], 1); this.grid[i] = 0; }
    }
    // Fill with recipe ingredients
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        const needed = recipe.pattern[r][c];
        if (needed) {
          const invIdx = this.player.inventory.findIndex(it => it && it.id === needed);
          if (invIdx !== -1) {
            this.grid[r * 3 + c] = needed;
            this.player.removeItem(invIdx, 1);
          }
        }
      }
    }
    this.ui.updateHotbar();
    this._render();
  }
}
