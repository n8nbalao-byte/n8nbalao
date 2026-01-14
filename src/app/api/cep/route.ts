import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cep = searchParams.get("cep");

  if (!cep) {
    return NextResponse.json({ error: "CEP obrigatório" }, { status: 400 });
  }

  const cleanCep = cep.replace(/\D/g, "");

  const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
  const data = await response.json();

  if (data.erro) {
    return NextResponse.json({ error: "CEP não encontrado" }, { status: 404 });
  }

  return NextResponse.json({
    zipCode: cleanCep,
    address: data.logradouro,
    city: data.localidade,
    state: data.uf,
  });
}

