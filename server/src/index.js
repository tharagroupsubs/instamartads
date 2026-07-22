import express from 'express';
import cors from 'cors';
import multer from 'multer';
import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import { v4 as uuid } from 'uuid';

const app = express();
const PORT = process.env.PORT || 5000;
const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'uploads.json');
fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, '[]');

app.use(cors({ origin: [process.env.CLIENT_URL || 'http://localhost:5173', 'https://instamartads.vercel.app'] }));
app.use(express.json());
const upload = multer({ storage: multer.memoryStorage() });

const num = (v) => {
  if (v === undefined || v === null || v === '') return 0;
  const n = Number(String(v).replace(/[₹,% ,]/g, ''));
  return Number.isFinite(n) ? n : 0;
};
const pct = (a, b) => (b ? Number(((a / b) * 100).toFixed(2)) : 0);
const roi = (gmv, spend) => (spend ? Number((gmv / spend).toFixed(2)) : 0);
const status = (r, ctr, orders) => r >= 5 || (ctr >= 3 && orders > 0) ? 'Scale' : r >= 2 || ctr >= 1 ? 'Monitor' : 'Pause';

function readDb() { return JSON.parse(fs.readFileSync(DB_FILE, 'utf8')); }
function writeDb(data) { fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2)); }

function sheetToJson(buffer, originalname) {
  const wb = XLSX.read(buffer, { type: 'buffer' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const raw = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
  const headerIndex = raw.findIndex(r => r.includes('CAMPAIGN_ID') || r.includes('Campaign') || r.includes('Date'));
  if (headerIndex === -1) throw new Error('Header row not found. Please upload Instamart campaign CSV/XLSX export.');
  const headers = raw[headerIndex].map(h => String(h).trim());
  return raw.slice(headerIndex + 1).filter(r => r.some(Boolean)).map(row =>
    Object.fromEntries(headers.map((h, i) => [h || `COL_${i}`, row[i]]))
  );
}

function parseDate(v) {
  if (!v) return new Date().toISOString().slice(0, 10);
  if (typeof v === 'number' || (typeof v === 'string' && !isNaN(v) && Number(v) > 20000)) {
    return new Date(Math.round((Number(v) - 25569) * 86400 * 1000)).toISOString().slice(0, 10);
  }
  try {
    const d = new Date(v);
    if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  } catch (e) { }
  return String(v).slice(0, 10);
}

function buildReport(rows, fileName) {
  const r = rows[0] || {};
  const spend = num(r.TOTAL_BUDGET_BURNT || r.Spend || r.SPEND);
  const budget = num(r.TOTAL_BUDGET || r.Budget || r.BUDGET);
  const impressions = num(r.TOTAL_IMPRESSIONS || r.Impressions);
  const clicks = num(r.TOTAL_CLICKS || r.Clicks);
  const addToCart = num(r.TOTAL_A2C || r['Add to Cart']);
  const orders = num(r.TOTAL_CONVERSIONS || r.Orders);
  const gmv = num(r.TOTAL_GMV || r.GMV || r.Sales);
  const campaignName = r.CAMPAIGN_NAME || r.Campaign || fileName;
  const date = parseDate(r.Date || r.DATE || r.CAMPAIGN_START_DATE || r['Start Date']);
  const calcCtr = r.TOTAL_CTR ? num(r.TOTAL_CTR) : pct(clicks, impressions);
  const calcRoi = r.TOTAL_ROI ? num(r.TOTAL_ROI) : roi(gmv, spend);
  const ecpc = r.eCPC ? num(r.eCPC) : spend && clicks ? Number((spend / clicks).toFixed(2)) : 0;
  const cvr = pct(orders, clicks);
  const a2cRate = pct(addToCart, clicks);
  const budgetUtilized = pct(spend, budget);

  return {
    id: uuid(), fileName, uploadedAt: new Date().toISOString(), campaignName, date,
    overview: { date, budget, spend, roi: calcRoi, gmv, orders, units: orders },
    traffic: { impressions, clicks, ctr: calcCtr, ecpc, avgRank: num(r.AVG_RANK) || '-' },
    conversion: { addToCart, a2cRate, orders, cvr, gmv, roi: calcRoi },
    budget: { dailyBudget: budget, spent: spend, utilized: budgetUtilized, exhaustedTime: budgetUtilized >= 100 ? 'Early / check Ads panel' : 'Not exhausted', missedSlots: budgetUtilized >= 100 ? 'Possible missed slots' : 'No major issue' },
    organic: { totalSales: gmv, adsSales: gmv, organicSales: 0, adsPercent: 100, organicPercent: 0 },
    targets: [
      { kpi: 'ROI', target: 5, actual: calcRoi, status: calcRoi >= 5 ? 'Achieved' : 'Improve' },
      { kpi: 'CTR', target: '3%', actual: `${calcCtr}%`, status: calcCtr >= 3 ? 'Achieved' : 'Improve' },
      { kpi: 'Orders', target: '-', actual: orders, status: orders > 0 ? 'Achieved' : 'Improve' },
      { kpi: 'GMV', target: '-', actual: gmv, status: gmv > 0 ? 'Achieved' : 'Improve' },
      { kpi: 'A2C Rate', target: '-', actual: `${a2cRate}%`, status: a2cRate >= 40 ? 'Achieved' : 'Improve' },
      { kpi: 'Spend', target: budget, actual: spend, status: spend <= budget ? 'Good' : 'Over budget' }
    ],
    products: rows.filter(r => Object.keys(r).some(k => /product|sku/i.test(k))).length > 0 ? rows.filter(r => Object.keys(r).some(k => /product|sku/i.test(k))).map(r => {
      const prodKey = Object.keys(r).find(k => /product|sku/i.test(k) && !/id/i.test(k)) || Object.keys(r).find(k => /product|sku/i.test(k));
      return { product: r[prodKey], spend: num(r.Spend || r.SPEND || r.TOTAL_BUDGET_BURNT), impressions: num(r.Impressions || r.IMPRESSIONS || r.TOTAL_IMPRESSIONS), clicks: num(r.Clicks || r.CLICKS || r.TOTAL_CLICKS), orders: num(r.Orders || r.CONVERSIONS || r.TOTAL_CONVERSIONS), gmv: num(r.GMV || r.Sales || r.TOTAL_GMV), roi: roi(num(r.GMV || r.Sales || r.TOTAL_GMV), num(r.Spend || r.SPEND || r.TOTAL_BUDGET_BURNT)), status: status(roi(num(r.GMV || r.Sales || r.TOTAL_GMV), num(r.Spend || r.SPEND || r.TOTAL_BUDGET_BURNT)), pct(num(r.Clicks || r.CLICKS || r.TOTAL_CLICKS), num(r.Impressions || r.IMPRESSIONS || r.TOTAL_IMPRESSIONS)), num(r.Orders || r.CONVERSIONS || r.TOTAL_CONVERSIONS)) };
    }) : [{ product: campaignName, spend, impressions, clicks, orders, gmv, roi: calcRoi, status: status(calcRoi, calcCtr, orders) }],
    keywords: rows.filter(r => Object.keys(r).some(k => /keyword|search/i.test(k))).map(r => {
      const kwKey = Object.keys(r).find(k => /keyword|search/i.test(k) && !/id/i.test(k)) || Object.keys(r).find(k => /keyword|search/i.test(k));
      return { keyword: r[kwKey], spend: num(r.Spend || r.SPEND || r.TOTAL_BUDGET_BURNT), impressions: num(r.Impressions || r.IMPRESSIONS || r.TOTAL_IMPRESSIONS), clicks: num(r.Clicks || r.CLICKS || r.TOTAL_CLICKS), orders: num(r.Orders || r.CONVERSIONS || r.TOTAL_CONVERSIONS), gmv: num(r.GMV || r.Sales || r.TOTAL_GMV), roi: roi(num(r.GMV || r.Sales || r.TOTAL_GMV), num(r.Spend || r.SPEND || r.TOTAL_BUDGET_BURNT)), status: status(roi(num(r.GMV || r.Sales || r.TOTAL_GMV), num(r.Spend || r.SPEND || r.TOTAL_BUDGET_BURNT)), pct(num(r.Clicks || r.CLICKS || r.TOTAL_CLICKS), num(r.Impressions || r.IMPRESSIONS || r.TOTAL_IMPRESSIONS)), num(r.Orders || r.CONVERSIONS || r.TOTAL_CONVERSIONS)) };
    }),
    cities: rows.filter(r => Object.keys(r).some(k => /city/i.test(k))).map(r => {
      const cityKey = Object.keys(r).find(k => /city/i.test(k) && !/id/i.test(k)) || Object.keys(r).find(k => /city/i.test(k));
      return { city: r[cityKey], impressions: num(r.Impressions || r.IMPRESSIONS || r.TOTAL_IMPRESSIONS), orders: num(r.Orders || r.CONVERSIONS || r.TOTAL_CONVERSIONS), gmv: num(r.GMV || r.Sales || r.TOTAL_GMV), roi: roi(num(r.GMV || r.Sales || r.TOTAL_GMV), num(r.Spend || r.SPEND || r.TOTAL_BUDGET_BURNT)) };
    }),
    insights: {
      bestProduct: campaignName,
      bestKeyword: 'Upload keyword report to calculate',
      bestCity: 'Upload city report to calculate',
      worstKeyword: '-',
      worstProduct: calcRoi < 2 ? campaignName : '-',
      budgetExhaustedTime: budgetUtilized >= 100 ? 'Budget fully used / check exact time in Instamart' : 'Not exhausted',
      missedOpportunity: budgetUtilized >= 100 ? 'Increase daily budget if ROI remains healthy.' : 'Keep budget stable and monitor.',
      actionTomorrow: calcRoi >= 5 ? 'Scale budget and bids slowly.' : calcRoi >= 2 ? 'Monitor and optimize low CTR areas.' : 'Pause weak campaigns and reduce spend.'
    }
  };
}

app.post('/api/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'File is required' });
    const rows = sheetToJson(req.file.buffer, req.file.originalname);
    const report = buildReport(rows, req.file.originalname);
    const db = readDb(); db.unshift(report); writeDb(db);
    res.json(report);
  } catch (e) { res.status(400).json({ message: e.message }); }
});
app.get('/api/reports', (_, res) => res.json(readDb()));
app.get('/api/reports/:id', (req, res) => {
  const report = readDb().find(x => x.id === req.params.id);
  if (!report) return res.status(404).json({ message: 'Report not found' });
  res.json(report);
});
app.delete('/api/reports/:id', (req, res) => { writeDb(readDb().filter(x => x.id !== req.params.id)); res.json({ ok: true }); });
app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
