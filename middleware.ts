import { NextRequest, NextResponse } from "next/server";

const AMAP_WEB_SERVICE_KEY = "5a2b5d291a75d25e888b17f499becc21";

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (!pathname.startsWith("/_AMapService")) {
    return NextResponse.next();
  }

  // 构建目标 URL
  const restPath = pathname.replace("/_AMapService", "");
  const targetUrl = new URL(`https://restapi.amap.com${restPath}${search}`);

  // 用 Web 服务 Key 替换原有 key
  targetUrl.searchParams.set("key", AMAP_WEB_SERVICE_KEY);

  // 转发请求
  const resp = await fetch(targetUrl.toString(), {
    method: request.method,
    headers: {
      "User-Agent": "Mozilla/5.0",
    },
  });

  const body = await resp.arrayBuffer();

  return new NextResponse(body, {
    status: resp.status,
    headers: {
      "Content-Type": resp.headers.get("Content-Type") || "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

export const config = {
  matcher: "/_AMapService/:path*",
};
