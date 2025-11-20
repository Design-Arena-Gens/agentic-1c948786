import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const { rows } = (await request.json()) as { rows: string[][] };
    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: "No rows provided" }, { status: 400 });
    }

    const spreadsheetId = process.env.GOOGLE_SHEETS_ID;
    const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;

    if (!spreadsheetId || !serviceAccountKey) {
      return NextResponse.json(
        {
          error:
            "Missing Google credentials. Set GOOGLE_SHEETS_ID and GOOGLE_SERVICE_ACCOUNT_KEY in env. Falling back to CSV."
        },
        { status: 500 }
      );
    }

    const keyObj = JSON.parse(serviceAccountKey);
    const scopes = ["https://www.googleapis.com/auth/spreadsheets"];
    const jwt = new google.auth.JWT(keyObj.client_email, undefined, keyObj.private_key, scopes);
    const sheets = google.sheets({ version: "v4", auth: jwt });

    // Ensure header exists; append all rows after header
    const header = [
      "File Name",
      "Candidate Name",
      "Email",
      "Phone",
      "Years Experience",
      "Top Skills",
      "Summary"
    ];

    // Read current values to see if header exists
    const getResp = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "Sheet1!A1:G1"
    });

    const firstRow = getResp.data.values?.[0] || [];
    if (firstRow.length === 0) {
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: "Sheet1!A1:G1",
        valueInputOption: "RAW",
        requestBody: { values: [header] }
      });
    }

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: "Sheet1!A2",
      valueInputOption: "RAW",
      insertDataOption: "INSERT_ROWS",
      requestBody: { values: rows }
    });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Unknown error" }, { status: 500 });
  }
}

