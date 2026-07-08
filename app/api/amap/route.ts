import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const path = searchParams.get("path") || "";

  // 构建转发到高德的 URL
  const amapUrl = new URL(`https://restapi.amap.com${path}`);

  // 转发所有查询参数
  searchParams.forEach((value, key) => {
    if (key !== "path") {
      amapUrl.searchParams.set(key, value);
    }
  });

  const response = await fetch(amapUrl.toString());
  const data = await response.text();

  return new NextResponse(data, {
    headers: {
      "Content-Type": response.headers.get("Content-Type") || "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

export async function POST(req: NextRequest) {
  return GET(req);
}
