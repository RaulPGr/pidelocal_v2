"use client";

import React, { useEffect, useState } from "react";

type OrderItem = { quantity: number; name?: string | null; unit_price_cents: number };
type Order = {
  id: string;
  created_at: string;
  customer_name: string;
  customer_phone: string;
  pickup_at: string | null;
  status: string;
  payment_method: "CASH" | "CARD" | "BIZUM";
  payment_status: "pending" | "paid" | "failed" | "refunded";
  total_cents: number;
  items: OrderItem[];
};

type Biz = { name?: string | null; logo_url?: string | null };

function centsToEUR(cents: number) {
  return (cents / 100).toLocaleString("es-ES", { style: "currency", currency: "EUR" });
}


// Versión optimizada para impresión/PDF del pedido.
export default function PrintTicketPage(props: any) {
  const [resolvedId, setResolvedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<any | null>(null);
  const [biz, setBiz] = useState<Biz>({});
  const [error, setError] = useState<string | null>(null);

  // Resolver params (puede venir Promise)
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const p = await Promise.resolve((props as any)?.params);
        if (mounted) setResolvedId(p?.id ?? null);
      } catch {
        if (mounted) setResolvedId(null);
      }
    })();
    return () => { mounted = false; };
  }, [props]);

  // Trae datos básicos del negocio para la cabecera del ticket.
  async function loadBiz() {
    try {
      const r = await fetch('/api/admin/business', { cache: 'no-store' });
      const j = await r.json().catch(() => ({} as any));
      if (j?.ok && j?.data) setBiz({ name: j.data.name, logo_url: j.data.logo_url });
    } catch { }
  }

  // Descarga el pedido y lanza window.print tras cargarlo.
  async function loadOrder(id: string) {
    try {
      setLoading(true); setError(null);
      const res = await fetch(`/api/orders/get?id=${id}`, { cache: "no-store" });
      if (!res.ok) throw new Error("No se pudo cargar el pedido");
      const data = await res.json();
      setOrder(data?.order ?? null);
      // Pequeño delay para asegurar render antes de imprimir
      setTimeout(() => window.print(), 800);
    } catch (e: any) {
      setError(e?.message ?? "Error"); setOrder(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void loadBiz(); }, []);
  useEffect(() => { if (resolvedId) void loadOrder(resolvedId); }, [resolvedId]);

  if (!resolvedId) return <div className="p-10 text-center font-sans text-gray-500">Cargando...</div>;
  if (loading) return <div className="p-10 text-center font-sans text-gray-500">Generando ticket...</div>;
  if (error || !order) return <div className="p-10 text-center font-sans text-red-500">Error: {error ?? "desconocido"}</div>;

  const created = new Date(order.created_at).toLocaleString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
  const pickup = order.pickup_at ? new Date(order.pickup_at).toLocaleString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";
  const method = order.payment_method === 'CARD' ? 'Tarjeta' : order.payment_method === 'BIZUM' ? 'Bizum' : 'Efectivo';
  const pstatus = order.payment_status === 'paid' ? 'PAGADO' : order.payment_status === 'failed' ? 'FALLIDO' : order.payment_status === 'refunded' ? 'REEMBOLSADO' : 'PENDIENTE';
  const code = `#${order.id.split('-')[0].toUpperCase()}`;

  return (
    <div className="ticket-container">
      <div className="ticket">

        {/* CABECERA */}
        <div className="header">
          {biz.logo_url && <img src={biz.logo_url} alt="Logo" className="logo" />}
          <h1 className="biz-name">{biz.name || 'Restaurante'}</h1>
          <div className="divider"></div>
          <p className="order-id">Ticket {code}</p>
          <p className="date">{created}</p>
        </div>

        {/* INFO CLIENTE */}
        <div className="section customer-info">
          <div className="row"><strong>Cliente:</strong> <span>{order.customer_name}</span></div>
          <div className="row"><strong>Teléfono:</strong> <span>{order.customer_phone}</span></div>
          <div className="row"><strong>Recogida:</strong> <span>{pickup}</span></div>
        </div>

        {/* ITEMS */}
        <div className="section items-section">
          <div className="section-title">DETALLE DEL PEDIDO</div>
          <table className="items-table">
            <thead>
              <tr>
                <th className="col-qty">Ud.</th>
                <th className="col-prod">Concepto</th>
                <th className="col-price">Imp.</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((it: any, idx: number) => {
                const optionTotalCents = (it.options || []).reduce(
                  (sum: number, opt: any) => sum + Math.round(((opt.priceDelta ?? 0) as number) * 100), 0
                );
                const basePriceCents = it.unit_price_cents - optionTotalCents;

                return (
                  <React.Fragment key={idx}>
                    <tr className="item-row">
                      <td className="col-qty">{it.quantity}x</td>
                      <td className="col-prod">
                        <span className="prod-name">{it.name}</span>
                        {/* Opciones */}
                        {it.options && it.options.length > 0 && (
                          <div className="options-list">
                            {it.options.map((opt: any, oIdx: number) => (
                              <div key={oIdx} className="option-item">
                                + {opt.name}
                                {(opt.priceDelta > 0) && ` (+${centsToEUR(opt.priceDelta * 100)})`}
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="col-price">{centsToEUR(it.quantity * it.unit_price_cents)}</td>
                    </tr>
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* NOTAS */}
        {order.notes && (
          <div className="section notes-section">
            <div className="notes-box">
              <strong>Notas:</strong> {order.notes}
            </div>
          </div>
        )}

        {/* TOTALES */}
        <div className="section totals-section">
          <div className="divider-dashed"></div>
          <div className="row total-row">
            <span>TOTAL</span>
            <span className="total-amount">{centsToEUR(order.total_cents)}</span>
          </div>
          <div className="row payment-info">
            <span>Método: {method}</span>
            <span className={`status-badge ${order.payment_status}`}>{pstatus}</span>
          </div>
          <div className="divider-dashed"></div>
        </div>

        {/* FOOTER */}
        <div className="footer">
          <p>¡Gracias por tu visita!</p>
          <p className="tiny-id">{order.id}</p>
        </div>

      </div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&family=Inter:wght@400;600;800&display=swap');
        
        body {
          background-color: #525252;
          margin: 0;
          font-family: 'Inter', sans-serif;
          -webkit-print-color-adjust: exact;
        }
        
        @media print {
          body { background-color: white; }
          .ticket-container { margin: 0; padding: 0; }
          .ticket { box-shadow: none; margin: 0; border: none; }
        }

        .ticket-container {
          display: flex;
          justify-content: center;
          padding: 40px 20px;
          min-height: 100vh;
        }

        .ticket {
          background: white;
          width: 100%;
          max-width: 380px; /* Ancho típico de ticket térmico ancho o A5 */
          padding: 32px 24px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.2);
          position: relative;
        }

        /* Tipografía y Estilos */
        .header { text-align: center; margin-bottom: 24px; }
        .logo { width: 80px; height: 80px; object-fit: cover; border-radius: 12px; margin-bottom: 12px; }
        .biz-name { font-size: 20px; font-weight: 800; margin: 0; text-transform: uppercase; letter-spacing: -0.5px; }
        .order-id { font-size: 14px; color: #666; margin: 4px 0 0; font-family: 'JetBrains Mono', monospace; }
        .date { font-size: 12px; color: #999; margin-top: 4px; }

        .divider { height: 2px; background: #000; margin: 16px auto; width: 40px; }
        .divider-dashed { border-top: 2px dashed #ddd; margin: 16px 0; }

        .section { margin-bottom: 20px; }
        .row { display: flex; justify-content: space-between; font-size: 14px; margin-bottom: 6px; }
        .section-title { font-size: 11px; font-weight: 700; color: #888; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px; border-bottom: 1px solid #eee; padding-bottom: 4px; }

        .items-table { width: 100%; border-collapse: collapse; font-family: 'JetBrains Mono', monospace; font-size: 13px; }
        .items-table th { text-align: left; font-size: 10px; color: #888; text-transform: uppercase; padding-bottom: 8px; font-weight: 600; }
        .col-qty { width: 32px; vertical-align: top; font-weight: 700; color: #444; }
        .col-prod { padding-right: 8px; vertical-align: top; }
        .col-price { text-align: right; width: 60px; vertical-align: top; font-weight: 600; }
        
        .item-row td { padding-bottom: 12px; }
        .prod-name { display: block; font-weight: 500;  }
        .options-list { margin-top: 4px; }
        .option-item { font-size: 11px; color: #666; display: block; }
        .option-item::before { content: "• "; color: #ccc; }

        .notes-box { background: #f9f9f9; padding: 12px; border-radius: 6px; font-size: 13px; font-style: italic; color: #555; border: 1px solid #eee; }

        .total-row { font-size: 18px; font-weight: 800; align-items: flex-end; margin-top: 8px; }
        .payment-info { color: #666; font-size: 12px; align-items: center; margin-top: 8px; }
        
        .status-badge { padding: 4px 8px; border-radius: 4px; font-weight: 700; font-size: 10px; text-transform: uppercase; border: 1px solid currentColor; }
        .status-badge.paid { color: #059669; bg-color: #ecfdf5; }
        .status-badge.pending { color: #d97706; bg-color: #fffbeb; }
        .status-badge.failed { color: #dc2626; }

        .footer { text-align: center; margin-top: 32px; color: #888; font-size: 12px; }
        .tiny-id { font-size: 9px; color: #ccc; font-family: monospace; margin-top: 8px; }
      `}</style>
    </div>
  );
}
