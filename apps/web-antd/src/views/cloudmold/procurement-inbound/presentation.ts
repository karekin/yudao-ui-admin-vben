import type { CloudMoldWarehouseProcurementApi } from '#/api/cloudmold/warehouse-procurement';

const DECIMAL_SCALE = 1_000_000n;
const ZERO = 0n;

const statusLabels: Record<string, string> = {
  COMPLETED: '已完成',
  PARTIAL_QUALITY_DECIDED: '部分质检已处置',
  PARTIALLY_PUTAWAY: '分批上架',
  PENDING_QUALITY: '待质检',
  PUTAWAY_COMPLETED: '已上架',
  QUALITY_ACCEPTED: '质检合格',
  QUALITY_MIXED: '混合处置',
  QUALITY_QUARANTINED: '质检隔离',
  QUALITY_REJECTED: '质检拒收',
};

function toScaled(value: string) {
  const [units = '0', decimals = ''] = value.split('.');
  const negative = units.startsWith('-');
  const absoluteUnits = units.replace('-', '') || '0';
  const scaled =
    BigInt(absoluteUnits) * DECIMAL_SCALE +
    BigInt(decimals.padEnd(6, '0').slice(0, 6) || '0');
  return negative ? -scaled : scaled;
}

function fromScaled(value: bigint) {
  const negative = value < ZERO;
  const absolute = negative ? -value : value;
  const units = absolute / DECIMAL_SCALE;
  const decimals = String(absolute % DECIMAL_SCALE)
    .padStart(6, '0')
    .replace(/0+$/, '');
  return `${negative ? '-' : ''}${units}${decimals ? `.${decimals}` : ''}`;
}

export function inboundStatusMeta(status: string) {
  let color = 'processing';
  if (['COMPLETED', 'PUTAWAY_COMPLETED', 'QUALITY_ACCEPTED'].includes(status)) {
    color = 'success';
  }
  if (status === 'QUALITY_REJECTED') color = 'error';
  if (
    [
      'PARTIAL_QUALITY_DECIDED',
      'PARTIALLY_PUTAWAY',
      'QUALITY_MIXED',
      'QUALITY_QUARANTINED',
    ].includes(status)
  ) {
    color = 'warning';
  }
  return { color, label: statusLabels[status] ?? status };
}

export function formatQuantity(value?: string, uomCode?: string) {
  if (!value) return `0${uomCode ? ` ${uomCode}` : ''}`;
  const normalized = value.replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '');
  return `${normalized}${uomCode ? ` ${uomCode}` : ''}`;
}

export function remainingReceivableQuantity(
  line: CloudMoldWarehouseProcurementApi.AsnLine,
) {
  return fromScaled(
    toScaled(line.scheduledQuantity) +
      toScaled(line.allowedOverReceiptQuantity) -
      toScaled(line.receivedQuantity),
  );
}

export function remainingPutawayQuantity(
  line: CloudMoldWarehouseProcurementApi.ReceiptLine,
) {
  return fromScaled(
    toScaled(line.acceptedQuantity) - toScaled(line.cumulativePutawayQuantity),
  );
}

export function canPutawayLine(
  line: CloudMoldWarehouseProcurementApi.ReceiptLine,
) {
  return (
    ['PARTIALLY_PUTAWAY', 'QUALITY_ACCEPTED', 'QUALITY_MIXED'].includes(
      line.qualityStatus,
    ) && toScaled(remainingPutawayQuantity(line)) > ZERO
  );
}

export function canRecordReceipt(
  progress: CloudMoldWarehouseProcurementApi.ReceiptProgress,
) {
  return (
    !progress.terminal &&
    progress.lines.some(
      (line) => toScaled(remainingReceivableQuantity(line)) > ZERO,
    )
  );
}

export function receiptDispositionSummary(
  line: CloudMoldWarehouseProcurementApi.ReceiptLine,
) {
  return `待检 ${formatQuantity(line.pendingQualityQuantity)} · 合格 ${formatQuantity(line.acceptedQuantity)} · 拒收 ${formatQuantity(line.rejectedQuantity)} · 隔离 ${formatQuantity(line.quarantinedQuantity)}`;
}
