import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return new Response("Unauthorized", { status: 401 });

  try {
    const orders = await prisma.productionOrder.findMany({
      include: {
        sale: {
          include: {
            client: true,
            items: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(orders);
  } catch (error) {
    console.error("Erro ao buscar ordens de produção:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return new Response("Unauthorized", { status: 401 });

  try {
    const data = await request.json();
    const { id, status } = data;

    if (!id || !status) {
      return NextResponse.json({ error: "ID e Status são obrigatórios" }, { status: 400 });
    }

    const updated = await prisma.productionOrder.update({
      where: { id },
      data: { status },
      include: {
        sale: {
            include: {
                client: true,
                items: true
            }
        }
      }
    });

    // Optionally update Sale status if Production is COMPLETED?
    if (status === "COMPLETED") {
        await prisma.sale.update({
            where: { id: updated.saleId },
            data: { status: "READY_FOR_DELIVERY" }
        });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Erro ao atualizar ordem de produção:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
