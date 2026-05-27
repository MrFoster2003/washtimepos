import { TrendingUp, TrendingDown, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'

interface StatProps {
  label: string
  value: string | number
  trend?: number
  icon?: LucideIcon
}

export function Stat({ label, value, trend, icon: Icon }: StatProps) {
  return (
    <Card size="sm">
      <CardContent className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold tracking-tight">{value}</p>
          {trend !== undefined && (
            <div className="flex items-center gap-1">
              {trend >= 0 ? (
                <TrendingUp className="size-3.5 text-green-600" />
              ) : (
                <TrendingDown className="size-3.5 text-red-600" />
              )}
              <span
                className={cn(
                  'text-xs font-medium',
                  trend >= 0 ? 'text-green-600' : 'text-red-600',
                )}
              >
                {Math.abs(trend)}%
              </span>
            </div>
          )}
        </div>
        {Icon && (
          <div className="rounded-lg bg-primary/10 p-2 text-primary">
            <Icon className="size-5" />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
