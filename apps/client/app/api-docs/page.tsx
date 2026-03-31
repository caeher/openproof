import Link from 'next/link'
import { ArrowLeft, Code2, FileJson, Globe2, KeyRound, Lock, Server, Zap } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CodeBlock } from '@/components/ui/code-block'
import { Header, Footer, MobileNav } from '@/components/layout'
import { cn } from '@/lib/utils'

type ExampleLanguageId = 'curl' | 'typescript' | 'python' | 'rust'

interface CodeExample {
  id: ExampleLanguageId
  label: string
  language: 'bash' | 'typescript' | 'python' | 'rust'
  code: string
}

interface EndpointDefinition {
  method: 'GET' | 'POST'
  path: string
  audience: string
  description: string
  requestExamples: CodeExample[]
  response: string
  notes: string[]
}

const languageOptions: Array<{ id: ExampleLanguageId; label: string }> = [
  { id: 'typescript', label: 'TypeScript' },
  { id: 'python', label: 'Python' },
  { id: 'rust', label: 'Rust' },
  { id: 'curl', label: 'cURL' },
]

function resolveLanguage(value?: string | string[]): ExampleLanguageId {
  const rawValue = Array.isArray(value) ? value[0] : value
  if (rawValue && languageOptions.some((option) => option.id === rawValue)) {
    return rawValue as ExampleLanguageId
  }

  return 'typescript'
}

function getExampleForLanguage(examples: CodeExample[], languageId: ExampleLanguageId) {
  return examples.find((example) => example.id === languageId) ?? examples[0]
}

const quickstartExamples = [
  {
    id: 'curl',
    label: 'curl',
    language: 'bash' as const,
    code: `curl -X POST https://tu-dominio-openproof.com/api/v1/documents/verify \\
  -H "Content-Type: application/json" \\
  -d '{
    "fileHash": "a7ffc6f8bf1ed76651c14756a061d662f580ff4de43b49fa82d80a4b80f8434a"
  }'`,
  },
  {
    id: 'typescript',
    label: 'TypeScript',
    language: 'typescript' as const,
    code: `const response = await fetch('https://tu-dominio-openproof.com/api/v1/documents/verify', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    fileHash: 'a7ffc6f8bf1ed76651c14756a061d662f580ff4de43b49fa82d80a4b80f8434a',
  }),
})

const payload = await response.json()

if (payload.success && payload.data.publicProofPath) {
  console.log('Viewer público:', payload.data.publicProofPath)
}`,
  },
  {
    id: 'python',
    label: 'Python',
    language: 'python' as const,
    code: `import requests

response = requests.post(
    'https://tu-dominio-openproof.com/api/v1/documents/verify',
    json={
        'fileHash': 'a7ffc6f8bf1ed76651c14756a061d662f580ff4de43b49fa82d80a4b80f8434a'
    },
    timeout=10,
)

payload = response.json()
print(payload['data'].get('publicProofPath'))`,
  },
  {
    id: 'rust',
    label: 'Rust',
    language: 'rust' as const,
    code: `use reqwest::Client;
use serde_json::json;

let client = Client::new();

let payload = client
    .post("https://tu-dominio-openproof.com/api/v1/documents/verify")
    .json(&json!({
        "fileHash": "a7ffc6f8bf1ed76651c14756a061d662f580ff4de43b49fa82d80a4b80f8434a"
    }))
    .send()
    .await?
    .json::<serde_json::Value>()
    .await?;

println!("{:?}", payload["data"]["publicProofPath"]);`,
  },
] satisfies CodeExample[]

const endpoints = [
  {
    method: 'POST',
    path: '/api/v1/documents',
    audience: 'Bearer requerido',
    description: 'Registra un hash documental con nombre de archivo y metadatos opcionales.',
    requestExamples: [
      {
        id: 'curl',
        label: 'curl',
        language: 'bash' as const,
        code: `curl -X POST https://tu-dominio-openproof.com/api/v1/documents \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer OPENPROOF_API_KEY" \\
  -d '{
    "fileHash": "a7ffc6f8bf1ed76651c14756a061d662f580ff4de43b49fa82d80a4b80f8434a",
    "filename": "contrato-marzo-2026.pdf",
    "metadata": {
      "description": "Contrato firmado con proveedor",
      "tags": ["legal", "proveedores"]
    }
  }'`,
      },
      {
        id: 'typescript',
        label: 'TypeScript',
        language: 'typescript' as const,
        code: `const response = await fetch('https://tu-dominio-openproof.com/api/v1/documents', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: 'Bearer OPENPROOF_API_KEY',
  },
  body: JSON.stringify({
    fileHash: 'a7ffc6f8bf1ed76651c14756a061d662f580ff4de43b49fa82d80a4b80f8434a',
    filename: 'contrato-marzo-2026.pdf',
    metadata: {
      description: 'Contrato firmado con proveedor',
      tags: ['legal', 'proveedores'],
    },
  }),
})

const payload = await response.json()`,
      },
      {
        id: 'python',
        label: 'Python',
        language: 'python' as const,
        code: `import requests

payload = requests.post(
    'https://tu-dominio-openproof.com/api/v1/documents',
    headers={'Authorization': 'Bearer OPENPROOF_API_KEY'},
    json={
        'fileHash': 'a7ffc6f8bf1ed76651c14756a061d662f580ff4de43b49fa82d80a4b80f8434a',
        'filename': 'contrato-marzo-2026.pdf',
        'metadata': {
            'description': 'Contrato firmado con proveedor',
            'tags': ['legal', 'proveedores'],
        },
    },
    timeout=10,
)

print(payload.json())`,
      },
      {
        id: 'rust',
        label: 'Rust',
        language: 'rust' as const,
        code: `use reqwest::Client;
use serde_json::json;

let client = Client::new();

let payload = client
    .post("https://tu-dominio-openproof.com/api/v1/documents")
    .bearer_auth("OPENPROOF_API_KEY")
    .json(&json!({
        "fileHash": "a7ffc6f8bf1ed76651c14756a061d662f580ff4de43b49fa82d80a4b80f8434a",
        "filename": "contrato-marzo-2026.pdf",
        "metadata": {
            "description": "Contrato firmado con proveedor",
            "tags": ["legal", "proveedores"]
        }
    }))
    .send()
    .await?
    .json::<serde_json::Value>()
    .await?;`,
      },
    ],
    response: `{
  "success": true,
  "data": {
    "documentId": "2fbd2479-c2b7-467a-9d85-4f1119caaf39",
    "transactionId": "4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b",
    "status": "processing",
    "createdAt": "2026-03-30T18:45:00Z"
  }
}`,
    notes: [
      'Requiere sesión verificada o API key bearer válida.',
      'El `transactionId` puede llegar vacío mientras el worker todavía no haya emitido la transacción on-chain.',
    ],
  },
  {
    method: 'POST',
    path: '/api/v1/documents/verify',
    audience: 'Ruta pública',
    description: 'Verifica si un hash ya fue registrado y devuelve la ruta pública del viewer cuando existe constancia compartible.',
    requestExamples: quickstartExamples,
    response: `{
  "success": true,
  "data": {
    "exists": true,
    "transactionId": "4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b",
    "publicProofPath": "/p/4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b",
    "blockHeight": 831542,
    "timestamp": "2024-01-15T10:30:00Z",
    "confirmations": 1542
  }
}`,
    notes: [
      'No requiere autenticación y está sujeta a rate limiting público.',
      '`publicProofPath` es la ruta recomendada para enlazar el viewer oficial desde tus propias aplicaciones.',
    ],
  },
  {
    method: 'GET',
    path: '/api/v1/documents/{id}',
    audience: 'Bearer requerido',
    description: 'Obtiene el detalle privado de un documento perteneciente al owner autenticado.',
    requestExamples: [
      {
        id: 'curl',
        label: 'curl',
        language: 'bash' as const,
        code: `curl https://tu-dominio-openproof.com/api/v1/documents/2fbd2479-c2b7-467a-9d85-4f1119caaf39 \\
  -H "Authorization: Bearer OPENPROOF_API_KEY"`,
      },
      {
        id: 'typescript',
        label: 'TypeScript',
        language: 'typescript' as const,
        code: `const response = await fetch(
  'https://tu-dominio-openproof.com/api/v1/documents/2fbd2479-c2b7-467a-9d85-4f1119caaf39',
  {
    headers: {
      Authorization: 'Bearer OPENPROOF_API_KEY',
    },
  },
)

const payload = await response.json()`,
      },
      {
        id: 'python',
        label: 'Python',
        language: 'python' as const,
        code: `import requests

payload = requests.get(
    'https://tu-dominio-openproof.com/api/v1/documents/2fbd2479-c2b7-467a-9d85-4f1119caaf39',
    headers={'Authorization': 'Bearer OPENPROOF_API_KEY'},
    timeout=10,
)

print(payload.json())`,
      },
      {
        id: 'rust',
        label: 'Rust',
        language: 'rust' as const,
        code: `let client = reqwest::Client::new();

let payload = client
    .get("https://tu-dominio-openproof.com/api/v1/documents/2fbd2479-c2b7-467a-9d85-4f1119caaf39")
    .bearer_auth("OPENPROOF_API_KEY")
    .send()
    .await?
    .json::<serde_json::Value>()
    .await?;`,
      },
    ],
    response: `{
  "success": true,
  "data": {
    "id": "2fbd2479-c2b7-467a-9d85-4f1119caaf39",
    "fileHash": "a7ffc6f8bf1ed76651c14756a061d662f580ff4de43b49fa82d80a4b80f8434a",
    "filename": "contract.pdf",
    "metadata": {
      "description": "Contrato firmado con proveedor",
      "tags": ["legal", "proveedores"]
    },
    "transactionId": "4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b",
    "blockHeight": 831542,
    "timestamp": "2024-01-15T10:30:00Z",
    "confirmations": 1542,
    "status": "confirmed",
    "createdAt": "2026-03-30T18:45:00Z",
    "updatedAt": "2026-03-30T18:52:00Z"
  }
}`,
    notes: [
      'Solo devuelve documentos asociados al owner autenticado o al owner de la API key.',
    ],
  },
  {
    method: 'GET',
    path: '/api/v1/documents',
    audience: 'Bearer requerido',
    description: 'Lista los documentos del usuario autenticado o del owner de la API key.',
    requestExamples: [
      {
        id: 'curl',
        label: 'curl',
        language: 'bash' as const,
        code: `curl https://tu-dominio-openproof.com/api/v1/documents \\
  -H "Authorization: Bearer OPENPROOF_API_KEY"`,
      },
      {
        id: 'python',
        label: 'Python',
        language: 'python' as const,
        code: `import requests

payload = requests.get(
    'https://tu-dominio-openproof.com/api/v1/documents',
    headers={'Authorization': 'Bearer OPENPROOF_API_KEY'},
    timeout=10,
)

print(payload.json())`,
      },
      {
        id: 'typescript',
        label: 'TypeScript',
        language: 'typescript' as const,
        code: `const response = await fetch('https://tu-dominio-openproof.com/api/v1/documents', {
  headers: {
    Authorization: 'Bearer OPENPROOF_API_KEY',
  },
})

const payload = await response.json()`,
      },
      {
        id: 'rust',
        label: 'Rust',
        language: 'rust' as const,
        code: `let client = reqwest::Client::new();

let payload = client
    .get("https://tu-dominio-openproof.com/api/v1/documents")
    .bearer_auth("OPENPROOF_API_KEY")
    .send()
    .await?
    .json::<serde_json::Value>()
    .await?;`,
      },
    ],
    response: `{
  "success": true,
  "data": [
    {
      "id": "2fbd2479-c2b7-467a-9d85-4f1119caaf39",
      "fileHash": "a7ffc6f8bf1ed76651c14756a061d662f580ff4de43b49fa82d80a4b80f8434a",
      "filename": "contrato-marzo-2026.pdf",
      "transactionId": "4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b",
      "status": "confirmed",
      "createdAt": "2026-03-30T18:45:00Z",
      "updatedAt": "2026-03-30T18:52:00Z"
    }
  ]
}`,
    notes: [
      'Útil para dashboards, backoffices o conciliación de registros ya procesados.',
    ],
  },
  {
    method: 'GET',
    path: '/api/v1/transactions/{txid}',
    audience: 'Ruta pública',
    description: 'Expone información pública de una transacción Bitcoin vinculada al registro.',
    requestExamples: [
      {
        id: 'curl',
        label: 'curl',
        language: 'bash' as const,
        code: `curl https://tu-dominio-openproof.com/api/v1/transactions/4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b`,
      },
      {
        id: 'rust',
        label: 'Rust',
        language: 'rust' as const,
        code: `let payload = reqwest::get(
    "https://tu-dominio-openproof.com/api/v1/transactions/4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b"
)
.await?
.json::<serde_json::Value>()
.await?;`,
      },
  {
    id: 'typescript',
    label: 'TypeScript',
    language: 'typescript' as const,
    code: `const response = await fetch(
  'https://tu-dominio-openproof.com/api/v1/transactions/4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b'
)

const payload = await response.json()`,
  },
  {
    id: 'python',
    label: 'Python',
    language: 'python' as const,
    code: `import requests

payload = requests.get(
    'https://tu-dominio-openproof.com/api/v1/transactions/4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b',
    timeout=10,
)

print(payload.json())`,
  },
    ],
    response: `{
  "success": true,
  "data": {
    "txid": "4a5e1e4baab89f3a32518a88c31bc87f...",
    "blockHeight": 831542,
    "blockHash": "000000000000000000029d7e3cb4c3a0...",
    "timestamp": "2024-01-15T10:30:00Z",
    "confirmations": 1542,
    "fee": 0.00001234,
    "outputs": [
      {
        "address": "bc1qexample...",
        "value": 0.00000546,
        "opReturn": "a7ffc6f8bf1ed76651c14756a061d662"
      }
    ]
  }
}`,
    notes: [
      'Diseñada para viewers públicos, auditorías técnicas y validación de anclaje on-chain.',
    ],
  },
] satisfies EndpointDefinition[]

export default async function APIDocsPage({
  searchParams,
}: {
  searchParams?: Promise<{ lang?: string | string[] | undefined }>
}) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined
  const selectedLanguage = resolveLanguage(resolvedSearchParams?.lang)
  const selectedLanguageLabel = languageOptions.find((option) => option.id === selectedLanguage)?.label ?? 'TypeScript'

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="container max-w-6xl mx-auto px-4 py-8 md:py-12">
        <div>
          {/* Back link */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al inicio
          </Link>

          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                Documentación de la API
            </h1>
            <p className="mt-2 text-muted-foreground">
              Fácil integración
            </p>
          </div>

          <div className="space-y-6">
            {/* Header */}
            <div className="rounded-3xl border border-border bg-card p-6 md:p-8">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary text-sm font-medium text-foreground mb-4">
                <Code2 className="w-4 h-4" />
                API REST v1
              </div>
              
              <p className="text-lg text-muted-foreground">
                Integra OpenProof desde backend, scripts o servicios externos para registrar
                hashes, consultar estados y enlazar viewers públicos con ejemplos listos para usar.
              </p>

              <div className="mt-8 flex flex-col gap-3">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Lenguaje global de ejemplos
                </p>
                <div className="flex flex-wrap gap-2">
                  {languageOptions.map((option) => (
                    <Link
                      key={option.id}
                      href={option.id === 'typescript' ? '/api-docs' : `/api-docs?lang=${option.id}`}
                      scroll={false}
                      className={cn(
                        'inline-flex items-center rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] transition-colors',
                        selectedLanguage === option.id
                          ? 'border-foreground bg-foreground text-background'
                          : 'border-border bg-secondary/60 text-muted-foreground hover:text-foreground',
                      )}
                    >
                      {option.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Server className="w-5 h-5" />
                    Base URL
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="rounded-2xl border border-border bg-secondary/50 px-4 py-4 font-mono text-sm text-foreground">
                    https://tu-dominio-openproof.com/api/v1
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <KeyRound className="w-5 h-5" />
                    Autenticación
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm leading-7 text-muted-foreground">
                    Las rutas privadas aceptan API key bearer o sesión válida según el contexto.
                  </p>
                  <p className="rounded-2xl border border-border bg-secondary/50 px-4 py-4 font-mono text-xs text-foreground">
                    Authorization: Bearer OPENPROOF_API_KEY
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe2 className="w-5 h-5" />
                    Viewer público
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm leading-7 text-muted-foreground">
                    Usa la respuesta de verificación para enlazar el viewer oficial devuelto en
                    <span className="font-mono text-foreground"> publicProofPath</span>.
                  </p>
                  <p className="rounded-2xl border border-border bg-secondary/50 px-4 py-4 font-mono text-xs text-foreground">
                    /p/&lt;transactionId&gt;
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code2 className="w-5 h-5" />
                  Inicio rápido
                </CardTitle>
                <CardDescription>
                  Elige un lenguaje una sola vez y todos los snippets se sincronizan.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CodeBlock
                  code={getExampleForLanguage(quickstartExamples, selectedLanguage).code}
                  language={getExampleForLanguage(quickstartExamples, selectedLanguage).language}
                  title={`Quickstart · ${selectedLanguageLabel}`}
                />
              </CardContent>
            </Card>

            {/* Endpoints */}
            <div className="space-y-8">
              <h2 className="text-xl font-bold text-foreground">Endpoints</h2>
              
              {endpoints.map((endpoint) => (
                <Card key={`${endpoint.method}:${endpoint.path}`}>
                  <CardHeader>
                    <div className="flex flex-wrap items-center gap-3">
                      <Badge 
                        variant={endpoint.method === 'POST' ? 'default' : 'secondary'}
                        className={endpoint.method === 'POST' ? 'bg-accent text-accent-foreground' : ''}
                      >
                        {endpoint.method}
                      </Badge>
                      <Badge variant="outline">{endpoint.audience}</Badge>
                      <code className="font-mono text-sm text-foreground">
                        {endpoint.path}
                      </code>
                    </div>
                    <CardDescription className="mt-2">
                      {endpoint.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <CodeBlock
                        code={getExampleForLanguage(endpoint.requestExamples, selectedLanguage).code}
                        language={getExampleForLanguage(endpoint.requestExamples, selectedLanguage).language}
                        title={`Request · ${selectedLanguageLabel}`}
                      />

                      <CodeBlock code={endpoint.response} language="json" title="Response" />

                      <div className="grid gap-4 md:grid-cols-2">
                        {endpoint.notes.map((note) => (
                          <div key={note} className="rounded-2xl border border-border bg-secondary/35 px-4 py-4 text-sm leading-7 text-muted-foreground">
                            {note}
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Rate limits */}
            <Card>
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
                  
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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
                  
                  <CodeBlock
                    code={`X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1705312260`}
                    language="bash"
                    title="Headers de ejemplo"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Errors */}
            <Card>
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
            <div className="rounded-3xl border border-border bg-card p-6 text-center md:p-8">
              <p className="text-muted-foreground mb-4">
                ¿Listo para integrar OpenProof?
              </p>
              <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Button asChild>
                  <Link href="/developers">Obtener API key</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/pricing">Revisar créditos</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
      <MobileNav />
    </div>
  )
}
