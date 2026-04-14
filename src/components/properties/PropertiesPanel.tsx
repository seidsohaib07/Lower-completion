import { useSelectionStore, useCompletionStore } from '../../stores';
import { EQUIPMENT_LABELS, EQUIPMENT_COLORS } from '../../constants';
import type { SwellPacker, SandScreen, SlidingSleeve } from '../../types';

export function PropertiesPanel() {
  const selection = useSelectionStore((s) => s.selection);
  const items = useCompletionStore((s) => s.completionString.items);
  const updateEquipment = useCompletionStore((s) => s.updateEquipment);
  const removeEquipment = useCompletionStore((s) => s.removeEquipment);

  if (selection.type !== 'equipment' || !selection.equipmentId) {
    return (
      <div className="w-56 bg-[#0f172a] border-l border-[#1e293b] p-3 overflow-y-auto shrink-0">
        <p className="text-[10px] text-[#64748b] uppercase tracking-wider mb-2">Properties</p>
        <p className="text-xs text-[#475569]">Select equipment to view properties</p>
      </div>
    );
  }

  const item = items.find((i) => i.id === selection.equipmentId);
  if (!item) return null;

  return (
    <div className="w-56 bg-[#0f172a] border-l border-[#1e293b] p-3 overflow-y-auto shrink-0">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] text-[#64748b] uppercase tracking-wider">Properties</p>
        {item.type !== 'blank_pipe' && (
          <button
            onClick={() => removeEquipment(item.id)}
            className="text-[10px] text-red-400 hover:text-red-300"
          >
            Remove
          </button>
        )}
      </div>

      <div
        className="flex items-center gap-2 mb-3 pb-2 border-b border-[#1e293b]"
      >
        <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: EQUIPMENT_COLORS[item.type] }} />
        <span className="text-xs font-medium text-[#e2e8f0]">{EQUIPMENT_LABELS[item.type]}</span>
      </div>

      <FieldGroup label="Depth">
        <Field label="Top MD" value={item.topMD.toFixed(2)} unit="m" />
        <Field label="Bottom MD" value={item.bottomMD.toFixed(2)} unit="m" />
        <Field label="Length" value={item.length.toFixed(2)} unit="m" />
      </FieldGroup>

      <FieldGroup label="Dimensions">
        <EditableField label="OD" value={item.od} unit="in" onChange={(v) => updateEquipment(item.id, { od: v })} />
        <EditableField label="ID" value={item.innerDiameter} unit="in" onChange={(v) => updateEquipment(item.id, { innerDiameter: v })} />
      </FieldGroup>

      {item.type === 'swell_packer' && <SwellPackerFields item={item as SwellPacker} onUpdate={updateEquipment} />}
      {item.type === 'sand_screen' && <SandScreenFields item={item as SandScreen} onUpdate={updateEquipment} />}
      {item.type === 'sliding_sleeve' && <SlidingSleeveFields item={item as SlidingSleeve} onUpdate={updateEquipment} />}

      <FieldGroup label="Notes">
        <textarea
          className="w-full bg-[#1e293b] text-[#e2e8f0] text-[10px] p-1.5 rounded border border-[#334155] resize-none h-14"
          value={item.comment ?? ''}
          onChange={(e) => updateEquipment(item.id, { comment: e.target.value })}
          placeholder="Add notes..."
        />
      </FieldGroup>
    </div>
  );
}

function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-3">
      <p className="text-[9px] text-[#475569] uppercase tracking-wider mb-1">{label}</p>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function Field({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[10px] text-[#94a3b8]">{label}</span>
      <span className="text-[10px] text-[#e2e8f0]">{value} {unit}</span>
    </div>
  );
}

function EditableField({ label, value, unit, onChange }: { label: string; value: number; unit: string; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[10px] text-[#94a3b8]">{label}</span>
      <div className="flex items-center gap-1">
        <input
          type="number"
          className="w-14 bg-[#1e293b] text-[#e2e8f0] text-[10px] px-1 py-0.5 rounded border border-[#334155] text-right"
          value={value}
          step={0.001}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        />
        <span className="text-[9px] text-[#64748b]">{unit}</span>
      </div>
    </div>
  );
}

function SwellPackerFields({ item, onUpdate }: { item: SwellPacker; onUpdate: (id: string, u: Partial<SwellPacker>) => void }) {
  return (
    <FieldGroup label="Swell Packer">
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-[#94a3b8]">Medium</span>
        <select
          className="bg-[#1e293b] text-[#e2e8f0] text-[10px] px-1 py-0.5 rounded border border-[#334155]"
          value={item.swellMedium}
          onChange={(e) => onUpdate(item.id, { swellMedium: e.target.value as any })}
        >
          <option value="water">Water</option>
          <option value="oil">Oil</option>
          <option value="dual">Dual</option>
        </select>
      </div>
      <Field label="Swell Time" value={item.swellTime.toString()} unit="hrs" />
      <Field label="Max OD" value={item.maxOD.toFixed(3)} unit="in" />
    </FieldGroup>
  );
}

function SandScreenFields({ item, onUpdate }: { item: SandScreen; onUpdate: (id: string, u: Partial<SandScreen>) => void }) {
  return (
    <FieldGroup label="Sand Screen">
      <EditableField label="Mesh Size" value={item.meshSize} unit="μm" onChange={(v) => onUpdate(item.id, { meshSize: v })} />
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-[#94a3b8]">Type</span>
        <select
          className="bg-[#1e293b] text-[#e2e8f0] text-[10px] px-1 py-0.5 rounded border border-[#334155]"
          value={item.screenType}
          onChange={(e) => onUpdate(item.id, { screenType: e.target.value as any })}
        >
          <option value="wire_wrapped">Wire Wrapped</option>
          <option value="premium_mesh">Premium Mesh</option>
          <option value="sintered">Sintered</option>
        </select>
      </div>
      <Field label="Gauge OD" value={item.gaugeOD.toFixed(3)} unit="in" />
    </FieldGroup>
  );
}

function SlidingSleeveFields({ item, onUpdate }: { item: SlidingSleeve; onUpdate: (id: string, u: Partial<SlidingSleeve>) => void }) {
  return (
    <FieldGroup label="Sliding Sleeve">
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-[#94a3b8]">Type</span>
        <select
          className="bg-[#1e293b] text-[#e2e8f0] text-[10px] px-1 py-0.5 rounded border border-[#334155]"
          value={item.sleeveType}
          onChange={(e) => onUpdate(item.id, { sleeveType: e.target.value as any })}
        >
          <option value="manual">Manual</option>
          <option value="hydraulic">Hydraulic</option>
        </select>
      </div>
      <EditableField label="Nozzles" value={item.nozzleCount ?? 0} unit="" onChange={(v) => onUpdate(item.id, { nozzleCount: v })} />
      <EditableField label="Nozzle Size" value={item.nozzleSize ?? 0} unit="mm" onChange={(v) => onUpdate(item.id, { nozzleSize: v })} />
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-[#94a3b8]">Position</span>
        <select
          className="bg-[#1e293b] text-[#e2e8f0] text-[10px] px-1 py-0.5 rounded border border-[#334155]"
          value={item.position}
          onChange={(e) => onUpdate(item.id, { position: e.target.value as any })}
        >
          <option value="open">Open</option>
          <option value="closed">Closed</option>
        </select>
      </div>
    </FieldGroup>
  );
}
