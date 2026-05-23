import { useState, type FormEvent } from 'react'
import { UserPlus } from 'lucide-react'
import { EmployeeKind } from '@/client'
import { ClientCredentialsModal } from '@/components/admin/ClientCredentialsModal'
import { useProvisionStaffMutation } from '@/hooks/api/admin/useAdminMutations'
import { useAdminStaffQuery } from '@/hooks/api/admin/useAdminStaffQuery'
import { useTheme } from '@/theme'

type CredentialsState = {
  displayName: string
  email: string
  password: string
}

export function AdminAddEmployees() {
  const { theme } = useTheme()
  const primary = theme.colors.primary
  const secondary = theme.colors.secondary
  const ink = theme.colors.foreground

  const staffQuery = useAdminStaffQuery()
  const provisionStaff = useProvisionStaffMutation()

  const [email, setEmail] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [password, setPassword] = useState('')
  const [employeeKind, setEmployeeKind] = useState<EmployeeKind>(EmployeeKind.EDITOR)
  const [formError, setFormError] = useState<string | null>(null)
  const [credentials, setCredentials] = useState<CredentialsState | null>(null)

  const smmStaff = staffQuery.data?.smmStaff ?? []
  const editorStaff = staffQuery.data?.editorStaff ?? []

  function resetForm() {
    setEmail('')
    setDisplayName('')
    setPassword('')
    setEmployeeKind(EmployeeKind.EDITOR)
    setFormError(null)
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setFormError(null)
    const trimmedEmail = email.trim()
    const trimmedName = displayName.trim()
    if (!trimmedEmail || !trimmedName) {
      setFormError('Email and display name are required.')
      return
    }
    if (!password) {
      setFormError('Password is required.')
      return
    }
    void provisionStaff
      .mutateAsync({
        email: trimmedEmail,
        displayName: trimmedName,
        password,
        employeeKind,
      })
      .then((result) => {
        setCredentials({
          displayName: result.staff.name,
          email: result.credentials.email,
          password: result.credentials.password,
        })
        resetForm()
      })
      .catch(() => {
        setFormError(
          'Could not create employee. Check the email is unique and try again.',
        )
      })
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1
          className="font-[family-name:var(--heading)] text-2xl font-bold tracking-tight"
          style={{ color: ink }}
        >
          Add employees
        </h1>
      </div>

      <p className="text-muted-foreground -mt-4 max-w-2xl text-sm leading-relaxed">
        Create login credentials for editors and social media managers. Share the
        password securely — it is only shown once after creation.
      </p>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,22rem)_1fr]">
        <form
          onSubmit={handleSubmit}
          className="border-border bg-background/85 space-y-4 rounded-2xl border p-6 backdrop-blur-xl"
          style={{ boxShadow: `0 0 0 1px rgba(255, 255, 255, 0.55) inset` }}
        >
          <h2 className="text-foreground text-sm font-semibold">New employee</h2>

          <label className="block space-y-1.5">
            <span className="text-muted-foreground text-xs font-medium">Role</span>
            <div className="flex gap-2">
              {(
                [
                  { value: EmployeeKind.EDITOR, label: 'Editor' },
                  { value: EmployeeKind.SMM, label: 'SMM' },
                ] as const
              ).map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => {
                    setEmployeeKind(value)
                  }}
                  className={[
                    'flex-1 rounded-xl border px-3 py-2 text-sm font-medium transition-colors',
                    employeeKind === value
                      ? 'text-foreground'
                      : 'text-muted-foreground hover:text-foreground',
                  ].join(' ')}
                  style={
                    employeeKind === value
                      ? {
                          background: `${primary}14`,
                          borderColor: `${primary}45`,
                        }
                      : undefined
                  }
                >
                  {label}
                </button>
              ))}
            </div>
          </label>

          <label className="block space-y-1.5">
            <span className="text-muted-foreground text-xs font-medium">Email</span>
            <input
              type="email"
              autoComplete="off"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
              }}
              className="border-border bg-background text-foreground w-full rounded-xl border px-3 py-2 text-sm"
              placeholder="editor@yourcompany.com"
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-muted-foreground text-xs font-medium">
              Display name
            </span>
            <input
              type="text"
              value={displayName}
              onChange={(e) => {
                setDisplayName(e.target.value)
              }}
              className="border-border bg-background text-foreground w-full rounded-xl border px-3 py-2 text-sm"
              placeholder="Full name"
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-muted-foreground text-xs font-medium">Password</span>
            <input
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
              }}
              className="border-border bg-background text-foreground w-full rounded-xl border px-3 py-2 text-sm"
            />
          </label>

          {formError ? (
            <p className="text-destructive text-sm" role="alert">
              {formError}
            </p>
          ) : null}
          {provisionStaff.isError && !formError ? (
            <p className="text-destructive text-sm" role="alert">
              Request failed. Please try again.
            </p>
          ) : null}

          <button
            type="submit"
            disabled={provisionStaff.isPending}
            className="text-primary-foreground inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold disabled:opacity-55"
            style={{
              background: `linear-gradient(135deg, ${primary}, ${secondary})`,
            }}
          >
            <UserPlus className="size-4" aria-hidden />
            {provisionStaff.isPending ? 'Creating…' : 'Create employee'}
          </button>
        </form>

        <section className="space-y-6">
          <StaffList
            title="Editors"
            loading={staffQuery.isLoading}
            members={editorStaff}
          />
          <StaffList
            title="Social media managers"
            loading={staffQuery.isLoading}
            members={smmStaff}
          />
        </section>
      </div>

      <ClientCredentialsModal
        open={credentials !== null}
        title="Employee login"
        displayName={credentials?.displayName ?? ''}
        loginId={credentials?.email ?? ''}
        password={credentials?.password ?? ''}
        onClose={() => {
          setCredentials(null)
        }}
      />
    </>
  )
}

function StaffList({
  title,
  loading,
  members,
}: {
  title: string
  loading: boolean
  members: { id: string; name: string }[]
}) {
  return (
    <div
      className="border-border bg-background/85 rounded-2xl border backdrop-blur-xl"
      style={{ boxShadow: `0 0 0 1px rgba(255, 255, 255, 0.55) inset` }}
    >
      <h2 className="text-foreground border-border border-b px-5 py-3 text-sm font-semibold">
        {title}
      </h2>
      {loading ? (
        <p className="text-muted-foreground px-5 py-4 text-sm">Loading…</p>
      ) : members.length === 0 ? (
        <p className="text-muted-foreground px-5 py-4 text-sm">No accounts yet.</p>
      ) : (
        <ul className="divide-border divide-y">
          {members.map((member) => (
            <li
              key={member.id}
              className="text-foreground px-5 py-3 text-sm font-medium"
            >
              {member.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
