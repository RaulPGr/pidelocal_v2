import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Política de Privacidad | PideLocal",
};

export default function PrivacyPage() {
    return (
        <>
            <h1>Política de Privacidad</h1>
            <p className="lead">Última actualización: {new Date().toLocaleDateString("es-ES")}</p>

            <h2>1. Responsable del Tratamiento</h2>
            <p>
                <strong>Identidad:</strong> [Nombre de tu Empresa / Autónomo] (en adelante, "PideLocal")<br />
                <strong>NIF/CIF:</strong> [Tu NIF/CIF]<br />
                <strong>Dirección:</strong> [Tu Dirección Completa]<br />
                <strong>Email:</strong> [Tu Email de Contacto]
            </p>

            <h2>2. Información que Recopilamos</h2>
            <p>Recopilamos información personal que usted nos proporciona directamente cuando:</p>
            <ul>
                <li>Se registra en nuestra plataforma.</li>
                <li>Realiza un pedido a través de nuestros sistemas.</li>
                <li>Se pone en contacto con nuestro soporte.</li>
            </ul>
            <p>Los datos pueden incluir: nombre, dirección de correo electrónico, número de teléfono y datos de pago (procesados de forma segura por Stripe).</p>

            <h2>3. Finalidad del Tratamiento</h2>
            <p>Usamos sus datos para:</p>
            <ul>
                <li>Proveer y mantener nuestro servicio de gestión de pedidos y reservas.</li>
                <li>Procesar sus transacciones y enviarle confirmaciones.</li>
                <li>Mejorar y personalizar la experiencia de usuario.</li>
                <li>Cumplir con obligaciones legales y fiscales.</li>
            </ul>

            <h2>4. Legitimación</h2>
            <p>La base legal para el tratamiento de sus datos es la ejecución del contrato de prestación de servicios (Términos y Condiciones) y el cumplimiento de obligaciones legales.</p>

            <h2>5. Destinatarios</h2>
            <p>Sus datos no se cederán a terceros salvo obligación legal. Compartimos información con proveedores de servicios esenciales (como Stripe para pagos o proveedores de hosting) bajo estrictos acuerdos de confidencialidad.</p>

            <h2>6. Derechos</h2>
            <p>Usted tiene derecho a acceder, rectificar y suprimir sus datos, así como otros derechos reconocidos por el RGPD, contactando con nosotros en la dirección de email indicada arriba.</p>
        </>
    );
}
