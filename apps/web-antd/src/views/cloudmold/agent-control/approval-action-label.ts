const approvalActionLabels: Record<string, string> = {
  TEMPORAL_SCHEDULED_WRITE: '定时任务受控写入',
};

/** Turns technical action codes into language an approver can act on. */
export function approvalActionLabel(actionCode?: string) {
  if (!actionCode) return '受控业务操作';
  return approvalActionLabels[actionCode.trim().toUpperCase()] ?? '受控业务操作';
}
