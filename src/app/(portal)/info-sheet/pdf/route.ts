import { NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import { getInfoSheet } from "@/lib/services/info-sheet-service";
import { renderInfoSheetPdf } from "../_components/info-sheet-pdf";

export const runtime = "nodejs";

export async function GET(request: Request) {
  let userId: number;
  try {
    ({ userId } = await getAuth());
  } catch {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const mode =
    new URL(request.url).searchParams.get("mode") === "download"
      ? "attachment"
      : "inline";

  try {
    const data = await getInfoSheet(userId);
    const pdf = await renderInfoSheetPdf(data);

    return new NextResponse(new Uint8Array(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `${mode}; filename="Spring-Aqua-Customer-Info-Sheet.pdf"`,
      },
    });
  } catch (error) {
    console.error("[info-sheet/pdf] failed to render", error);
    return new NextResponse("Unable to generate PDF", { status: 502 });
  }
}
