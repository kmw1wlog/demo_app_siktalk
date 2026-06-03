import { readFile } from "node:fs/promises";

const ebookPath = "/home/openq/code/platform_block_trade/영웅문_단타_화면_세팅_가이드.pdf";

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
