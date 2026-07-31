<script lang="ts" setup>
import type { Dayjs } from 'dayjs';

import type { CloudMoldSupplierPerformanceApi } from '#/api/cloudmold/supplier-performance';

import { computed, ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  Alert,
  Button,
  Card,
  Col,
  DatePicker,
  Descriptions,
  DescriptionsItem,
  Empty,
  Form,
  FormItem,
  Input,
  Progress,
  Row,
  Space,
  Statistic,
  Tag,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import {
  getLatestSupplierPerformanceScorecard,
  getSupplierPerformanceReadiness,
} from '#/api/cloudmold/supplier-performance';

defineOptions({ name: 'CloudMoldSupplierPerformance' });

const supplierId = ref('');
const period = ref<[Dayjs, Dayjs]>([
  dayjs().startOf('month'),
  dayjs().endOf('month'),
]);
const loading = ref(false);
const loadError = ref('');
const readiness = ref<CloudMoldSupplierPerformanceApi.Readiness>();
const scorecard = ref<CloudMoldSupplierPerformanceApi.Scorecard>();

const metricLabels: Record<string, string> = {
  CAPACITY_ATTAINMENT: '产能达成',
  CAPA_EFFECTIVENESS: 'CAPA 有效性',
  OTIF: '准时足量交付（OTIF）',
  QUALITY_PASS_RATE: '质量合格率',
};

const readinessMessage = computed(() => {
  if (!readiness.value) return '';
  if (readiness.value.status === 'READY_TO_SCORE') {
    return '本周期四类绩效事实已齐备，可以由受控评分流程生成新版本评分卡。';
  }
  const missing = readiness.value.missingMetricCodes
    .map((code) => metricLabels[code] ?? code)
    .join('、');
  return `当前仅表示事实尚未齐备，缺少：${missing || '待确认指标'}。这不是供应商不合格结论。`;
});

function formatPercent(bps?: number) {
  if (typeof bps !== 'number') return '-';
  return `${(bps / 100).toFixed(2)}%`;
}

function assessmentMeta(value?: string) {
  if (value === 'HEALTHY') return { color: 'green', label: '健康' };
  if (value === 'WATCH') return { color: 'gold', label: '关注' };
  if (value === 'AT_RISK') return { color: 'red', label: '风险关注' };
  return { color: 'default', label: '-' };
}

async function loadPerformance() {
  const normalizedSupplierId = supplierId.value.trim();
  if (!normalizedSupplierId) {
    loadError.value = '请输入供应商编号后查询。';
    return;
  }
  const [periodStart, periodEnd] = period.value;
  if (!periodStart || !periodEnd) {
    loadError.value = '请选择完整的绩效周期。';
    return;
  }
  loading.value = true;
  loadError.value = '';
  scorecard.value = undefined;
  try {
    readiness.value = await getSupplierPerformanceReadiness({
      supplierId: normalizedSupplierId,
      periodStart: periodStart.format('YYYY-MM-DD'),
      periodEnd: periodEnd.format('YYYY-MM-DD'),
    });
    try {
      scorecard.value =
        await getLatestSupplierPerformanceScorecard(normalizedSupplierId);
    } catch {
      // “尚无评分卡”是正常业务状态；就绪度仍是该周期的权威展示。
      scorecard.value = undefined;
    }
  } catch {
    readiness.value = undefined;
    loadError.value =
      '绩效事实暂时无法读取，请检查供应商编号、权限或服务状态。';
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <Page
    title="供应商绩效运营"
    description="以可追溯事实衡量交付、质量、产能与 CAPA；不以 AI 估算替代经营证据。"
  >
    <Alert
      class="mb-4"
      type="info"
      show-icon
      message="评分卡只在四类事实齐备时生成"
      description="待补事实表示尚未形成评分依据，不代表供应商不合格，也不会自动触发限单、处罚或恢复。"
    />

    <Card class="mb-4" :bordered="false">
      <Form layout="inline">
        <FormItem label="供应商编号">
          <Input
            v-model:value="supplierId"
            class="w-72"
            placeholder="输入 CloudMold 供应商编号"
          />
        </FormItem>
        <FormItem label="绩效周期">
          <DatePicker.RangePicker v-model:value="period" />
        </FormItem>
        <FormItem>
          <Button type="primary" :loading="loading" @click="loadPerformance">
            查询绩效事实
          </Button>
        </FormItem>
      </Form>
    </Card>

    <Alert
      v-if="loadError"
      class="mb-4"
      type="warning"
      show-icon
      :message="loadError"
    />

    <template v-else-if="readiness">
      <Alert
        class="mb-4"
        :type="readiness.status === 'READY_TO_SCORE' ? 'success' : 'info'"
        show-icon
        :message="
          readiness.status === 'READY_TO_SCORE'
            ? '评分事实已齐备'
            : '等待经营事实补齐'
        "
        :description="readinessMessage"
      />

      <Row :gutter="[16, 16]" class="mb-4">
        <Col
          v-for="(count, code) in readiness.evidenceCounts"
          :key="code"
          :xs="24"
          :sm="12"
          :xl="6"
        >
          <Card :bordered="false">
            <Statistic
              :title="metricLabels[code] ?? code"
              :value="count"
              suffix="条事实"
            />
          </Card>
        </Col>
        <Col
          v-for="code in readiness.missingMetricCodes"
          :key="code"
          :xs="24"
          :sm="12"
          :xl="6"
        >
          <Card :bordered="false">
            <Statistic
              :title="metricLabels[code] ?? code"
              :value="0"
              suffix="条事实"
            />
          </Card>
        </Col>
      </Row>

      <Card v-if="scorecard" :bordered="false" title="最新真实评分卡">
        <template #extra>
          <Space>
            <Tag :color="assessmentMeta(scorecard.assessment).color">
              {{ assessmentMeta(scorecard.assessment).label }}
            </Tag>
            <Tag>v{{ scorecard.scorecardVersion }}</Tag>
          </Space>
        </template>
        <Row :gutter="[16, 16]" class="mb-4">
          <Col :xs="24" :md="6">
            <Progress
              type="circle"
              :percent="Math.round(scorecard.overallBps / 100)"
              :format="() => formatPercent(scorecard.overallBps)"
            />
          </Col>
          <Col :xs="24" :md="18">
            <Descriptions :column="2" bordered size="small">
              <DescriptionsItem label="供应商">
                {{ scorecard.supplierName || scorecard.supplierId }}
              </DescriptionsItem>
              <DescriptionsItem label="评分周期">
                {{ scorecard.periodStart }} 至 {{ scorecard.periodEnd }}
              </DescriptionsItem>
              <DescriptionsItem label="OTIF">
                {{ formatPercent(scorecard.otifBps) }}
              </DescriptionsItem>
              <DescriptionsItem label="质量合格率">
                {{ formatPercent(scorecard.qualityBps) }}
              </DescriptionsItem>
              <DescriptionsItem label="产能达成">
                {{ formatPercent(scorecard.capacityBps) }}
              </DescriptionsItem>
              <DescriptionsItem label="CAPA 有效性">
                {{ formatPercent(scorecard.capaBps) }}
              </DescriptionsItem>
              <DescriptionsItem label="生成时间" :span="2">
                {{ scorecard.generatedAt }}
              </DescriptionsItem>
            </Descriptions>
          </Col>
        </Row>
        <Alert
          type="info"
          show-icon
          message="评分卡是观测结论，不是限制或恢复授权"
          description="任何限单、处罚或恢复都必须冻结评分版本，并经过采购、质量和经营负责人独立审批。"
        />
      </Card>
      <Empty v-else description="当前供应商尚无已生成的真实评分卡" />
    </template>
  </Page>
</template>
