
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.email) return new Response("Unauthorized", { status: 401 });

  try {
    const data = await request.json();
    console.log("Receiving Sale Data:", JSON.stringify(data, null, 2));

    const { clientId, items, deliveryDate, deliveryNotes } = data; // items: { productId, quantity, price, description, observation }[]

    if (!clientId) {
      return NextResponse.json({ error: "Cliente não selecionado." }, { status: 400 });
    }
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Lista de itens vazia." }, { status: 400 });
    }

    // Validate items
    for (const item of items) {
        if (!item.quantity || item.quantity <= 0) {
            return NextResponse.json({ error: `Quantidade inválida para o item: ${item.description}` }, { status: 400 });
        }
        if (item.price === undefined || item.price === null) {
            return NextResponse.json({ error: `Preço inválido para o item: ${item.description}` }, { status: 400 });
        }
    }

    // Calculate total
    const total = items.reduce((acc: number, item: any) => acc + (Number(item.quantity) * Number(item.price)), 0);

    // Get user ID from session email
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });

    // Validate deliveryDate
    let validDeliveryDate = null;
    if (deliveryDate) {
      const date = new Date(deliveryDate);
      if (!isNaN(date.getTime())) {
        validDeliveryDate = date;
      }
    }

    const sale = await prisma.sale.create({
      data: {
        clientId,
        userId: user.id,
        total,
        status: "CONFIRMED", // Auto-confirm to trigger production logic
        deliveryDate: validDeliveryDate,
        deliveryNotes: deliveryNotes || null,
        items: {
          create: items.map((item: any) => ({
            productId: item.productId || undefined, // Allow null/undefined if productId is missing or empty string
            description: item.description || "Item sem descrição",
            quantity: Number(item.quantity),
            unitPrice: Number(item.price),
            totalPrice: Number(item.quantity) * Number(item.price),
            observation: item.observation || null,
            structureType: item.structureType || null,
          })),
        },
        // Create Production Order automatically
        productionOrder: {
            create: {
                status: "PENDING"
            }
        }
      },
      include: {
        items: true,
        productionOrder: true
      }
    });

    return NextResponse.json(sale);
  } catch (error: any) {
    console.error("Erro CRÍTICO ao criar venda:", error);
    // Return detailed error for debugging
    return NextResponse.json({ 
        error: error.message || "Erro interno",
        details: error.stack
    }, { status: 500 });
  }
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return new Response("Unauthorized", { status: 401 });

  const sales = await prisma.sale.findMany({
    include: {
      client: true,
      user: true,
      items: true,
    },
    orderBy: { createdAt: 'desc' }
  });
  return NextResponse.json(sales);
}
