const express = require('express');
const { getDb } = require('../db/database');
const { requireAuth } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { parseFile } = require('../utils/parser');
const { analyzeAllCampaigns } = require('../engine/rules');

const router = express.Router();

router.post('/', requireAuth, upload.single('file'), (req, res) => {
  try {
    const { product_price, product_type, has_pre_checkout } = req.body;

    if (!product_price || parseFloat(product_price) <= 0) {
      return res.status(400).json({ error: 'Valor do produto é obrigatório e deve ser maior que zero.' });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'Arquivo da planilha é obrigatório (.xlsx ou .csv).' });
    }

    const price = parseFloat(product_price);
    const pType = product_type || 'low_ticket';
    const preCheckout = has_pre_checkout === 'true' || has_pre_checkout === '1';

    const parsed = parseFile(req.file.path);
    if (parsed.error) {
      return res.status(400).json({ error: parsed.error });
    }

    if (!parsed.hasPurchases) {
      return res.status(400).json({
        error: 'Para calcular CPA e classificar cenário 1/2, preciso da métrica COMPRAS (Purchases). Reexporte a planilha no Gerenciador de Anúncios incluindo a coluna Compras.'
      });
    }

    const analyzed = analyzeAllCampaigns(parsed.campaigns, price, preCheckout);

    const db = getDb();
    const insertAudit = db.prepare(
      'INSERT INTO audits (user_id, product_price, product_type, has_pre_checkout, filename) VALUES (?, ?, ?, ?, ?)'
    );
    const insertCampaign = db.prepare(`
      INSERT INTO campaigns (audit_id, campaign_name, spend, ctr_link, link_clicks, lp_views, lp_rate, checkouts, purchases, cpa, cpc, impressions, reach, scenario, hook_rate)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const insertRec = db.prepare(
      'INSERT INTO recommendations (campaign_id, title, message, steps_json) VALUES (?, ?, ?, ?)'
    );

    const transaction = db.transaction(() => {
      const auditResult = insertAudit.run(req.user.id, price, pType, preCheckout ? 1 : 0, req.file.originalname);
      const auditId = auditResult.lastInsertRowid;

      for (const c of analyzed) {
        const campResult = insertCampaign.run(
          auditId, c.campaign_name, c.spend, c.ctr_link, c.link_clicks,
          c.lp_views, c.lp_rate, c.checkouts, c.purchases, c.cpa,
          c.cpc || 0, c.impressions || 0, c.reach || 0, c.scenario, c.hook_rate || 0
        );
        const campId = campResult.lastInsertRowid;

        if (c.recommendation) {
          insertRec.run(campId, c.recommendation.title, c.recommendation.message, JSON.stringify(c.recommendation.steps));
        }
      }

      return auditId;
    });

    const auditId = transaction();

    res.json({ id: auditId, message: 'Auditoria criada com sucesso!' });
  } catch (err) {
    console.error('Audit create error:', err);
    res.status(500).json({ error: 'Erro ao processar auditoria: ' + err.message });
  }
});

router.get('/', requireAuth, (req, res) => {
  try {
    const db = getDb();
    const audits = db.prepare(`
      SELECT a.*, 
        (SELECT COUNT(*) FROM campaigns WHERE audit_id = a.id) as campaign_count,
        (SELECT COUNT(*) FROM campaigns WHERE audit_id = a.id AND scenario = 1) as scenario1_count,
        (SELECT COUNT(*) FROM campaigns WHERE audit_id = a.id AND scenario = 2) as scenario2_count,
        (SELECT COUNT(*) FROM campaigns WHERE audit_id = a.id AND scenario = 3) as scenario3_count
      FROM audits a 
      WHERE a.user_id = ? 
      ORDER BY a.created_at DESC
    `).all(req.user.id);

    res.json({ audits });
  } catch (err) {
    console.error('Audit list error:', err);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

router.get('/:id', requireAuth, (req, res) => {
  try {
    const db = getDb();
    const audit = db.prepare('SELECT * FROM audits WHERE id = ?').get(req.params.id);

    if (!audit) return res.status(404).json({ error: 'Auditoria não encontrada.' });
    if (audit.user_id !== req.user.id && req.user.role !== 'LIDERANCA') {
      return res.status(403).json({ error: 'Sem permissão.' });
    }

    const campaigns = db.prepare('SELECT * FROM campaigns WHERE audit_id = ? ORDER BY spend DESC').all(audit.id);

    const campaignsWithRecs = campaigns.map(c => {
      const recs = db.prepare('SELECT * FROM recommendations WHERE campaign_id = ?').all(c.id);
      return { ...c, recommendations: recs };
    });

    res.json({ audit, campaigns: campaignsWithRecs });
  } catch (err) {
    console.error('Audit detail error:', err);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

module.exports = router;
