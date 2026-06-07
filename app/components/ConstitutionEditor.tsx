"use client";

import { Constitution } from "@/src/shared/types";
import conservativePreset from "@/constitutions/conservative.json";
import developerPreset from "@/constitutions/developer.json";
import standardPreset from "@/constitutions/standard.json";

interface ConstitutionEditorProps {
  constitution: Constitution;
  onChange: (constitution: Constitution) => void;
}

type EditableSection = "spending_limits" | "contract_rules" | "action_rules" | "gas_rules";

export default function ConstitutionEditor({ constitution, onChange }: ConstitutionEditorProps) {
  function updateSection<K extends EditableSection>(section: K, values: Partial<Constitution[K]>) {
    onChange({ ...constitution, [section]: { ...constitution[section], ...values } });
  }

  function loadPreset(preset: Constitution) {
    onChange(structuredClone(preset));
  }

  return (
    <section className="border border-border bg-base p-4">
      <h2 className="font-mono text-base text-white">CONSTITUTION</h2>
      <div className="mt-4 grid grid-cols-3 gap-2">
        <PresetButton label="Conservative" onClick={() => loadPreset(conservativePreset as Constitution)} />
        <PresetButton label="Standard" onClick={() => loadPreset(standardPreset as Constitution)} />
        <PresetButton label="Developer" onClick={() => loadPreset(developerPreset as Constitution)} />
      </div>

      <EditorSection title="Spending Limits">
        <NumberField label="Max single tx USD" value={constitution.spending_limits.max_single_tx_usd} onChange={(value) => updateSection("spending_limits", { max_single_tx_usd: value })} />
        <NumberField label="Max daily spend USD" value={constitution.spending_limits.max_daily_spend_usd} onChange={(value) => updateSection("spending_limits", { max_daily_spend_usd: value })} />
        <NumberField label="Confirm above USD" value={constitution.spending_limits.require_confirmation_above_usd} onChange={(value) => updateSection("spending_limits", { require_confirmation_above_usd: value })} />
        <NumberField label="Auto-approve below USD" value={constitution.spending_limits.auto_approve_below_usd} onChange={(value) => updateSection("spending_limits", { auto_approve_below_usd: value })} />
      </EditorSection>

      <EditorSection title="Contract Rules">
        <Toggle label="Allow unverified contracts" checked={constitution.contract_rules.allow_unverified_contracts} onChange={(checked) => updateSection("contract_rules", { allow_unverified_contracts: checked })} />
        <Toggle label="Allow unlimited approvals" checked={constitution.action_rules.allow_unlimited_approvals} onChange={(checked) => updateSection("action_rules", { allow_unlimited_approvals: checked })} />
        <Toggle label="Confirm new contracts" checked={constitution.contract_rules.require_confirmation_for_new_contracts} onChange={(checked) => updateSection("contract_rules", { require_confirmation_for_new_contracts: checked })} />
        <label className="block text-xs text-muted">
          Blocked addresses
          <textarea
            className="mt-2 min-h-20 w-full resize-y border border-border bg-surface p-2 font-mono text-xs text-white outline-none focus:border-[var(--risk-medium)]"
            value={constitution.contract_rules.blocked_addresses.join("\n")}
            onChange={(event) =>
              updateSection("contract_rules", {
                blocked_addresses: event.target.value.split("\n").map((value) => value.trim()).filter(Boolean)
              })
            }
          />
        </label>
      </EditorSection>

      <EditorSection title="Action Rules">
        <Toggle label="Allow contract deployment" checked={constitution.action_rules.allow_contract_deployment} onChange={(checked) => updateSection("action_rules", { allow_contract_deployment: checked })} />
        <Toggle label="Allow batch transfers" checked={constitution.action_rules.allow_batch_transfers} onChange={(checked) => updateSection("action_rules", { allow_batch_transfers: checked })} />
        <NumberField label="Max batch recipients" value={constitution.action_rules.max_batch_recipients} onChange={(value) => updateSection("action_rules", { max_batch_recipients: value })} />
      </EditorSection>

      <EditorSection title="Gas Limits">
        <NumberField label="Max gas price GWEI" value={constitution.gas_rules.max_gas_price_gwei} onChange={(value) => updateSection("gas_rules", { max_gas_price_gwei: value })} />
      </EditorSection>
    </section>
  );
}

function EditorSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-5 border-t border-border pt-4">
      <h3 className="font-mono text-xs uppercase text-muted">{title}</h3>
      <div className="mt-3 grid gap-3">{children}</div>
    </div>
  );
}

function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <label className="grid grid-cols-[1fr_120px] items-center gap-3 text-xs text-muted">
      <span>{label}</span>
      <input
        type="number"
        min="0"
        className="h-9 min-w-0 border border-border bg-surface px-2 font-mono text-xs text-white outline-none focus:border-[var(--risk-medium)]"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 text-xs text-muted">
      <span>{label}</span>
      <input className="peer sr-only" type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      <span className="relative h-5 w-9 border border-border bg-surface transition peer-checked:border-[var(--risk-medium)] peer-checked:bg-[var(--risk-medium-bg)] after:absolute after:left-0.5 after:top-0.5 after:h-3.5 after:w-3.5 after:bg-muted after:transition peer-checked:after:translate-x-4 peer-checked:after:bg-[var(--risk-medium)]" />
    </label>
  );
}

function PresetButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button className="min-w-0 border border-border px-2 py-2 font-mono text-[10px] text-white transition hover:border-[var(--risk-medium)]" onClick={onClick}>
      {label}
    </button>
  );
}
