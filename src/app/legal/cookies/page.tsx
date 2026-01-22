import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Política de Cookies | PideLocal",
};

export default function CookiesPage() {
    return (
        <>
            <h1>Política de Cookies</h1>
            <p className="lead">Última actualización: {new Date().toLocaleDateString("es-ES")}</p>

            <h2>¿Qué son las cookies?</h2>
            <p>Una cookie es un pequeño archivo de texto que se almacena en su navegador cuando visita casi cualquier página web. Su utilidad es que la web sea capaz de recordar su visita cuando vuelva a navegar por esa página.</p>

            <h2>Cookies que utilizamos</h2>

            <h3>1. Cookies Técnicas (Necesarias)</h3>
            <p>Son aquellas esenciales para el funcionamiento de la web, como por ejemplo, recordar su sesión de usuario, gestionar el carrito de la compra o garantizar la seguridad.</p>

            <h3>2. Cookies de Análisis (Google Analytics 4)</h3>
            <p>Nos permiten cuantificar el número de usuarios y realizar la medición y análisis estadístico de la utilización que hacen los usuarios del servicio. Para ello se analiza su navegación en nuestra página web con el fin de mejorar la oferta de productos o servicios que le ofrecemos.</p>
            <p>Estas cookies <strong>solo se activan si usted da su consentimiento expreso</strong> a través de nuestro banner de cookies.</p>

            <h2>Gestión de sus preferencias</h2>
            <p>Puede usted permitir, bloquear o eliminar las cookies instaladas en su equipo mediante la configuración de las opciones del navegador instalado en su ordenador:</p>
            <ul>
                <li><a href="https://support.google.com/chrome/answer/95647?hl=es" target="_blank" rel="noopener noreferrer">Chrome</a></li>
                <li><a href="https://support.mozilla.org/es/kb/habilitar-y-deshabilitar-cookies-sitios-web-rastrear-preferencias" target="_blank" rel="noopener noreferrer">Firefox</a></li>
                <li><a href="https://support.apple.com/es-es/guide/safari/sfri11471/mac" target="_blank" rel="noopener noreferrer">Safari</a></li>
                <li><a href="https://support.microsoft.com/es-es/windows/eliminar-y-administrar-cookies-168dab11-0753-043d-7c16-ede5947fc64d" target="_blank" rel="noopener noreferrer">Edge</a></li>
            </ul>
        </>
    );
}
