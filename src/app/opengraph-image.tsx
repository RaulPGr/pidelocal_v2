
import { ImageResponse } from 'next/og';
import { headers } from 'next/headers';

export const runtime = 'edge';

// Image metadata
export const alt = 'PideLocal - Tu carta digital';
export const size = {
    width: 1200,
    height: 630,
};

export const contentType = 'image/png';

export default async function Image() {
    const headersList = await headers();
    const host = headersList.get('host') || '';

    // Logic to parse slug from host (same as middleware)
    let slug = '';
    const hostname = host.split(':')[0]; // Remove port if present
    const parts = hostname.split('.');

    if (parts.length >= 3) {
        slug = parts[0].toLowerCase();
        // Handle www.subdomain.domain.tld or similar if needed. 
        // Middleware logic: if parts >= 3, take first.
    }

    // Also check search params if we could access request object, but here we only have headers easily.
    // We'll rely on subdomain for OG mostly.

    let businessName = 'PideLocal';
    let logoUrl = null;
    let themeColor = '#10b981'; // Default Emerald

    if (slug) {
        try {
            const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
            const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

            if (supabaseUrl && supabaseKey) {
                const res = await fetch(`${supabaseUrl}/rest/v1/businesses?slug=eq.${slug}&select=name,logo_url,theme_config`, {
                    headers: {
                        'apikey': supabaseKey,
                        'Authorization': `Bearer ${supabaseKey}`
                    },
                    cache: 'no-store'
                });

                if (res.ok) {
                    const data = await res.json();
                    if (data && data.length > 0) {
                        const biz = data[0];
                        businessName = biz.name || businessName;
                        logoUrl = biz.logo_url;

                        // Try to get primary color
                        try {
                            const config = typeof biz.theme_config === 'string' ? JSON.parse(biz.theme_config) : biz.theme_config;
                            if (config?.colors?.primary) themeColor = config.colors.primary;
                            else if (config?.colors?.accent) themeColor = config.colors.accent;
                        } catch { }
                    }
                }
            }
        } catch (e) {
            console.error('OG Image fetch error:', e);
        }
    }

    return new ImageResponse(
        (
            <div
                style={{
                    background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'sans-serif',
                    position: 'relative'
                }}
            >
                {/* Decorative Background Patterns */}
                <div style={{
                    position: 'absolute',
                    top: -100,
                    right: -100,
                    width: 400,
                    height: 400,
                    borderRadius: '50%',
                    background: themeColor,
                    opacity: 0.1,
                    filter: 'blur(80px)',
                }} />

                <div style={{
                    position: 'absolute',
                    bottom: -100,
                    left: -100,
                    width: 300,
                    height: 300,
                    borderRadius: '50%',
                    background: themeColor,
                    opacity: 0.1,
                    filter: 'blur(60px)',
                }} />

                {/* Logo or Initial */}
                {logoUrl ? (
                    // Use img tag; ImageResponse handles standard URLs. 
                    // For external images, strict CORS check applies, but mostly works if public.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={logoUrl}
                        alt={businessName}
                        width="256"
                        height="256"
                        style={{
                            objectFit: 'contain',
                            marginBottom: 40,
                            borderRadius: '20px',
                            // Optional: Add a subtle shadow or backing if transparent
                        }}
                    />
                ) : (
                    <div
                        style={{
                            width: 150,
                            height: 150,
                            borderRadius: '50%',
                            background: themeColor,
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 80,
                            fontWeight: 700,
                            marginBottom: 40,
                            boxShadow: '0 20px 50px rgba(0,0,0,0.1)'
                        }}
                    >
                        {businessName.substring(0, 1).toUpperCase()}
                    </div>
                )}

                {/* Business Name */}
                <div
                    style={{
                        fontSize: 60,
                        fontWeight: 800,
                        color: '#1e293b',
                        textAlign: 'center',
                        maxWidth: '80%',
                        lineHeight: 1.1,
                    }}
                >
                    {businessName}
                </div>

                <div
                    style={{
                        marginTop: 20,
                        fontSize: 30,
                        color: themeColor, // Use brand color
                        fontWeight: 600,
                        background: 'white',
                        padding: '10px 30px',
                        borderRadius: 50,
                        boxShadow: '0 10px 30px rgba(0,0,0,0.05)'
                    }}
                >
                    Pedidos Online
                </div>
            </div>
        ),
        {
            ...size,
        }
    );
}
