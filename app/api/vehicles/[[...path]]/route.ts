import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const GATEWAY_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

async function proxyToGateway(request: NextRequest, path: string[]) {
  const cookieStore = await cookies();
  const token = cookieStore.get('access_token')?.value;

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const subPath = path.length > 0 ? `/${path.join('/')}` : '/';
  const targetUrl = new URL(`/api/vehicles${subPath}`, GATEWAY_URL);

  request.nextUrl.searchParams.forEach((value, key) => {
    targetUrl.searchParams.set(key, value);
  });

  let body: BodyInit | undefined;
  if (!['GET', 'HEAD'].includes(request.method)) {
    body = await request.text();
  }

  try {
    const response = await fetch(targetUrl.toString(), {
      method: request.method,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body,
    });

    if (response.status === 204) {
      return new NextResponse(null, { status: 204 });
    }

    const data = await response.text();
    return new NextResponse(data, {
      status: response.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
  }
}

type Params = { params: Promise<{ path?: string[] }> };

export async function GET(request: NextRequest, { params }: Params) {
  const { path = [] } = await params;
  return proxyToGateway(request, path);
}

export async function POST(request: NextRequest, { params }: Params) {
  const { path = [] } = await params;
  return proxyToGateway(request, path);
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const { path = [] } = await params;
  return proxyToGateway(request, path);
}

export async function PUT(request: NextRequest, { params }: Params) {
  const { path = [] } = await params;
  return proxyToGateway(request, path);
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { path = [] } = await params;
  return proxyToGateway(request, path);
}
