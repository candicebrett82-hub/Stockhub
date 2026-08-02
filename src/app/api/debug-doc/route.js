import { getQWConnection } from "@/lib/quotewerks";
import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// TEMPORARY DEBUG ENDPOINT — remove after diagnosis is complete.
// Usage: /api/debug-doc?docNo=QW4836
export async function GET(request) {
  try {
    const docNo = request.nextUrl.searchParams.get("docNo");
    if (!docNo) {
      return NextResponse.json({ success: false, error: "Missing ?docNo= param" }, { status: 400 });
    }
    const pool = await getQWConnection();
    const req = pool.request();
    req.input("docNo", docNo);
    const result = await req.query(
      "SELECT dh.DocNo, dh.DocType, dh.DocDate, dh.DocStatus, dh.SoldToCompany, di.LineType, di.ManufacturerPartNumber AS sku, di.Description, di.QtyTotal, di.UnitPrice, di.UnitCost, di.CustomText04 AS serial, di.CustomText10 AS xeroInvoiceRef, di.Manufacturer, di.Vendor FROM DocumentHeaders dh INNER JOIN DocumentItems di ON di.DocID = dh.ID WHERE dh.DocNo = @docNo"
    );
    return NextResponse.json({ success: true, docNo, rowCount: result.recordset.length, rows: result.recordset });
  } catch (error) {
    console.error("Debug doc error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
