import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { POST as openShift } from '@/app/api/shifts/open/route'
import { POST as closeShift } from '@/app/api/shifts/close/route'
import { createAdminClient } from '@/lib/supabase/admin'
import { ShiftStatus, Role } from '@/types/enums'
import type { SessionUser } from '@/lib/auth'

vi.mock('@/lib/auth', () => ({
  getSessionUser: vi.fn(),
}))

import { getSessionUser } from '@/lib/auth'

const baseUser: SessionUser = {
  id: 'user-1',
  name: 'Cashier One',
  role: Role.CASHIER,
  company_id: 'company-1',
}

function mockReq(url: string, body?: unknown): NextRequest {
  return new NextRequest(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
}

const mockShift = {
  id: 'shift-1',
  company_id: 'company-1',
  opened_by: 'user-1',
  closed_by: null,
  opened_at: '2026-05-27T10:00:00Z',
  closed_at: null,
  status: ShiftStatus.OPEN,
  opening_cash: 50000,
  total_cash: 0,
  total_digital: 0,
  total_sales: 0,
  total_services: 0,
  total_unassigned: 0,
  notes: null,
  created_at: '2026-05-27T10:00:00Z',
}

function createMockSupabase(results: Array<{ data: unknown; error: unknown }>) {
  let idx = 0
  const next = () => results[idx++] ?? { data: null, error: null }

  const chainObj = {
    eq: vi.fn(() => chainObj),
    in: vi.fn(() => chainObj),
    select: vi.fn(() => chainObj),
    order: vi.fn(() => chainObj),
    single: vi.fn(() => Promise.resolve(next())),
    maybeSingle: vi.fn(() => Promise.resolve(next())),
    insert: vi.fn(() => chainObj),
    update: vi.fn(() => chainObj),
    then: (resolve: (v: unknown) => void) => resolve(next()),
  }

  vi.mocked(createAdminClient).mockReturnValue({
    from: vi.fn(() => chainObj),
  } as unknown as ReturnType<typeof createAdminClient>)
}

describe('POST /api/shifts/open', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Happy path', () => {
    it('creates a shift and returns 201', async () => {
      vi.mocked(getSessionUser).mockResolvedValue(baseUser)
      createMockSupabase([
        { data: null, error: null },           // maybeSingle — no existing shift
        { data: mockShift, error: null },      // single — insert result
      ])

      const req = mockReq('http://localhost:3000/api/shifts/open', { opening_cash: 50000 })
      const res = await openShift(req)
      const body = await res.json()

      expect(res.status).toBe(201)
      expect(body.data).toMatchObject({ id: 'shift-1', opening_cash: 50000 })
      expect(createAdminClient().from).toHaveBeenCalledWith('shifts')
    })
  })

  describe('Auth & authorization', () => {
    it('returns 401 when no session', async () => {
      vi.mocked(getSessionUser).mockResolvedValue(null)

      const req = mockReq('http://localhost:3000/api/shifts/open', { opening_cash: 50000 })
      const res = await openShift(req)

      expect(res.status).toBe(401)
    })

    it('returns 403 when role is below CASHIER', async () => {
      vi.mocked(getSessionUser).mockResolvedValue({ ...baseUser, role: Role.WASHER })

      const req = mockReq('http://localhost:3000/api/shifts/open', { opening_cash: 50000 })
      const res = await openShift(req)

      expect(res.status).toBe(403)
    })
  })

  describe('Validation', () => {
    it('returns 422 when opening_cash is missing', async () => {
      vi.mocked(getSessionUser).mockResolvedValue(baseUser)

      const req = mockReq('http://localhost:3000/api/shifts/open', {})
      const res = await openShift(req)
      const body = await res.json()

      expect(res.status).toBe(422)
      expect(body.error).toBeDefined()
    })

    it('returns 422 when opening_cash is negative', async () => {
      vi.mocked(getSessionUser).mockResolvedValue(baseUser)

      const req = mockReq('http://localhost:3000/api/shifts/open', { opening_cash: -100 })
      const res = await openShift(req)
      const body = await res.json()

      expect(res.status).toBe(422)
      expect(body.error).toBeDefined()
    })
  })

  describe('Business rules', () => {
    it('returns 400 when an OPEN shift already exists', async () => {
      vi.mocked(getSessionUser).mockResolvedValue(baseUser)
      createMockSupabase([
        { data: { id: 'existing-shift' }, error: null },
      ])

      const req = mockReq('http://localhost:3000/api/shifts/open', { opening_cash: 50000 })
      const res = await openShift(req)
      const body = await res.json()

      expect(res.status).toBe(400)
      expect(body.error).toContain('open shift already exists')
    })
  })
})

describe('POST /api/shifts/close', () => {
  const closedShift = {
    ...mockShift,
    status: ShiftStatus.CLOSED,
    closed_at: '2026-05-27T20:00:00Z',
    closed_by: 'user-1',
    total_sales: 150000,
    total_services: 2,
    total_unassigned: 1,
    total_cash: 100000,
    total_digital: 50000,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Happy path', () => {
    it('closes the shift and returns 200 with computed totals', async () => {
      vi.mocked(getSessionUser).mockResolvedValue(baseUser)
      createMockSupabase([
        { data: { id: 'shift-1' }, error: null },                                                    // maybeSingle — find shift
        { data: [{ id: 'sale-1', total: 100000 }, { id: 'sale-2', total: 50000 }], error: null },   // then — sales
        { data: [
          { id: 'd1', service_id: 'svc-1', assigned: true },
          { id: 'd2', service_id: null, assigned: null },
          { id: 'd3', service_id: 'svc-3', assigned: false },
        ], error: null },                                                                            // then — details
        { data: [
          { payment_method: 'CASH', amount: 100000 },
          { payment_method: 'NEQUI', amount: 50000 },
        ], error: null },                                                                            // then — payments
        { data: closedShift, error: null },                                                           // single — update result
      ])

      const req = mockReq('http://localhost:3000/api/shifts/close', { notes: 'End of day' })
      const res = await closeShift(req)
      const body = await res.json()

      expect(res.status).toBe(200)
      expect(body.data.total_sales).toBe(150000)
      expect(body.data.total_services).toBe(2)
      expect(body.data.total_unassigned).toBe(1)
      expect(body.data.total_cash).toBe(100000)
      expect(body.data.total_digital).toBe(50000)
      expect(body.data.status).toBe(ShiftStatus.CLOSED)
    })
  })

  describe('Auth & authorization', () => {
    it('returns 401 when no session', async () => {
      vi.mocked(getSessionUser).mockResolvedValue(null)

      const req = mockReq('http://localhost:3000/api/shifts/close', {})
      const res = await closeShift(req)

      expect(res.status).toBe(401)
    })

    it('returns 403 when role is below CASHIER', async () => {
      vi.mocked(getSessionUser).mockResolvedValue({ ...baseUser, role: Role.WASHER })

      const req = mockReq('http://localhost:3000/api/shifts/close', {})
      const res = await closeShift(req)

      expect(res.status).toBe(403)
    })
  })

  describe('Validation', () => {
    it('returns 422 when notes is not a string', async () => {
      vi.mocked(getSessionUser).mockResolvedValue(baseUser)

      const req = mockReq('http://localhost:3000/api/shifts/close', { notes: 123 })
      const res = await closeShift(req)
      const body = await res.json()

      expect(res.status).toBe(422)
      expect(body.error).toBeDefined()
    })
  })

  describe('Business rules', () => {
    it('returns 404 when no open shift exists', async () => {
      vi.mocked(getSessionUser).mockResolvedValue(baseUser)
      createMockSupabase([
        { data: null, error: null },
      ])

      const req = mockReq('http://localhost:3000/api/shifts/close', {})
      const res = await closeShift(req)
      const body = await res.json()

      expect(res.status).toBe(404)
      expect(body.error).toContain('No open shift found')
    })
  })
})
