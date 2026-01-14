import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return new Response("Unauthorized", { status: 401 });

  const { id } = await params;
  
  try {
    const data = await request.json();
    console.log("PUT /api/vendas/[id] payload:", JSON.stringify(data, null, 2));

    const { status, paymentMethod, installments, items, total, deliveryDate, deliveryNotes } = data;

    // Validate deliveryDate
    let validDeliveryDate = null;
    if (deliveryDate) {
      const date = new Date(deliveryDate);
      if (!isNaN(date.getTime())) {
        validDeliveryDate = date;
      }
    }

    // Use transaction for data integrity
    const updatedSale = await prisma.$transaction(async (tx) => {
      // 1. Update Sale details
      const sale = await tx.sale.update({
        where: { id },
        data: {
          status,
          paymentMethod,
          installments: Number(installments) || 1,
          total,
          deliveryDate: validDeliveryDate,
          deliveryNotes: deliveryNotes || null,
        },
      });

      // 2. Sync Items
      if (items && Array.isArray(items)) {
          // Get existing items
          const existingItems = await tx.saleItem.findMany({
              where: { saleId: id },
              select: { id: true }
          });
          const existingIds = existingItems.map(i => i.id);
          // Filter out temporary IDs (starting with "temp-") or empty ones to get only valid UUIDs
          const incomingIds = items
            .map((i: any) => i.id)
            .filter((id: string) => id && !id.startsWith("temp-"));

          // Items to delete
          const toDelete = existingIds.filter(id => !incomingIds.includes(id));
          if (toDelete.length > 0) {
              await tx.saleItem.deleteMany({
                  where: { id: { in: toDelete } }
              });
          }

          // Items to upsert (update or create)
          for (const item of items) {
               // If item has a valid UUID and exists in DB, update it
               if (item.id && !item.id.startsWith("temp-") && existingIds.includes(item.id)) {
                   await tx.saleItem.update({
                       where: { id: item.id },
                       data: {
                           quantity: Number(item.quantity),
                           unitPrice: Number(item.unitPrice),
                           totalPrice: Number(item.totalPrice),
                           description: item.description,
                           observation: item.observation || null,
                           structureType: item.structureType || null,
                       }
                   });
               } else {
                   // Create new (if it's a new item with temp ID or no ID)
                   await tx.saleItem.create({
                       data: {
                           saleId: id,
                           productId: item.productId || null,
                           description: item.description,
                           quantity: Number(item.quantity),
                           unitPrice: Number(item.unitPrice),
                           totalPrice: Number(item.totalPrice),
                           observation: item.observation || null,
                           structureType: item.structureType || null,
                       }
                    });
                }
           }
       }
       
       // 3. Create Production Order if confirmed and doesn't exist
       if (sale.status === "CONFIRMED" || sale.status === "IN_PRODUCTION") {
           const existingOrder = await tx.productionOrder.findUnique({
               where: { saleId: id }
           });
           
           if (!existingOrder) {
               await tx.productionOrder.create({
                   data: {
                       saleId: id,
                       status: "PENDING"
                   }
               });
           }
       }
       
       return sale;
     });

    return NextResponse.json(updatedSale);
  } catch (error: any) {
    console.error("Erro CRÍTICO ao atualizar venda:", error);
    return NextResponse.json(
        { 
          error: "Erro ao salvar venda", 
          details: error.message,
          stack: process.env.NODE_ENV === 'development' ? error.stack : undefined 
        }, 
        { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return new Response("Unauthorized", { status: 401 });

  const { id } = await params;

  try {
    // Delete related items first (handled by cascade usually, but being safe)
    // Prisma relation onDelete: Cascade should handle items.
    // Production Order might need manual handling if not cascaded, but let's assume cascade or try.
    // Checking schema: SaleItem has onDelete: Cascade. ProductionOrder does NOT.
    
    await prisma.$transaction(async (tx) => {
        // Delete Production Order if exists
        await tx.productionOrder.deleteMany({ where: { saleId: id } });
        // Delete Deliveries if exist
        await tx.delivery.deleteMany({ where: { saleId: id } });
        // Delete Sale (Items cascade)
        await tx.sale.delete({ where: { id } });
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Erro ao excluir venda:", error);
    return NextResponse.json({ error: "Erro ao excluir venda" }, { status: 500 });
  }
}
