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

    // Step 1: does a header row exist at all, with a fuzzy LIKE match?
    const headerReq = pool.request();
    headerReq.input("docNoLike", `%${docNo}%`);
    const headerResult = await headerReq.query(
      "SELECT ID, DocNo, DocType, DocDate, DocStatus, SoldToCompany FROM DocumentHeaders WHERE DocNo LIKE @docNoLike"
    );

    // Step 2: for each matching header, pull its line items (LEFT JOIN so we see headers with zero items too)
    const itemsReq = pool.request();
    itemsReq.input("docNoLike2", `%${docNo}%`);
    const itemsResult = await itemsReq.query(
      "SELECT dh.DocNo, dh.DocType, di.LineType, di.ManufacturerPartNumber AS sku, di.Description, di.QtyTotal, di.UnitPrice, di.UnitCost, di.CustomText04 AS serial, di.CustomText10 AS xeroInvoiceRef, di.Manufacturer, di.Vendor FROM DocumentHeaders dh LEFT JOIN DocumentItems di ON di.DocID = dh.ID WHERE dh.DocNo LIKE @docNoLike2"
    );

    return NextResponse.json({
      success: true,
      docNo,
      headerMatches: headerResult.recordset,
      headerMatchCount: headerResult.recordset.length,
      itemRows: itemsResult.recordset,
      itemRowCount: itemsResult.recordset.length
    });
  } catch (error) {
    console.error("Debug doc error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
