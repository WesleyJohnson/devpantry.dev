import { useEffect, useState } from 'react'
import { AlertTriangle, CheckCircle2, Clock, RotateCcw, WandSparkles, XCircle } from 'lucide-react'
import { CopyButton } from '@/components/CopyButton'
import { DeveloperAdSlot } from '@/components/DeveloperAdSlot'
import { decodeCertificate, type DecodedCertificate } from '@/lib/x509Decoder'

const SAMPLE = `-----BEGIN CERTIFICATE-----
MIIDVjCCAj6gAwIBAgIIWj+cHit9AUYwDQYJKoZIhvcNAQELBQAwOTEWMBQGA1UE
AxMNZGV2cGFudHJ5LmRldjESMBAGA1UEChMJRGV2UGFudHJ5MQswCQYDVQQGEwJV
UzAeFw0yNDA2MDEwMDAwMDBaFw0yODA2MDEwMDAwMDBaMDkxFjAUBgNVBAMTDWRl
dnBhbnRyeS5kZXYxEjAQBgNVBAoTCURldlBhbnRyeTELMAkGA1UEBhMCVVMwggEi
MA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQDmwaB44+fhUOsFDSxrpJPGRRvt
L/GqhvHu6zN00x+eb1WhbU1SA34jD08lSono5+ZNO9Hyvk+f0tZ3e0wAg3iIp7lT
lQMGWbJpJ2bqx5KEY/uQgVTPAnp1Y3Nrn2VRgsPDVtsMDl3ElobI7VVjFUvDQZgH
Y4ar73rCV4HpkoNcuxwDsazoAviXM0ggC8hPzMO/Y3oau5N2smJ1xyQ6tJ2ohjZN
ZBOVzGtY+u9P2/Ohap1R1FCqTZoGMlW3NzWKNkYDI2Dw2Be6e9wfGPFJQ7lga/qG
ubEjoE/JDLfMZk/DK+oioBSkdRy6m0iU8zgGOHmHxmQf/1MwsxKymCvVZPx7AgMB
AAGjYjBgMAwGA1UdEwEB/wQCMAAwDgYDVR0PAQH/BAQDAgWgMBMGA1UdJQQMMAoG
CCsGAQUFBwMBMCsGA1UdEQQkMCKCDWRldnBhbnRyeS5kZXaCEXd3dy5kZXZwYW50
cnkuZGV2MA0GCSqGSIb3DQEBCwUAA4IBAQBYnbii/3NzoW4FECGtEQC9DOD4NFI9
rel/6ISaa3AWtm+bFFUdfHitYV7dtzPn8hMWWjUXb+uGpFNV2vgRNZ8o+gayIGly
i6WiWzBTvjMVQn9U1M4fcqDvvsE1/i1GMn8rYnHXIuf+31QvBvZujY5Ycj5zEOGQ
/Hl5xQN4/SLKHAMjSP659P6P1bWg6VRWz0UMmVLred4902cjoyRi24bVdyIy2DG3
N3YY48x1nq0nnKxmXN1fHhZplO26P0x9FLsB6FlRipri/3r4UrY7+jq6wPOPuDph
jnp1IKtxNSsc9Mm0NR8K4tSdfBGXlWn+pCQ7ieOUuJC02SylByVGITGz
-----END CERTIFICATE-----`

const DEBOUNCE_MS = 200

function useTimeStatus(cert: DecodedCertificate | null) {
  if (!cert) return null
  const now = Date.now()
  if (now < cert.notBefore.getTime()) return { kind: 'not-yet-valid' as const }
  if (now > cert.notAfter.getTime()) return { kind: 'expired' as const }
  return { kind: 'valid' as const }
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[140px_1fr] gap-2 py-1.5 text-sm">
      <span className="text-zinc-500 dark:text-zinc-400">{label}</span>
      <span className="break-all font-mono text-xs text-zinc-800 dark:text-zinc-200">{value}</span>
    </div>
  )
}

export default function X509DecoderTool() {
  const [input, setInput] = useState(SAMPLE)
  const [cert, setCert] = useState<DecodedCertificate | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!input.trim()) {
      setCert(null)
      setError(null)
      return
    }
    let cancelled = false
    const timeout = setTimeout(() => {
      decodeCertificate(input).then((result) => {
        if (cancelled) return
        setCert(result.cert)
        setError(result.error)
      })
    }, DEBOUNCE_MS)
    return () => {
      cancelled = true
      clearTimeout(timeout)
    }
  }, [input])

  const timeStatus = useTimeStatus(cert)

  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setInput(SAMPLE)}
          className="flex items-center gap-1.5 rounded-md border border-zinc-200 px-2.5 py-1.5 text-xs font-medium text-zinc-600 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          <WandSparkles className="h-3.5 w-3.5" />
          Load sample
        </button>
        <button
          type="button"
          onClick={() => setInput('')}
          className="flex items-center gap-1.5 rounded-md border border-zinc-200 px-2.5 py-1.5 text-xs font-medium text-zinc-600 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Reset
        </button>

        <div className="ml-auto">
          {input.trim() && (
            <span
              className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                cert
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
                  : 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400'
              }`}
            >
              {cert ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
              {cert ? 'Parsed' : 'Invalid'}
            </span>
          )}
        </div>
      </div>

      <div className="grid flex-1 grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="flex flex-col overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900/50">
            <span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              PEM certificate
            </span>
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            spellCheck={false}
            placeholder="Paste a PEM-encoded X.509 certificate (-----BEGIN CERTIFICATE-----)..."
            className="min-h-[420px] flex-1 resize-none bg-white p-4 font-mono text-xs leading-relaxed text-zinc-800 focus:outline-none dark:bg-zinc-950 dark:text-zinc-200"
          />
        </div>

        <div className="flex flex-col gap-4">
          {error ? (
            <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400">
              <XCircle className="h-3.5 w-3.5 shrink-0" />
              {error}
            </div>
          ) : cert ? (
            <>
              {timeStatus && timeStatus.kind !== 'valid' && (
                <div
                  className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium ${
                    timeStatus.kind === 'expired'
                      ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400'
                      : 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-400'
                  }`}
                >
                  <Clock className="h-3.5 w-3.5 shrink-0" />
                  {timeStatus.kind === 'expired'
                    ? `Expired on ${cert.notAfter.toLocaleDateString()}`
                    : `Not valid yet — becomes active on ${cert.notBefore.toLocaleDateString()}`}
                </div>
              )}
              {cert.isSelfSigned && (
                <div className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-medium text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-400">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                  Self-signed certificate
                </div>
              )}

              <div className="flex flex-col overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900/50">
                  <span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    Certificate
                  </span>
                </div>
                <div className="divide-y divide-zinc-100 bg-white px-3 dark:divide-zinc-800 dark:bg-zinc-950">
                  <Field label="Subject" value={cert.subject} />
                  <Field label="Issuer" value={cert.issuer} />
                  <Field label="Serial number" value={cert.serialNumber} />
                  {cert.version && <Field label="Version" value={cert.version} />}
                  <Field label="Not before" value={cert.notBefore.toLocaleString()} />
                  <Field label="Not after" value={cert.notAfter.toLocaleString()} />
                  <Field label="Signature algorithm" value={cert.signatureAlgorithm} />
                  <Field label="Public key" value={cert.publicKeySummary} />
                  {cert.isCA !== null && <Field label="Is CA" value={cert.isCA ? 'Yes' : 'No'} />}
                  {cert.pathLength !== null && <Field label="Path length" value={String(cert.pathLength)} />}
                  {cert.keyUsages.length > 0 && <Field label="Key usage" value={cert.keyUsages.join(', ')} />}
                  {cert.extendedKeyUsages.length > 0 && (
                    <Field label="Extended key usage" value={cert.extendedKeyUsages.join(', ')} />
                  )}
                  {cert.subjectAltNames.length > 0 && (
                    <Field label="Subject alt names" value={cert.subjectAltNames.join(', ')} />
                  )}
                </div>
              </div>

              <div className="flex flex-col overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900/50">
                  <span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    Fingerprints
                  </span>
                </div>
                <div className="divide-y divide-zinc-100 bg-white px-3 dark:divide-zinc-800 dark:bg-zinc-950">
                  <div className="flex items-center justify-between gap-2 py-1.5">
                    <Field label="SHA-1" value={cert.sha1Fingerprint} />
                    <CopyButton value={cert.sha1Fingerprint} />
                  </div>
                  <div className="flex items-center justify-between gap-2 py-1.5">
                    <Field label="SHA-256" value={cert.sha256Fingerprint} />
                    <CopyButton value={cert.sha256Fingerprint} />
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex min-h-[420px] items-center justify-center rounded-xl border border-zinc-200 text-sm text-zinc-400 dark:border-zinc-800 dark:text-zinc-600">
              Paste a certificate to see its details
            </div>
          )}
        </div>
      </div>

      <DeveloperAdSlot variant="banner" />
    </div>
  )
}
