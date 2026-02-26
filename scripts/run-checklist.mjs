import fs from 'node:fs';

const baseUrl = 'http://localhost:3000';
const report = [];

function ok(step, extra = {}) {
  report.push({ step, ok: true, ...extra });
}

function fail(step, error, extra = {}) {
  report.push({ step, ok: false, error: String(error), ...extra });
}

async function asJson(response) {
  const text = await response.text();
  try {
    return { raw: text, json: JSON.parse(text) };
  } catch {
    return { raw: text, json: null };
  }
}

async function main() {
  const unique = Date.now();
  const menteeEmail = `checklist_${unique}@example.com`;
  const menteePassword = '123456';
  let menteeToken = '';
  let menteeId = 0;
  let leaderToken = '';
  let auditId = 0;
  let campaignId = 0;

  try {
    // 1) Register mentee
    {
      const res = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Checklist Mentorado',
          email: menteeEmail,
          password: menteePassword
        })
      });
      const body = await asJson(res);
      if (res.status === 200 && body.json?.token) {
        menteeToken = body.json.token;
        menteeId = body.json.user?.id || 0;
        ok('register mentee', { status: res.status, menteeEmail });
      } else {
        fail('register mentee', `status ${res.status}`, { body: body.raw.slice(0, 300) });
      }
    }

    // 2) Login mentee
    {
      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: menteeEmail, password: menteePassword })
      });
      const body = await asJson(res);
      if (res.status === 200 && body.json?.token) {
        menteeToken = body.json.token;
        menteeId = menteeId || body.json.user?.id || 0;
        ok('login mentee', { status: res.status });
      } else {
        fail('login mentee', `status ${res.status}`, { body: body.raw.slice(0, 300) });
      }
    }

    // 3) Upload audit
    {
      const csvBuffer = fs.readFileSync('tmp/checklist-upload.csv');
      const fd = new FormData();
      fd.append('product_price', '97');
      fd.append('product_type', 'low_ticket');
      fd.append('has_pre_checkout', 'false');
      fd.append('file', new Blob([csvBuffer], { type: 'text/csv' }), 'checklist-upload.csv');

      const res = await fetch(`${baseUrl}/api/audits`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${menteeToken}` },
        body: fd
      });
      const body = await asJson(res);
      if (res.status === 200 && body.json?.id) {
        auditId = body.json.id;
        ok('upload audit', { status: res.status, auditId });
      } else {
        fail('upload audit', `status ${res.status}`, { body: body.raw.slice(0, 300) });
      }
    }

    // 4) List audits
    {
      const res = await fetch(`${baseUrl}/api/audits`, {
        headers: { Authorization: `Bearer ${menteeToken}` }
      });
      const body = await asJson(res);
      const list = body.json?.audits || [];
      if (res.status === 200 && Array.isArray(list) && list.length > 0) {
        ok('list audits', { status: res.status, count: list.length });
      } else {
        fail('list audits', `status ${res.status}`, { body: body.raw.slice(0, 300) });
      }
    }

    // 5) Audit detail
    {
      const res = await fetch(`${baseUrl}/api/audits/${auditId}`, {
        headers: { Authorization: `Bearer ${menteeToken}` }
      });
      const body = await asJson(res);
      const campaigns = body.json?.campaigns || [];
      if (res.status === 200 && Array.isArray(campaigns) && campaigns.length > 0) {
        campaignId = campaigns[0].id;
        ok('audit detail', { status: res.status, campaigns: campaigns.length, campaignId });
      } else {
        fail('audit detail', `status ${res.status}`, { body: body.raw.slice(0, 300) });
      }
    }

    // 6) Creative campaigns by audit
    {
      const res = await fetch(`${baseUrl}/api/creatives/campaigns/${auditId}`, {
        headers: { Authorization: `Bearer ${menteeToken}` }
      });
      const body = await asJson(res);
      const campaigns = body.json?.campaigns || [];
      if (res.status === 200 && Array.isArray(campaigns) && campaigns.length > 0) {
        ok('creatives campaigns by audit', { status: res.status, campaigns: campaigns.length });
      } else {
        fail('creatives campaigns by audit', `status ${res.status}`, { body: body.raw.slice(0, 300) });
      }
    }

    // 7) Create creative
    {
      const res = await fetch(`${baseUrl}/api/creatives`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${menteeToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          audit_id: auditId,
          items: [
            {
              campaign_id: campaignId,
              copy_text: 'Copy de teste com prova e resultado para validar análise.',
              video_link: 'https://example.com/video'
            }
          ]
        })
      });
      const body = await asJson(res);
      const creatives = body.json?.creatives || [];
      if (res.status === 200 && Array.isArray(creatives) && creatives.length > 0) {
        ok('create creative', { status: res.status, creatives: creatives.length });
      } else {
        fail('create creative', `status ${res.status}`, { body: body.raw.slice(0, 300) });
      }
    }

    // 8) My creatives
    {
      const res = await fetch(`${baseUrl}/api/creatives/my`, {
        headers: { Authorization: `Bearer ${menteeToken}` }
      });
      const body = await asJson(res);
      const creatives = body.json?.creatives || [];
      if (res.status === 200 && Array.isArray(creatives)) {
        ok('my creatives', { status: res.status, creatives: creatives.length });
      } else {
        fail('my creatives', `status ${res.status}`, { body: body.raw.slice(0, 300) });
      }
    }

    // 9) Login leadership
    {
      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'ellen@vtsd.com.br', password: '123' })
      });
      const body = await asJson(res);
      if (res.status === 200 && body.json?.token) {
        leaderToken = body.json.token;
        ok('login leadership', { status: res.status });
      } else {
        fail('login leadership', `status ${res.status}`, { body: body.raw.slice(0, 300) });
      }
    }

    // 10) Admin summary
    {
      const res = await fetch(`${baseUrl}/api/admin/summary`, {
        headers: { Authorization: `Bearer ${leaderToken}` }
      });
      const body = await asJson(res);
      if (res.status === 200 && body.json?.totalUsers !== undefined) {
        ok('admin summary', { status: res.status, totalUsers: body.json.totalUsers });
      } else {
        fail('admin summary', `status ${res.status}`, { body: body.raw.slice(0, 300) });
      }
    }

    // 11) Admin users
    {
      const res = await fetch(`${baseUrl}/api/admin/users`, {
        headers: { Authorization: `Bearer ${leaderToken}` }
      });
      const body = await asJson(res);
      const users = body.json?.users || [];
      if (res.status === 200 && Array.isArray(users) && users.length > 0) {
        ok('admin users', { status: res.status, users: users.length });
      } else {
        fail('admin users', `status ${res.status}`, { body: body.raw.slice(0, 300) });
      }
    }

    // 12) Admin user audits
    {
      const res = await fetch(`${baseUrl}/api/admin/users/${menteeId}/audits`, {
        headers: { Authorization: `Bearer ${leaderToken}` }
      });
      const body = await asJson(res);
      const audits = body.json?.audits || [];
      if (res.status === 200 && Array.isArray(audits)) {
        ok('admin user audits', { status: res.status, audits: audits.length });
      } else {
        fail('admin user audits', `status ${res.status}`, { body: body.raw.slice(0, 300) });
      }
    }

    // 13) Admin audit detail
    {
      const res = await fetch(`${baseUrl}/api/admin/audits/${auditId}`, {
        headers: { Authorization: `Bearer ${leaderToken}` }
      });
      const body = await asJson(res);
      const campaigns = body.json?.campaigns || [];
      if (res.status === 200 && Array.isArray(campaigns) && campaigns.length > 0) {
        ok('admin audit detail', { status: res.status, campaigns: campaigns.length });
      } else {
        fail('admin audit detail', `status ${res.status}`, { body: body.raw.slice(0, 300) });
      }
    }

    // 14) Admin creatives all
    {
      const res = await fetch(`${baseUrl}/api/creatives/all`, {
        headers: { Authorization: `Bearer ${leaderToken}` }
      });
      const body = await asJson(res);
      const creatives = body.json?.creatives || [];
      if (res.status === 200 && Array.isArray(creatives)) {
        ok('admin creatives all', { status: res.status, creatives: creatives.length });
      } else {
        fail('admin creatives all', `status ${res.status}`, { body: body.raw.slice(0, 300) });
      }
    }
  } catch (error) {
    fail('fatal', error);
  }

  const passed = report.filter(r => r.ok).length;
  const total = report.length;
  const failed = total - passed;
  console.log(JSON.stringify({ passed, failed, total, report }, null, 2));
  process.exit(failed > 0 ? 1 : 0);
}

main();
