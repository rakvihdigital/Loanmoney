import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * POST { token, id } → { url } (a 2-minute signed download link)
 *
 * Borrowers don't have a Supabase Auth session (they log in with mobile number +
 * an admin-issued password), so storage policies can't authorise them directly.
 * This route checks their session in the database (borrower_document_path only
 * returns a path for a document on THEIR loan), then signs the link with the
 * service role key, which never leaves the server.
 */
export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const noStore = { headers: { "Cache-Control": "no-store" } };

export async function POST(req: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !anon) return NextResponse.json({ error: "Supabase isn't configured." }, { status: 503, ...noStore });
  if (!service)
    return NextResponse.json({ error: "Document downloads aren't set up yet. Please contact support." }, { status: 503, ...noStore });

  let token = "";
  let id = "";
  try {
    const body = (await req.json()) as { token?: unknown; id?: unknown };
    token = typeof body.token === "string" ? body.token : "";
    id = typeof body.id === "string" ? body.id : "";
  } catch {
    return NextResponse.json({ error: "Bad request." }, { status: 400, ...noStore });
  }
  if (!/^[0-9a-f]{64}$/.test(token) || !UUID.test(id)) return NextResponse.json({ error: "Bad request." }, { status: 400, ...noStore });

  const pub = createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: path, error } = await pub.rpc("borrower_document_path", { p_token: token, p_doc: id });
  if (error || typeof path !== "string" || !path)
    return NextResponse.json({ error: "Document not found, or your session has ended." }, { status: 404, ...noStore });

  const admin = createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error: signError } = await admin.storage.from("loan-documents").createSignedUrl(path, 120, { download: true });
  if (signError || !data) return NextResponse.json({ error: "Could not prepare the download." }, { status: 500, ...noStore });
  return NextResponse.json({ url: data.signedUrl }, noStore);
}
