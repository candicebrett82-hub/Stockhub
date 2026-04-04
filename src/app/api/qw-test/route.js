import { getQWConnection } from "@/lib/quotewerks";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const pool = await getQWConnection();
    const docCount = await pool.request().query("SELECT COUNT(*) AS total FROM DocumentHeaders");
    const invoiceCount = await pool.request().query("SELECT COUNT(*) AS total FROM DocumentHeaders WHERE DocType = 'INVOICE'");
    return NextResponse.json({ success: true, connection: "OK", totalDocuments: docCount.recordset[0].total, invoices: invoiceCount.recordset[0].total });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
