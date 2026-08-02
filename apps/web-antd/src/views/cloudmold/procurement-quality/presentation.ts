import type { CloudMoldProcurementQualityApi } from '#/api/cloudmold/procurement-quality';

const DECIMAL_SCALE = 1_000_000n;
const NEGATIVE_ONE = BigInt(-1);
const ONE = 1n;
const ZERO = 0n;

const statusLabels: Record<string, string> = {
  COMPLETED: '已完成',
  IN_PROGRESS: '检验中',
  OPEN: '待取样',
  PARTIALLY_COMPLETED: '部分判定',
  PARTIALLY_INSPECTED: '部分判定',
  READY_TO_COMPLETE: '待独立复核',
};

const finalDecisionLabels: Record<string, string> = {
  ACCEPTED: '合格',
  MIXED: '混合处置',
  QUARANTINED: '隔离',
  REJECTED: '拒收',
};

export function inspectionStatusMeta(status: string) {
  let color = 'processing';
  if (status === 'COMPLETED') color = 'success';
  if (status === 'READY_TO_COMPLETE') color = 'warning';
  return { color, label: statusLabels[status] ?? status };
}

export function finalDecisionMeta(finalDecision?: string) {
  if (!finalDecision) return { color: 'default', label: '尚未终判' };
  let color = 'success';
  if (finalDecision === 'REJECTED') color = 'error';
  if (['MIXED', 'QUARANTINED'].includes(finalDecision)) color = 'warning';
  return {
    color,
    label: finalDecisionLabels[finalDecision] ?? finalDecision,
  };
}

export function formatDecimalQuantity(value?: string, uomCode?: string) {
  if (!value) return `0${uomCode ? ` ${uomCode}` : ''}`;
  const normalized = value.replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '');
  return `${normalized}${uomCode ? ` ${uomCode}` : ''}`;
}

export function dispositionSummary(
  item:
    | CloudMoldProcurementQualityApi.Detail
    | CloudMoldProcurementQualityApi.PageItem,
) {
  return [
    `合格 ${formatDecimalQuantity(item.acceptedQuantity)}`,
    `拒收 ${formatDecimalQuantity(item.rejectedQuantity)}`,
    `隔离 ${formatDecimalQuantity(item.quarantinedQuantity)}`,
  ].join(' / ');
}

export function canRecordInspectionResult(status: string) {
  return ['IN_PROGRESS', 'OPEN', 'PARTIALLY_COMPLETED'].includes(status);
}

export function canCompleteInspection(status: string) {
  return status === 'READY_TO_COMPLETE';
}

export function undecidedQuantity(
  split: CloudMoldProcurementQualityApi.InspectionSplit,
) {
  const toScaled = (value: string) => {
    const [units = '0', decimals = ''] = value.split('.');
    const sign = units.startsWith('-') ? NEGATIVE_ONE : ONE;
    const absoluteUnits = units.replace('-', '') || '0';
    return (
      sign *
      (BigInt(absoluteUnits) * DECIMAL_SCALE +
        BigInt(decimals.padEnd(6, '0').slice(0, 6) || '0'))
    );
  };
  const value =
    toScaled(split.receivedQuantity) -
    toScaled(split.acceptedQuantity) -
    toScaled(split.rejectedQuantity) -
    toScaled(split.quarantinedQuantity);
  const sign = value < ZERO ? '-' : '';
  const absolute = value < ZERO ? -value : value;
  const units = absolute / DECIMAL_SCALE;
  const decimals = String(absolute % DECIMAL_SCALE)
    .padStart(6, '0')
    .replace(/0+$/, '');
  return `${sign}${units}${decimals ? `.${decimals}` : ''}`;
}
