// src/app/api/admin/theme/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { designAdminEmails, adminEmails } from '@/utils/plan';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function getTenantSlug(req?: Request): Promise<string> {
  try {
    // 1. Try URL param (priority for superadmin context)
    if (req) {
      const url = new URL(req.url);
      const param = url.searchParams.get('tenant');
      if (param) return param;
    }
    // 2. Fallback to cookie
    const cookieStore = await cookies();
    return cookieStore.get('x-tenant-slug')?.value || '';
  } catch {
    return '';
  }
}

async function assertCanEditTheme(req: Request): Promise<{ ok: true; slug: string } | { ok: false; res: Response }> {
  const slug = await getTenantSlug(req);
  if (!slug) return { ok: false, res: NextResponse.json({ ok: false, error: 'Missing tenant' }, { status: 400 }) };

  // Get Session User
  const cookieStore = await cookies();
  const supa = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return cookieStore.get(name)?.value; },
        set(name: string, value: string, options: any) { },
        remove(name: string, options: any) { },
      },
    }
  );
  const { data: { user } } = await supa.auth.getUser();
  if (!user || !user.email) {
    return { ok: false, res: NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 }) };
  }
  const email = user.email.toLowerCase();

  // 1. Check SuperAdmin / Designer
  const designers = designAdminEmails();
  const admins = adminEmails();
  if (designers.includes(email) || admins.includes(email)) {
    return { ok: true, slug };
  }

  // 2. Check Business Owner / Member
  const { data: biz, error } = await supabaseAdmin
    .from('businesses')
    .select('id, email')
    .eq('slug', slug)
    .maybeSingle();

  if (error || !biz) {
    return { ok: false, res: NextResponse.json({ ok: false, error: 'Business not found' }, { status: 404 }) };
  }

  if (biz.email && biz.email.toLowerCase() === email) {
    return { ok: true, slug };
  }

  // 3. Check Membership
  const { data: membership } = await supabaseAdmin
    .from('business_members')
    .select('id')
    .eq('business_id', biz.id)
    .eq('user_id', user.id)
    .maybeSingle();

  if (membership) {
    return { ok: true, slug };
  }

  return { ok: false, res: NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 }) };
}

export async function GET(req: Request) {
  const auth = await assertCanEditTheme(req);
  if (!auth.ok) return auth.res;

  const { data, error } = await supabaseAdmin
    .from('businesses')
    .select('theme_config')
    .eq('slug', auth.slug)
    .maybeSingle();

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true, theme: (data?.theme_config || null) });
}

export async function PATCH(req: Request) {
  const auth = await assertCanEditTheme(req);
  if (!auth.ok) return auth.res;

  let body: any = null;
  try { body = await req.json(); } catch { }
  const theme = body?.theme && typeof body.theme === 'object' ? body.theme : null;
  if (!theme) return NextResponse.json({ ok: false, error: 'Invalid theme' }, { status: 400 });

  const { error } = await supabaseAdmin
    .from('businesses')
    .update({ theme_config: theme })
    .eq('slug', auth.slug);

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
