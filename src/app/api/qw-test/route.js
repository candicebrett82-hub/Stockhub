import { getQWConnection } from "@/lib/quotewerks";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const pool = await getQWConnection();

    const memo02Values = await pool.request().query("SELECT DISTINCT LTRIM(RTRIM(di.CustomMemo02)) AS val FROM DocumentItems di WHERE di.CustomMemo02 IS NOT NULL AND di.CustomMemo02 != '' AND di.LineType = 1");

    const sampleWithMemo = await pool.request().query("SELECT TOP 5 di.ManufacturerPartNumber AS sku, di.CustomMemo02 AS goodsInType, di.CustomText04 AS serialAlt, di.CustomDate02 AS dateReceived, di.CustomMemo04 AS bookedIn, di.UnitCost, di.Manufacturer, di.Vendor FROM DocumentItems di WHERE di.CustomMemo02 IS NOT NULL AND di.CustomMemo02 != '' AND di.LineType = 1");

    return NextResponse.json({
      success: true,
      distinctGoodsInTypes: memo02Values.recordset.map(r => r.val),
      sampleItems: sampleWithMemo.recordset
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
