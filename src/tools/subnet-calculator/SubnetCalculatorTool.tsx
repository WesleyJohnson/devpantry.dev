import { useMemo, useState } from 'react'
import { RotateCcw, WandSparkles, XCircle } from 'lucide-react'
import { CopyButton } from '@/components/CopyButton'
import { DeveloperAdSlot } from '@/components/DeveloperAdSlot'
import { calculateSubnet } from '@/lib/subnetCalculator'

const SAMPLE = '192.168.1.10/24'

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[150px_1fr] gap-2 py-1.5 text-sm">
      <span className="text-zinc-500 dark:text-zinc-400">{label}</span>
      <span className="break-all font-mono text-xs text-zinc-800 dark:text-zinc-200">{value}</span>
    </div>
  )
}

export default function SubnetCalculatorTool() {
  const [input, setInput] = useState(SAMPLE)
  const { result, error } = useMemo(() => calculateSubnet(input), [input])

  const summary = useMemo(() => {
    if (!result) return ''
    if (result.family === 4) {
      return [
        `CIDR: ${result.ip}/${result.prefix}`,
        `Netmask: ${result.netmask}`,
        `Network: ${result.network}`,
        `Broadcast: ${result.broadcast ?? 'n/a'}`,
        `Host range: ${result.firstHost} - ${result.lastHost}`,
        `Usable hosts: ${result.usableHosts}`,
      ].join('\n')
    }
    return [
      `CIDR: ${result.ip}/${result.prefix}`,
      `Network: ${result.network}`,
      `Last address: ${result.lastAddress}`,
      `Total addresses: ${result.totalAddresses}`,
    ].join('\n')
  }, [result])

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
      </div>

      <div className="flex flex-col overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900/50">
          <span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            CIDR notation
          </span>
        </div>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          spellCheck={false}
          placeholder="e.g. 192.168.1.10/24 or 2001:db8::/32"
          className="bg-white px-4 py-3 font-mono text-sm text-zinc-800 focus:outline-none dark:bg-zinc-950 dark:text-zinc-200"
        />
      </div>

      {error ? (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400">
          <XCircle className="h-3.5 w-3.5 shrink-0" />
          {error}
        </div>
      ) : (
        result && (
          <div className="flex flex-col overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900/50">
              <span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                {result.family === 4 ? 'IPv4' : 'IPv6'} subnet details
              </span>
              <CopyButton value={summary} />
            </div>
            <div className="divide-y divide-zinc-100 bg-white px-3 dark:divide-zinc-800 dark:bg-zinc-950">
              {result.family === 4 ? (
                <>
                  <Row label="Network address" value={result.network} />
                  <Row label="Broadcast address" value={result.broadcast ?? 'n/a (no broadcast)'} />
                  <Row label="Subnet mask" value={result.netmask} />
                  <Row label="Wildcard mask" value={result.wildcardMask} />
                  <Row label="Host range" value={`${result.firstHost} – ${result.lastHost}`} />
                  <Row label="Usable hosts" value={result.usableHosts.toLocaleString()} />
                  <Row label="Total addresses" value={result.totalAddresses.toLocaleString()} />
                  <Row label="IP class" value={result.ipClass} />
                  <Row label="Private/reserved" value={result.isPrivate ? 'Yes' : 'No'} />
                  <Row label="Binary address" value={result.binaryIp} />
                  <Row label="Binary mask" value={result.binaryMask} />
                </>
              ) : (
                <>
                  <Row label="Network address" value={result.network} />
                  <Row label="Last address" value={result.lastAddress} />
                  <Row label="Total addresses" value={result.totalAddresses} />
                </>
              )}
            </div>
          </div>
        )
      )}

      <DeveloperAdSlot variant="banner" />
    </div>
  )
}
