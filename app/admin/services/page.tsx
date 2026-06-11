import { PageHeader } from '@/components/ui/PageHeader'
import { Badge } from '@/components/ui/badge'

export default function AdminServicesPage() {
  return (
    <div className="p-6">
      <PageHeader title="Servicios" subtitle="Catálogo de servicios del lavadero" />
      <Badge variant="outline">En construcción</Badge>
    </div>
  )
}
