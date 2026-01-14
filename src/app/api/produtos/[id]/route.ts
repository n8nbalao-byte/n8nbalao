import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(
  request: Request,
  context: RouteContext
) {
  const { id } = await context.params;

  const product = await prisma.product.findUnique({
    where: { id },
  });

  if (!product) {
    return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 });
  }

  return NextResponse.json(product);
}

export async function PUT(
  request: Request,
  context: RouteContext
) {
  const { id } = await context.params;
  const data = await request.json();

  try {
    const updated = await prisma.product.update({
      where: { id },
      data: {
        code: data.code,
        name: data.name,
        unit: data.unit,
        basePrice: data.basePrice,
        category: data.category || null,
        steelType: data.steelType || null,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: "Erro ao atualizar produto" }, { status: 400 });
  }
}

export async function DELETE(
  request: Request,
  context: RouteContext
) {
  const { id } = await context.params;

  const linkedItems = await prisma.saleItem.count({
    where: { productId: id },
  });

  if (linkedItems > 0) {
    return NextResponse.json(
      { error: "Produto vinculado a vendas e não pode ser excluído." },
      { status: 400 }
    );
  }

  try {
    await prisma.product.delete({
      where: { id },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: "Erro ao excluir produto" }, { status: 400 });
  }
}

export async function POST(
  request: Request,
  context: RouteContext
) {
  return DELETE(request, context);
}

