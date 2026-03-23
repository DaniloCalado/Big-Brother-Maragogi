import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<NextResponse> {
  const blobToken =
    process.env.BLOB_READ_WRITE_TOKEN ??
    process.env.VERCEL_BLOB_READ_WRITE_TOKEN;

  if (!blobToken) {
    console.error(
      "[api/upload] Upload não configurado: defina BLOB_READ_WRITE_TOKEN (ou VERCEL_BLOB_READ_WRITE_TOKEN).",
    );
    return NextResponse.json(
      {
        error:
          "Upload não configurado. Defina BLOB_READ_WRITE_TOKEN nas variáveis de ambiente.",
      },
      { status: 500 },
    );
  }

  let body: HandleUploadBody;
  try {
    body = (await request.json()) as HandleUploadBody;
  } catch (err) {
    console.error("[api/upload] Body inválido", err);
    return NextResponse.json(
      { error: "Body inválido para upload." },
      { status: 400 },
    );
  }

  try {
    const response = await handleUpload({
      body,
      request,
      token: blobToken,
      onBeforeGenerateToken: async (pathname) => {
        return {
          allowedContentTypes: ["video/*", "image/*"],
          pathname,
        };
      },
      onUploadCompleted: async () => {},
    });

    return NextResponse.json(response);
  } catch (err) {
    console.error("[api/upload] Falha no upload", err);
    return NextResponse.json(
      {
        error: "Falha ao iniciar upload.",
        details: err instanceof Error ? err.message : "Erro desconhecido",
      },
      { status: 500 },
    );
  }
}
