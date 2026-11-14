import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { put } from "@vercel/blob";
import { getSession } from "@/lib/session";

const MAX_SIZE = 5 * 1024 * 1024;
const EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

/**
 * Uploads are stored on Vercel Blob in production so they persist across
 * deploys. Local development keeps writing to `public/uploads` so the app
 * works without the Blob token.
 */
export async function POST(request: Request) {
  const session = await getSession();
  if (session?.user?.role !== "admin") {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return Response.json({ error: "file" }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return Response.json({ error: "size" }, { status: 400 });
  }

  const extension = EXTENSIONS[file.type];
  if (!extension) {
    return Response.json({ error: "type" }, { status: 400 });
  }

  const name = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${extension}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const { url } = await put(`uploads/${name}`, buffer, {
      access: "public",
      contentType: file.type,
    });
    return Response.json({ url });
  }

  const directory = path.join(process.cwd(), "public", "uploads");
  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, name), buffer);

  return Response.json({ url: `/uploads/${name}` });
}
