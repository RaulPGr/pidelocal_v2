"use client";

import { useState } from "react";
import {
    Search,
    BookOpen,
    MessageCircle,
    ChevronDown,
    ChevronRight,
    Settings,
    ShoppingBag,
    UtensilsCrossed,
    BarChart3,
    Smartphone,
    Megaphone,
    LifeBuoy,
    X,
    ShieldCheck,
    CalendarCheck
} from "lucide-react";
import clsx from "clsx";

export default function HelpClient() {
    const [search, setSearch] = useState("");
    const [selectedGuide, setSelectedGuide] = useState<any>(null);

    const guides = [
        {
            title: "Primeros Pasos",
            icon: Settings,
            color: "blue",
            items: [
                {
                    title: "Configurar Horarios de Apertura",
                    content: (
                        <div className="space-y-4">
                            <p>Tus clientes necesitan saber cuándo pueden hacer pedidos. Configurar tus horarios es vital.</p>
                            <ol className="list-decimal pl-5 space-y-2 text-slate-700">
                                <li>Ve al menú lateral y pulsa en <strong>Configuración</strong>.</li>
                                <li>Selecciona la pestaña <strong>Horarios</strong>.</li>
                                <li>Define tus horas de apertura para cada día de la semana.</li>
                                <li>Si necesitas cerrar un día específico (vacaciones, festivo...), usa el interruptor o el modo "Cerrado Temporalmente".</li>
                            </ol>
                            <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-800 border border-blue-100">
                                💡 Tip: Los pedidos de "Recogida" solo se permitirán dentro de estas franjas horarias.
                            </div>
                        </div>
                    )
                },
                {
                    title: "Personalizar Datos del Negocio",
                    content: "En Configuración > Empresa puedes cambiar el nombre visible de tu restaurante, el teléfono de contacto y la descripción corta que aparece en Google. Asegúrate de que la dirección sea correcta para que los clientes sepan dónde recoger."
                },
                {
                    title: "Vincular cuenta de STRIPE (Pagos)",
                    content: (
                        <div className="space-y-4">
                            <p>Para recibir pagos con tarjeta, debes conectar tu cuenta de Stripe. Ve a Configuración &gt; Facturación y sigue los pasos. Es seguro y el dinero llega directo a tu banco.</p>
                            <div className="bg-amber-50 p-3 rounded-lg text-sm text-amber-800 border border-amber-100 flex gap-2">
                                <span className="text-xl">⚠️</span>
                                <p><strong>Importante:</strong> PideLocal actúa solo como conector tecnológico. Cualquier incidencia con cobros, retenciones, disputas o devoluciones bancarias debe tratarse directamente con el <strong>Soporte de Stripe</strong>. PideLocal no tiene acceso a tus fondos ni responsabilidad sobre las transacciones financieras.</p>
                            </div>

                            <div className="flex items-center gap-3 p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
                                <span className="font-bold text-slate-700 text-xs uppercase tracking-wider">Pagos Seguros vía</span>
                                <span className="text-xl font-bold text-[#635BFF] flex items-center gap-0.5">stripe <ShieldCheck className="w-4 h-4 text-emerald-500 ml-1" /></span>
                            </div>
                        </div>
                    )
                },
                {
                    title: "Cambiar logotipo y colores",
                    content: "Haz que tu marca destaque. En Configuración > Tema puedes subir tu logotipo (recomendamos formato PNG transparente) y elegir el color principal que teñirá los botones y enlaces de tu carta digital."
                }
            ]
        },
        {
            title: "Gestionar mi Carta",
            icon: UtensilsCrossed,
            color: "emerald",
            items: [
                {
                    title: "Crear Categorías y Productos",
                    content: "Organiza tu menú. Primero crea Categorías (ej: Entrantes, Hamburguesas). Luego, dentro de cada una, añade Productos con su foto, precio y descripción."
                },
                {
                    title: "Configurar Extras (Grupos de Opciones)",
                    content: (
                        <div className="space-y-4">
                            <p>¿Tus clientes pueden personalizar sus platos? Usa los Grupos de Opciones (Toppings).</p>
                            <ul className="list-disc pl-5 space-y-2 text-slate-700">
                                <li>Crea un grupo (ej: "Salsas", "Punto de la carne").</li>
                                <li>Define si es Obligatorio o Opcional.</li>
                                <li>Añade las opciones con sus precios extra (ej: "+1.00€").</li>
                                <li>Finalmente, <strong>asigna este grupo a los productos</strong> que lo necesiten desde la edición del producto.</li>
                            </ul>
                        </div>
                    )
                },
                {
                    title: "Gestión de Alérgenos",
                    content: "Cumple la normativa informando a tus clientes. Al editar un producto, verás un selector de alérgenos (Gluten, Lactosa, Frutos Secos...). Marca los que contiene el plato y aparecerán iconos informativos en la carta."
                },
                {
                    title: "Ocultar productos agotados",
                    content: "¿Te has quedado sin aguacate? No borres la hamburguesa. Simplemente entra en Editar Producto y desmarca la casilla 'Disponible'. Desaparecerá de la carta al instante hasta que lo vuelvas a activar."
                }
            ]
        },
        {
            title: "Pedidos en Vivo",
            icon: ShoppingBag,
            color: "orange",
            items: [
                {
                    title: "Entender el Tablero (Kanban)",
                    content: "La vista de Pedidos es tu centro de mando. Las columnas representan el estado del pedido: Pendiente -> Confirmado -> En Cocina -> Listo -> Entregado. Mueve las tarjetas de una columna a otra para avanzar."
                },
                {
                    title: "Cambiar estados",
                    content: "Cuando entra un pedido nuevo, suena una alerta y aparece en 'Pendiente'. Al aceptarlo, pasa a 'Confirmado'. Cuando cocina empieza, muévelo a 'Preparando'. Cuando esté empaquetado, a 'Listo' (el cliente recibe un aviso). Y finalmente 'Entregado'."
                },
                {
                    title: "Histórico de pedidos",
                    content: "Los pedidos completados o cancelados desaparecen del tablero principal para no molestar, pero se guardan siempre en el Historial (parte inferior de la pantalla de Pedidos) o en la sección Estadísticas."
                },
                {
                    title: "Devoluciones y Cancelaciones",
                    content: (
                        <div className="space-y-4">
                            <p>Si tienes que cancelar un pedido pagado online, el sistema inicia un reembolso automático en Stripe.</p>
                            <div className="bg-amber-50 p-3 rounded-lg text-sm text-amber-800 border border-amber-100">
                                <strong>Nota Legal:</strong> Tú eres el responsable final de la venta. Si el reembolso falla o hay errores en la tarjeta del cliente, deberás contactar con Stripe. PideLocal no se hace responsable de pérdidas por fallos en la pasarela de pago.
                            </div>
                        </div>
                    )
                }
            ]
        },
        {
            title: "Marketing y QR",
            icon: Megaphone,
            color: "rose",
            items: [
                {
                    title: "Crear Promociones Automáticas",
                    content: "Ve a la sección Promociones. Puedes crear ofertas tipo 'Descuento en toda la carta' o '2x1' que se aplican automáticamente en el carrito si se cumplen las condiciones."
                },
                {
                    title: "Descargar e imprimir Códigos QR",
                    content: "En la sección Marketing QR tienes un generador listo para usar. Descarga el PDF, imprímelo y ponlo en tus mesas. Los clientes escanearán para ver la carta."
                },
                {
                    title: "Personalizar el diseño del QR",
                    content: "Puedes cambiar el color del QR para que coincida con tu marca antes de descargarlo."
                },
                {
                    title: "Ofertas 2x1 y descuentos fijos",
                    content: "Configura reglas avanzadas: Descuento por % (ej: 10% dto), Descuento fijo (ej: -5€) o Compra X y llévate Y gratis."
                }
            ]
        },
        {
            title: "Móvil y App",
            icon: Smartphone,
            color: "violet",
            items: [
                {
                    title: "Acceso desde el móvil",
                    content: "PideLocal está diseñado para móviles. Tanto tu panel de admin como la carta de los clientes funcionan perfecto en cualquier smartphone."
                },
                {
                    title: "Instalar como App (PWA)",
                    content: (
                        <div className="space-y-6">
                            <p>Instala el panel de gestión en tu móvil para recibir los pedidos a pantalla completa y acceder más rápido. No ocupa espacio y funciona como una app nativa.</p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                                    <h4 className="font-bold text-slate-900 flex items-center gap-2 mb-3">
                                        <span className="text-xl">🤖</span> Android (Chrome)
                                    </h4>
                                    <ol className="list-decimal pl-5 space-y-2 text-sm text-slate-700">
                                        <li>Abre el panel en <strong>Google Chrome</strong>.</li>
                                        <li>Pulsa en los <strong>3 puntos</strong> de arriba a la derecha.</li>
                                        <li>Selecciona <strong>"Instalar aplicación"</strong> o "Añadir a pantalla de inicio".</li>
                                        <li>Confirma y verás el icono de PideLocal en tu menú.</li>
                                    </ol>
                                </div>

                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                                    <h4 className="font-bold text-slate-900 flex items-center gap-2 mb-3">
                                        <span className="text-xl">🍎</span> iPhone (Safari)
                                    </h4>
                                    <ol className="list-decimal pl-5 space-y-2 text-sm text-slate-700">
                                        <li>Abre el panel en <strong>Safari</strong>.</li>
                                        <li>Pulsa el botón <strong>Compartir</strong> (cuadrado con flecha abajo al centro).</li>
                                        <li>Busca y pulsa en <strong>"Añadir a pantalla de inicio"</strong>.</li>
                                        <li>Dale a "Añadir" arriba a la derecha.</li>
                                    </ol>
                                </div>
                            </div>

                            <div className="bg-orange-50 p-3 rounded-lg text-sm text-orange-800 border border-orange-100 flex gap-2">
                                <span className="text-lg">💡</span>
                                <p><strong>Truco:</strong> Si usas la App instalada, la pantalla se mantendrá encendida más fácilmente y la gestión de pedidos es más cómoda.</p>
                            </div>
                        </div>
                    )
                },
                {
                    title: "Notificaciones de sonido",
                    content: "Para que suene la alerta de 'Nuevo Pedido', necesitas tener el panel de pedidos abierto. Asegúrate de haber hecho clic en algún lugar de la página al menos una vez para activar el audio del navegador."
                },
                {
                    title: "Modo quiosco para cocina",
                    content: "Puedes poner una tablet en la cocina con la vista de Pedidos abierta. Es la mejor forma de que los cocineros vean lo que entra en tiempo real."
                }
            ]
        },
        {
            title: "Gestión de Reservas",
            icon: CalendarCheck,
            color: "violet",
            items: [
                {
                    title: "Activar o Desactivar Reservas",
                    content: "Ve a Configuración > Reservas. Allí encontrarás un interruptor principal. Si lo desactivas, el botón 'Reservar Mesa' desaparecerá automáticamente tanto de tu página web como de tu carta digital, para que no recibas solicitudes."
                },
                {
                    title: "Control de Aforo y Zonas",
                    content: (
                        <div className="space-y-4">
                            <p>Puedes definir distintas zonas (ej: Terraza, Salón Interior) y asignarles una capacidad máxima.</p>
                            <ul className="list-disc pl-5 space-y-2 text-slate-700">
                                <li><strong>Aforo Máx:</strong> Es la capacidad física total (ej: 20 pax).</li>
                                <li><strong>Disponibilidad Real:</strong> El sistema calcula automáticamente cuánta gente hay reservada en cada tramo. Si el aforo se completa, el horario aparece como 'Lleno/No disponible' automáticamante.</li>
                            </ul>
                        </div>
                    )
                },
                {
                    title: "Franjas Horarias (Slots)",
                    content: "El sistema genera los tramos de reserva (ej: 13:00, 13:30, 14:00) basándose en tu configuración de 'Intervalo' y 'Duración media'. No necesitas crear cada hora a mano, ¡es automático según tu horario de apertura!"
                },
                {
                    title: "Tablero Kanban de Reservas",
                    content: "En la sección Reservas verás un tablero visual. Las tarjetas muestran una etiqueta con la Zona (ej: Terraza) y el número de personas. Puedes arrastrar las reservas para cambiar su estado (Pendiente -> Confirmada)."
                }
            ]
        },
        {
            title: "Estadísticas",
            icon: BarChart3,
            color: "amber",
            items: [
                {
                    title: "Entender el reporte de ventas",
                    content: "El gráfico muestra tus ingresos brutos (antes de gastos). Puedes ver la evolución por días o meses para detectar tendencias."
                },
                {
                    title: "Productos más vendidos",
                    content: "Descubre tus platos estrella. Si un plato no se vende, quizás es hora de cambiarlo o promocionarlo mejor."
                },
                {
                    title: "Horas punta de actividad",
                    content: "¿A qué hora te piden más? Úsalo para preparar tu mise-en-place o reforzar el personal en esos tramos."
                },
                {
                    title: "Exportar datos",
                    content: "Próximamente podrás descargar un Excel con todo el desglose para enviárselo a tu gestor."
                }
            ]
        }
    ];

    const faqs = [
        {
            q: "¿Cómo recibo el dinero de los pedidos online?",
            a: "Los pagos con tarjeta se procesan a través de Stripe y se depositan directamente en tu cuenta bancaria configurada. PideLocal no tiene acceso a esos fondos. Para cualquier incidencia con un pago, depósito o devolución, contacta a través de tu panel de Stripe."
        },
        {
            q: "¿Puedo cerrar la tienda temporalmente?",
            a: "Sí, desde 'Configuración > Horarios' puedes activar el modo 'Cerrado Temporalmente' o ajustar tus horarios festivos."
        },
        {
            q: "¿Los clientes necesitan descargar una App?",
            a: "No. Tu carta digital funciona directamente en el navegador de cualquier móvil sin descargar nada. Sin embargo, pueden 'instalarla' si lo desean para acceso rápido."
        },
        {
            q: "¿Cómo configuro los gastos de envío?",
            a: "Desde 'Configuración > Pedidos' puedes activar el reparto propio, establecer un pedido mínimo y fijar un coste de envío que se sumará automáticamente al ticket."
        }
    ];

    const filteredGuides = guides.filter(g =>
        g.title.toLowerCase().includes(search.toLowerCase()) ||
        g.items.some(i => i.title.toLowerCase().includes(search.toLowerCase()))
    );

    return (
        <div className="space-y-8 animate-in fade-in pb-20 max-w-7xl mx-auto">

            {/* Hero Header */}
            <div className="relative overflow-hidden rounded-3xl bg-slate-900 px-6 py-12 sm:px-12 sm:py-16 text-center shadow-2xl">
                <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
                    <div className="absolute right-0 top-0 -translate-y-12 translate-x-12 w-96 h-96 bg-emerald-500 rounded-full blur-3xl" />
                    <div className="absolute left-0 bottom-0 translate-y-12 -translate-x-12 w-96 h-96 bg-blue-500 rounded-full blur-3xl" />
                </div>

                <div className="relative z-10 max-w-2xl mx-auto space-y-6">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-xs font-medium mb-4">
                        <LifeBuoy className="w-3.5 h-3.5 text-emerald-400" />
                        Centro de Ayuda
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
                        ¿Cómo podemos ayudarte hoy?
                    </h1>
                    <p className="text-slate-400 text-lg">
                        Encuentra guías, trucos y respuestas para sacar el máximo partido a tu negocio.
                    </p>

                    <div className="relative max-w-lg mx-auto transform transition-all focus-within:scale-105">
                        <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Buscar temas (ej: Horarios, Carta, Pagos...)"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 shadow-xl"
                        />
                    </div>
                </div>
            </div>

            {/* Guides Grid */}
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-slate-500" />
                Guías Rápidas
            </h2>

            {filteredGuides.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    <p className="text-slate-500">No encontramos guías para tu búsqueda.</p>
                    <button onClick={() => setSearch("")} className="mt-2 text-emerald-600 font-bold hover:underline">Limpiar búsqueda</button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredGuides.map((g) => (
                        <GuideCard key={g.title} {...g} onSelect={(item: any) => setSelectedGuide(item)} />
                    ))}
                </div>
            )}

            {/* FAQ Accordion Section */}
            <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1">
                    <h2 className="text-xl font-bold text-slate-800 mb-2">Preguntas Frecuentes</h2>
                    <p className="text-slate-500 text-sm mb-6">Respuestas a las dudas más comunes de nuestros usuarios.</p>

                    <div className="glass-panel p-6 bg-emerald-50/50 border-emerald-100">
                        <h3 className="font-bold text-emerald-900 mb-2 flex items-center gap-2">
                            <MessageCircle className="w-4 h-4" /> ¿Necesitas más ayuda?
                        </h3>
                        <p className="text-sm text-emerald-700/80 mb-4">
                            Si no encuentras lo que buscas, contacta con nuestro soporte técnico.
                        </p>
                        <button className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors text-sm">
                            Contactar Soporte
                        </button>
                    </div>
                </div>

                <div className="lg:col-span-2 space-y-4">
                    {faqs.map((faq, i) => (
                        <FaqItem key={i} q={faq.q} a={faq.a} />
                    ))}
                </div>
            </div>

            {/* Help Details Modal */}
            {selectedGuide && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSelectedGuide(null)} />
                    <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <h3 className="text-lg font-bold text-slate-900">{selectedGuide.title}</h3>
                            <button onClick={() => setSelectedGuide(null)} className="p-2 bg-white rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors shadow-sm border border-slate-100">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 text-slate-600 text-base leading-relaxed">
                            {selectedGuide.content}
                        </div>
                        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
                            <button onClick={() => setSelectedGuide(null)} className="px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-colors">
                                Entendido
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}

function GuideCard({ title, icon: Icon, color, items, onSelect }: any) {
    const colors: any = {
        blue: "bg-blue-50 text-blue-600 border-blue-100",
        emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
        orange: "bg-orange-50 text-orange-600 border-orange-100",
        rose: "bg-rose-50 text-rose-600 border-rose-100",
        violet: "bg-violet-50 text-violet-600 border-violet-100",
        amber: "bg-amber-50 text-amber-600 border-amber-100",
    };
    const c = colors[color] || colors.blue;

    return (
        <div className="glass-panel p-0 overflow-hidden hover:shadow-lg transition-all group h-full flex flex-col">
            <div className={clsx("p-5 border-b flex items-center gap-3", c)}>
                <div className="p-2 bg-white rounded-lg shadow-sm">
                    <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-800">{title}</h3>
            </div>
            <div className="p-5 flex-1 bg-white">
                <ul className="space-y-3">
                    {items.map((item: any, idx: number) => (
                        <li
                            key={idx}
                            onClick={() => onSelect(item)}
                            className="flex items-start gap-2 text-sm text-slate-600 cursor-pointer hover:text-emerald-600 hover:font-medium transition-colors p-1.5 -ml-1.5 rounded-lg hover:bg-emerald-50/50 group/item"
                        >
                            <ChevronRight className="w-4 h-4 text-slate-300 mt-0.5 flex-shrink-0 group-hover:text-emerald-500 transition-colors group-hover/item:translate-x-0.5 transform duration-200" />
                            <span>{item.title}</span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}

function FaqItem({ q, a }: { q: string, a: string }) {
    const [open, setOpen] = useState(false);
    return (
        <div className="border border-slate-200 rounded-xl bg-white overflow-hidden transition-all hover:border-slate-300">
            <button
                onClick={() => setOpen(!open)}
                className="w-full flex items-center justify-between p-4 text-left"
            >
                <span className="font-bold text-slate-800 text-sm md:text-base">{q}</span>
                <ChevronDown className={clsx("w-5 h-5 text-slate-400 transition-transform duration-300", open && "rotate-180")} />
            </button>
            <div
                className={clsx(
                    "grid transition-all duration-300 ease-in-out text-slate-600 bg-slate-50",
                    open ? "grid-rows-[1fr] px-4 pb-4 pt-0 border-t border-slate-100" : "grid-rows-[0fr]"
                )}
            >
                <div className="overflow-hidden">
                    <div className="pt-2 text-sm leading-relaxed">
                        {a}
                    </div>
                </div>
            </div>
        </div>
    );
}
