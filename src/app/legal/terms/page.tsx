import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Términos y Condiciones | PideLocal",
};

export default function TermsPage() {
    return (
        <>
            <h1>Términos y Condiciones de Uso</h1>
            <p className="lead">Última actualización: {new Date().toLocaleDateString("es-ES")}</p>

            <h2>1. Introducción</h2>
            <p>Bienvenido a PideLocal. Al acceder a nuestro sitio web y utilizar nuestros servicios, usted acepta estar legalmente vinculado por estos Términos y Condiciones.</p>

            <h2>2. Descripción del Servicio</h2>
            <p>PideLocal es una plataforma SaaS (Software as a Service) que permite a negocios de hostelería gestionar pedidos, reservas y cartas digitales.</p>

            <h2>3. Registro y Cuentas</h2>
            <p>Para utilizar el servicio, debe registrarse y crear una cuenta. Usted es responsable de mantener la confidencialidad de sus credenciales y de toda la actividad que ocurra bajo su cuenta.</p>

            <h2>4. Pagos y Suscripciones</h2>
            <p>El servicio se ofrece bajo un modelo de suscripción (mensual o anual). Los pagos son procesados de forma segura a través de Stripe. Usted acepta pagar todas las tarifas aplicables al plan seleccionado.</p>

            <h2>5. Propiedad Intelectual</h2>
            <p>La plataforma PideLocal, incluyendo su código fuente, diseño y estructura, es propiedad exclusiva de [Nombre de tu Empresa]. Los usuarios conservan la propiedad de los datos (menús, imágenes) que suban a la plataforma.</p>

            <h2>6. Limitación de Responsabilidad</h2>
            <p>PideLocal se proporciona "tal cual". No garantizamos que el servicio sea ininterrumpido o libre de errores. En la medida máxima permitida por la ley, no seremos responsables de daños indirectos o consecuentes.</p>

            <h2>7. Modificaciones</h2>
            <p>Nos reservamos el derecho de modificar estos términos en cualquier momento. Le notificaremos sobre cambios significativos a través de nuestro sitio web o por correo electrónico.</p>

            <h2>8. Ley Aplicable</h2>
            <p>Estos términos se rigen por la legislación española. Cualquier disputa se someterá a los tribunales de [Tu Ciudad].</p>
        </>
    );
}
