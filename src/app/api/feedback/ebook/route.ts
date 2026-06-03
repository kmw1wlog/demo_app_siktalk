import { readFile } from "node:fs/promises";
import path from "node:path";

const ebookPath = path.join(process.cwd(), "public", "downloads", "siktalk-heromoon-setting-guide.pdf");

export async function GET() {
  try {
    const pdf = await readFile(ebookPath);
    return new Response(pdf, {
      headers: {
        "Content-Disposition": 'attachment; filename="siktalk-heromoon-setting-guide.pdf"',
        "Content-Type": "application/pdf",
      },
    });
  } catch {
    return Response.json({ error: "전자책 파일을 찾지 못했습니다." }, { status: 404 });
  }
}
