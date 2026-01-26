import { getTicketDetails } from "../../actions";
import AdminChat from "./AdminChat";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function TicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const data = await getTicketDetails(id);

    if (!data) return <div>Ticket no encontrado</div>;

    return (
        <div className="space-y-6">
            <Link href="/superadmin/support" className="inline-flex items-center text-sm text-slate-500 hover:text-slate-800">
                <ArrowLeft className="w-4 h-4 mr-1" /> Volver a Soporte
            </Link>

            <AdminChat ticket={data.ticket} messages={data.messages} />
        </div>
    );
}
