'use client'

import { useState, useEffect, useCallback } from 'react'
import { Clock, DollarSign, PackageOpen, UsersRound, AlertTriangle } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useShift } from '@/hooks/useShift'
import { useShiftStore } from '@/store/shift.store'
import { getActiveShift } from '@/services/shifts.service'
import { formatDateTime, formatCurrency } from '@/lib/utils'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'

export default function ShiftPage() {
  const user = useAuth()
  const shift = useShift()
  const { setShift, clearShift } = useShiftStore()

  const [loading, setLoading] = useState(true)
  const [openingCash, setOpeningCash] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showCloseDialog, setShowCloseDialog] = useState(false)

  const loadShift = useCallback(async () => {
    if (!user) return
    try {
      setLoading(true)
      setError(null)
      const active = await getActiveShift(user.company_id)
      if (active) {
        setShift({
          id: active.id,
          opened_at: active.opened_at,
          opening_cash: active.opening_cash,
          status: active.status,
          total_sales: active.total_sales,
          total_services: active.total_services,
          total_unassigned: active.total_unassigned,
          opened_by: active.opened_by,
        })
      }
    } catch {
      setError('Could not load shift status')
    } finally {
      setLoading(false)
    }
  }, [user, setShift])

  useEffect(() => {
    loadShift()
  }, [loadShift])

  async function handleOpenShift() {
    if (!user) return
    setIsSubmitting(true)
    setError(null)

    try {
      const res = await fetch('/api/shifts/open', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ opening_cash: Number(openingCash) }),
      })
      const body = await res.json()

      if (!res.ok) {
        setError(typeof body.error === 'string' ? body.error : 'Failed to open shift')
        return
      }

      setShift({
        id: body.data.id,
        opened_at: body.data.opened_at,
        opening_cash: body.data.opening_cash,
        status: body.data.status,
        total_sales: body.data.total_sales,
        total_services: body.data.total_services,
        total_unassigned: body.data.total_unassigned,
        opened_by: body.data.opened_by,
      })
      setOpeningCash('')
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleCloseShift() {
    setShowCloseDialog(false)
    setIsSubmitting(true)
    setError(null)

    try {
      const res = await fetch('/api/shifts/close', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      const body = await res.json()

      if (!res.ok) {
        setError(typeof body.error === 'string' ? body.error : 'Failed to close shift')
        return
      }

      clearShift()
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Shift" subtitle="Manage your work shift" />
        <Card>
          <CardContent className="space-y-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!shift) {
    return (
      <div className="space-y-6">
        <PageHeader title="Shift" subtitle="Open a new shift to start operations" />

        {error && (
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Open Shift</CardTitle>
            <CardDescription>
              Enter the starting cash amount to open the register
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="opening-cash" className="text-sm font-medium">
                  Opening Cash
                </label>
                <Input
                  id="opening-cash"
                  type="number"
                  min="0"
                  step="100"
                  placeholder="0"
                  value={openingCash}
                  onChange={(e) => setOpeningCash(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
              <Button
                onClick={handleOpenShift}
                disabled={isSubmitting || !openingCash}
              >
                {isSubmitting ? 'Opening...' : 'Open Shift'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Current Shift" subtitle="Shift is open" />

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Shift Summary</CardTitle>
          <CardDescription>Details of the currently open shift</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="flex items-center gap-3 rounded-lg border p-3">
              <Clock className="size-5 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Opened At</p>
                <p className="text-sm font-medium">{formatDateTime(shift.opened_at)}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-lg border p-3">
              <UsersRound className="size-5 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Opened By</p>
                <p className="text-sm font-medium font-mono">{shift.opened_by.slice(0, 8)}...</p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-lg border p-3">
              <DollarSign className="size-5 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Opening Cash</p>
                <p className="text-sm font-medium">{formatCurrency(shift.opening_cash)}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-lg border p-3">
              <DollarSign className="size-5 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Total Sales</p>
                <p className="text-sm font-medium">{formatCurrency(shift.total_sales)}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-lg border p-3">
              <PackageOpen className="size-5 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Services</p>
                <p className="text-sm font-medium">{shift.total_services}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-lg border p-3">
              <AlertTriangle className="size-5 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Unassigned</p>
                <p className="text-sm font-medium">{shift.total_unassigned}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button
          variant={shift.total_unassigned > 0 ? 'default' : 'destructive'}
          onClick={() => setShowCloseDialog(true)}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Closing...' : 'Close Shift'}
        </Button>
      </div>

      <ConfirmDialog
        open={showCloseDialog}
        onConfirm={handleCloseShift}
        onCancel={() => setShowCloseDialog(false)}
        title="Close Shift"
        description={
          shift.total_unassigned > 0
            ? `There ${shift.total_unassigned === 1 ? 'is' : 'are'} ${shift.total_unassigned} unassigned service${shift.total_unassigned === 1 ? '' : 's'}. Closing will mark them as unattended. Are you sure?`
            : 'Are you sure you want to close this shift? This action cannot be undone.'
        }
        variant={shift.total_unassigned > 0 ? 'warning' : 'danger'}
      />
    </div>
  )
}
