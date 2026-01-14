"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DeleteProductButton({ id }: { id: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirm("Deseja realmente excluir este produto?")) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/produtos/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Erro ao excluir");
      } else {
        router.refresh();
      }
    } catch (err) {
      console.error(err);
      alert("Erro ao excluir");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="text-xs text-red-600 hover:text-red-800 underline disabled:opacity-50 bg-transparent border-none cursor-pointer p-0"
    >
      {loading ? "Excluindo..." : "Excluir"}
    </button>
  );
}
