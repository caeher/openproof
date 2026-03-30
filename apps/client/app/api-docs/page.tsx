import Link from 'next/link'
import { ArrowLeft, Code, Copy, Terminal, FileJson, Lock, Zap, Server } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Header, Footer, MobileNav } from '@/components/layout'

const endpoints = [
  {
    method: 'POST',
    path: '/api/v1/documents',
    description: 'Registra un nuevo documento usando sesion autenticada o API key bearer',
    request: {
      body: `{
  "file_hash": "a7ffc6f8bf1ed76651c14756a061d662f580ff4de43b49fa82d80a4b80f8434a",
  "filename": "contract.pdf",
  "metadata": {
    "description": "Contract document",
    "tags": ["legal", "2024"]
  }
}`,
    },
    response: `{
  "success": true,
  "data": {
    "document_id": "doc_abc123",
    "transaction_id": "4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b",
    "status": "processing",
    "created_at": "2024-01-15T10:30:00Z"
  }
}`,
  },
  {
    method: 'POST',
    path: '/api/v1/documents/verify',
    description: 'Verifica si un documento existe en la blockchain',
    request: {
      body: `{
  "file_hash": "a7ffc6f8bf1ed76651c14756a061d662f580ff4de43b49fa82d80a4b80f8434a"
}`,
    },
    response: `{
  "success": true,
  "data": {
    "exists": true,
    "transaction_id": "4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b",
    "block_height": 831542,
    "timestamp": "2024-01-15T10:30:00Z",
    "confirmations": 1542
  }
}`,
  },
  {
    method: 'GET',
    path: '/api/v1/documents/{id}',
    description: 'Obtiene los detalles de un documento registrado',
    request: null,
    response: `{
  "success": true,
  "data": {
    "id": "doc_abc123",
    "file_hash": "a7ffc6f8bf1ed76651c14756a061d662...",
    "filename": "contract.pdf",
    "metadata": {
      "description": "Contract document",
      "tags": ["legal", "2024"]
    },
    "transaction_id": "4a5e1e4baab89f3a32518a88c31bc87f...",
    "block_height": 831542,
    "timestamp": "2024-01-15T10:30:00Z",
    "confirmations": 1542,
    "status": "confirmed",
    "created_at": "2024-01-15T10:25:00Z"
  }
}`,
  },
  {
    method: 'GET',
    path: '/api/v1/documents',
    description: 'Lista los documentos asociados al usuario autenticado o al owner de la API key',
    request: null,
    response: `{
  "success": true,
  "data": [
    {
      "id": "doc_abc123",
      "file_hash": "a7ffc6f8bf1ed...",
      "filename": "contract.pdf",
      "status": "confirmed",
      "created_at": "2024-01-15T10:25:00Z"
    }
  ]
}`,
  },
  {
    method: 'GET',
    path: '/api/v1/transactions/{txid}',
    description: 'Obtiene detalles de una transacción Bitcoin',
    request: null,
    response: `{
  "success": true,
  "data": {
    "txid": "4a5e1e4baab89f3a32518a88c31bc87f...",
    "block_height": 831542,
    "block_hash": "000000000000000000029d7e3cb4c3a0...",
    "timestamp": "2024-01-15T10:30:00Z",
    "confirmations": 1542,
    "fee": 0.00001234,
    "op_return": "a7ffc6f8bf1ed76651c14756a061d662"
  }
}`,
  },
]

export default function APIDocsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 pb-24 md:pb-0">
        <div className="container mx-auto px-4 py-8 md:py-12">
          {/* Back link */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al inicio
          </Link>

          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-12">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary text-sm font-medium text-foreground mb-4">
                <Code className="w-4 h-4" />
                API REST v1
              </div>
              
              <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                Documentación de la API
              </h1>
              <p className="text-lg text-muted-foreground">
                Integra ProofChain en tu aplicación para registrar y verificar 
                documentos de forma programática.
              </p>
            </div>

            {/* Quick start */}
            <Card className="mb-12">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Terminal className="w-5 h-5" />
                  Inicio rápido
                </CardTitle>
                <CardDescription>
                  Verifica un documento con un simple request
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="p-4 rounded-lg bg-foreground text-background font-mono text-sm overflow-x-auto">
                  <pre>{`curl -X POST https://api.proofchain.io/api/v1/documents \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{"file_hash": "a7ffc6f8bf1ed76651c14756a061d662...", "filename": "contract.pdf"}'

curl -X POST https://api.proofchain.io/api/v1/documents/verify \
  -H "Content-Type: application/json" \\
  -d '{"file_hash": "a7ffc6f8bf1ed76651c14756a061d662..."}'`}</pre>
                </div>
              </CardContent>
            </Card>

            {/* Authentication */}
            <Card className="mb-12">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="w-5 h-5" />
                  Autenticación
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  Todas las peticiones a la API requieren un token de autenticación. 
                  Incluye tu API key en el header de cada request:
                </p>
                
                <div className="p-4 rounded-lg bg-secondary/50 border border-border font-mono text-sm">
                  <code>Authorization: Bearer YOUR_API_KEY</code>
                </div>
                
                <p className="text-sm text-muted-foreground">
                  Puedes generar y rotar tus API keys desde <Link href="/developers" className="text-foreground underline">Developers</Link> una vez autenticado.
                </p>
              </CardContent>
            </Card>

            {/* Base URL */}
            <Card className="mb-12">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="w-5 h-5" />
                  Base URL
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-4 rounded-lg bg-secondary/50 border border-border font-mono text-sm">
                  <code>https://api.proofchain.io/v1</code>
                </div>
              </CardContent>
            </Card>

            {/* Endpoints */}
            <div className="space-y-8">
              <h2 className="text-xl font-bold text-foreground">Endpoints</h2>
              
              {endpoints.map((endpoint) => (
                <Card key={endpoint.path}>
                  <CardHeader>
                    <div className="flex flex-wrap items-center gap-3">
                      <Badge 
                        variant={endpoint.method === 'POST' ? 'default' : 'secondary'}
                        className={endpoint.method === 'POST' ? 'bg-accent text-accent-foreground' : ''}
                      >
                        {endpoint.method}
                      </Badge>
                      <code className="font-mono text-sm text-foreground">
                        {endpoint.path}
                      </code>
                    </div>
                    <CardDescription className="mt-2">
                      {endpoint.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue={endpoint.request ? 'request' : 'response'} className="w-full">
                      <TabsList className="mb-4">
                        {endpoint.request && (
                          <TabsTrigger value="request">Request</TabsTrigger>
                        )}
                        <TabsTrigger value="response">Response</TabsTrigger>
                      </TabsList>
                      
                      {endpoint.request && (
                        <TabsContent value="request">
                          <div className="p-4 rounded-lg bg-foreground text-background font-mono text-xs overflow-x-auto">
                            <pre>{endpoint.request.body}</pre>
                          </div>
                        </TabsContent>
                      )}
                      
                      <TabsContent value="response">
                        <div className="p-4 rounded-lg bg-foreground text-background font-mono text-xs overflow-x-auto">
                          <pre>{endpoint.response}</pre>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Rate limits */}
            <Card className="mt-12">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  Rate Limits
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-muted-foreground">
                    La API tiene los siguientes límites de uso:
                  </p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-4 rounded-lg bg-secondary/50 border border-border text-center">
                      <p className="text-2xl font-bold text-foreground">100</p>
                      <p className="text-sm text-muted-foreground">requests/minuto</p>
                    </div>
                    <div className="p-4 rounded-lg bg-secondary/50 border border-border text-center">
                      <p className="text-2xl font-bold text-foreground">1,000</p>
                      <p className="text-sm text-muted-foreground">requests/hora</p>
                    </div>
                    <div className="p-4 rounded-lg bg-secondary/50 border border-border text-center">
                      <p className="text-2xl font-bold text-foreground">10,000</p>
                      <p className="text-sm text-muted-foreground">requests/día</p>
                    </div>
                  </div>
                  
                  <p className="text-sm text-muted-foreground">
                    Los headers de respuesta incluyen información sobre tu uso actual:
                  </p>
                  
                  <div className="p-4 rounded-lg bg-secondary/50 border border-border font-mono text-xs">
                    <pre>{`X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1705312260`}</pre>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Errors */}
            <Card className="mt-8">
              <CardHeader>
                <CardTitle>Códigos de error</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { code: 400, message: 'Bad Request - Parámetros inválidos' },
                    { code: 401, message: 'Unauthorized - API key inválida o ausente' },
                    { code: 404, message: 'Not Found - Recurso no encontrado' },
                    { code: 429, message: 'Too Many Requests - Rate limit excedido' },
                    { code: 500, message: 'Server Error - Error interno del servidor' },
                  ].map((error) => (
                    <div key={error.code} className="flex items-center gap-4 p-3 rounded-lg bg-secondary/30">
                      <Badge variant="outline" className="font-mono">
                        {error.code}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {error.message}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* CTA */}
            <div className="mt-12 text-center">
              <p className="text-muted-foreground mb-4">
                ¿Listo para integrar ProofChain?
              </p>
              <Button asChild>
                <Link href="/dashboard">Obtener API Key</Link>
              </Button>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
      <MobileNav />
    </div>
  )
}
