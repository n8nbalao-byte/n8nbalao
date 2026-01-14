import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export default async function ClientesPage() {
  const session = await getServerSession();

  if (!session) {
    redirect("/login");
  }

  const clientes = await prisma.client.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
      <div className="w-full max-w-5xl rounded-xl bg-white shadow-sm border border-slate-200 p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Clientes
            </h1>
            <p className="text-sm text-slate-600">
              Cadastre e gerencie os clientes da loja.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Voltar ao Dashboard
            </Link>
            <Link
              href="/clientes/novo"
              className="inline-flex items-center justify-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 transition-colors"
            >
              Novo cliente
            </Link>
          </div>
        </div>

        <div className="border border-slate-200 rounded-lg overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left px-4 py-3 text-slate-600 font-semibold">
                  Nome
                </th>
                <th className="text-left px-4 py-3 text-slate-600 font-semibold">
                  CPF/CNPJ
                </th>
                <th className="text-left px-4 py-3 text-slate-600 font-semibold">
                  Tipo
                </th>
                <th className="text-left px-4 py-3 text-slate-600 font-semibold">
                  Cidade/UF
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {clientes.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-10 text-center text-slate-500"
                  >
                    Nenhum cliente cadastrado ainda.
                  </td>
                </tr>
              ) : (
                clientes.map((cliente) => (
                  <tr key={cliente.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <Link
                        href={`/clientes/${cliente.id}/editar`}
                        className="font-medium text-slate-900 hover:text-blue-600 hover:underline"
                      >
                        {cliente.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-slate-600 font-mono text-xs">
                      {cliente.document}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        cliente.type === 'PF' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'
                      }`}>
                        {cliente.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {cliente.city ? `${cliente.city}/${cliente.state}` : "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <div className="text-xs text-slate-500">
            Total de {clientes.length} cliente(s) cadastrado(s).
          </div>
          <div className="text-xs text-slate-400 italic">
            Dica: Clique no nome para editar os dados.
          </div>
        </div>
      </div>
    </div>
  );
}
