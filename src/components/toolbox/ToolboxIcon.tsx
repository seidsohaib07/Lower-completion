import { useEffect, useRef } from 'react';
import type { CompletionEquipment, EquipmentType } from '../../types';
import { SHAPE_DRAWERS } from '../../canvas/equipment-shapes';

interface Props {
  type: EquipmentType;
  color: string;
  size: number;
}

/**
 * Renders a small canvas preview of an equipment piece by invoking the actual
 * shape drawer used on the schematic. This keeps icons and schematic shapes visually identical.
 */
export function ToolboxIcon({ type, size }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, size, size);

    const drawer = SHAPE_DRAWERS[type];
    if (!drawer) return;

    // Construct a minimal equipment object for the drawer (shape ignores most fields)
    const equipment: CompletionEquipment = makeIconEquipment(type);

    const wellboreWidth = size * 0.75;
    const pipeWidth = wellboreWidth * 0.45;
    const padding = 3;

    drawer({
      ctx,
      centerX: size / 2,
      yTop: padding,
      yBottom: size - padding,
      wellboreWidth,
      pipeWidth,
      isSelected: false,
      equipment,
    });
  }, [type, size]);

  return <canvas ref={canvasRef} />;
}

function makeIconEquipment(type: EquipmentType): CompletionEquipment {
  const base = { id: 'icon', topMD: 0, bottomMD: 1, length: 1, od: 4.5, innerDiameter: 3.826 };
  switch (type) {
    case 'casing':
      return { ...base, type, od: 9.625, innerDiameter: 8.681, jointLength: 12.2, casingClass: 'production' };
    case 'tubing':
      return { ...base, type, od: 3.5, innerDiameter: 2.992, jointLength: 9.5 };
    case 'blank_pipe':
      return { ...base, type, jointLength: 12.2 };
    case 'pup_joint':
      return { ...base, type };
    case 'constrictor':
      return { ...base, type, constrictionType: 'mechanical', bodyOD: 4.5, maxOD: 5.875 };
    case 'swell_packer':
      return { ...base, type, swellMedium: 'water', swellTime: 48, maxOD: 5.875, bodyOD: 4.5 };
    case 'sand_screen':
      return { ...base, type, meshSize: 200, screenType: 'premium_mesh', gaugeOD: 4.75 };
    case 'icd_screen':
      return { ...base, type, meshSize: 200, screenType: 'premium_mesh', gaugeOD: 4.75, nozzleCount: 4, nozzleSize: 3, flowArea: 28 };
    case 'aicd_screen':
      return { ...base, type, meshSize: 200, screenType: 'premium_mesh', gaugeOD: 4.75, nozzleCount: 4, nozzleSize: 3, autonomousRating: 50 };
    case 'sliding_sleeve':
      return { ...base, type, sleeveType: 'hydraulic', position: 'open', nozzleCount: 8, nozzleSize: 3 };
    case 'perforation':
      return { ...base, type, shotDensity: 6, phasing: 60, chargeSize: 22.7 };
    case 'frac_sleeve':
      return { ...base, type, ballSize: 2.875, portArea: 4.5 };
    case 'centralizer':
      return { ...base, type, centralizerType: 'bow_spring', maxOD: 5.75 };
    case 'production_packer':
      return { ...base, type, packerType: 'hydraulic_set', maxOD: 5.9 };
    case 'liner_hanger':
      return { ...base, type, hangerType: 'hydraulic', maxOD: 6.75 };
    case 'float_shoe':
      return { ...base, type, shoeType: 'float' };
    case 'float_collar':
      return { ...base, type, valveType: 'double' };
    case 'wash_pipe':
      return { ...base, type, washOD: 2.875 };
  }
}
