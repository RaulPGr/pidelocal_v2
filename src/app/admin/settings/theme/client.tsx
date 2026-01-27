"use client";

import { useEffect, useMemo, useState } from "react";
import { Palette, Wand2, ChevronDown, ChevronUp } from "lucide-react";

type ThemeColors = {
  background?: string;
  text?: string;
  muted?: string;
  accent?: string;
  accentHover?: string;
  secondary?: string;
  secondaryHover?: string;
  topbarStart?: string;
  topbarEnd?: string;
  menuHeading?: string;
};

type ThemeFonts = {
  body?: string;
  headings?: string;
};

type ThemeHome = {
  heroOverlay?: boolean;
};

type ThemeConfig = {
  colors?: ThemeColors;
  fonts?: ThemeFonts;
  home?: ThemeHome;
  // Subscription is now handled in Business Settings
  // subscription?: SubscriptionPlan;
};

const DEFAULTS: {
  colors: Required<ThemeColors>;
  fonts: Required<ThemeFonts>;
  home: Required<ThemeHome>;
} = {
  colors: {
    background: "#DAD6D1",
    text: "#333333",
    muted: "#666666",
    accent: "#CC2936",
    accentHover: "#A5222D",
    secondary: "#457242",
    secondaryHover: "#375a35",
    topbarStart: "#CC2936",
    topbarEnd: "#457242",
    menuHeading: "#1f2937",
  },
  fonts: {
    body:
      'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji"',
    headings: "inherit",
  },
  home: {
    heroOverlay: true,
  },
};

function ColorInput({
  label,
  desc,
  value,
  onChange,
}: {
  label: string;
  desc?: string;
  value?: string;
  onChange: (v: string) => void;
}) {
  const hex = (value || "").match(/^#?[0-9a-fA-F]{6}$/)
    ? value!.startsWith("#")
      ? value!
      : `#${value}`
    : "";
  return (
    <label className="block text-sm">
      <span className="text-slate-700 inline-flex items-center gap-2">
        {label}
        {desc ? (
          <span title={desc} aria-label={desc} className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-slate-300 text-[10px] leading-none text-slate-500">i</span>
        ) : null}
      </span>
      {desc && <span className="block text-xs text-slate-500">{desc}</span>}
      <div className="mt-1 flex items-center gap-3">
        <input type="color" className="h-9 w-14" value={hex || "#ffffff"} onChange={(e) => onChange(e.target.value)} />
        <input
          className="flex-1 rounded-md border border-slate-300 px-2 py-1"
          placeholder="#rrggbb"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    </label>
  );
}

function FontSelect({
  label,
  desc,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  desc?: string;
  value?: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const presets = [
    {
      label: "Sistema (recomendada)",
      val:
        'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji"',
    },
    { label: "Inter", val: "Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial" },
    { label: "Poppins", val: "Poppins, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial" },
    { label: "Roboto", val: "Roboto, ui-sans-serif, system-ui, -apple-system, Segoe UI, Helvetica, Arial" },
    { label: "Open Sans", val: '"Open Sans", ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial' },
    { label: "Montserrat", val: "Montserrat, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial" },
    { label: "Lato", val: "Lato, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial" },
    { label: "Georgia (serif)", val: 'Georgia, Cambria, "Times New Roman", Times, serif' },
  ];
  const matchIdx = presets.findIndex((p) => (value || "").toLowerCase() === p.val.toLowerCase());
  const selectVal = matchIdx >= 0 ? presets[matchIdx].val : "";
  return (
    <div className="text-sm">
      <label className="block">
        <span className="text-slate-700 inline-flex items-center gap-2">
          {label}
          {desc ? (
            <span title={desc} aria-label={desc} className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-slate-300 text-[10px] leading-none text-slate-500">i</span>
          ) : null}
        </span>
        {desc && <span className="block text-xs text-slate-500">{desc}</span>}
        <select
          className="mt-1 w-full rounded-md border border-slate-300 bg-white px-2 py-1"
          value={selectVal}
          onChange={(e) => onChange(e.target.value || value || "")}
        >
          <option value="">- Personalizada -</option>
          {presets.map((p) => (
            <option key={p.label} value={p.val} style={{ fontFamily: p.val }}>
              {p.label}
            </option>
          ))}
        </select>
      </label>
      <div className="mt-2">
        <input
          className="w-full rounded-md border border-slate-300 px-2 py-1"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          style={{ fontFamily: value || undefined }}
        />
        <div className="mt-1 text-xs text-slate-500">
          Puedes elegir una opcion del listado o escribir tu propia pila de fuentes.
        </div>
      </div>
    </div>
  );
}

// Interfaz completa para personalizar tema visual
export default function ThemeSettingsClient() {
  function getTenantFromUrl(): string {
    if (typeof window === "undefined") return "";
    try {
      return new URLSearchParams(window.location.search).get("tenant") || "";
    } catch {
      return "";
    }
  }
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [theme, setTheme] = useState<ThemeConfig>({});

  const merged = useMemo(
    () => ({
      colors: { ...DEFAULTS.colors, ...(theme.colors || {}) },
      fonts: { ...DEFAULTS.fonts, ...(theme.fonts || {}) },
      home: { heroOverlay: theme.home?.heroOverlay !== false },
    }),
    [theme]
  );

  const heroOverlayEnabled = merged.home.heroOverlay;

  const handleHeroOverlayChange = (checked: boolean) => {
    setTheme((prev) => ({
      ...prev,
      home: { ...(prev.home || {}), heroOverlay: checked },
    }));
  };

  // --- MAGIC COLOR LOGIC ---
  const [brandColor, setBrandColor] = useState("#CC2936");

  // Helper to darken a hex color
  function adjustColor(hex: string, amount: number) {
    let color = hex.replace("#", "");
    if (color.length === 3) color = color[0] + color[0] + color[1] + color[1] + color[2] + color[2];
    const num = parseInt(color, 16);
    let r = (num >> 16) + amount;
    let g = ((num >> 8) & 0x00ff) + amount;
    let b = (num & 0x0000ff) + amount;
    if (r > 255) r = 255; else if (r < 0) r = 0;
    if (g > 255) g = 255; else if (g < 0) g = 0;
    if (b > 255) b = 255; else if (b < 0) b = 0;
    return "#" + (g | (b << 8) | (r << 16)).toString(16).padStart(6, "0");
  }

  function applyBrandColor() {
    const primary = brandColor;
    const primaryHover = adjustColor(brandColor, -20); // Darker
    const secondary = "#457242"; // Keep default green for secondary actions or generate complementary? Let's keep it simple or user-defined.

    // Topbar Gradient: Start = Brand, End = Brand Darker/Shifted
    const topStart = primary;
    const topEnd = adjustColor(primary, -30); // Darker gradient end

    setTheme(prev => ({
      ...prev,
      colors: {
        ...prev.colors,
        accent: primary,
        accentHover: primaryHover,
        topbarStart: topStart,
        topbarEnd: topEnd,
      }
    }));
  }
  // -------------------------

  const [showAdvancedColors, setShowAdvancedColors] = useState(false);

  // Live preview: actualiza variables CSS usadas por el sitio
  useEffect(() => {
    const r = document.documentElement;
    const c = merged.colors;
    r.style.setProperty("--brand-chalk-bg", c.background ?? "");
    r.style.setProperty("--brand-ink", merged.colors.text ?? "");
    r.style.setProperty("--brand-muted", merged.colors.muted ?? "");
    r.style.setProperty("--brand-accent", merged.colors.accent ?? "");
    r.style.setProperty("--brand-accent-700", merged.colors.accentHover ?? "");
    r.style.setProperty("--brand-green", (merged.colors.topbarEnd || merged.colors.secondary) ?? "");
    r.style.setProperty("--brand-green-700", merged.colors.secondaryHover ?? "");
    r.style.setProperty("--brand-orange", (merged.colors.topbarStart || merged.colors.accent) ?? "");
    r.style.setProperty("--menu-heading-color", merged.colors.menuHeading ?? merged.colors.text ?? "");
    if (merged.fonts.body) r.style.setProperty("--font-body", merged.fonts.body ?? "");
    if (merged.fonts.headings) r.style.setProperty("--font-headings", merged.fonts.headings ?? "");
  }, [merged]);

  // Cargar tema actual
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const tenant = getTenantFromUrl();
        const url = tenant ? `/api/admin/theme?tenant=${encodeURIComponent(tenant)}` : "/api/admin/theme";
        const resp = await fetch(url, { cache: "no-store" });
        if (!resp.ok) throw new Error("No autorizado");
        const j = await resp.json();
        if (!active) return;
        if (j?.ok && j.theme) setTheme(j.theme); // Only load if theme exists, otherwise use defaults/empty
      } catch (e: any) {
        setError(e?.message || "Error");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  async function save() {
    try {
      setSaving(true);
      setError(null);
      const tenant = getTenantFromUrl();
      const url = tenant ? `/api/admin/theme?tenant=${encodeURIComponent(tenant)}` : "/api/admin/theme";
      const resp = await fetch(url, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ theme }),
      });
      const j = await resp.json();
      if (!resp.ok || !j?.ok) throw new Error(j?.error || "Error al guardar");
    } catch (e: any) {
      setError(e?.message || "Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="rounded border bg-white p-4 shadow-sm">Cargando...</div>;
  if (error) return <div className="rounded border border-rose-200 bg-rose-50 p-4 text-rose-800 shadow-sm">{error}</div>;

  return (
    <div className="space-y-6 rounded border bg-white p-4 shadow-sm">
      <div>
        <h1 className="text-xl font-semibold">Personalizacion de tema</h1>
        <p className="text-sm text-slate-600">
          Ajusta colores, tipografias y la barra superior. Cada campo tiene una breve descripcion. Los cambios se aplican
          de inmediato tras guardar.
        </p>
      </div>

      {/* Vista previa barra superior */}
      <div className="overflow-hidden rounded border">
        <div
          className="px-4 py-3 text-sm font-medium text-white"
          style={{
            background: `linear-gradient(90deg, ${merged.colors.topbarStart || merged.colors.accent}, ${merged.colors.topbarEnd || merged.colors.secondary
              })`,
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex gap-6">
              <span>Inicio</span>
              <span>Menu</span>
            </div>
            <span>Carrito</span>
          </div>
        </div>
        <div className="bg-white px-4 py-2 text-xs text-slate-600">Vista previa de la barra superior</div>
      </div>

      {/* Vista previa de botones y texto */}
      <div className="rounded border bg-white p-4">
        <div className="mb-3 text-sm font-medium text-slate-700">Vista previa de estilos</div>
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            className="rounded px-4 py-2 text-sm font-semibold text-white shadow-sm"
            style={{ backgroundColor: merged.colors.accent || "#999" }}
            aria-label="Boton primario"
          >
            Boton primario
          </button>
          <button
            type="button"
            className="rounded px-4 py-2 text-sm font-semibold text-white shadow-sm"
            style={{ backgroundColor: merged.colors.accentHover || merged.colors.accent || "#777" }}
            aria-label="Boton primario (hover)"
          >
            Hover (primario)
          </button>
          <button
            type="button"
            className="rounded px-4 py-2 text-sm font-semibold text-white shadow-sm"
            style={{ backgroundColor: merged.colors.secondary || "#557a52" }}
            aria-label="Boton secundario"
          >
            Boton secundario
          </button>
          <button
            type="button"
            className="rounded px-4 py-2 text-sm font-semibold text-white shadow-sm"
            style={{ backgroundColor: merged.colors.secondaryHover || merged.colors.secondary || "#476646" }}
            aria-label="Boton secundario (hover)"
          >
            Hover (secundario)
          </button>
          <span className="text-xs text-slate-600">Uso: acciones y acentos</span>
        </div>

        <div className="rounded border p-3" style={{ backgroundColor: merged.colors.background || "#f5f5f5" }}>
          <div
            className="mb-1 text-lg"
            style={{ color: merged.colors.text || "#333", fontFamily: merged.fonts.headings || "inherit", fontWeight: 600 }}
          >
            Titulo de ejemplo
          </div>
          <div className="text-sm" style={{ color: merged.colors.text || "#333", fontFamily: merged.fonts.body || "inherit" }}>
            Este es un texto de parrafo para comprobar la legibilidad con la combinacion de colores y la fuente del
            cuerpo.
          </div>
          <div className="mt-1 text-xs" style={{ color: merged.colors.muted || "#777", fontFamily: merged.fonts.body || "inherit" }}>
            Texto secundario o de ayuda (menos destacado).
          </div>
        </div>
      </div>

      {/* Colores */}
      {/* MAGIC BRAND COLOR PICKER */}
      <div className="rounded border border-emerald-100 bg-emerald-50/50 p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-emerald-100 rounded-xl text-emerald-600">
            <Palette className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-slate-800">Color de Marca Mágico</h3>
            <p className="text-sm text-slate-600 mb-4">
              Elige tu color principal y generaremos automáticamente una paleta armoniosa para tu negocio.
            </p>

            <div className="flex flex-wrap items-end gap-4">
              <label className="block">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Tu color principal</span>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={brandColor}
                    onChange={e => setBrandColor(e.target.value)}
                    className="h-10 w-16 cursor-pointer rounded border border-slate-300 p-1"
                  />
                  <input
                    type="text"
                    value={brandColor}
                    onChange={e => setBrandColor(e.target.value)}
                    className="w-24 rounded border border-slate-300 px-3 py-2 text-sm uppercase"
                    maxLength={7}
                  />
                </div>
              </label>

              <button
                onClick={applyBrandColor}
                className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/10 mb-[1px]"
              >
                <Wand2 className="w-4 h-4" />
                Aplicar Paleta Mágica
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ADVANCED COLORS TOGGLE */}
      <div className="border-t border-slate-100 pt-4">
        <button
          onClick={() => setShowAdvancedColors(!showAdvancedColors)}
          className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors w-full justify-between p-2 rounded hover:bg-slate-50"
        >
          <span>Ajustes Avanzados de Color (Manual)</span>
          {showAdvancedColors ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showAdvancedColors && (
          <div className="mt-4 grid gap-6 md:grid-cols-2 animate-in slide-in-from-top-2 fade-in duration-300">
            <div>
              <h3 className="mb-2 font-medium">Generales</h3>
              <div className="space-y-3 pl-2 border-l-2 border-slate-100">
                <ColorInput
                  label="Fondo pagina"
                  value={merged.colors.background}
                  onChange={(v) => setTheme((p) => ({ ...p, colors: { ...p.colors, background: v } }))}
                />
                <ColorInput
                  label="Texto principal"
                  value={merged.colors.text}
                  onChange={(v) => setTheme((p) => ({ ...p, colors: { ...p.colors, text: v } }))}
                />
                <ColorInput
                  label="Texto atenuado"
                  value={merged.colors.muted}
                  onChange={(v) => setTheme((p) => ({ ...p, colors: { ...p.colors, muted: v } }))}
                />
              </div>
            </div>
            <div>
              <h3 className="mb-2 font-medium">Botones y Acciones</h3>
              <div className="space-y-3 pl-2 border-l-2 border-slate-100">
                <ColorInput
                  label="Acento (Botones)"
                  value={merged.colors.accent}
                  onChange={(v) => setTheme((p) => ({ ...p, colors: { ...p.colors, accent: v } }))}
                />
                <ColorInput
                  label="Acento hover"
                  value={merged.colors.accentHover}
                  onChange={(v) => setTheme((p) => ({ ...p, colors: { ...p.colors, accentHover: v } }))}
                />
                <ColorInput
                  label="Secundario"
                  value={merged.colors.secondary}
                  onChange={(v) => setTheme((p) => ({ ...p, colors: { ...p.colors, secondary: v } }))}
                />
                <ColorInput
                  label="Secundario hover"
                  value={merged.colors.secondaryHover}
                  onChange={(v) => setTheme((p) => ({ ...p, colors: { ...p.colors, secondaryHover: v } }))}
                />
              </div>
            </div>
            <div>
              <h3 className="mb-2 font-medium">Navegación Superior</h3>
              <div className="space-y-3 pl-2 border-l-2 border-slate-100">
                <ColorInput
                  label="Degradado Inicio"
                  value={merged.colors.topbarStart}
                  onChange={(v) => setTheme((p) => ({ ...p, colors: { ...p.colors, topbarStart: v } }))}
                />
                <ColorInput
                  label="Degradado Fin"
                  value={merged.colors.topbarEnd}
                  onChange={(v) => setTheme((p) => ({ ...p, colors: { ...p.colors, topbarEnd: v } }))}
                />
                <ColorInput
                  label="Titulos en Menu"
                  desc="Color de los titulos de secciones en la carta"
                  value={merged.colors.menuHeading}
                  onChange={(v) => setTheme((p) => ({ ...p, colors: { ...p.colors, menuHeading: v } }))}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="border-t pt-4">
        <h3 className="mb-2 font-semibold">Tipografias</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <FontSelect
            label="Fuente principal (Cuerpo)"
            value={merged.fonts.body}
            onChange={(v) => setTheme((p) => ({ ...p, fonts: { ...p.fonts, body: v } }))}
            placeholder="Ej: Inter, sans-serif"
          />
          <FontSelect
            label="Fuente titulos"
            value={merged.fonts.headings}
            onChange={(v) => setTheme((p) => ({ ...p, fonts: { ...p.fonts, headings: v } }))}
            placeholder="Ej: Montserrat, sans-serif"
          />
        </div>
      </div>

      <div className="border-t pt-4">
        <h3 className="mb-2 font-semibold">Portada</h3>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={heroOverlayEnabled}
            onChange={(e) => handleHeroOverlayChange(e.target.checked)}
          />
          Oscurecer imagen de cabecera (Overlay)
        </label>
        <p className="text-xs text-slate-500 ml-5 mt-1">
          Añade una capa oscura semitransparente sobre la imagen de cabecera para mejorar la legibilidad del texto/logo.
        </p>
      </div>

      <div className="mt-4 flex justify-end">
        <button onClick={() => void save()} disabled={saving} className="rounded bg-black px-4 py-2 text-white disabled:opacity-50">
          {saving ? "Guardando..." : "Guardar cambios"}
        </button>
      </div>
    </div>
  );
}
