// multiplayer.js - Monde partagé via Supabase

class MultiplayerSync {
  constructor(world, config) {
    this.world   = world;
    this.sb      = null;
    this.enabled = false;
    this.pending = new Map();
    this.pseudo  = config?.pseudo || 'Joueur';

    this._statusEl = this._makeStatusEl();

    if (!config) {
      this._status('Solo', '#888');
      return;
    }
    this._init(config.url, config.key);
  }

  async _init(url, key) {
    this._status('⏳ Connexion...', '#fa0');
    try {
      const { createClient } = await import(
        'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'
      );
      this.sb = createClient(url, key);

      // Charger l'état existant
      const { data, error } = await this.sb.from('blocks').select('key,id');
      if (error) throw error;

      for (const row of data) {
        const [wx, y] = row.key.split(',').map(Number);
        this.world.set(wx, y, row.id);
      }
      console.log('[MP] Blocs chargés:', data.length);

      // Écoute temps réel
      this.sb.channel('blocks')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'blocks' },
          ({ eventType, new: n, old: o }) => {
            const key = (n?.key || o?.key);
            if (this.pending.has(key)) return; // notre propre changement
            const [wx, y] = key.split(',').map(Number);
            this.world.set(wx, y, eventType === 'DELETE' ? 0 : n.id);
          })
        .subscribe();

      // Flush toutes les 400ms
      setInterval(() => this._flush(), 400);

      this.enabled = true;
      this._status(`🌐 ${this.pseudo} connecté`, '#4d4');

      // Mettre à jour le statut dans l'écran multi si encore visible
      const statusEl = document.getElementById('multi-config-status');
      if (statusEl) {
        statusEl.textContent = '✅ Connecté !';
        statusEl.style.borderColor = '#4d4';
      }

    } catch(e) {
      console.error('[MP]', e);
      this._status('❌ Erreur (F12)', '#f44');
      const statusEl = document.getElementById('multi-config-status');
      if (statusEl) {
        statusEl.textContent = '❌ Erreur : ' + (e.message || 'URL/Key incorrecte ?');
        statusEl.style.borderColor = '#f44';
      }
    }
  }

  syncBlock(wx, y, id) {
    if (!this.enabled) return;
    this.pending.set(`${wx},${y}`, id);
  }

  async _flush() {
    if (!this.enabled || this.pending.size === 0) return;
    const batch = [...this.pending.entries()];
    this.pending.clear();

    const toUpsert = batch.filter(([,id]) => id !== 0).map(([key,id]) => ({ key, id }));
    const toDelete = batch.filter(([,id]) => id === 0).map(([key]) => key);

    try {
      if (toUpsert.length) await this.sb.from('blocks').upsert(toUpsert, { onConflict: 'key' });
      if (toDelete.length) await this.sb.from('blocks').delete().in('key', toDelete);
    } catch(e) {
      for (const [k,v] of batch) this.pending.set(k, v); // retry
    }
  }

  _makeStatusEl() {
    const el = document.createElement('div');
    el.id = 'mp-status';
    el.style.cssText = `position:fixed;top:8px;right:8px;
      font-family:'Press Start 2P',monospace;font-size:0.42rem;
      padding:6px 10px;background:rgba(0,0,0,0.8);
      border:2px solid #555;color:#fff;z-index:999;
      pointer-events:none;max-width:220px;text-align:right;`;
    document.body.appendChild(el);
    return el;
  }

  _status(msg, color) {
    this._statusEl.textContent = msg;
    this._statusEl.style.borderColor = color;
  }
}
