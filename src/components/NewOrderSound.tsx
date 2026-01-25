'use client';

import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Bell, Volume2, VolumeX, X } from 'lucide-react';

type Props = {
  businessId?: string;
};

export default function NewOrderSound({ businessId }: Props) {
  const [enabled, setEnabled] = useState(false);
  const [notifyOn, setNotifyOn] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const enabledRef = useRef(false);
  const notifyRef = useRef(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const audioBufRef = useRef<AudioBuffer | null>(null);
  const originalTitleRef = useRef<string>(typeof document !== 'undefined' ? document.title : '');
  const blinkTimerRef = useRef<number | null>(null);
  const originalFaviconsRef = useRef<HTMLLinkElement[] | null>(null);
  const faviconTimerRef = useRef<number | null>(null);

  // Alert UI State
  const [alertOpen, setAlertOpen] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('new-order-sound');
      const isOn = stored === 'on';
      setEnabled(isOn);
      enabledRef.current = isOn;
    } catch { }

    try {
      const nstored = localStorage.getItem('new-order-notify');
      const no = nstored === 'on';
      setNotifyOn(no);
      notifyRef.current = no;
    } catch { }

    try {
      const el = document.createElement('audio');
      el.src = '/sounds/new-order.mp3';
      el.preload = 'auto';
      el.controls = false;
      el.style.display = 'none';
      el.setAttribute('aria-hidden', 'true');
      document.body.appendChild(el);
      audioRef.current = el as HTMLAudioElement;
      try { el.load(); } catch { }
      return () => { try { el.pause(); } catch { }; try { el.remove(); } catch { }; };
    } catch { }
  }, []);

  const beepFallback = () => {
    try {
      const Ctx: any = (window as any).AudioContext || (window as any).webkitAudioContext;
      const ctx: AudioContext = audioCtxRef.current || new Ctx();
      audioCtxRef.current = ctx;
      if (ctx.state === 'suspended') ctx.resume().catch(() => { });
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = 880;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.0);
      osc.stop(ctx.currentTime + 1.0);
    } catch { }
  };

  async function ensureAudioBuffer() {
    try {
      if (!audioCtxRef.current) {
        const Ctx: any = (window as any).AudioContext || (window as any).webkitAudioContext;
        audioCtxRef.current = new Ctx();
      }
      const ctx = audioCtxRef.current!;
      if (ctx.state === 'suspended') await ctx.resume().catch(() => { });
      if (!audioBufRef.current) {
        const res = await fetch('/sounds/new-order.mp3');
        const arr = await res.arrayBuffer();
        audioBufRef.current = await ctx.decodeAudioData(arr);
      }
      return true;
    } catch {
      return false;
    }
  }

  const playSound = async () => {
    const el = audioRef.current;
    try {
      const ok = await ensureAudioBuffer();
      if (ok && audioCtxRef.current && audioBufRef.current) {
        const ctx = audioCtxRef.current;
        const src = ctx.createBufferSource();
        src.buffer = audioBufRef.current;
        src.connect(ctx.destination);
        src.start(0);
        return;
      }
    } catch { }
    try {
      if (el) {
        el.currentTime = 0;
        await el.play();
        return;
      }
    } catch { }
    beepFallback();
  };

  const triggerAlert = () => {
    setAlertOpen(true);
    if (enabledRef.current) {
      // Play sound in loop a few times or once? Just once for now, but maybe repeated?
      // Let's play once forcefully
      void playSound();
      // A second beep after 2 seconds to make sure
      setTimeout(() => void playSound(), 2000);
    }

    // System Notification
    if (notifyRef.current && typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        const n = new Notification('¡Nuevo Pedido Recibido!', { body: 'Revisa la sección de pedidos ahora.', icon: '/favicon.ico', tag: 'pl-new-order' });
        n.onclick = () => { window.focus(); setAlertOpen(false); };
      } catch { }
    }

    // Title & Favicon blinking
    startBlinkTitle('🔔 NUEVO PEDIDO', { original: originalTitleRef, timer: blinkTimerRef });
    startBlinkFavicon({ originals: originalFaviconsRef, timer: faviconTimerRef });
  };

  // Realtime Listener
  useEffect(() => {
    if (!businessId) return; // Don't subscribe if no businessId

    const channel = supabase
      .channel('orders-sound')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
          filter: `business_id=eq.${businessId}`
        },
        (payload: any) => {
          const newOrder = payload.new;
          // Si el pedido es con tarjeta/online pero NO está pagado, ignorar el sonido inicial.
          // Esperaremos al evento UPDATE cuando pase a 'paid'.
          const isStripe = newOrder.payment_method === 'stripe' || newOrder.payment_method === 'card';
          const isPaid = newOrder.payment_status === 'paid';

          if (isStripe && !isPaid) {
            // Ignorar: El pago es online pero aún no se ha confirmado.
            // Cuando el webhook confirme el pago, recibiremos un UPDATE.
            return;
          }

          triggerAlert();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `business_id=eq.${businessId}`
        },
        (payload: any) => {
          const newOrder = payload.new;
          const oldOrder = payload.old;

          // Si el estado de pago cambia a 'paid', sonar la alarma (para pedidos online que acaban de pagarse)
          if (newOrder.payment_status === 'paid' && oldOrder.payment_status !== 'paid') {
            triggerAlert();
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [notifyOn, businessId]);

  // Global Event Listener (fallback for manual triggers)
  useEffect(() => {
    const handler = () => triggerAlert();
    const onFocus = () => { stopBlinkTitle({ original: originalTitleRef, timer: blinkTimerRef }); };

    window.addEventListener('pl:new-order', handler);
    window.addEventListener('focus', onFocus);

    return () => {
      window.removeEventListener('pl:new-order', handler);
      window.removeEventListener('focus', onFocus);
      stopBlinkTitle({ original: originalTitleRef, timer: blinkTimerRef });
      stopBlinkFavicon({ originals: originalFaviconsRef, timer: faviconTimerRef });
    };
  }, []);

  const toggle = () => {
    const next = !enabled;
    setEnabled(next);
    enabledRef.current = next;
    try { localStorage.setItem('new-order-sound', next ? 'on' : 'off'); } catch { }
    if (next) void playSound();
  };

  const toggleNotify = async () => {
    const wantOn = !notifyOn;
    if (!('Notification' in window)) return setNotifyOn(false);
    if (wantOn && Notification.permission !== 'granted') {
      try { await Notification.requestPermission(); } catch { }
    }
    const ok = Notification.permission === 'granted' && wantOn;
    setNotifyOn(ok);
    notifyRef.current = ok;
    try { localStorage.setItem('new-order-notify', ok ? 'on' : 'off'); } catch { }
    if (ok) {
      new Notification('Alertas Activas', { body: 'Te avisaremos por aquí.' });
    }
  };

  return (
    <>
      {/* Floating Controls */}
      <div className="fixed z-50 bottom-6 left-6 flex items-center gap-2">
        {alertOpen && (
          <div className="absolute bottom-full mb-4 right-0 w-80 bg-white border border-slate-200 shadow-2xl rounded-2xl p-4 animate-in slide-in-from-bottom-10 fade-in duration-300">
            <div className="flex items-start gap-4">
              <div className="bg-emerald-100 text-emerald-600 p-3 rounded-full animate-bounce">
                <Bell className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-slate-900 text-lg leading-tight">¡Nuevo Pedido!</h4>
                <p className="text-slate-500 text-sm mt-1">Acaba de llegar una nueva comanda.</p>
                <div className="mt-3 flex gap-2">
                  <a href="/admin/orders" onClick={() => setAlertOpen(false)} className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold px-4 py-2 rounded-lg flex-1 text-center shadow-md shadow-emerald-200 transition-colors">
                    Ver Pedido
                  </a>
                  <button onClick={() => setAlertOpen(false)} className="bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-medium px-4 py-2 rounded-lg transition-colors">
                    Cerrar
                  </button>
                </div>
              </div>
              <button onClick={() => setAlertOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        <button
          onClick={toggle}
          className={`h-10 px-4 rounded-full shadow-lg border border-white/20 backdrop-blur-sm flex items-center gap-2 text-xs font-bold transition-all ${enabled ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          title={enabled ? 'Sonido activado' : 'Sonido desactivado'}
        >
          {enabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          {enabled ? 'SONIDO ON' : 'SILENCIO'}
        </button>
        <button
          onClick={toggleNotify}
          className={`h-10 w-10 flex items-center justify-center rounded-full shadow-lg border border-white/20 backdrop-blur-sm transition-all ${notifyOn ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          title={notifyOn ? 'Notificaciones activadas' : 'Activar notificaciones'}
        >
          <Bell className="w-4 h-4" />
        </button>
      </div>
    </>
  );
}

// ===== Blinking Helpers =====

function startBlinkTitle(message: string, refs: { original: React.MutableRefObject<string>; timer: React.MutableRefObject<number | null>; }) {
  if (typeof document === 'undefined') return;
  if (refs.timer.current != null) return;
  if (!refs.original.current) refs.original.current = document.title;

  let shownAlt = false;
  let ticks = 0;
  const limit = 40;

  const id = window.setInterval(() => {
    try {
      document.title = shownAlt ? refs.original.current : `🔔 ${message}`;
      shownAlt = !shownAlt;
      ticks++;
      if ((document.visibilityState === 'visible' && document.hasFocus()) || ticks >= limit) {
        stopBlinkTitle(refs);
      }
    } catch { stopBlinkTitle(refs); }
  }, 1000);
  refs.timer.current = id as unknown as number;
}

function stopBlinkTitle(refs: { original: React.MutableRefObject<string>; timer: React.MutableRefObject<number | null>; }) {
  if (refs.timer.current != null) {
    try { window.clearInterval(refs.timer.current as unknown as number); } catch { }
    refs.timer.current = null;
  }
  try { if (typeof document !== 'undefined' && refs.original.current) document.title = refs.original.current; } catch { }
}

function collectFavicons(): HTMLLinkElement[] {
  const list: HTMLLinkElement[] = [];
  if (typeof document === 'undefined') return list;
  document.querySelectorAll('link[rel~="icon"]').forEach((n) => list.push(n as HTMLLinkElement));
  return list;
}

function createAlertFaviconDataUrl(): string {
  const sz = 64;
  const c = document.createElement('canvas');
  c.width = sz; c.height = sz;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#CC2936';
  ctx.beginPath();
  ctx.arc(sz / 2, sz / 2, sz / 2, 0, Math.PI * 2);
  ctx.fill();
  return c.toDataURL('image/png');
}

function setFaviconHref(href: string) {
  if (typeof document === 'undefined') return;
  const links = document.querySelectorAll('link[rel~="icon"]');
  if (links.length === 0) return;
  links.forEach((el) => { (el as HTMLLinkElement).href = href; });
}

function startBlinkFavicon(refs: { originals: React.MutableRefObject<HTMLLinkElement[] | null>; timer: React.MutableRefObject<number | null>; }) {
  if (typeof document === 'undefined') return;
  if (refs.timer.current != null) return;
  if (!refs.originals.current) refs.originals.current = collectFavicons();
  const originals = (refs.originals.current || []).map(l => l.href);
  const alertUrl = createAlertFaviconDataUrl();
  let shownAlt = false;
  let ticks = 0;
  const limit = 40;
  const id = window.setInterval(() => {
    try {
      if (shownAlt) {
        if (originals.length > 0) originals.forEach((href) => setFaviconHref(href));
      } else {
        setFaviconHref(alertUrl);
      }
      shownAlt = !shownAlt;
      ticks++;
      if ((document.visibilityState === 'visible' && document.hasFocus()) || ticks >= limit) {
        stopBlinkFavicon(refs);
      }
    } catch { stopBlinkFavicon(refs); }
  }, 1000);
  refs.timer.current = id as unknown as number;
}

function stopBlinkFavicon(refs: { originals: React.MutableRefObject<HTMLLinkElement[] | null>; timer: React.MutableRefObject<number | null>; }) {
  if (refs.timer.current != null) {
    try { window.clearInterval(refs.timer.current as unknown as number); } catch { }
    refs.timer.current = null;
  }
  try {
    const originals = refs.originals.current || [];
    if (originals.length > 0) originals.forEach((l) => setFaviconHref(l.href));
  } catch { }
}
