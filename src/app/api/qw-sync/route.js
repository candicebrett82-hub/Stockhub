import { getQWConnection } from "@/lib/quotewerks";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request) {
  try {
    const type = request.nextUrl.searchParams.get("type");
    const since = request.nextUrl.searchParams.get("since");
    const pool = await getQWConnection();
    const result = {};
    if (type === "invoices" || type === "both" || !type) {
      const dateFilter = since ? "AND dh.DocDate >= @since" : "";
      const req = pool.request();
      if (since) req.input("since", since);
      const invoices = await req.query("SELECT dh.DocNo AS qwRef, dh.DocDate AS invoiceDate, dh.SoldToCompany AS customer, dh.SoldToContact AS contact, dh.DocStatus AS status, di.ManufacturerPartNumber AS sku, di.Description AS description, di.QtyTotal AS qty, di.UnitPrice AS unitPrice, di.UnitCost AS unitCost, di.SerialNumber AS serial, di.CustomText04 AS serialAlt, di.Manufacturer AS manufacturer, di.Vendor AS vendor FROM DocumentHeaders dh INNER JOIN DocumentItems di ON di.DocID = dh.ID WHERE dh.DocType = 'INVOICE' AND di.LineType = 1 " + dateFilter + " ORDER BY dh.DocDate DESC");
      const grouped = {};
      for (const row of invoices.recordset) {
        const key = row.qwRef;
        if (!grouped[key]) {
          grouped[key] = { qwRef: row.qwRef, customer: row.customer || "", contact: row.contact || "", date: row.invoiceDate, items: [] };
        }
        grouped[key].items.push({ sku: row.sku || "", description: row.description || "", qty: row.qty || 1, unitPrice: row.unitPrice || 0, unitCost: row.unitCost || 0, serial: (row.serial || row.serialAlt || "").trim(), manufacturer: row.manufacturer || "", vendor: row.vendor || "" });
      }
      result.invoices = Object.values(grouped);
    }
    if (type === "pos" || type === "both" || !type) {
      const dateFilter = since ? "AND dh.DocDate >= @since2" : "";
      const req2 = pool.request();
      if (since) req2.input("since2", since);
      const pos = await req2.query("SELECT dh.DocNo AS qwRef, dh.DocDate AS poDate, dh.SoldToCompany AS supplier, dh.DocStatus AS status, di.ManufacturerPartNumber AS sku, di.Description AS description, di.QtyTotal AS qty, di.UnitCost AS unitCost, di.SerialNumber AS serial, di.CustomText04 AS serialAlt, di.Manufacturer AS manufacturer, di.Vendor AS vendor FROM DocumentHeaders dh INNER JOIN DocumentItems di ON di.DocID = dh.ID WHERE dh.DocType = 'ORDER' AND di.LineType = 1 AND di.UnitCost > 0 " + dateFilter + " ORDER BY dh.DocDate DESC");
      const grouped = {};
      for (const row of pos.recordset) {
        const key = row.qwRef;
        if (!grouped[key]) {
          grouped[key] = { qwRef: row.qwRef, supplier: row.supplier || "", date: row.poDate, status: row.status || "", items: [] };
        }
        grouped[key].items.push({ sku: row.sku || "", description: row.description || "", qty: row.qty || 1, unitCost: row.unitCost || 0, serial: (row.serial || row.serialAlt || "").trim(), manufacturer: row.manufacturer || "", vendor: row.vendor || "" });
      }
      result.purchaseOrders = Object.values(grouped);
    }
    return NextResponse.json({ success: true, ...result, syncedAt: new Date().toISOString() });
  } catch (error) {
    console.error("QW Sync error:", error);
    return NextResponse.json({ success: false, error: error.message, hint: "Check QW_SQL_ environment variables in Vercel" }, { status: 500 });
  }
}
