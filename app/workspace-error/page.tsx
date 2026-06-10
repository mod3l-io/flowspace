export default async function WorkspaceErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams
  const message = error ? decodeURIComponent(error) : 'No se pudo crear el workspace'

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-red-100 rounded-xl mb-4">
          <span className="text-red-600 text-xl">⚠</span>
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Error al iniciar el workspace</h1>
        <p className="text-sm text-gray-500 mb-6">{message}</p>
        <p className="text-xs text-gray-400 mb-6">
          Esto puede deberse a un problema de permisos en la base de datos.
          Si el problema persiste, revisá la configuración de tu proyecto en Supabase.
        </p>
        <a
          href="/login"
          className="inline-block px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
        >
          Volver al login
        </a>
      </div>
    </div>
  )
}
