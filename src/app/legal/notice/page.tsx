import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Aviso Legal | PideLocal",
};

export default function NoticePage() {
    return (
        <>
            <h1>Aviso Legal</h1>
            <p className="lead">En cumplimiento con el deber de información recogido en artículo 10 de la Ley 34/2002, de 11 de julio, de Servicios de la Sociedad de la Información y del Comercio Electrónico (LSSICE), a continuación se reflejan los siguientes datos:</p>

            <h2>1. Datos Identificativos</h2>
            <p>
                <strong>Titular del sitio web:</strong> [Nombre de tu Empresa / Autónomo]<br />
                <strong>NIF/CIF:</strong> [Tu NIF/CIF]<br />
                <strong>Domicilio:</strong> [Tu Dirección Completa]<br />
                <strong>Email de contacto:</strong> [Tu Email]<br />
                <strong>Actividad:</strong> Desarrollo de software y servicios SaaS para hostelería.
            </p>

            <h2>2. Usuarios</h2>
            <p>El acceso y/o uso de este portal atribuye la condición de USUARIO, que acepta, desde dicho acceso y/o uso, las Condiciones Generales de Uso aquí reflejadas.</p>

            <h2>3. Uso del Portal</h2>
            <p>PideLocal proporciona el acceso a multitud de informaciones, servicios, programas o datos (en adelante, "los contenidos") en Internet pertenecientes a PideLocal o a sus licenciantes a los que el USUARIO pueda tener acceso.</p>
            <p>El USUARIO asume la responsabilidad del uso del portal. Dicha responsabilidad se extiende al registro que fuese necesario para acceder a determinados servicios o contenidos.</p>

            <h2>4. Exclusión de Garantías y Responsabilidad</h2>
            <p>PideLocal no se hace responsable, en ningún caso, de los daños y perjuicios de cualquier naturaleza que pudieran ocasionar, a título enunciativo: errores u omisiones en los contenidos, falta de disponibilidad del portal o la transmisión de virus o programas maliciosos o lesivos en los contenidos, a pesar de haber adoptado todas las medidas tecnológicas necesarias para evitarlo.</p>
        </>
    );
}
