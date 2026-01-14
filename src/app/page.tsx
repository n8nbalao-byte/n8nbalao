export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md rounded-xl bg-white shadow-sm border border-slate-200 p-8">
        <h1 className="text-2xl font-semibold text-slate-900 mb-2">
          WM Ferro – Sistema de Aço
        </h1>
        <p className="text-sm text-slate-600 mb-6">
          Painel de controle para vendas, produção e entregas de aço para
          construção.
        </p>
        <a
          href="/login"
          className="inline-flex w-full items-center justify-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 transition-colors"
        >
          Entrar no sistema
        </a>
      </div>
    </div>
  );
}
