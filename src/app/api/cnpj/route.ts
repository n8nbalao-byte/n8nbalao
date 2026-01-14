import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cnpj = searchParams.get("cnpj");

  if (!cnpj) {
    return NextResponse.json({ error: "CNPJ obrigatório" }, { status: 400 });
  }

  const cleanCnpj = cnpj.replace(/\D/g, "");

  // Try BrasilAPI first
  try {
    const response = await fetch(
      `https://brasilapi.com.br/api/cnpj/v1/${cleanCnpj}`
    );

    if (response.ok) {
      const data = await response.json();
      return NextResponse.json({
        name: data.razao_social || data.nome_fantasia,
        fantasyName: data.nome_fantasia,
        zipCode: data.cep?.replace(/\D/g, "") ?? null,
        address: data.logradouro,
        city: data.municipio,
        state: data.uf,
      });
    }
    
    console.error(`BrasilAPI Error for CNPJ ${cleanCnpj}: ${response.status} - ${response.statusText}`);
  } catch (error) {
    console.error("BrasilAPI Exception:", error);
  }

  // Fallback to ReceitaWS
  try {
    console.log(`Trying ReceitaWS for CNPJ ${cleanCnpj}...`);
    const response = await fetch(
      `https://www.receitaws.com.br/v1/cnpj/${cleanCnpj}`
    );

    if (response.ok) {
      const data = await response.json();
      // ReceitaWS returns 200 even for errors sometimes, with status: "ERROR"
      if (data.status === "ERROR") {
         console.error("ReceitaWS returned ERROR:", data.message);
         return NextResponse.json(
            { error: "CNPJ não encontrado na ReceitaWS" },
            { status: 404 }
         );
      }
      
      return NextResponse.json({
        name: data.nome,
        fantasyName: data.fantasia,
        zipCode: data.cep?.replace(/\D/g, "") ?? null,
        address: data.logradouro,
        city: data.municipio,
        state: data.uf,
      });
    }
    console.error(`ReceitaWS Error for CNPJ ${cleanCnpj}: ${response.status}`);
  } catch (error) {
    console.error("ReceitaWS Exception:", error);
  }

  return NextResponse.json(
    { error: "Não foi possível consultar o CNPJ nos serviços disponíveis." },
    { status: 404 }
  );
}
