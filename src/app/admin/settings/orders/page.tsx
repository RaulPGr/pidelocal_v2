
import OrdersHoursSettingsClient from './client';

export const metadata = {
    title: 'Configuración de Pedidos - PideLocal',
};

export default function OrdersSettingsPage() {
    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-900">Pedidos y Horarios</h1>
                <p className="text-slate-500">Configura cuándo aceptas pedidos y tus métodos de pago.</p>
            </div>
            <OrdersHoursSettingsClient />
        </div>
    );
}
