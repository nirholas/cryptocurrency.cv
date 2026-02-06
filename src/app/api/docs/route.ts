import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const host = request.headers.get('host') || 'cryptocurrency.cv';
  const baseUrl = `https://${host}`;
  
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Free Crypto News API Documentation</title>
  <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #1a1a2e; }
    .swagger-ui { max-width: 1200px; margin: 0 auto; }
    .swagger-ui .topbar { display: none; }
    .swagger-ui .info { margin: 30px 0; }
    .swagger-ui .info .title { color: #fff; }
    .swagger-ui .info .description p { color: #ccc; }
    .swagger-ui .opblock-tag { color: #fff !important; }
    .swagger-ui .opblock .opblock-summary-operation-id { color: #fff; }
    .swagger-ui .btn { border-radius: 4px; }
    .header-banner {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 40px 20px;
      text-align: center;
      color: white;
    }
    .header-banner h1 { font-size: 2.5em; margin-bottom: 10px; }
    .header-banner p { font-size: 1.2em; opacity: 0.9; }
    .badge {
      display: inline-block;
      background: rgba(255,255,255,0.2);
      padding: 5px 15px;
      border-radius: 20px;
      margin-top: 15px;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <div class="header-banner">
    <h1>🆓 Free Crypto News API</h1>
    <p>100% FREE • No API Keys • No Rate Limits</p>
    <span class="badge">130+ Sources • Real-time News</span>
  </div>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script>
    window.onload = function() {
      SwaggerUIBundle({
        url: "${baseUrl}/api/openapi.json",
        dom_id: '#swagger-ui',
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIBundle.SwaggerUIStandalonePreset
        ],
        layout: "BaseLayout",
        deepLinking: true,
        defaultModelsExpandDepth: -1,
        docExpansion: "list"
      });
    };
  </script>
</body>
</html>`;

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600',
    },
  });
}
