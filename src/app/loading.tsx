import Image from "next/image";

export default function Loading() {
    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: "url('/images/splash-bg.jpg')" }}>
            {/* Overlay opcional para mejorar contraste si fuera necesario, 
          pero la imagen parece tener buen contraste o estilo propio. 
          Podemos añadir un logo vibrante encima. */}

            <div className="relative animate-pulse">
                <Image
                    src="/images/pidelocal.png"
                    alt="Cargando..."
                    width={120}
                    height={120}
                    className="drop-shadow-xl"
                    priority
                />
            </div>
        </div>
    );
}
