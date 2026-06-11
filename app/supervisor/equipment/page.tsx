import { PageHeader } from '@/components/ui/PageHeader'
import { Badge } from '@/components/ui/badge'

export default function SupervisorEquipmentPage() {
  return (
    <div className="p-6">
      <PageHeader title="Equipos" subtitle="Maquinaria y estado de los equipos" />
      <Badge variant="outline">En construcción</Badge>
    </div>
  )
}
