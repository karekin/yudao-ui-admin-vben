<script lang="ts" setup>
import { useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';

import { Card, Col, Row } from 'ant-design-vue';

import EvidenceAlert from '../shared/evidence-alert.vue';

defineOptions({ name: 'CloudMoldCommerce' });

const router = useRouter();

/**
 * 交易与履约领域工作台：原 5 实体页签已拆分为独立只读子页。
 * 此处只做领域导航入口，不再把 5 个实体的完整表格堆进页签，
 * 避免与子页数据重复；后端菜单完成迁移后本聚合页可下线。
 */
const sections = [
  {
    desc: '规范 Listing、报价与渠道发布资格',
    key: 'listing',
    path: '/cloudmold/listing',
    title: '渠道刊登',
  },
  {
    desc: '规范 Order 及与支付、履约、售后的跨域关联',
    key: 'order',
    path: '/cloudmold/order',
    title: '订单',
  },
  {
    desc: '规范 Payment（当前为 INTERNAL_TEST 首切片）',
    key: 'payment',
    path: '/cloudmold/payment',
    title: '支付',
  },
  {
    desc: '规范 Fulfillment 与首切片发运事实',
    key: 'fulfillment',
    path: '/cloudmold/fulfillment',
    title: '履约',
  },
  {
    desc: '规范 AfterSale、退货与退款',
    key: 'aftersale',
    path: '/cloudmold/aftersale',
    title: '售后',
  },
] as const;

function go(path: string) {
  router.push(path);
}
</script>

<template>
  <Page auto-content-height>
    <EvidenceAlert
      message="CloudMold 交易与履约工作台"
      description="本工作台为交易与履约领域入口；Listing / Order / Payment / Fulfillment / AfterSale 已拆分为独立只读页面。请从下方卡片或左侧菜单进入，所有数据只读取 CloudMold 规范表，不读取 yudao Mall Trade、Pay、ERP 或 WMS 业务表。"
    />

    <Row :gutter="16">
      <Col
        v-for="section in sections"
        :key="section.key"
        :md="8"
        :sm="12"
        :xs="24"
        class="mb-4"
      >
        <Card
          class="cursor-pointer transition-shadow hover:shadow-md"
          :title="section.title"
          @click="go(section.path)"
        >
          <div class="text-muted-foreground">{{ section.desc }}</div>
        </Card>
      </Col>
    </Row>
  </Page>
</template>
