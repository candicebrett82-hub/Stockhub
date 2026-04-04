"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { getSupabase } from "@/lib/supabase";

/* ═══════════════════════════════════════════════════════════════
   STOCKHUB — Warehouse Stock Register
   Products · Serials · Goods In · Goods Out (from QW) · Costs
   ═══════════════════════════════════════════════════════════════ */

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
const money = (n) => "\u00A3" + Number(n || 0).toFixed(2);
const fd = d => { if (!d) return "\u2014"; try { return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }); } catch { return "\u2014"; } };
const today = () => new Date().toISOString().slice(0, 10);

const T = { bg: "#f5f4f0", surface: "#fff", border: "#e3e0d9", text: "#1a1a18", muted: "#807b72", accent: "#1a5c3a", accentBg: "#e6f4ec", accentDk: "#0e3d25", sidebar: "#1e2330", sideText: "#9da5b8", sideAct: "#fff", danger: "#b91c1c", dangerBg: "#fef2f2" };
const MF = "'JetBrains Mono',monospace";
const bp = { background: T.accent, color: "#fff", border: "none", padding: "8px 18px", borderRadius: 6, fontWeight: 600, cursor: "pointer", fontSize: 13, fontFamily: "inherit" };
const bs = { background: T.bg, border: `1px solid ${T.border}`, padding: "7px 14px", borderRadius: 6, cursor: "pointer", fontSize: 13, fontFamily: "inherit", fontWeight: 500 };
const bsm = { ...bs, padding: "4px 10px", fontSize: 12 };
const bd = { background: T.dangerBg, color: T.danger, border: "none", padding: "7px 14px", borderRadius: 6, fontWeight: 600, cursor: "pointer", fontSize: 13, fontFamily: "inherit" };
const iS = { width: "100%", padding: "8px 10px", border: `1px solid ${T.border}`, borderRadius: 6, background: "#fff", fontFamily: "inherit", fontSize: 13, boxSizing: "border-box" };
const lS = { fontSize: 11, fontWeight: 600, color: T.muted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4, display: "block" };
const thS = { padding: "10px 14px", textAlign: "left", fontSize: 11, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: 0.5 };
const tdS = { padding: "12px 14px" };
const SER_STY = { in_stock: { l: "In Stock", bg: "#dcfce7", c: "#16a34a" }, dispatched: { l: "Dispatched", bg: "#eef1f5", c: "#6b7280" } };
const GI_STY = { pending: { l: "Pending", bg: "#fef3c7", c: "#d97706" }, received: { l: "Received", bg: "#dcfce7", c: "#16a34a" } };

function Badge({ status, map }) { const st = (map || {})[status] || { l: status, bg: "#eee", c: "#666" }; return <span style={{ display: "inline-flex", padding: "3px 10px", borderRadius: 99, fontSize: 11, fontWeight: 600, background: st.bg, color: st.c }}>{st.l}</span>; }
function Overlay({ children, onClose, width }) { return <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, backdropFilter: "blur(2px)" }}><div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 14, width: width || 520, maxWidth: "92vw", maxHeight: "90vh", overflow: "auto", animation: "popIn .2s ease", boxShadow: "0 20px 60px rgba(0,0,0,.2)" }}>{children}</div></div>; }

function useStore(key, fallback) {
  const [data, setData] = useState(fallback);
  const [ready, setReady] = useState(false);
  const ref = useRef(data); ref.current = data;
  useEffect(() => {
    let c = false;
    (async () => {
      try {
        const sb = getSupabase();
        const { data: row } = await sb.from("kv_store").select("value").eq("key", key).single();
        if (!c && row?.value) { setData(row.value); ref.current = row.value; }
      } catch {}
      if (!c) setReady(true);
    })();
    return () => { c = true; };
  }, [key]);
  const save = useCallback(async u => {
    const n = typeof u === "function" ? u(ref.current) : u;
    ref.current = n; setData(n);
    try {
      const sb = getSupabase();
      await sb.from("kv_store").upsert({ key, value: n }, { onConflict: "key" });
    } catch (e) { console.error("Save error:", e); }
    return n;
  }, [key]);
  return [data, save, ready];
}

// 47 products from AZTEK_STOCK_SHEET_2026.xlsx (as at 31 March 2026)
const D_PROD = [
  {id:"p1",sku:"DMS502B51",name:"DMS502B51",category:"Controls",costPrice:1133.56,salePrice:1530.31,totalQty:1,availableQty:1},
  {id:"p2",sku:"DCM601B51",name:"DCM601B51",category:"Controls",costPrice:2340.56,salePrice:3159.76,totalQty:1,availableQty:0},
  {id:"p3",sku:"BRC073A1",name:"BRC073A1",category:"Controls",costPrice:80.92,salePrice:109.24,totalQty:7,availableQty:7},
  {id:"p4",sku:"BRC1E53A7",name:"BRC1E53A7",category:"Controls",costPrice:84.32,salePrice:113.83,totalQty:5,availableQty:5},
  {id:"p5",sku:"BRC1H52W",name:"BRC1H52W",category:"Controls",costPrice:79.46,salePrice:107.27,totalQty:11,availableQty:11},
  {id:"p6",sku:"BRC7EA628",name:"BRC7EA628",category:"Controls",costPrice:135.32,salePrice:182.68,totalQty:2,availableQty:2},
  {id:"p7",sku:"BRP069B45",name:"BRP069B45",category:"Controls",costPrice:47.16,salePrice:63.67,totalQty:4,availableQty:4},
  {id:"p8",sku:"BRCW901A03",name:"BRCW901A03",category:"Controls",costPrice:11.56,salePrice:15.61,totalQty:1,availableQty:1},
  {id:"p9",sku:"EKRS21",name:"EKRS21",category:"Controls",costPrice:5.82,salePrice:7.86,totalQty:0,availableQty:0},
  {id:"p10",sku:"KRP928BB2S",name:"KRP928BB2S",category:"Controls",costPrice:43.52,salePrice:58.75,totalQty:2,availableQty:2},
  {id:"p11",sku:"KRP413BB1S",name:"KRP413BB1S",category:"Controls",costPrice:78.88,salePrice:106.49,totalQty:1,availableQty:1},
  {id:"p12",sku:"EKAFVJ100F7",name:"EKAFVJ100F7",category:"Controls",costPrice:157.08,salePrice:212.06,totalQty:4,availableQty:4},
  {id:"p13",sku:"2MXM68A2V1B9",name:"2MXM68A2V1B9",category:"Outdoor Units",costPrice:1371.56,salePrice:1851.61,totalQty:0,availableQty:0},
  {id:"p14",sku:"3MXM52A2V1B9",name:"3MXM52A2V1B9",category:"Outdoor Units",costPrice:1197.48,salePrice:1616.6,totalQty:0,availableQty:0},
  {id:"p15",sku:"4MXM68A2V1B",name:"4MXM68A2V1B",category:"Outdoor Units",costPrice:2058.36,salePrice:2778.79,totalQty:0,availableQty:0},
  {id:"p16",sku:"5MXM90A",name:"5MXM90A",category:"Outdoor Units",costPrice:2085.76,salePrice:2815.78,totalQty:1,availableQty:1},
  {id:"p17",sku:"ARXM71A",name:"ARXM71A",category:"Outdoor Units",costPrice:696.96,salePrice:940.9,totalQty:2,availableQty:2},
  {id:"p18",sku:"AZAS100MV1",name:"AZAS100MV1",category:"Outdoor Units",costPrice:856.03,salePrice:1155.64,totalQty:0,availableQty:0},
  {id:"p19",sku:"RXM35A5V1B9",name:"RXM35A5V1B9",category:"Outdoor Units",costPrice:501.94,salePrice:677.62,totalQty:0,availableQty:0},
  {id:"p20",sku:"RXP25N5V1B9",name:"RXP25N5V1B9",category:"Outdoor Units",costPrice:321.92,salePrice:434.59,totalQty:3,availableQty:3},
  {id:"p21",sku:"RXP35N5V1B9",name:"RXP35N5V1B9",category:"Outdoor Units",costPrice:373.76,salePrice:504.58,totalQty:2,availableQty:2},
  {id:"p22",sku:"RXP50N8",name:"RXP50N8",category:"Outdoor Units",costPrice:486.4,salePrice:656.64,totalQty:2,availableQty:2},
  {id:"p23",sku:"RZAG35B5V1B",name:"RZAG35B5V1B",category:"Outdoor Units",costPrice:734.72,salePrice:991.87,totalQty:0,availableQty:0},
  {id:"p24",sku:"RZAG50B5V1B",name:"RZAG50B5V1B",category:"Outdoor Units",costPrice:896.64,salePrice:1210.46,totalQty:2,availableQty:2},
  {id:"p25",sku:"CTXM15A",name:"CTXM15A",category:"Indoor Units",costPrice:138.72,salePrice:187.27,totalQty:3,availableQty:3},
  {id:"p26",sku:"FAA100B",name:"FAA100B",category:"Indoor Units",costPrice:714.88,salePrice:965.09,totalQty:0,availableQty:0},
  {id:"p27",sku:"FAA71B",name:"FAA71B",category:"Indoor Units",costPrice:656.0,salePrice:885.6,totalQty:2,availableQty:2},
  {id:"p28",sku:"FTXA35C2V1BB",name:"FTXA35C2V1BB",category:"Indoor Units",costPrice:346.9,salePrice:468.31,totalQty:1,availableQty:1},
  {id:"p29",sku:"FTXA50C2V1BW",name:"FTXA50C2V1BW",category:"Indoor Units",costPrice:435.5,salePrice:587.93,totalQty:1,availableQty:1},
  {id:"p30",sku:"FTXF25F52U1B",name:"FTXF25F52U1B",category:"Indoor Units",costPrice:88.4,salePrice:119.34,totalQty:1,availableQty:1},
  {id:"p31",sku:"FTXP25N5V1B",name:"FTXP25N5V1B",category:"Indoor Units",costPrice:113.28,salePrice:152.93,totalQty:3,availableQty:2},
  {id:"p32",sku:"FTXP35N5V1B9",name:"FTXP35N5V1B9",category:"Indoor Units",costPrice:127.36,salePrice:171.94,totalQty:0,availableQty:0},
  {id:"p33",sku:"FTXP50N5V1B9",name:"FTXP50N5V1B9",category:"Indoor Units",costPrice:206.72,salePrice:279.07,totalQty:3,availableQty:3},
  {id:"p34",sku:"FTXM25R2V1B",name:"FTXM25R2V1B",category:"Indoor Units",costPrice:146.64,salePrice:197.96,totalQty:0,availableQty:0},
  {id:"p35",sku:"FTXM35A2V1B",name:"FTXM35A2V1B",category:"Indoor Units",costPrice:170.88,salePrice:230.69,totalQty:0,availableQty:0},
  {id:"p36",sku:"FDXM35F3V1B9",name:"FDXM35F3V1B9",category:"Indoor Units",costPrice:357.12,salePrice:482.11,totalQty:2,availableQty:2},
  {id:"p37",sku:"FDXM50F3V1B9",name:"FDXM50F3V1B9",category:"Indoor Units",costPrice:392.96,salePrice:530.5,totalQty:1,availableQty:0},
  {id:"p38",sku:"MC55VBFVM7",name:"MC55VBFVM7",category:"Indoor Units",costPrice:229.16,salePrice:309.37,totalQty:5,availableQty:5},
  {id:"p39",sku:"KHRQ23M75T8",name:"KHRQ23M75T8",category:"Parts",costPrice:70.85,salePrice:95.65,totalQty:5,availableQty:5},
  {id:"p40",sku:"KHRQ23M64T",name:"KHRQ23M64T",category:"Parts",costPrice:55.9,salePrice:75.47,totalQty:1,availableQty:1},
  {id:"p41",sku:"KHRQ23M20T",name:"KHRQ23M20T",category:"Parts",costPrice:40.8,salePrice:55.08,totalQty:0,availableQty:0},
  {id:"p42",sku:"KHRQ22M20T8",name:"KHRQ22M20T8",category:"Parts",costPrice:25.84,salePrice:34.88,totalQty:0,availableQty:0},
  {id:"p43",sku:"KHRQ23M64T8",name:"KHRQ23M64T8",category:"Parts",costPrice:55.9,salePrice:75.47,totalQty:0,availableQty:0},
  {id:"p44",sku:"BS4A14AV1B",name:"BS4A14AV1B",category:"Outdoor Units",costPrice:1624.46,salePrice:2193.02,totalQty:1,availableQty:1},
  {id:"p45",sku:"AZAI16WSCDK1",name:"AZAI16WSCDK1",category:"Parts",costPrice:195.84,salePrice:264.38,totalQty:0,availableQty:0},
  {id:"p46",sku:"5035698",name:"5035698",category:"Parts",costPrice:23.03,salePrice:31.09,totalQty:0,availableQty:0},
  {id:"p47",sku:"4016600 - Fan Motor",name:"4016600 - Fan Motor",category:"Parts",costPrice:596.05,salePrice:804.67,totalQty:1,availableQty:1},
];

// ══════════════════════════════════════════════════════════════
export default function App() {
  const [products, setProd, r1] = useStore("products", D_PROD);
  const [serials, setSer, r2] = useStore("serials", []);       // {id, productId, serial, status:"in_stock"|"dispatched", customer, qwRef, dispatchDate, addedDate}
  const [goodsIn, setGI, r3] = useStore("goods_in", []);       // {id, supplier, supplierRef, items, notes, created, receivedDate, status}
  const [dispatches, setDisp, r4] = useStore("dispatches", []);    // {id, customer, qwRef, items:[{sku, serial, productId, qty}], date, importedDate}
  const [page, setPage] = useState("dashboard");
  const [modal, setModal] = useState(null);
  const [search, setSearch] = useState("");
  const [catFilter, setCF] = useState("all");
  const [toast, setToast] = useState(null);
  const ready = r1 && r2 && r3 && r4;

  const flash = m => { setToast(m); setTimeout(() => setToast(null), 2400); };
  const ff = (arr, id) => arr.find(x => x.id === id);

  const totalUnits = products.reduce((s, p) => s + (p.totalQty || 0), 0);
  const totalAvail = products.reduce((s, p) => s + (p.availableQty || 0), 0);
  const totalValue = products.reduce((s, p) => s + (p.totalQty || 0) * (p.costPrice || 0), 0);
  const categories = [...new Set(products.map(p => p.category))].sort();
  const inStockSerials = serials.filter(s => s.status === "in_stock").length;
  const dispatchedSerials = serials.filter(s => s.status === "dispatched").length;

  // ── Product CRUD ──────────────
  const saveProd = p => { setProd(prev => p.id ? prev.map(x => x.id === p.id ? p : x) : [...prev, { ...p, id: uid() }]); flash("Saved"); setModal(null); };
  const addSer = (pid, sn) => { if (serials.some(s => s.serial === sn)) { flash("Serial exists!"); return false; } setSer(p => [...p, { id: uid(), productId: pid, serial: sn, status: "in_stock", customer: "", qwRef: "", dispatchDate: "", addedDate: today() }]); flash("Serial added"); return true; };
  const delSer = id => { const s = ff(serials, id); if (s?.status !== "in_stock") { flash("Only in-stock"); return; } setSer(p => p.filter(x => x.id !== id)); flash("Removed"); };

  // ── Goods In ──────────────────
  const saveGI = g => { const isNew = !g.id; const rec = isNew ? { ...g, id: uid(), created: today(), status: "pending" } : g; setGI(prev => isNew ? [...prev, rec] : prev.map(x => x.id === rec.id ? rec : x)); flash(isNew ? "Recorded" : "Updated"); setModal(null); };
  const receiveGI = (gid, newSerials) => {
    const g = ff(goodsIn, gid); if (!g) return;
    (newSerials || []).forEach(s => { if (s.serial.trim()) addSer(s.productId, s.serial.trim()); });
    const byProd = {}, costByProd = {};
    g.items.forEach(it => { byProd[it.productId] = (byProd[it.productId] || 0) + (it.qty || 1); costByProd[it.productId] = it.unitCost || 0; });
    setProd(prev => prev.map(p => {
      if (!byProd[p.id]) return p;
      const add = byProd[p.id], nc = costByProd[p.id];
      const hist = [...(p.costHistory || []), { date: today(), cost: nc, supplier: g.supplier, qty: add, ref: g.supplierRef || "" }];
      return { ...p, totalQty: (p.totalQty || 0) + add, availableQty: (p.availableQty || 0) + add, costPrice: nc > 0 ? nc : p.costPrice, lastCostDate: today(), lastCostSupplier: g.supplier, costHistory: hist };
    }));
    setGI(prev => prev.map(x => x.id === gid ? { ...x, status: "received", receivedDate: today() } : x));
    flash("Stock received"); setModal(null);
  };

  // ── Goods Out (import from QW) ──
  const importDispatches = (rows) => {
    // rows: [{customer, qwRef, sku, serial, qty, date}]
    // For each row: mark serial as dispatched, deduct stock, create dispatch record
    const dispatchMap = {};
    rows.forEach(r => {
      const key = r.qwRef || r.customer || uid();
      if (!dispatchMap[key]) dispatchMap[key] = { customer: r.customer || "", qwRef: r.qwRef || "", date: r.date || today(), items: [] };
      dispatchMap[key].items.push({ sku: r.sku || "", serial: r.serial || "", qty: parseInt(r.qty) || 1 });
    });

    const newDispatches = Object.values(dispatchMap).map(d => ({ ...d, id: uid(), importedDate: today() }));
    setDisp(prev => [...prev, ...newDispatches]);

    // Mark serials as dispatched and deduct stock
    const serialsToDispatch = rows.filter(r => r.serial).map(r => r.serial.trim()).filter(Boolean);
    const stockDeductions = {};
    rows.forEach(r => {
      const prod = products.find(p => p.sku === r.sku);
      if (prod) stockDeductions[prod.id] = (stockDeductions[prod.id] || 0) + (parseInt(r.qty) || 1);
    });

    setSer(prev => prev.map(s => serialsToDispatch.includes(s.serial) ? { ...s, status: "dispatched", customer: rows.find(r => r.serial === s.serial)?.customer || "", qwRef: rows.find(r => r.serial === s.serial)?.qwRef || "", dispatchDate: today() } : s));
    setProd(prev => prev.map(p => stockDeductions[p.id] ? { ...p, totalQty: Math.max(0, (p.totalQty || 0) - stockDeductions[p.id]), availableQty: Math.max(0, (p.availableQty || 0) - stockDeductions[p.id]) } : p));

    flash(`${newDispatches.length} dispatch${newDispatches.length !== 1 ? "es" : ""} imported, stock updated`);
    setModal(null);
  };

  const resetAll = async () => { await setProd(D_PROD); await setSer([]); await setGI([]); await setDisp([]); flash("Reset"); };

  const [syncing, setSyncing] = useState(false);
  const syncFromQW = async (type) => {
    setSyncing(true);
    try {
      const apiType = type === "dispatches" ? "invoices" : "pos";
      const res = await fetch(`/api/qw-sync?type=${apiType}&since=2026-04-01`);
      const json = await res.json();
      if (!json.success) { flash("Sync error: " + (json.error || "Unknown")); setSyncing(false); return; }

      if (type === "dispatches") {
        const docs = json.invoices || [];
        const existing = dispatches.map(d => d.qwRef).filter(Boolean);
        const newDocs = docs.filter(d => !existing.includes(d.qwRef));
        if (newDocs.length === 0) { flash("No new dispatches found"); setSyncing(false); return; }

        const newDispatches = newDocs.map(d => ({
          id: uid(), customer: d.customer, qwRef: d.qwRef, date: d.date, importedDate: today(),
          items: d.items.map(i => ({ sku: i.sku, serial: i.serial, qty: i.qty }))
        }));
        setDisp(prev => [...prev, ...newDispatches]);

        // Mark serials as dispatched and deduct stock
        const allSerials = newDocs.flatMap(d => d.items.filter(i => i.serial).map(i => ({ serial: i.serial, customer: d.customer, qwRef: d.qwRef })));
        if (allSerials.length > 0) {
          setSer(prev => prev.map(s => {
            const match = allSerials.find(a => a.serial === s.serial);
            return match ? { ...s, status: "dispatched", customer: match.customer, qwRef: match.qwRef, dispatchDate: today() } : s;
          }));
        }
        const stockDeductions = {};
        newDocs.forEach(d => d.items.forEach(i => {
          const prod = products.find(p => p.sku === i.sku);
          if (prod) stockDeductions[prod.id] = (stockDeductions[prod.id] || 0) + (i.qty || 1);
        }));
        setProd(prev => prev.map(p => stockDeductions[p.id] ? { ...p, totalQty: Math.max(0, (p.totalQty || 0) - stockDeductions[p.id]), availableQty: Math.max(0, (p.availableQty || 0) - stockDeductions[p.id]) } : p));

        flash(`${newDispatches.length} new dispatch${newDispatches.length !== 1 ? "es" : ""} synced from QW`);
      }

      if (type === "goodsin") {
        const docs = json.purchaseOrders || [];
        const existing = goodsIn.map(g => g.supplierRef).filter(Boolean);
        const newDocs = docs.filter(d => !existing.includes(d.qwRef));
        if (newDocs.length === 0) { flash("No new goods-in found"); setSyncing(false); return; }

        const newGoodsIn = newDocs.map(d => {
          const supplierName = d.items[0]?.manufacturer || d.items[0]?.vendor || d.supplier || "Unknown";
          return {
            id: uid(), supplier: supplierName, supplierRef: d.qwRef, created: d.date, status: "received", receivedDate: today(), notes: "Synced from QuoteWerks",
            items: d.items.map(i => {
              const prod = products.find(p => p.sku === i.sku);
              return { productId: prod?.id || "", qty: i.qty || 1, unitCost: i.unitCost || 0 };
            })
          };
        });
        setGI(prev => [...prev, ...newGoodsIn]);

        // Register serials and increase stock
        newDocs.forEach(d => {
          d.items.forEach(i => {
            if (i.serial) {
              const prod = products.find(p => p.sku === i.sku);
              if (prod) addSer(prod.id, i.serial);
            }
          });
        });
        const stockAdditions = {};
        const costByProd = {};
        newDocs.forEach(d => d.items.forEach(i => {
          const prod = products.find(p => p.sku === i.sku);
          if (prod) {
            stockAdditions[prod.id] = (stockAdditions[prod.id] || 0) + (i.qty || 1);
            costByProd[prod.id] = i.unitCost || 0;
          }
        }));
        setProd(prev => prev.map(p => {
          if (!stockAdditions[p.id]) return p;
          const add = stockAdditions[p.id], nc = costByProd[p.id];
          const hist = [...(p.costHistory || []), { date: today(), cost: nc, supplier: "QW Sync", qty: add, ref: "" }];
          return { ...p, totalQty: (p.totalQty || 0) + add, availableQty: (p.availableQty || 0) + add, costPrice: nc > 0 ? nc : p.costPrice, lastCostDate: today(), lastCostSupplier: "QW Sync", costHistory: hist };
        }));

        flash(`${newGoodsIn.length} new goods-in synced from QW`);
      }
    } catch (err) {
      console.error("Sync error:", err);
      flash("Sync failed \u2014 check connection");
    }
    setSyncing(false);
  };

  const nav = [
    { k: "dashboard", l: "Dashboard", i: "\u25D0" },
    { k: "products", l: "Products", i: "\u25A6" },
    { k: "goodsin", l: "Goods In", i: "\u2191", badge: goodsIn.filter(g => g.status === "pending").length || null, bc: "#d97706" },
    { k: "goodsout", l: "Goods Out", i: "\u2193", badge: dispatches.length > 0 ? dispatches.length : null, bc: T.accent },
    { k: "serials", l: "Serials", i: "\u27D0" },
  ];

  if (!ready) return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", fontFamily: "system-ui", background: T.bg, color: T.muted }}><div style={{ textAlign: "center" }}><div style={{ fontSize: 32, animation: "spin 1s linear infinite" }}>{"\u25D0"}</div><div style={{ marginTop: 12 }}>Loading...</div></div><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style></div>;

  const renderTable = (headers, rows) => (
    <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, overflow: "hidden" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}><thead><tr style={{ background: T.bg }}>{headers.map(h => <th key={h} style={thS}>{h}</th>)}</tr></thead><tbody>{rows}</tbody></table>
      {rows.length === 0 && <div style={{ padding: 32, textAlign: "center", color: T.muted }}>Nothing found</div>}
    </div>
  );

  // ══════════════════════════════════
  const renderPage = () => {
    // ── DASHBOARD
    if (page === "dashboard") {
      const recentIn = [...goodsIn].sort((a, b) => new Date(b.created) - new Date(a.created)).slice(0, 5);
      const recentOut = [...dispatches].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);
      const Card = ({ label, value, sub, color, onClick }) => (
        <div onClick={onClick} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: "18px 20px", cursor: onClick ? "pointer" : "default", transition: "all .15s" }}
          onMouseEnter={e => onClick && (e.currentTarget.style.borderColor = T.accent)} onMouseLeave={e => onClick && (e.currentTarget.style.borderColor = T.border)}>
          <div style={{ fontSize: 11, fontWeight: 600, color: T.muted, textTransform: "uppercase", letterSpacing: .5 }}>{label}</div>
          <div style={{ fontSize: 26, fontWeight: 700, color: color || T.text, marginTop: 5 }}>{value}</div>
          {sub && <div style={{ fontSize: 12, color: T.muted, marginTop: 3 }}>{sub}</div>}
        </div>
      );
      return (
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 22 }}>Dashboard</h1>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(170px,1fr))", gap: 12, marginBottom: 28 }}>
            <Card label="Products" value={products.length} onClick={() => setPage("products")} />
            <Card label="Total Units" value={totalUnits} sub={`${totalAvail} available`} />
            <Card label="Stock Value" value={money(totalValue)} color="#16a34a" onClick={() => setModal({ type: "stockValue" })} />
            <Card label="Serials Tracked" value={inStockSerials} sub={`${dispatchedSerials} dispatched`} onClick={() => setPage("serials")} />
            <Card label="Pending In" value={goodsIn.filter(g => g.status === "pending").length} color="#d97706" onClick={() => setPage("goodsin")} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 18 }}>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Recent Goods In</div>
              {recentIn.length === 0 && <div style={{ color: T.muted, fontSize: 13 }}>None yet</div>}
              {recentIn.map(g => <div key={g.id} className="hovRow" onClick={() => setModal({ type: "viewGI", data: g })} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 8px", borderBottom: `1px solid ${T.bg}`, cursor: "pointer", borderRadius: 6 }}><div><div style={{ fontWeight: 600, fontSize: 13 }}>{g.supplier}</div><div style={{ fontSize: 12, color: T.muted }}>{fd(g.created)}</div></div><Badge status={g.status} map={GI_STY} /></div>)}
            </div>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 18 }}>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Recent Dispatches (from QW)</div>
              {recentOut.length === 0 && <div style={{ color: T.muted, fontSize: 13 }}>None yet {"\u2014"} import from QuoteWerks</div>}
              {recentOut.map(d => <div key={d.id} style={{ padding: "9px 8px", borderBottom: `1px solid ${T.bg}` }}><div style={{ fontWeight: 600, fontSize: 13 }}>{d.customer || "Customer"}</div><div style={{ fontSize: 12, color: T.muted }}>{fd(d.date)} {"\u00B7"} {d.qwRef} {"\u00B7"} {d.items.length} item{d.items.length !== 1 ? "s" : ""}</div></div>)}
            </div>
          </div>
        </div>
      );
    }

    // ── PRODUCTS
    if (page === "products") {
      const fil = products.filter(p => { if (catFilter !== "all" && p.category !== catFilter) return false; if (!search) return true; return [p.name, p.sku, p.category].some(v => (v || "").toLowerCase().includes(search.toLowerCase())); });
      const filValue = fil.reduce((s, p) => s + (p.totalQty || 0) * (p.costPrice || 0), 0);
      const exportCSV = () => { const h = "SKU,Product,Category,Cost,Sale,Total Qty,Available,Stock Value"; const rows = fil.map(p => [p.sku, p.name, p.category, (p.costPrice || 0).toFixed(2), (p.salePrice || 0).toFixed(2), p.totalQty || 0, p.availableQty || 0, ((p.totalQty || 0) * (p.costPrice || 0)).toFixed(2)].map(v => `"${v}"`).join(",")); const blob = new Blob([h + "\n" + rows.join("\n")], { type: "text/csv" }); const u = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = u; a.download = `inventory-${today()}.csv`; a.click(); URL.revokeObjectURL(u); };
      return (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
            <h1 style={{ fontSize: 22, fontWeight: 700 }}>Products</h1>
            <div style={{ display: "flex", gap: 8 }}><button style={bs} onClick={() => setModal({ type: "importProds" })}>{"\u2191"} Import</button><button style={bs} onClick={exportCSV}>{"\u2193"} Export</button><button style={bp} onClick={() => setModal({ type: "editProd", data: null })}>+ Add</button></div>
          </div>
          <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
            <input placeholder="Search SKU, name, category..." value={search} onChange={e => setSearch(e.target.value)} style={{ ...iS, flex: 1 }} />
            <select value={catFilter} onChange={e => setCF(e.target.value)} style={{ ...iS, width: "auto", minWidth: 160 }}><option value="all">All categories</option>{categories.map(c => <option key={c} value={c}>{c}</option>)}</select>
          </div>
          <div style={{ display: "flex", gap: 12, marginBottom: 14, flexWrap: "wrap" }}>
            {[["Products", fil.length], ["Units", fil.reduce((s, p) => s + (p.totalQty || 0), 0)], ["Available", fil.reduce((s, p) => s + (p.availableQty || 0), 0)], ["Value", money(filValue)]].map(([l, v]) => <div key={l} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: "8px 16px", fontSize: 13 }}><span style={{ color: T.muted }}>{l}:</span> <strong>{v}</strong></div>)}
          </div>
          {renderTable(["SKU", "Product", "Category", "Cost", "Sale", "Qty", "Available", ""], fil.map(p => { const tq = p.totalQty || 0; return (
            <tr key={p.id} className="hovRow" style={{ cursor: "pointer", borderBottom: `1px solid ${T.bg}` }} onClick={() => setModal({ type: "viewProd", data: p })}>
              <td style={{ ...tdS, fontFamily: MF, fontSize: 12 }}>{p.sku}</td><td style={{ ...tdS, fontWeight: 600 }}>{p.name}</td>
              <td style={tdS}><span style={{ background: T.bg, padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600, color: T.muted }}>{p.category}</span></td>
              <td style={tdS}>{money(p.costPrice)}</td><td style={tdS}>{money(p.salePrice)}</td>
              <td style={{ ...tdS, fontWeight: 700 }}>{tq}</td>
              <td style={tdS}><span style={{ fontWeight: 600, color: (p.availableQty || 0) > 0 ? "#16a34a" : T.muted }}>{p.availableQty || 0}</span></td>
              <td style={tdS}><button style={bsm} onClick={e => { e.stopPropagation(); setModal({ type: "editProd", data: p }); }}>Edit</button></td>
            </tr>
          ); }))}
        </div>
      );
    }

    // ── GOODS IN
    if (page === "goodsin") {
      const fil = goodsIn.filter(g => !search || [g.supplier, g.supplierRef].some(v => (v || "").toLowerCase().includes(search.toLowerCase()))).sort((a, b) => new Date(b.created) - new Date(a.created));
      return (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
            <div><h1 style={{ fontSize: 22, fontWeight: 700 }}>Goods In</h1><p style={{ color: T.muted, fontSize: 12, marginTop: 2 }}>Stock received from suppliers</p></div>
            <div style={{ display: "flex", gap: 8 }}>
              <button style={bp} onClick={() => syncFromQW("goodsin")}>{"\u21BB"} Sync from QW</button>
              <button style={bs} onClick={() => setModal({ type: "editGI", data: null })}>+ Manual Entry</button>
            </div>
          </div>
          <input placeholder="Search supplier..." value={search} onChange={e => setSearch(e.target.value)} style={{ ...iS, marginBottom: 14 }} />
          {renderTable(["Date", "Supplier", "Ref", "Items", "Cost", "Status", ""], fil.map(g => { const tot = g.items.reduce((s, i) => s + (i.qty || 1) * (i.unitCost || 0), 0); return (
            <tr key={g.id} className="hovRow" style={{ cursor: "pointer", borderBottom: `1px solid ${T.bg}` }} onClick={() => setModal({ type: "viewGI", data: g })}>
              <td style={tdS}>{fd(g.created)}</td><td style={{ ...tdS, fontWeight: 600 }}>{g.supplier}</td>
              <td style={{ ...tdS, fontFamily: MF, fontSize: 12, color: T.muted }}>{g.supplierRef || "\u2014"}</td>
              <td style={{ ...tdS, color: T.muted }}>{g.items.length}</td><td style={{ ...tdS, fontWeight: 600 }}>{money(tot)}</td>
              <td style={tdS}><Badge status={g.status} map={GI_STY} /></td>
              <td style={tdS}>{g.status === "pending" && <button style={bsm} onClick={e => { e.stopPropagation(); setModal({ type: "receiveGI", data: g }); }}>Receive</button>}</td>
            </tr>
          ); }))}
        </div>
      );
    }

    // ── GOODS OUT (imported from QW)
    if (page === "goodsout") {
      const fil = dispatches.filter(d => !search || [d.customer, d.qwRef].some(v => (v || "").toLowerCase().includes(search.toLowerCase()))).sort((a, b) => new Date(b.date) - new Date(a.date));
      return (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
            <div><h1 style={{ fontSize: 22, fontWeight: 700 }}>Goods Out</h1><p style={{ color: T.muted, fontSize: 12, marginTop: 2 }}>Dispatches from QuoteWerks</p></div>
            <div style={{ display: "flex", gap: 8 }}>
              <button style={bp} onClick={() => syncFromQW("dispatches")}>{"\u21BB"} Sync from QW</button>
              <button style={bs} onClick={() => setModal({ type: "importDispatches" })}>{"\u2191"} CSV Import</button>
            </div>
          </div>
          <input placeholder="Search customer, QW ref..." value={search} onChange={e => setSearch(e.target.value)} style={{ ...iS, marginBottom: 14 }} />
          {renderTable(["Date", "Customer", "QW Ref", "Items", "Serials"], fil.map(d => { const serCount = d.items.filter(i => i.serial).length; return (
            <tr key={d.id} className="hovRow" style={{ cursor: "pointer", borderBottom: `1px solid ${T.bg}` }} onClick={() => setModal({ type: "viewDispatch", data: d })}>
              <td style={tdS}>{fd(d.date)}</td><td style={{ ...tdS, fontWeight: 600 }}>{d.customer || "\u2014"}</td>
              <td style={{ ...tdS, fontFamily: MF, fontSize: 12 }}>{d.qwRef || "\u2014"}</td>
              <td style={{ ...tdS, color: T.muted }}>{d.items.length}</td>
              <td style={tdS}>{serCount > 0 ? <span style={{ color: T.accent, fontWeight: 600 }}>{serCount} tracked</span> : <span style={{ color: T.muted }}>None</span>}</td>
            </tr>
          ); }))}
        </div>
      );
    }

    // ── SERIALS
    if (page === "serials") {
      const fil = serials.filter(s => { if (catFilter !== "all" && s.status !== catFilter) return false; if (!search) return true; const p = ff(products, s.productId); return [s.serial, p?.name, p?.sku, s.customer].some(v => (v || "").toLowerCase().includes(search.toLowerCase())); });
      return (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
            <h1 style={{ fontSize: 22, fontWeight: 700 }}>Serial Numbers</h1>
            <button style={bp} onClick={() => setModal({ type: "quickSerial" })}>+ Add Serial</button>
          </div>
          <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
            <input placeholder="Search serial, product, customer..." value={search} onChange={e => setSearch(e.target.value)} style={{ ...iS, flex: 1 }} />
            <select value={catFilter} onChange={e => setCF(e.target.value)} style={{ ...iS, width: "auto", minWidth: 140 }}><option value="all">All</option><option value="in_stock">In Stock</option><option value="dispatched">Dispatched</option></select>
          </div>
          {renderTable(["Serial", "Product", "SKU", "Status", "Customer", "QW Ref", "Date"], fil.map(s => { const p = ff(products, s.productId); return (
            <tr key={s.id} className="hovRow" style={{ borderBottom: `1px solid ${T.bg}` }}>
              <td style={{ ...tdS, fontFamily: MF, fontSize: 12, fontWeight: 500 }}>{s.serial}</td>
              <td style={{ ...tdS, fontWeight: 600 }}>{p?.name || "\u2014"}</td>
              <td style={{ ...tdS, fontFamily: MF, fontSize: 12, color: T.muted }}>{p?.sku || "\u2014"}</td>
              <td style={tdS}><Badge status={s.status} map={SER_STY} /></td>
              <td style={{ ...tdS, fontWeight: s.customer ? 600 : 400, color: s.customer ? T.text : T.muted }}>{s.customer || "\u2014"}</td>
              <td style={{ ...tdS, fontFamily: MF, fontSize: 11, color: T.muted }}>{s.qwRef || "\u2014"}</td>
              <td style={{ ...tdS, fontSize: 12, color: T.muted }}>{fd(s.status === "dispatched" ? s.dispatchDate : s.addedDate)}</td>
            </tr>
          ); }))}
        </div>
      );
    }

    return null;
  };

  // ══════════════════════════════════
  const renderModal = () => {
    if (!modal) return null;
    const mt = modal.type;

    if (mt === "editProd") return <ProductEditModal key={"p-" + (modal.data?.id || "new")} data={modal.data} serials={modal.data ? serials.filter(s => s.productId === modal.data.id) : []} onSave={saveProd} onAddSerial={addSer} onDeleteSerial={delSer} onClose={() => setModal(null)} />;

    if (mt === "viewProd") {
      const p = ff(products, modal.data?.id) || modal.data;
      const tq = p.totalQty || 0, aq = p.availableQty || 0;
      const pSer = serials.filter(s => s.productId === p.id);
      const moves = [];
      goodsIn.forEach(g => g.items.forEach(it => { if (it.productId === p.id && g.receivedDate) moves.push({ date: g.receivedDate, type: "in", qty: it.qty || 1, detail: g.supplier, cost: it.unitCost, ref: g.supplierRef }); }));
      dispatches.forEach(d => d.items.forEach(it => { const prod = products.find(x => x.sku === it.sku); if (prod?.id === p.id) moves.push({ date: d.date, type: "out", qty: it.qty || 1, detail: d.customer, ref: d.qwRef, serial: it.serial }); }));
      moves.sort((a, b) => new Date(b.date) - new Date(a.date));
      const mc = { in: { bg: "#dcfce7", c: "#16a34a", l: "\u2191 IN" }, out: { bg: "#fee2e2", c: "#dc2626", l: "\u2193 OUT" } };
      return (
        <Overlay onClose={() => setModal(null)} width={640}><div style={{ padding: 26 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 18 }}><div><h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>{p.name}</h2><p style={{ color: T.muted, fontSize: 13, fontFamily: MF }}>{p.sku} {"\u00B7"} {p.category}</p></div><button style={bsm} onClick={() => setModal({ type: "editProd", data: p })}>Edit</button></div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10, marginBottom: 18 }}>{[["Total", tq], ["Available", aq, "#16a34a"], ["Serials", pSer.filter(s => s.status === "in_stock").length, "#2563eb"], ["Value", money(tq * (p.costPrice || 0))]].map(([l, v, c]) => <div key={l} style={{ background: T.bg, borderRadius: 8, padding: 12, textAlign: "center" }}><div style={{ fontSize: 22, fontWeight: 700, color: c || T.text }}>{v}</div><div style={{ fontSize: 11, color: T.muted }}>{l}</div></div>)}</div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14, marginBottom: 18 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}><div><div style={lS}>Last Cost</div><div style={{ fontSize: 18, fontWeight: 700 }}>{money(p.costPrice)}</div></div><div><div style={lS}>Sale Price</div><div style={{ fontSize: 18, fontWeight: 700 }}>{money(p.salePrice)}</div></div><div><div style={lS}>Margin</div><div style={{ fontSize: 18, fontWeight: 700, color: ((p.salePrice || 0) - (p.costPrice || 0)) > 0 ? "#16a34a" : "#dc2626" }}>{p.costPrice > 0 ? ((((p.salePrice || 0) - (p.costPrice || 0)) / (p.costPrice || 1)) * 100).toFixed(1) + "%" : "\u2014"}</div></div></div>
            {p.lastCostDate && <div style={{ fontSize: 12, color: T.muted, borderTop: `1px solid ${T.border}`, paddingTop: 8, marginTop: 8 }}>Updated {fd(p.lastCostDate)}{p.lastCostSupplier && ` from ${p.lastCostSupplier}`}</div>}
          </div>
          {(p.costHistory || []).length > 0 && <div style={{ marginBottom: 18 }}><label style={lS}>Cost History</label>{[...(p.costHistory || [])].reverse().map((ch, i) => <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 6px", borderBottom: `1px solid ${T.bg}`, fontSize: 13 }}><span>{fd(ch.date)} {"\u00B7"} {ch.supplier}</span><span style={{ fontWeight: 600 }}>{money(ch.cost)} x{ch.qty}</span></div>)}</div>}
          <div style={{ marginBottom: 16 }}><label style={lS}>Stock Movements</label>{moves.length === 0 && <div style={{ color: T.muted, fontSize: 13, padding: 12, textAlign: "center" }}>No movements</div>}<div style={{ maxHeight: 220, overflow: "auto" }}>{moves.map((m, i) => { const s = mc[m.type]; return <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 6px", borderBottom: `1px solid ${T.bg}` }}><span style={{ background: s.bg, color: s.c, padding: "3px 8px", borderRadius: 4, fontSize: 10, fontWeight: 700, minWidth: 50, textAlign: "center" }}>{s.l}</span><div style={{ flex: 1 }}><span style={{ fontWeight: 600, fontSize: 13 }}>{m.qty} unit{m.qty !== 1 ? "s" : ""}</span>{m.cost > 0 && <span style={{ fontSize: 11, color: T.muted }}> @ {money(m.cost)}</span>}{m.serial && <span style={{ fontSize: 11, fontFamily: MF, color: T.accent }}> S/N: {m.serial}</span>}<div style={{ fontSize: 12, color: T.muted }}>{m.detail}{m.ref && ` \u00B7 ${m.ref}`}</div></div><div style={{ fontSize: 12, color: T.muted }}>{fd(m.date)}</div></div>; })}</div></div>
          <div style={{ display: "flex", justifyContent: "flex-end" }}><button style={bs} onClick={() => setModal(null)}>Close</button></div>
        </div></Overlay>
      );
    }

    if (mt === "editGI") return <GoodsInForm key={"gi-" + (modal.data?.id || "new")} data={modal.data} products={products} ff={ff} onSave={saveGI} onClose={() => setModal(null)} />;
    if (mt === "receiveGI") return <ReceiveGIModal key={"rcv-" + modal.data.id} gi={modal.data} products={products} ff={ff} onReceive={receiveGI} onClose={() => setModal(null)} />;
    if (mt === "viewGI") { const g = ff(goodsIn, modal.data?.id) || modal.data; const tot = g.items.reduce((s, i) => s + (i.qty || 1) * (i.unitCost || 0), 0); return (
      <Overlay onClose={() => setModal(null)} width={560}><div style={{ padding: 26 }}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 18 }}><div><h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Goods In</h2><p style={{ color: T.muted, fontSize: 13 }}>{g.supplier}{g.supplierRef && ` \u00B7 ${g.supplierRef}`}</p></div><Badge status={g.status} map={GI_STY} /></div>
        <div style={{ fontSize: 13, color: T.muted, marginBottom: 14 }}>Created {fd(g.created)}{g.receivedDate && ` \u00B7 Received ${fd(g.receivedDate)}`}</div>
        <label style={lS}>Items</label>{g.items.map((it, i) => { const p = ff(products, it.productId); return <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: `1px solid ${T.bg}` }}><div><div style={{ fontWeight: 600, fontSize: 13 }}>{p?.name || "?"}</div><div style={{ fontSize: 12, color: T.muted }}>{p?.sku} {"\u00B7"} Qty {it.qty || 1} @ {money(it.unitCost)}</div></div><div style={{ fontWeight: 600 }}>{money((it.qty || 1) * (it.unitCost || 0))}</div></div>; })}
        <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", fontWeight: 700, fontSize: 16 }}><span>Total</span><span>{money(tot)}</span></div>
        {g.notes && <div style={{ fontSize: 13, color: T.muted, padding: 10, background: T.bg, borderRadius: 6, marginTop: 10 }}>{g.notes}</div>}
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 18 }}><div>{g.status === "pending" && <button style={bp} onClick={() => setModal({ type: "receiveGI", data: g })}>Receive Stock</button>}</div><button style={bs} onClick={() => setModal(null)}>Close</button></div>
      </div></Overlay>
    ); }

    if (mt === "viewDispatch") { const d = modal.data; return (
      <Overlay onClose={() => setModal(null)} width={560}><div style={{ padding: 26 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Dispatch Detail</h2>
        <p style={{ color: T.muted, fontSize: 13, marginBottom: 18 }}>{d.customer}{d.qwRef && ` \u00B7 ${d.qwRef}`} {"\u00B7"} {fd(d.date)}</p>
        <label style={lS}>Items</label>
        {d.items.map((it, i) => <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: `1px solid ${T.bg}` }}><div><div style={{ fontWeight: 600, fontSize: 13 }}>{it.sku}</div>{it.serial && <div style={{ fontSize: 12, fontFamily: MF, color: T.accent }}>S/N: {it.serial}</div>}</div><div style={{ fontSize: 13, color: T.muted }}>Qty {it.qty || 1}</div></div>)}
        <div style={{ fontSize: 12, color: T.muted, marginTop: 14 }}>Imported {fd(d.importedDate)}</div>
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 14 }}><button style={bs} onClick={() => setModal(null)}>Close</button></div>
      </div></Overlay>
    ); }

    if (mt === "importDispatches") return <ImportCSVModal key="imp-d" title="Import Dispatches from QuoteWerks" subtitle="Upload a CSV with dispatched items. Include customer, QW reference, SKU, serial number, and quantity." targetFields={[
      { key: "customer", label: "Customer Name", required: true }, { key: "qwRef", label: "QW Ref / Invoice #" }, { key: "sku", label: "Product SKU" }, { key: "serial", label: "Serial Number" }, { key: "qty", label: "Quantity", type: "int" }, { key: "date", label: "Dispatch Date" }
    ]} onImport={importDispatches} onClose={() => setModal(null)} />;

    if (mt === "quickSerial") return <QuickSerialModal key="qs" products={products} onAdd={addSer} onClose={() => setModal(null)} />;
    if (mt === "stockValue") {
      const valued = products.filter(p => (p.totalQty || 0) > 0).map(p => ({ ...p, value: (p.totalQty || 0) * (p.costPrice || 0) })).sort((a, b) => b.value - a.value);
      const grandTotal = valued.reduce((s, p) => s + p.value, 0);
      const exportValCSV = () => { const h = "SKU,Product,Category,Qty,Cost Price,Stock Value"; const rows = valued.map(p => [p.sku, p.name, p.category, p.totalQty || 0, (p.costPrice || 0).toFixed(2), p.value.toFixed(2)].map(v => `"${v}"`).join(",")); const blob = new Blob([h + "\n" + rows.join("\n")], { type: "text/csv" }); const u = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = u; a.download = `stock-valuation-${today()}.csv`; a.click(); URL.revokeObjectURL(u); };
      return (
        <Overlay onClose={() => setModal(null)} width={700}><div style={{ padding: 26 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 18 }}>
            <div><h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Stock Valuation</h2><p style={{ color: T.muted, fontSize: 13 }}>All products with stock, sorted by value (highest first)</p></div>
            <button style={bs} onClick={exportValCSV}>{"\u2193"} Export CSV</button>
          </div>
          <div style={{ display: "flex", gap: 16, marginBottom: 18 }}>
            <div style={{ background: T.accentBg, borderRadius: 8, padding: "12px 18px" }}><div style={{ fontSize: 11, fontWeight: 600, color: T.accent, textTransform: "uppercase", letterSpacing: .5 }}>Total Stock Value</div><div style={{ fontSize: 24, fontWeight: 700, color: T.accent, marginTop: 4 }}>{money(grandTotal)}</div></div>
            <div style={{ background: T.bg, borderRadius: 8, padding: "12px 18px" }}><div style={{ fontSize: 11, fontWeight: 600, color: T.muted, textTransform: "uppercase", letterSpacing: .5 }}>Products in Stock</div><div style={{ fontSize: 24, fontWeight: 700, marginTop: 4 }}>{valued.length}</div></div>
            <div style={{ background: T.bg, borderRadius: 8, padding: "12px 18px" }}><div style={{ fontSize: 11, fontWeight: 600, color: T.muted, textTransform: "uppercase", letterSpacing: .5 }}>Total Units</div><div style={{ fontSize: 24, fontWeight: 700, marginTop: 4 }}>{valued.reduce((s, p) => s + (p.totalQty || 0), 0)}</div></div>
          </div>
          <div style={{ maxHeight: 420, overflow: "auto", border: `1px solid ${T.border}`, borderRadius: 8 }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr style={{ background: T.bg, position: "sticky", top: 0 }}>
                {["Product", "SKU", "Category", "Qty", "Cost", "Value", "%"].map(h => <th key={h} style={{ ...thS, textAlign: h === "Qty" || h === "Cost" || h === "Value" || h === "%" ? "right" : "left" }}>{h}</th>)}
              </tr></thead>
              <tbody>{valued.map((p, i) => {
                const pct = grandTotal > 0 ? ((p.value / grandTotal) * 100) : 0;
                return (
                  <tr key={p.id} className="hovRow" style={{ cursor: "pointer", borderBottom: `1px solid ${T.bg}` }} onClick={() => setModal({ type: "viewProd", data: p })}>
                    <td style={{ ...tdS, fontWeight: 600 }}>{p.name}</td>
                    <td style={{ ...tdS, fontFamily: MF, fontSize: 11, color: T.muted }}>{p.sku}</td>
                    <td style={tdS}><span style={{ background: T.bg, padding: "2px 8px", borderRadius: 4, fontSize: 10, fontWeight: 600, color: T.muted }}>{p.category}</span></td>
                    <td style={{ ...tdS, textAlign: "right" }}>{p.totalQty}</td>
                    <td style={{ ...tdS, textAlign: "right", color: T.muted }}>{money(p.costPrice)}</td>
                    <td style={{ ...tdS, textAlign: "right", fontWeight: 700 }}>{money(p.value)}</td>
                    <td style={{ ...tdS, textAlign: "right", width: 90 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "flex-end" }}>
                        <div style={{ width: 50, height: 6, background: T.bg, borderRadius: 3, overflow: "hidden" }}><div style={{ width: `${Math.min(100, pct)}%`, height: "100%", background: T.accent, borderRadius: 3 }} /></div>
                        <span style={{ fontSize: 11, color: T.muted, minWidth: 32, textAlign: "right" }}>{pct.toFixed(1)}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}</tbody>
            </table>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 14, marginTop: 14, borderTop: `1px solid ${T.border}` }}>
            <div style={{ fontSize: 13, color: T.muted }}>Valued at last cost paid per product</div>
            <button style={bs} onClick={() => setModal(null)}>Close</button>
          </div>
        </div></Overlay>
      );
    }
    if (mt === "importProds") return <ImportCSVModal key="imp-p" title="Import Products" subtitle="CSV with SKU, name, category, cost, sale price, quantities" targetFields={[
      { key: "sku", label: "SKU", required: true }, { key: "name", label: "Product Name" }, { key: "category", label: "Category" }, { key: "costPrice", label: "Cost Price", type: "number" }, { key: "salePrice", label: "Sale Price", type: "number" }, { key: "totalQty", label: "Total Qty", type: "int" }, { key: "availableQty", label: "Available Qty", type: "int" }
    ]} onImport={rows => { setProd(prev => [...prev, ...rows.map(r => ({ ...r, id: uid(), name: r.name || r.sku, totalQty: r.totalQty || 0, availableQty: r.availableQty || 0 }))]); flash(`${rows.length} imported`); setModal(null); }} onClose={() => setModal(null)} />;
    return null;
  };

  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "'DM Sans','Segoe UI',system-ui,sans-serif", color: T.text, background: T.bg, overflow: "hidden", fontSize: 14 }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');*{box-sizing:border-box;margin:0;padding:0}input,select,textarea{font-family:inherit;font-size:13px}input:focus,select:focus,textarea:focus{outline:2px solid ${T.accent};outline-offset:-1px}::-webkit-scrollbar{width:5px}::-webkit-scrollbar-thumb{background:#ccc;border-radius:3px}@keyframes popIn{from{opacity:0;transform:scale(.96)}to{opacity:1;transform:scale(1)}}@keyframes toastSlide{from{opacity:0;transform:translateX(-50%) translateY(16px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}.hovRow:hover{background:${T.bg}!important}`}</style>
      <nav style={{ width: 220, background: T.sidebar, display: "flex", flexDirection: "column", flexShrink: 0 }}>
        <div style={{ padding: "22px 20px 16px", borderBottom: "1px solid rgba(255,255,255,.06)" }}><div style={{ fontSize: 17, fontWeight: 700, color: "#fff" }}>{"\u25A6"} StockHub</div><div style={{ fontSize: 11, color: T.sideText, marginTop: 3 }}>Warehouse Stock Register</div></div>
        <div style={{ padding: "10px", flex: 1, overflow: "auto" }}>{nav.map(n => { const act = page === n.k; return <button key={n.k} onClick={() => { setPage(n.k); setSearch(""); setCF("all"); setModal(null); }} style={{ display: "flex", alignItems: "center", gap: 9, width: "100%", padding: "9px 12px", border: "none", background: act ? "rgba(255,255,255,.11)" : "transparent", color: act ? T.sideAct : T.sideText, borderRadius: 8, cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: act ? 600 : 400, transition: "all .15s", marginBottom: 1 }}><span style={{ fontSize: 14, width: 20, textAlign: "center" }}>{n.i}</span>{n.l}{n.badge && <span style={{ marginLeft: "auto", background: n.bc, color: "#fff", fontSize: 10, padding: "2px 6px", borderRadius: 99, fontWeight: 700 }}>{n.badge}</span>}</button>; })}</div>
        <div style={{ padding: "10px 20px", borderTop: "1px solid rgba(255,255,255,.06)" }}>
          <button onClick={async () => { try { const r = await fetch("/api/qw-sync?type=test"); const j = await r.json(); flash(j.success ? j.message : "Connection failed: " + j.error); } catch { flash("Connection failed"); } }} style={{ background: "none", border: "none", color: "rgba(255,255,255,.4)", fontSize: 11, cursor: "pointer", fontFamily: "inherit", marginBottom: 4, display: "block" }}>{"\u26A1"} Test QW Connection</button>
          {syncing && <div style={{ color: "#d97706", fontSize: 11 }}>{"\u21BB"} Syncing...</div>}
          <button onClick={resetAll} style={{ background: "none", border: "none", color: "rgba(255,255,255,.15)", fontSize: 10, cursor: "pointer", fontFamily: "inherit" }}>Reset demo</button>
        </div>
      </nav>
      <main style={{ flex: 1, overflow: "auto", padding: "26px 34px" }}>{renderPage()}</main>
      {renderModal()}
      {toast && <div style={{ position: "fixed", bottom: 28, left: "50%", transform: "translateX(-50%)", background: T.sidebar, color: "#fff", padding: "10px 24px", borderRadius: 99, fontSize: 13, fontWeight: 500, animation: "toastSlide .25s ease", zIndex: 9999, boxShadow: "0 8px 30px rgba(0,0,0,.2)" }}>{toast}</div>}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// COMPONENTS
// ══════════════════════════════════════════════════════════════
function ProductEditModal({ data, serials, onSave, onAddSerial, onDeleteSerial, onClose }) {
  const isE = !!data?.id; const [fm, sF] = useState(data || { sku: "", name: "", category: "", costPrice: 0, salePrice: 0, totalQty: 0, availableQty: 0 }); const [ns, setNs] = useState("");
  const s = (k, v) => sF(p => ({ ...p, [k]: v })); const doAdd = () => { if (ns.trim() && data?.id && onAddSerial(data.id, ns.trim())) setNs(""); };
  return <Overlay onClose={onClose} width={580}><div style={{ padding: 26 }}><h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 18 }}>{isE ? "Edit" : "New"} Product</h2>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}><div><label style={lS}>SKU</label><input style={iS} value={fm.sku} onChange={e => s("sku", e.target.value)} /></div><div><label style={lS}>Category</label><input style={iS} value={fm.category} onChange={e => s("category", e.target.value)} /></div><div style={{ gridColumn: "1/-1" }}><label style={lS}>Name</label><input style={iS} value={fm.name} onChange={e => s("name", e.target.value)} /></div><div><label style={lS}>Cost</label><input style={iS} type="number" step="0.01" value={fm.costPrice} onChange={e => s("costPrice", parseFloat(e.target.value) || 0)} /></div><div><label style={lS}>Sale</label><input style={iS} type="number" step="0.01" value={fm.salePrice} onChange={e => s("salePrice", parseFloat(e.target.value) || 0)} /></div><div><label style={lS}>Total Qty</label><input style={iS} type="number" value={fm.totalQty || 0} onChange={e => s("totalQty", parseInt(e.target.value) || 0)} /></div><div><label style={lS}>Available</label><input style={iS} type="number" value={fm.availableQty || 0} onChange={e => s("availableQty", parseInt(e.target.value) || 0)} /></div></div>
    {isE && <div style={{ marginTop: 20, borderTop: `1px solid ${T.border}`, paddingTop: 16 }}><label style={lS}>Serial Numbers ({serials.length})</label><div style={{ display: "flex", gap: 8, marginBottom: 12 }}><input placeholder="Serial..." value={ns} onChange={e => setNs(e.target.value)} onKeyDown={e => e.key === "Enter" && doAdd()} style={{ ...iS, flex: 1, fontFamily: MF }} /><button onClick={doAdd} style={bp}>Add</button></div><div style={{ maxHeight: 160, overflow: "auto" }}>{serials.map(sr => { const sty = SER_STY[sr.status] || { l: sr.status, bg: "#eee", c: "#666" }; return <div key={sr.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px", borderBottom: `1px solid ${T.bg}` }}><div style={{ display: "flex", alignItems: "center", gap: 8 }}><code style={{ fontFamily: MF, fontSize: 12 }}>{sr.serial}</code><span style={{ padding: "1px 6px", borderRadius: 99, fontSize: 10, fontWeight: 600, background: sty.bg, color: sty.c }}>{sty.l}</span>{sr.customer && <span style={{ fontSize: 11, color: T.muted }}>{"\u2192"} {sr.customer}</span>}</div>{sr.status === "in_stock" && <button onClick={() => onDeleteSerial(sr.id)} style={{ ...bd, padding: "2px 7px", fontSize: 11 }}>{"\u00D7"}</button>}</div>; })}</div></div>}
    <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 }}><button style={bs} onClick={onClose}>Cancel</button><button style={bp} onClick={() => fm.sku && onSave(fm)}>Save</button></div>
  </div></Overlay>;
}

function GoodsInForm({ data, products, ff, onSave, onClose }) {
  const isE = !!data?.id; const [fm, sF] = useState(data || { supplier: "", supplierRef: "", items: [], notes: "" });
  const s = (k, v) => sF(p => ({ ...p, [k]: v }));
  const addI = () => sF(p => ({ ...p, items: [...p.items, { productId: "", qty: 1, unitCost: 0 }] }));
  const rmI = i => sF(p => ({ ...p, items: p.items.filter((_, j) => j !== i) }));
  const sI = (i, k, v) => sF(p => ({ ...p, items: p.items.map((x, j) => j === i ? { ...x, [k]: v } : x) }));
  const sIP = (i, pid) => { const p = ff(products, pid); sF(prev => ({ ...prev, items: prev.items.map((x, j) => j === i ? { ...x, productId: pid, unitCost: p ? p.costPrice : x.unitCost } : x) })); };
  const tot = fm.items.reduce((s, i) => s + (i.qty || 1) * (i.unitCost || 0), 0);
  return <Overlay onClose={onClose} width={600}><div style={{ padding: 26 }}><h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 18 }}>{isE ? "Edit" : "Record"} Goods In</h2>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 18 }}><div><label style={lS}>Supplier</label><input style={iS} value={fm.supplier} onChange={e => s("supplier", e.target.value)} /></div><div><label style={lS}>Supplier Ref / PO</label><input style={iS} value={fm.supplierRef} onChange={e => s("supplierRef", e.target.value)} /></div><div style={{ gridColumn: "1/-1" }}><label style={lS}>Notes</label><textarea style={{ ...iS, minHeight: 40 }} value={fm.notes} onChange={e => s("notes", e.target.value)} /></div></div>
    <div style={{ marginBottom: 18 }}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}><label style={lS}>Items</label><button style={bsm} onClick={addI}>+ Add</button></div>
      {fm.items.map((it, i) => <div key={i} style={{ background: T.bg, borderRadius: 8, padding: 12, marginBottom: 8 }}><div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr auto", gap: 8, alignItems: "end" }}><div><label style={lS}>Product</label><select style={iS} value={it.productId} onChange={e => sIP(i, e.target.value)}><option value="">Select</option>{products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}</select></div><div><label style={lS}>Qty</label><input style={iS} type="number" min="1" value={it.qty} onChange={e => sI(i, "qty", parseInt(e.target.value) || 1)} /></div><div><label style={lS}>Unit Cost</label><input style={iS} type="number" step=".01" value={it.unitCost} onChange={e => sI(i, "unitCost", parseFloat(e.target.value) || 0)} /></div><button style={{ ...bd, padding: "6px 10px", marginBottom: 2 }} onClick={() => rmI(i)}>{"\u00D7"}</button></div></div>)}
      {fm.items.length === 0 && <div style={{ color: T.muted, fontSize: 13, textAlign: "center", padding: 14, background: T.bg, borderRadius: 8 }}>No items</div>}</div>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 14, borderTop: `1px solid ${T.border}` }}><div style={{ fontSize: 16, fontWeight: 700 }}>Total: {money(tot)}</div><div style={{ display: "flex", gap: 10 }}><button style={bs} onClick={onClose}>Cancel</button><button style={bp} onClick={() => fm.supplier && fm.items.length && onSave(fm)}>Save</button></div></div>
  </div></Overlay>;
}

function ReceiveGIModal({ gi, products, ff, onReceive, onClose }) {
  const [entries, setEntries] = useState(gi.items.flatMap(item => { const p = ff(products, item.productId); return Array.from({ length: item.qty || 1 }, () => ({ productId: item.productId, name: p?.name || "?", sku: p?.sku || "", serial: "" })); }));
  const setSer = (i, v) => setEntries(p => p.map((e, j) => j === i ? { ...e, serial: v } : e));
  const filled = entries.filter(e => e.serial.trim()).length;
  return <Overlay onClose={onClose} width={600}><div style={{ padding: 26 }}>
    <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Receive Stock</h2>
    <p style={{ color: T.muted, fontSize: 13, marginBottom: 18 }}>From <strong>{gi.supplier}</strong> {"\u2014"} enter serial numbers or leave blank for non-tracked items.</p>
    <div style={{ maxHeight: 380, overflow: "auto", marginBottom: 16 }}>{entries.map((e, i) => <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: `1px solid ${T.bg}` }}><div style={{ minWidth: 140 }}><div style={{ fontWeight: 600, fontSize: 13 }}>{e.name}</div><div style={{ fontSize: 11, color: T.muted }}>{e.sku}</div></div><input placeholder={`Serial #${i + 1}`} value={e.serial} onChange={ev => setSer(i, ev.target.value)} style={{ ...iS, flex: 1, fontFamily: MF, fontSize: 12 }} /></div>)}</div>
    {filled > 0 && <div style={{ background: T.accentBg, borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: T.accent, fontWeight: 600 }}>{filled} serial{filled !== 1 ? "s" : ""} will be registered</div>}
    <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 16, borderTop: `1px solid ${T.border}` }}><button style={bs} onClick={onClose}>Cancel</button><div style={{ display: "flex", gap: 10 }}><button onClick={() => onReceive(gi.id, [])} style={{ ...bs, color: T.muted }}>Skip serials</button><button onClick={() => onReceive(gi.id, entries.filter(e => e.serial.trim()))} style={bp}>Receive Stock</button></div></div>
  </div></Overlay>;
}

function QuickSerialModal({ products, onAdd, onClose }) {
  const [pid, setPid] = useState(""); const [serial, setSer] = useState(""); const [added, setAdded] = useState([]);
  const doAdd = () => { if (pid && serial.trim() && onAdd(pid, serial.trim())) { setAdded(p => [...p, { pid, serial: serial.trim() }]); setSer(""); } };
  return <Overlay onClose={onClose} width={520}><div style={{ padding: 26 }}><h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 18 }}>Add Serial Numbers</h2>
    <div style={{ marginBottom: 14 }}><label style={lS}>Product</label><select style={iS} value={pid} onChange={e => setPid(e.target.value)}><option value="">Select...</option>{products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}</select></div>
    {pid && <div style={{ display: "flex", gap: 8, marginBottom: 16 }}><input placeholder="Serial..." value={serial} onChange={e => setSer(e.target.value)} onKeyDown={e => e.key === "Enter" && doAdd()} style={{ ...iS, flex: 1, fontFamily: MF }} /><button onClick={doAdd} style={bp}>Add</button></div>}
    {added.length > 0 && <div style={{ background: T.accentBg, borderRadius: 8, padding: 12, marginBottom: 16 }}><div style={{ fontSize: 12, fontWeight: 600, color: T.accent, marginBottom: 4 }}>Added ({added.length})</div>{added.map((a, i) => <div key={i} style={{ fontSize: 12, fontFamily: MF, color: T.accent }}>{a.serial}</div>)}</div>}
    <div style={{ display: "flex", justifyContent: "flex-end" }}><button style={bs} onClick={onClose}>Done</button></div>
  </div></Overlay>;
}

function ImportCSVModal({ title, subtitle, targetFields, onImport, onClose }) {
  const [step, setStep] = useState("upload"); const [rawRows, setRawRows] = useState([]); const [headers, setHeaders] = useState([]); const [mapping, setMapping] = useState({}); const [previewed, setPreviewed] = useState([]);
  const parseCSV = text => { const lines = text.split(/\r?\n/).filter(l => l.trim()); if (lines.length < 2) return; const d = lines[0].includes("\t") ? "\t" : ","; const parse = line => { const r = []; let cur = "", inQ = false; for (let i = 0; i < line.length; i++) { const c = line[i]; if (c === '"') inQ = !inQ; else if (c === d && !inQ) { r.push(cur.trim()); cur = ""; } else cur += c; } r.push(cur.trim()); return r; }; const hdrs = parse(lines[0]); const rows = lines.slice(1).map(l => parse(l)).filter(r => r.some(c => c)); setHeaders(hdrs); setRawRows(rows); const auto = {}; targetFields.forEach(tf => { const m = hdrs.findIndex(h => { const hl = h.toLowerCase().replace(/[^a-z0-9]/g, ""); return hl.includes(tf.key.toLowerCase()) || tf.key.toLowerCase().includes(hl); }); if (m >= 0) auto[tf.key] = m; }); setMapping(auto); setStep("map"); };
  const buildPreview = () => { const results = rawRows.map(row => { const obj = {}; targetFields.forEach(tf => { const v = mapping[tf.key] >= 0 ? (row[mapping[tf.key]] || "") : ""; obj[tf.key] = tf.type === "number" ? parseFloat(v) || 0 : tf.type === "int" ? parseInt(v) || 0 : v; }); return obj; }).filter(o => { const req = targetFields.find(f => f.required); return req ? o[req.key] : true; }); setPreviewed(results); setStep("preview"); };
  const cols = targetFields.slice(0, 6);
  return <Overlay onClose={onClose} width={700}><div style={{ padding: 26 }}><h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>{title}</h2><p style={{ color: T.muted, fontSize: 13, marginBottom: 18 }}>{subtitle}</p>
    {step === "upload" && <div><div style={{ border: `2px dashed ${T.border}`, borderRadius: 10, padding: 32, textAlign: "center", marginBottom: 16 }}><div style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>Drop CSV or click to browse</div><input type="file" accept=".csv,.txt,.tsv" onChange={e => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onload = ev => parseCSV(ev.target.result); r.readAsText(f); } }} style={{ fontSize: 13 }} /></div><label style={lS}>Or paste data</label><textarea style={{ ...iS, minHeight: 100, fontFamily: MF, fontSize: 11 }} onChange={e => { if (e.target.value.split("\n").length >= 2) parseCSV(e.target.value); }} /><div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}><button style={bs} onClick={onClose}>Cancel</button></div></div>}
    {step === "map" && <div><div style={{ marginBottom: 16, fontSize: 13, color: T.muted }}>Found <strong>{rawRows.length}</strong> rows. Map columns:</div><div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 18 }}>{targetFields.map(tf => <div key={tf.key}><label style={lS}>{tf.label}{tf.required && " *"}</label><select style={iS} value={mapping[tf.key] ?? -1} onChange={e => setMapping(p => ({ ...p, [tf.key]: parseInt(e.target.value) }))}><option value={-1}>-- Skip --</option>{headers.map((h, i) => <option key={i} value={i}>{h}{rawRows[0]?.[i] ? ` ("${rawRows[0][i].slice(0, 25)}")` : ""}</option>)}</select></div>)}</div><div style={{ display: "flex", justifyContent: "space-between" }}><button style={bs} onClick={() => setStep("upload")}>Back</button><button style={bp} onClick={buildPreview}>Preview</button></div></div>}
    {step === "preview" && <div><div style={{ marginBottom: 12, fontSize: 13, fontWeight: 600, color: T.accent }}>{previewed.length} records ready</div><div style={{ maxHeight: 300, overflow: "auto", border: `1px solid ${T.border}`, borderRadius: 8, marginBottom: 16 }}><table style={{ width: "100%", borderCollapse: "collapse" }}><thead><tr style={{ background: T.bg }}>{cols.map(f => <th key={f.key} style={thS}>{f.label}</th>)}</tr></thead><tbody>{previewed.slice(0, 50).map((r, i) => <tr key={i} style={{ borderBottom: `1px solid ${T.bg}` }}>{cols.map(f => <td key={f.key} style={{ ...tdS, fontSize: 12 }}>{r[f.key] || "\u2014"}</td>)}</tr>)}</tbody></table></div><div style={{ display: "flex", justifyContent: "space-between" }}><button style={bs} onClick={() => setStep("map")}>Back</button><button style={bp} onClick={() => onImport(previewed)}>Import {previewed.length}</button></div></div>}
  </div></Overlay>;
}
