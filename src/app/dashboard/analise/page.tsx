
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import AIAnalyzer from "./AIAnalyzer";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export default async function AIAnalysisPage() {
  const session = await getServerSession();

  if (!session) {
    redirect("/login");
  }

  const clients = await prisma.client.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true }
  });

  return (
    <div className="min-h-screen bg-slate-50 p-6">
       <div className="max-w-6xl mx-auto space-y-6">
         <div className="flex items-center justify-between">
           <div>
             <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
               <span className="bg-indigo-600 text-white p-1 rounded">IA</span> Análise de Projetos
             </h1>
             <p className="text-slate-600">
               Envie plantas ou rascunhos e deixe a IA sugerir o orçamento.
             </p>
           </div>
           <Link href="/dashboard" className="text-sm font-medium text-slate-500 hover:text-slate-900">
              Voltar ao Dashboard
           </Link>
         </div>
         
         <AIAnalyzer clients={clients} />
       </div>
    </div>
  );
}
