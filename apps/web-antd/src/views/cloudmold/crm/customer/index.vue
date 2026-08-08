<script lang="ts" setup>
import EntityPage from '../shared/entity-page.vue';

defineOptions({ name: 'CloudMoldCrmCustomer' });
</script>

<template>
  <EntityPage page-key="customer" finance-summary-scope="customer" />
</template>
