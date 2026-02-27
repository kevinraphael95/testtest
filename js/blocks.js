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
};

// Draw a single block tile on a canvas context
// Each block is hand-drawn with pixel art style
function drawBlock(ctx, id, x, y, size) {
  if (id === B.AIR) return;
  const s = size || TILE;
  ctx.save();
  ctx.translate(x, y);

  switch(id) {
    case B.GRASS: drawGrass(ctx, s); break;
    case B.DIRT:  drawDirt(ctx, s); break;
    case B.STONE: drawStone(ctx, s); break;
    case B.COAL:  drawOre(ctx, s, '#1a1a1a', '#222'); break;
    case B.IRON:  drawOre(ctx, s, '#c8a878', '#b89060'); break;
    case B.GOLD:  drawOre(ctx, s, '#ffd700', '#e8c000'); break;
    case B.DIAMOND: drawOre(ctx, s, '#00e5ff', '#00bcd4'); break;
    case B.WOOD:  drawWood(ctx, s); break;
    case B.LEAVES: drawLeaves(ctx, s); break;
    case B.SAND:  drawSand(ctx, s); break;
    case B.GRAVEL: drawGravel(ctx, s); break;
    case B.WATER: drawWater(ctx, s); break;
    case B.LAVA:  drawLava(ctx, s); break;
    case B.BEDROCK: drawBedrock(ctx, s); break;
    case B.PLANKS: drawPlanks(ctx, s); break;
    case B.GLASS: drawGlass(ctx, s); break;
    case B.TORCH: drawTorch(ctx, s); break;
    case B.CRAFTING: drawCrafting(ctx, s); break;
    case B.FURNACE: drawFurnace(ctx, s); break;
    default: drawStone(ctx, s);
  }

  ctx.restore();
}

function drawGrass(ctx, s) {
  // Dirt base
  ctx.fillStyle = '#8B5E3C';
  ctx.fillRect(0, s*0.3, s, s*0.7);
  // Dirt noise
  addNoise(ctx, s, '#7a4f2d', 0.3, 6);
  // Grass top
  ctx.fillStyle = '#4a9e29';
  ctx.fillRect(0, 0, s, s*0.3);
  // Grass detail
  ctx.fillStyle = '#3d8520';
  for(let i=0;i<s;i+=4) ctx.fillRect(i, s*0.25, 2, s*0.08);
}

function drawDirt(ctx, s) {
  ctx.fillStyle = '#8B5E3C';
  ctx.fillRect(0, 0, s, s);
  addNoise(ctx, s, '#7a4f2d', 0.35, 8);
  addNoise(ctx, s, '#9d6e4e', 0.2, 6);
}

function drawStone(ctx, s) {
  ctx.fillStyle = '#7a7a7a';
  ctx.fillRect(0, 0, s, s);
  addNoise(ctx, s, '#6a6a6a', 0.3, 8);
  addNoise(ctx, s, '#888', 0.2, 5);
  // Cracks
  ctx.strokeStyle = '#555';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(s*0.2, s*0.1); ctx.lineTo(s*0.4, s*0.4);
  ctx.moveTo(s*0.6, s*0.5); ctx.lineTo(s*0.8, s*0.8);
  ctx.stroke();
}

function drawOre(ctx, s, oreColor, oreShade) {
  drawStone(ctx, s);
  // Ore veins
  ctx.fillStyle = oreColor;
  const spots = [{x:0.2,y:0.2},{x:0.55,y:0.15},{x:0.15,y:0.6},{x:0.6,y:0.55},{x:0.38,y:0.38}];
  for(const sp of spots) {
    ctx.fillRect(sp.x*s, sp.y*s, s*0.12, s*0.12);
    ctx.fillStyle = oreShade;
    ctx.fillRect(sp.x*s+1, sp.y*s+1, s*0.06, s*0.06);
    ctx.fillStyle = oreColor;
  }
}

function drawWood(ctx, s) {
  ctx.fillStyle = '#6B4226';
  ctx.fillRect(0, 0, s, s);
  // Rings
  ctx.strokeStyle = '#523119';
  ctx.lineWidth = 2;
  for(let r=4; r<s/2; r+=5) {
    ctx.beginPath();
    ctx.ellipse(s/2, s/2, r, r*0.7, 0, 0, Math.PI*2);
    ctx.stroke();
  }
  // Bark lines
  ctx.strokeStyle = '#7d4e30';
  ctx.lineWidth = 1;
  for(let i=0; i<s; i+=6) {
    ctx.beginPath();
    ctx.moveTo(i, 0); ctx.lineTo(i+2, s);
    ctx.stroke();
  }
}

function drawLeaves(ctx, s) {
  ctx.fillStyle = '#2d7a1f';
  ctx.fillRect(0, 0, s, s);
  addNoise(ctx, s, '#1d5a14', 0.4, 6);
  addNoise(ctx, s, '#3d9a29', 0.3, 5);
}

function drawSand(ctx, s) {
  ctx.fillStyle = '#d4b483';
  ctx.fillRect(0, 0, s, s);
  addNoise(ctx, s, '#c4a473', 0.3, 7);
  addNoise(ctx, s, '#e4c493', 0.2, 5);
}

function drawGravel(ctx, s) {
  ctx.fillStyle = '#888';
  ctx.fillRect(0, 0, s, s);
  const dots = [{x:0.1,y:0.1,r:0.15},{x:0.5,y:0.05,r:0.12},{x:0.75,y:0.2,r:0.1},
    {x:0.2,y:0.5,r:0.13},{x:0.6,y:0.4,r:0.14},{x:0.1,y:0.7,r:0.1},{x:0.55,y:0.7,r:0.12}];
  for(const d of dots) {
    ctx.fillStyle = '#999'; ctx.beginPath();
    ctx.ellipse(d.x*s, d.y*s, d.r*s, d.r*s*0.8, 0, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#777'; ctx.beginPath();
    ctx.ellipse(d.x*s+1, d.y*s+1, d.r*s*0.5, d.r*s*0.4, 0, 0, Math.PI*2); ctx.fill();
  }
}

function drawWater(ctx, s) {
  const t = Date.now() * 0.001;
  ctx.fillStyle = '#1a6eb5aa';
  ctx.fillRect(0, 0, s, s);
  ctx.fillStyle = '#2980d9aa';
  for(let i=0; i<3; i++) {
    const wx = (i * s/3 + Math.sin(t + i) * 4) % s;
    ctx.fillRect(wx, s*0.3 + i*s*0.12, s*0.4, 3);
  }
}

function drawLava(ctx, s) {
  const t = Date.now() * 0.002;
  ctx.fillStyle = '#c04000';
  ctx.fillRect(0, 0, s, s);
  const spots = [[0.2,0.3],[0.6,0.2],[0.4,0.6],[0.7,0.7]];
  for(const [bx,by] of spots) {
    const pulse = Math.abs(Math.sin(t + bx*5)) * 0.4 + 0.6;
    ctx.fillStyle = `rgba(255, ${Math.floor(150*pulse)}, 0, ${pulse})`;
    ctx.beginPath();
    ctx.ellipse(bx*s, by*s, s*0.15*pulse, s*0.1*pulse, 0, 0, Math.PI*2);
    ctx.fill();
  }
}

function drawBedrock(ctx, s) {
  ctx.fillStyle = '#222';
  ctx.fillRect(0, 0, s, s);
  addNoise(ctx, s, '#111', 0.4, 6);
  addNoise(ctx, s, '#333', 0.3, 5);
}

function drawPlanks(ctx, s) {
  ctx.fillStyle = '#ab7d3c';
  ctx.fillRect(0, 0, s, s);
  ctx.fillStyle = '#9a6c2b';
  ctx.fillRect(0, s*0.48, s, 4);
  // Grain
  ctx.strokeStyle = '#8a5c1b';
  ctx.lineWidth = 1;
  for(let i=0; i<s; i+=5) {
    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, s); ctx.stroke();
  }
}

function drawGlass(ctx, s) {
  ctx.fillStyle = 'rgba(150, 220, 255, 0.3)';
  ctx.fillRect(0, 0, s, s);
  ctx.strokeStyle = 'rgba(200, 240, 255, 0.6)';
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, s-2, s-2);
  ctx.beginPath();
  ctx.moveTo(s*0.1, s*0.1); ctx.lineTo(s*0.4, s*0.3);
  ctx.moveTo(s*0.6, s*0.6); ctx.lineTo(s*0.9, s*0.8);
  ctx.stroke();
}

function drawTorch(ctx, s) {
  // Stick
  ctx.fillStyle = '#6B4226';
  ctx.fillRect(s*0.45, s*0.4, s*0.1, s*0.5);
  // Flame
  const t = Date.now() * 0.003;
  ctx.fillStyle = `rgba(255, ${150 + Math.sin(t)*50}, 0, 0.9)`;
  ctx.beginPath();
  ctx.ellipse(s*0.5, s*0.3, s*0.1, s*0.15, 0, 0, Math.PI*2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255, 255, 0, 0.8)';
  ctx.beginPath();
  ctx.ellipse(s*0.5, s*0.33, s*0.05, s*0.08, 0, 0, Math.PI*2);
  ctx.fill();
}

function drawCrafting(ctx, s) {
  drawPlanks(ctx, s);
  // Crafting symbol
  ctx.fillStyle = '#7a4e1a';
  for(let r=0;r<2;r++) for(let c=0;c<2;c++) {
    ctx.strokeStyle = '#4a2e0a';
    ctx.strokeRect(s*0.15 + c*s*0.3, s*0.15 + r*s*0.3, s*0.25, s*0.25);
  }
}

function drawFurnace(ctx, s) {
  ctx.fillStyle = '#666';
  ctx.fillRect(0, 0, s, s);
  addNoise(ctx, s, '#555', 0.3, 5);
  // Opening
  ctx.fillStyle = '#222';
  ctx.fillRect(s*0.2, s*0.4, s*0.6, s*0.45);
  // Fire glow
  ctx.fillStyle = 'rgba(255, 100, 0, 0.7)';
  ctx.fillRect(s*0.25, s*0.55, s*0.5, s*0.25);
}

function addNoise(ctx, s, color, density, size) {
  ctx.fillStyle = color;
  const seed = s; // deterministic
  let x = 42, y = 17;
  for(let i=0; i<s*density; i++) {
    x = (x * 1664525 + 1013904223) & 0xffffffff;
    y = (y * 22695477 + 1) & 0xffffffff;
    const px = Math.abs(x % s);
    const py = Math.abs(y % s);
    ctx.fillRect(px, py, size*0.5|0 || 2, size*0.3|0 || 2);
  }
}

// Generate small icon canvas for inventory/hotbar
function getBlockIcon(id, size = 36) {
  const c = document.createElement('canvas');
  c.width = size; c.height = size;
  drawBlock(c.getContext('2d'), id, 0, 0, size);
  return c;
}
