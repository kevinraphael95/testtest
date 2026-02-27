// blocks.js - Block definitions, textures, properties

const BLOCK_DATA = {
  [B.AIR]:      { name: 'Air',           transparent: true,  solid: false, hardness: 0 },
  [B.GRASS]:    { name: 'Herbe',         transparent: false, solid: true,  hardness: 0.6, drops: B.DIRT },
  [B.DIRT]:     { name: 'Terre',         transparent: false, solid: true,  hardness: 0.5 },
  [B.STONE]:    { name: 'Pierre',        transparent: false, solid: true,  hardness: 1.5 },
  [B.COAL]:     { name: 'Charbon',       transparent: false, solid: true,  hardness: 3.0 },
  [B.IRON]:     { name: 'Fer',           transparent: false, solid: true,  hardness: 3.0 },
  [B.GOLD]:     { name: 'Or',            transparent: false, solid: true,  hardness: 3.0 },
  [B.DIAMOND]:  { name: 'Diamant',       transparent: false, solid: true,  hardness: 5.0 },
  [B.WOOD]:     { name: 'Bois',          transparent: false, solid: true,  hardness: 2.0 },
  [B.LEAVES]:   { name: 'Feuilles',      transparent: true,  solid: false, hardness: 0.2, drops: B.AIR },
  [B.SAND]:     { name: 'Sable',         transparent: false, solid: true,  hardness: 0.5 },
  [B.GRAVEL]:   { name: 'Gravier',       transparent: false, solid: true,  hardness: 0.6 },
  [B.WATER]:    { name: 'Eau',           transparent: true,  solid: false, hardness: -1 },
  [B.LAVA]:     { name: 'Lave',          transparent: false, solid: false, hardness: -1 },
  [B.BEDROCK]:  { name: 'Bedrock',       transparent: false, solid: true,  hardness: -1 },
  [B.PLANKS]:   { name: 'Planches',      transparent: false, solid: true,  hardness: 2.0 },
  [B.GLASS]:    { name: 'Verre',         transparent: true,  solid: true,  hardness: 0.3, drops: B.AIR },
  [B.TORCH]:    { name: 'Torche',        transparent: true,  solid: false, hardness: 0.1 },
  [B.CRAFTING]: { name: 'Table Craft',   transparent: false, solid: true,  hardness: 2.5 },
  [B.FURNACE]:  { name: 'Fourneau',      transparent: false, solid: true,  hardness: 3.5 },
  // Items (not placeable as full blocks)
  [B.STICK]:       { name: 'Bâton',         transparent: true, solid: false, hardness: 0 },
  [B.COAL_ITEM]:   { name: 'Charbon (item)',transparent: true, solid: false, hardness: 0 },
  [B.IRON_INGOT]:  { name: 'Lingot de fer', transparent: true, solid: false, hardness: 0 },
  [B.GOLD_INGOT]:  { name: "Lingot d'or",   transparent: true, solid: false, hardness: 0 },
  [B.DIAMOND_GEM]: { name: 'Diamant',       transparent: true, solid: false, hardness: 0 },
  [B.WOOD_PICK]:   { name: 'Pioche bois',   transparent: true, solid: false, hardness: 0 },
  [B.STONE_PICK]:  { name: 'Pioche pierre', transparent: true, solid: false, hardness: 0 },
  [B.IRON_PICK]:   { name: 'Pioche fer',    transparent: true, solid: false, hardness: 0 },
  [B.WOOD_AXE]:    { name: 'Hache bois',    transparent: true, solid: false, hardness: 0 },
  [B.STONE_AXE]:   { name: 'Hache pierre',  transparent: true, solid: false, hardness: 0 },
  [B.IRON_AXE]:    { name: 'Hache fer',     transparent: true, solid: false, hardness: 0 },
  [B.WOOD_SWORD]:  { name: 'Épée bois',     transparent: true, solid: false, hardness: 0 },
  [B.STONE_SWORD]: { name: 'Épée pierre',   transparent: true, solid: false, hardness: 0 },
  [B.IRON_SWORD]:  { name: 'Épée fer',      transparent: true, solid: false, hardness: 0 },
};

// ---- Single unified drawBlock function ----
function drawBlock(ctx, id, x, y, size) {
  if (id === B.AIR) return;
  const s = size || TILE;
  ctx.save();
  ctx.translate(x, y);

  switch(id) {
    case B.GRASS:    _drawGrass(ctx, s); break;
    case B.DIRT:     _drawDirt(ctx, s); break;
    case B.STONE:    _drawStone(ctx, s); break;
    case B.COAL:     _drawOre(ctx, s, '#1a1a1a', '#222'); break;
    case B.IRON:     _drawOre(ctx, s, '#c8a878', '#b89060'); break;
    case B.GOLD:     _drawOre(ctx, s, '#ffd700', '#e8c000'); break;
    case B.DIAMOND:  _drawOre(ctx, s, '#00e5ff', '#00bcd4'); break;
    case B.WOOD:     _drawWood(ctx, s); break;
    case B.LEAVES:   _drawLeaves(ctx, s); break;
    case B.SAND:     _drawSand(ctx, s); break;
    case B.GRAVEL:   _drawGravel(ctx, s); break;
    case B.WATER:    _drawWater(ctx, s); break;
    case B.LAVA:     _drawLava(ctx, s); break;
    case B.BEDROCK:  _drawBedrock(ctx, s); break;
    case B.PLANKS:   _drawPlanks(ctx, s); break;
    case B.GLASS:    _drawGlass(ctx, s); break;
    case B.TORCH:    _drawTorch(ctx, s); break;
    case B.CRAFTING: _drawCrafting(ctx, s); break;
    case B.FURNACE:  _drawFurnace(ctx, s); break;
    // Items
    case B.STICK:       _drawStick(ctx, s); break;
    case B.IRON_INGOT:  _drawIngot(ctx, s, '#c8a878'); break;
    case B.GOLD_INGOT:  _drawIngot(ctx, s, '#ffd700'); break;
    case B.DIAMOND_GEM: _drawGem(ctx, s, '#00e5ff'); break;
    case B.COAL_ITEM:   _drawGem(ctx, s, '#222'); break;
    case B.WOOD_PICK:   _drawTool(ctx, s, '#ab7d3c', 'pick'); break;
    case B.STONE_PICK:  _drawTool(ctx, s, '#888',    'pick'); break;
    case B.IRON_PICK:   _drawTool(ctx, s, '#c8a878', 'pick'); break;
    case B.WOOD_AXE:    _drawTool(ctx, s, '#ab7d3c', 'axe'); break;
    case B.STONE_AXE:   _drawTool(ctx, s, '#888',    'axe'); break;
    case B.IRON_AXE:    _drawTool(ctx, s, '#c8a878', 'axe'); break;
    case B.WOOD_SWORD:  _drawTool(ctx, s, '#ab7d3c', 'sword'); break;
    case B.STONE_SWORD: _drawTool(ctx, s, '#888',    'sword'); break;
    case B.IRON_SWORD:  _drawTool(ctx, s, '#c8a878', 'sword'); break;
    default:
      ctx.fillStyle = '#f0f'; ctx.fillRect(0, 0, s, s); // magenta = unknown block
  }

  ctx.restore();
}

// ---- Block draw helpers ----

function _drawGrass(ctx, s) {
  ctx.fillStyle = '#8B5E3C';
  ctx.fillRect(0, s*0.3, s, s*0.7);
  _addNoise(ctx, s, '#7a4f2d', 0.3, 6);
  ctx.fillStyle = '#4a9e29';
  ctx.fillRect(0, 0, s, s*0.3);
  ctx.fillStyle = '#3d8520';
  for(let i=0;i<s;i+=4) ctx.fillRect(i, s*0.25, 2, s*0.08);
}

function _drawDirt(ctx, s) {
  ctx.fillStyle = '#8B5E3C';
  ctx.fillRect(0, 0, s, s);
  _addNoise(ctx, s, '#7a4f2d', 0.35, 8);
  _addNoise(ctx, s, '#9d6e4e', 0.2, 6);
}

function _drawStone(ctx, s) {
  ctx.fillStyle = '#7a7a7a';
  ctx.fillRect(0, 0, s, s);
  _addNoise(ctx, s, '#6a6a6a', 0.3, 8);
  _addNoise(ctx, s, '#888', 0.2, 5);
  ctx.strokeStyle = '#555'; ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(s*0.2, s*0.1); ctx.lineTo(s*0.4, s*0.4);
  ctx.moveTo(s*0.6, s*0.5); ctx.lineTo(s*0.8, s*0.8);
  ctx.stroke();
}

function _drawOre(ctx, s, oreColor, oreShade) {
  _drawStone(ctx, s);
  const spots = [{x:0.2,y:0.2},{x:0.55,y:0.15},{x:0.15,y:0.6},{x:0.6,y:0.55},{x:0.38,y:0.38}];
  for(const sp of spots) {
    ctx.fillStyle = oreColor;
    ctx.fillRect(sp.x*s, sp.y*s, s*0.12, s*0.12);
    ctx.fillStyle = oreShade;
    ctx.fillRect(sp.x*s+1, sp.y*s+1, s*0.06, s*0.06);
  }
}

function _drawWood(ctx, s) {
  ctx.fillStyle = '#6B4226';
  ctx.fillRect(0, 0, s, s);
  ctx.strokeStyle = '#523119'; ctx.lineWidth = 2;
  for(let r=4; r<s/2; r+=5) {
    ctx.beginPath();
    ctx.ellipse(s/2, s/2, r, r*0.7, 0, 0, Math.PI*2);
    ctx.stroke();
  }
  ctx.strokeStyle = '#7d4e30'; ctx.lineWidth = 1;
  for(let i=0; i<s; i+=6) {
    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i+2, s); ctx.stroke();
  }
}

function _drawLeaves(ctx, s) {
  ctx.fillStyle = '#2d7a1f';
  ctx.fillRect(0, 0, s, s);
  _addNoise(ctx, s, '#1d5a14', 0.4, 6);
  _addNoise(ctx, s, '#3d9a29', 0.3, 5);
}

function _drawSand(ctx, s) {
  ctx.fillStyle = '#d4b483';
  ctx.fillRect(0, 0, s, s);
  _addNoise(ctx, s, '#c4a473', 0.3, 7);
}

function _drawGravel(ctx, s) {
  ctx.fillStyle = '#888';
  ctx.fillRect(0, 0, s, s);
  const dots = [{x:0.1,y:0.1,r:0.15},{x:0.5,y:0.05,r:0.12},{x:0.75,y:0.2,r:0.1},
    {x:0.2,y:0.5,r:0.13},{x:0.6,y:0.4,r:0.14},{x:0.55,y:0.7,r:0.12}];
  for(const d of dots) {
    ctx.fillStyle = '#999'; ctx.beginPath();
    ctx.ellipse(d.x*s, d.y*s, d.r*s, d.r*s*0.8, 0, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#777'; ctx.beginPath();
    ctx.ellipse(d.x*s+1, d.y*s+1, d.r*s*0.5, d.r*s*0.4, 0, 0, Math.PI*2); ctx.fill();
  }
}

function _drawWater(ctx, s) {
  ctx.fillStyle = '#1a6eb5aa';
  ctx.fillRect(0, 0, s, s);
  ctx.fillStyle = '#2980d9aa';
  for(let i=0; i<3; i++) ctx.fillRect(i*(s/3), s*0.35+i*s*0.1, s*0.5, 3);
}

function _drawLava(ctx, s) {
  ctx.fillStyle = '#c04000';
  ctx.fillRect(0, 0, s, s);
  const t = Date.now() * 0.002;
  const spots = [[0.2,0.3],[0.6,0.2],[0.4,0.6],[0.7,0.7]];
  for(const [bx,by] of spots) {
    const p = Math.abs(Math.sin(t + bx*5)) * 0.4 + 0.6;
    ctx.fillStyle = `rgba(255,${Math.floor(150*p)},0,${p})`;
    ctx.beginPath();
    ctx.ellipse(bx*s, by*s, s*0.15*p, s*0.1*p, 0, 0, Math.PI*2);
    ctx.fill();
  }
}

function _drawBedrock(ctx, s) {
  ctx.fillStyle = '#222';
  ctx.fillRect(0, 0, s, s);
  _addNoise(ctx, s, '#111', 0.4, 6);
  _addNoise(ctx, s, '#333', 0.3, 5);
}

function _drawPlanks(ctx, s) {
  ctx.fillStyle = '#ab7d3c';
  ctx.fillRect(0, 0, s, s);
  ctx.fillStyle = '#9a6c2b';
  ctx.fillRect(0, s*0.48, s, 4);
  ctx.strokeStyle = '#8a5c1b'; ctx.lineWidth = 1;
  for(let i=0; i<s; i+=5) {
    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, s); ctx.stroke();
  }
}

function _drawGlass(ctx, s) {
  ctx.fillStyle = 'rgba(150,220,255,0.3)';
  ctx.fillRect(0, 0, s, s);
  ctx.strokeStyle = 'rgba(200,240,255,0.6)'; ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, s-2, s-2);
}

function _drawTorch(ctx, s) {
  ctx.fillStyle = '#6B4226';
  ctx.fillRect(s*0.45, s*0.4, s*0.1, s*0.5);
  const t = Date.now() * 0.003;
  ctx.fillStyle = `rgba(255,${150+Math.sin(t)*50|0},0,0.9)`;
  ctx.beginPath();
  ctx.ellipse(s*0.5, s*0.3, s*0.1, s*0.15, 0, 0, Math.PI*2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,0,0.8)';
  ctx.beginPath();
  ctx.ellipse(s*0.5, s*0.33, s*0.05, s*0.08, 0, 0, Math.PI*2);
  ctx.fill();
}

function _drawCrafting(ctx, s) {
  _drawPlanks(ctx, s);
  ctx.strokeStyle = '#4a2e0a'; ctx.lineWidth = 2;
  for(let r=0;r<2;r++) for(let c=0;c<2;c++)
    ctx.strokeRect(s*0.15+c*s*0.3, s*0.15+r*s*0.3, s*0.25, s*0.25);
}

function _drawFurnace(ctx, s) {
  ctx.fillStyle = '#666'; ctx.fillRect(0, 0, s, s);
  _addNoise(ctx, s, '#555', 0.3, 5);
  ctx.fillStyle = '#222'; ctx.fillRect(s*0.2, s*0.4, s*0.6, s*0.45);
  ctx.fillStyle = 'rgba(255,100,0,0.7)'; ctx.fillRect(s*0.25, s*0.55, s*0.5, s*0.25);
}

function _addNoise(ctx, s, color, density, size) {
  ctx.fillStyle = color;
  let xn = 42, yn = 17;
  for(let i=0; i<s*density; i++) {
    xn = (xn * 1664525 + 1013904223) & 0xffffffff;
    yn = (yn * 22695477 + 1) & 0xffffffff;
    ctx.fillRect(Math.abs(xn % s), Math.abs(yn % s), Math.max(1, size*0.5|0), Math.max(1, size*0.3|0));
  }
}

// ---- Item draw helpers ----

function _drawStick(ctx, s) {
  ctx.fillStyle = '#6B4226';
  ctx.fillRect(s*0.45, s*0.05, s*0.1, s*0.9);
}

function _drawIngot(ctx, s, color) {
  ctx.fillStyle = color;
  ctx.fillRect(s*0.1, s*0.3, s*0.8, s*0.4);
  ctx.strokeStyle = 'rgba(0,0,0,0.4)'; ctx.lineWidth = 1;
  ctx.strokeRect(s*0.1, s*0.3, s*0.8, s*0.4);
}

function _drawGem(ctx, s, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(s*0.5, s*0.1);
  ctx.lineTo(s*0.85, s*0.4);
  ctx.lineTo(s*0.65, s*0.9);
  ctx.lineTo(s*0.35, s*0.9);
  ctx.lineTo(s*0.15, s*0.4);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 1; ctx.stroke();
}

function _drawTool(ctx, s, color, type) {
  // Handle
  ctx.strokeStyle = '#6B4226'; ctx.lineWidth = Math.max(2, s*0.1);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(s*0.7, s*0.3); ctx.lineTo(s*0.25, s*0.75);
  ctx.stroke();
  // Head
  ctx.fillStyle = color;
  ctx.strokeStyle = 'rgba(0,0,0,0.4)'; ctx.lineWidth = 1;
  if (type === 'pick') {
    ctx.beginPath();
    ctx.moveTo(s*0.2, s*0.15); ctx.lineTo(s*0.8, s*0.15);
    ctx.lineTo(s*0.65, s*0.35); ctx.lineTo(s*0.5, s*0.28);
    ctx.lineTo(s*0.35, s*0.35); ctx.closePath();
    ctx.fill(); ctx.stroke();
  } else if (type === 'axe') {
    ctx.fillRect(s*0.4, s*0.1, s*0.45, s*0.35);
    ctx.strokeRect(s*0.4, s*0.1, s*0.45, s*0.35);
  } else if (type === 'sword') {
    ctx.fillRect(s*0.44, s*0.1, s*0.12, s*0.55);
    ctx.fillRect(s*0.28, s*0.53, s*0.44, s*0.1);
    ctx.strokeRect(s*0.44, s*0.1, s*0.12, s*0.55);
  }
}

// Generate small icon canvas for inventory/hotbar
function getBlockIcon(id, size) {
  size = size || 36;
  const c = document.createElement('canvas');
  c.width = size; c.height = size;
  drawBlock(c.getContext('2d'), id, 0, 0, size);
  return c;
}
