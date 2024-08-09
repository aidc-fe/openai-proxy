const pickHeaders = (headers: Headers, keys: (string | RegExp)[]): Headers => {
  const picked = new Headers();
  for (const key of headers.keys()) {
    if (keys.some((k) => (typeof k === "string" ? k === key : k.test(key)))) {
      const value = headers.get(key);
      if (typeof value === "string") {
        if (key === 'authorization') {
          // picked.set(key, `Bearer ${process.env.OPENAI_API_KEY}`)
          if (process.env.OPENAI_API_KEY) {
            picked.set('api-key', process.env.OPENAI_API_KEY)
          }
        } else {
          picked.set(key, value);
        }
      }
    }
  }
  return picked;
};

const CORS_HEADERS: Record<string, string> = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, POST, PUT, DELETE, OPTIONS",
  "access-control-allow-headers": "Content-Type, Authorization",
};

export default async function handleRequest(req: Request & { nextUrl?: URL }) {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: CORS_HEADERS,
    });
  }

  const { pathname } = req.nextUrl ? req.nextUrl : new URL(req.url);
  const url = new URL('/openai/deployments/gpt-4o' + pathname + '?api-version=2024-02-01', process.env.OPENAI_API_BASE).href;
  console.log('url', url);
  const headers = pickHeaders(req.headers, ["content-type", "authorization", ]);

  const res = await fetch(url, {
    body: req.body,
    method: req.method,
    headers,
  });

  const resHeaders = {
    ...CORS_HEADERS,
    ...Object.fromEntries(
      pickHeaders(res.headers as any as Headers, ["content-type", /^x-ratelimit-/, /^openai-/])
    ),
  };

  return new Response(res.body as any, {
    headers: resHeaders,
    status: res.status
  });
}
