import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { orderReceipts, orders } from "@/db/schema";
import { hasOrderAccess } from "@/lib/order-access";
import { getSession } from "@/lib/session";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ orderId: string }> },
) {
  const { orderId } = await params;
  const db = await getDb();

  const order = await db.query.orders.findFirst({
    where: eq(orders.id, orderId),
    columns: { id: true, userId: true },
  });
  if (!order) {
    return new Response("Not found", { status: 404 });
  }

  const [session, cookieAccess] = await Promise.all([
    getSession(),
    hasOrderAccess(order.id),
  ]);
  const allowed =
    cookieAccess ||
    session?.user?.role === "admin" ||
    (session?.user?.id && order.userId === session.user.id);

  if (!allowed) {
    return new Response("Forbidden", { status: 403 });
  }

  const receipt = await db.query.orderReceipts.findFirst({
    where: eq(orderReceipts.orderId, orderId),
  });
  if (!receipt) {
    return new Response("Not found", { status: 404 });
  }

  const bytes = Buffer.from(receipt.dataBase64, "base64");
  return new Response(new Uint8Array(bytes), {
    headers: {
      "Content-Type": receipt.mimeType,
      "Content-Disposition": `inline; filename="${receipt.fileName.replace(/"/g, "")}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
