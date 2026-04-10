import { getQWConnection } from "@/lib/quotewerks";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const pool = await getQWConnection();

    let hasSerialNumber = false;
    try {
      await pool.request().query("SELECT TOP 1 SerialNumber FROM DocumentItems");
      hasSerialNumber = true;
    } catch { hasSerialNumber = false; }

    let hasSerialNumbers = false;
    try {
      await pool.request().query("SELECT TOP 1 SerialNumbers FROM DocumentItems");
      hasSerialNumbers = true;
    } catch { hasSerialNumbers = false; }

    const sample = await pool.request().query("SELECT TOP 3 di.ManufacturerPartNumber, di.CustomText04, di.CustomMemo02, di.CustomDate02 FROM DocumentItems di WHERE di.CustomMemo02 = 'Aztek' AND di.LineType = 1");

    return NextResponse.json({
      success: true,
      hasSerialNumberColumn: hasSerialNumber,
      hasSerialNumbersColumn: hasSerialNumbers,
      sampleAztekItems: sample.recordset
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
