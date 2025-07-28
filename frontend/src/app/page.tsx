export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold text-center mb-8">
          RBAC Auth Service
        </h1>
        <p className="text-center text-lg mb-8">
          Servicio de autenticación y autorización RBAC para aplicaciones externas
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
          <div className="p-6 border rounded-lg">
            <h2 className="text-xl font-semibold mb-4">🔐 Autenticación</h2>
            <p>OAuth2 Authorization Code Flow con AWS Cognito</p>
          </div>
          <div className="p-6 border rounded-lg">
            <h2 className="text-xl font-semibold mb-4">🎯 Autorización</h2>
            <p>RBAC con Amazon Verified Permissions</p>
          </div>
        </div>
      </div>
    </main>
  )
}