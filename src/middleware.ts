import { NextResponse, type NextRequest } from "next/server";

function unauthorized() {
  return new NextResponse("Acesso restrito.", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="BBE Admin"' },
  });
}

export function middleware(request: NextRequest) {
  const user = process.env.ADMIN_USER;
  const pass = process.env.ADMIN_PASSWORD;

  if (!user || !pass) {
    return new NextResponse(
      "Admin não configurado (defina ADMIN_USER e ADMIN_PASSWORD).",
      {
        status: 500,
      },
    );
  }

  const header = request.headers.get("authorization");
  if (!header?.startsWith("Basic ")) return unauthorized();

  const base64Credentials = header.slice("Basic ".length);
  let decoded = "";
  try {
    decoded = atob(base64Credentials);
  } catch {
    return unauthorized();
  }

  const [incomingUser, incomingPass] = decoded.split(":");
  if (incomingUser !== user || incomingPass !== pass) return unauthorized();

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
