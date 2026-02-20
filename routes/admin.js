const express = require('express');
const { getDb } = require('../db/database');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);
router.use(requireRole('LIDERANCA'));

router.get('/summary', (req, res) => {
  try {
    const db = getDb();
    const { from, to, product_type } = req.query;

    let dateFilter = '';
    const params = [];
    if (from) {
      dateFilter += ' AND a.created_at >= ?';
      params.push(from);
    }
    if (to) {
      dateFilter += ' AND a.created_at <= ?';
      params.push(to);
    }
    if (product_type) {
      dateFilter += ' AND a.product_type = ?';
      params.push(product_type);
    }

    const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users WHERE role = ?').get('MENTORADO');
    const totalAudits = db.prepare(`SELECT COUNT(*) as count FROM audits a WHERE 1=1 ${dateFilter}`).get(...params);
    
    const scenarioCounts = db.prepare(`
      SELECT 
        SUM(CASE WHEN c.scenario = 1 THEN 1 ELSE 0 END) as s1,
        SUM(CASE WHEN c.scenario = 2 THEN 1 ELSE 0 END) as s2,
        SUM(CASE WHEN c.scenario = 3 THEN 1 ELSE 0 END) as s3,
        COUNT(*) as total,
        AVG(c.spend) as avg_spend,
        AVG(c.cpa) as avg_cpa,
        AVG(c.ctr_link) as avg_ctr,
        SUM(c.spend) as total_spend,
        SUM(c.purchases) as total_purchases
      FROM campaigns c 
      JOIN audits a ON c.audit_id = a.id 
      WHERE 1=1 ${dateFilter}
    `).get(...params);

    const perUserAvg = db.prepare(`
      SELECT 
        AVG(user_spend) as avg_spend_per_user,
        AVG(user_purchases) as avg_purchases_per_user,
        AVG(CASE WHEN user_purchases > 0 THEN user_spend / user_purchases ELSE 0 END) as avg_cpa_per_user,
        AVG(user_revenue) as avg_revenue_per_user
      FROM (
        SELECT a.user_id, SUM(c.spend) as user_spend, SUM(c.purchases) as user_purchases,
          SUM(c.purchases * a.product_price) as user_revenue
        FROM campaigns c
        JOIN audits a ON c.audit_id = a.id
        WHERE a.id IN (
          SELECT MAX(a2.id) FROM audits a2 WHERE 1=1 ${dateFilter} GROUP BY a2.user_id
        )
        GROUP BY a.user_id
      )
    `).get(...params);

    const recentAudits = db.prepare(`
      SELECT a.*, u.name as user_name, u.email as user_email,
        (SELECT COUNT(*) FROM campaigns WHERE audit_id = a.id) as campaign_count
      FROM audits a 
      JOIN users u ON a.user_id = u.id 
      WHERE 1=1 ${dateFilter}
      ORDER BY a.created_at DESC LIMIT 10
    `).all(...params);

    const roasRanking = db.prepare(`
      SELECT u.id, u.name, u.email,
        SUM(c.spend) as total_spend,
        SUM(c.purchases) as total_purchases,
        SUM(c.purchases * a.product_price) as total_revenue,
        COALESCE(
          (SUM(c.purchases * a.product_price) * 1.0) / NULLIF(SUM(c.spend), 0),
          0
        ) as roas
      FROM users u
      JOIN audits a ON a.user_id = u.id
      JOIN campaigns c ON c.audit_id = a.id
      WHERE u.role = 'MENTORADO' ${dateFilter}
      GROUP BY u.id
      HAVING SUM(c.spend) > 0
      ORDER BY roas DESC
    `).all(...params);

    const half = Math.ceil(roasRanking.length / 2);
    const bestRoas = roasRanking.slice(0, Math.min(3, half));
    const worstRoas = roasRanking.slice(Math.max(roasRanking.length - 3, half)).reverse();

    const ctrRanking = db.prepare(`
      SELECT u.id, u.name, u.email,
        SUM(c.link_clicks) as total_clicks,
        SUM(c.impressions) as total_impressions,
        CASE WHEN SUM(c.impressions) > 0 THEN (SUM(c.link_clicks) * 1.0) / SUM(c.impressions) ELSE 0 END as ctr
      FROM users u
      JOIN audits a ON a.user_id = u.id
      JOIN campaigns c ON c.audit_id = a.id
      WHERE u.role = 'MENTORADO' ${dateFilter}
      GROUP BY u.id
      HAVING SUM(c.impressions) > 0
      ORDER BY ctr DESC
    `).all(...params);

    const halfCtr = Math.ceil(ctrRanking.length / 2);
    const bestCtr = ctrRanking.slice(0, Math.min(3, halfCtr));
    const worstCtr = ctrRanking.slice(Math.max(ctrRanking.length - 3, halfCtr)).reverse();

    const convRanking = db.prepare(`
      SELECT u.id, u.name, u.email,
        SUM(c.purchases) as total_purchases,
        SUM(c.lp_views) as total_lp_views,
        CASE WHEN SUM(c.lp_views) > 0 THEN (SUM(c.purchases) * 1.0) / SUM(c.lp_views) ELSE 0 END as conv_rate
      FROM users u
      JOIN audits a ON a.user_id = u.id
      JOIN campaigns c ON c.audit_id = a.id
      WHERE u.role = 'MENTORADO' ${dateFilter}
      GROUP BY u.id
      HAVING SUM(c.lp_views) > 0
      ORDER BY conv_rate DESC
    `).all(...params);

    const halfConv = Math.ceil(convRanking.length / 2);
    const bestConv = convRanking.slice(0, Math.min(3, halfConv));
    const worstConv = convRanking.slice(Math.max(convRanking.length - 3, halfConv)).reverse();

    res.json({
      totalUsers: totalUsers.count,
      totalAudits: totalAudits.count,
      scenarios: scenarioCounts,
      avgPerUser: perUserAvg,
      bestRoas,
      worstRoas,
      bestCtr,
      worstCtr,
      bestConv,
      worstConv,
      recentAudits
    });
  } catch (err) {
    console.error('Admin summary error:', err);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

router.get('/users', (req, res) => {
  try {
    const db = getDb();
    const users = db.prepare(`
      SELECT u.id, u.name, u.email, u.role, u.created_at,
        (SELECT COUNT(*) FROM audits WHERE user_id = u.id) as audit_count,
        (SELECT MAX(created_at) FROM audits WHERE user_id = u.id) as last_audit
      FROM users u 
      WHERE u.role = 'MENTORADO'
      ORDER BY u.name
    `).all();

    res.json({ users });
  } catch (err) {
    console.error('Admin users error:', err);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

router.get('/users/:id/audits', (req, res) => {
  try {
    const db = getDb();
    const user = db.prepare('SELECT id, name, email, role, created_at FROM users WHERE id = ?').get(req.params.id);
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado.' });

    const audits = db.prepare(`
      SELECT a.*,
        (SELECT COUNT(*) FROM campaigns WHERE audit_id = a.id) as campaign_count,
        (SELECT COUNT(*) FROM campaigns WHERE audit_id = a.id AND scenario = 1) as scenario1_count,
        (SELECT COUNT(*) FROM campaigns WHERE audit_id = a.id AND scenario = 2) as scenario2_count,
        (SELECT COUNT(*) FROM campaigns WHERE audit_id = a.id AND scenario = 3) as scenario3_count
      FROM audits a 
      WHERE a.user_id = ? 
      ORDER BY a.created_at DESC
    `).all(req.params.id);

    res.json({ user, audits });
  } catch (err) {
    console.error('Admin user audits error:', err);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

router.get('/audits/:id', (req, res) => {
  try {
    const db = getDb();
    const audit = db.prepare(`
      SELECT a.*, u.name as user_name, u.email as user_email 
      FROM audits a JOIN users u ON a.user_id = u.id 
      WHERE a.id = ?
    `).get(req.params.id);

    if (!audit) return res.status(404).json({ error: 'Auditoria não encontrada.' });

    const campaigns = db.prepare('SELECT * FROM campaigns WHERE audit_id = ? ORDER BY spend DESC').all(audit.id);
    const campaignsWithRecs = campaigns.map(c => {
      const recs = db.prepare('SELECT * FROM recommendations WHERE campaign_id = ?').all(c.id);
      return { ...c, recommendations: recs };
    });

    res.json({ audit, campaigns: campaignsWithRecs });
  } catch (err) {
    console.error('Admin audit detail error:', err);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

module.exports = router;
