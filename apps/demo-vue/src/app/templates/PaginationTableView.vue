<script lang="ts" setup>
import { computed, ref, reactive, watch, nextTick } from 'vue';
import useLoading from '@/app/hooks/loading';
import { queryPolicyList } from '@/app/api/list';
import type { PolicyRecord, PolicyParams } from '@/app/api/list';
import type { Pagination } from '@/app/types/global';
import type { SelectOptionData } from '@arco-design/web-vue/es/select/interface';
import type { TableColumnData } from '@arco-design/web-vue/es/table/interface';
import cloneDeep from 'lodash/cloneDeep';
// noinspection TypeScriptCheckImport,ES6UnusedImports
import {
  confee,
  type Pagination as ConfeePagination,
  type PaginationOption,
} from '@sia-fl/convite-dev';

confee.preTpl;
const currentMod = (global as any).currentMod
  .replace('@sia-fl/route-', '')
  .replace('.vue', '');

const [mainPageCode, paginationCode] = currentMod.split('-');

let confeePagination: ConfeePagination = null as unknown as ConfeePagination;
for (const pagination_ of confee.paginations) {
  if (
    pagination_.groupCode === mainPageCode &&
    pagination_.code === paginationCode
  ) {
    confeePagination = pagination_;
    break;
  }
}

const confeeTable = confee.tables.find(
  (item) => item.code === confeePagination.projectTableCode
);
const confeeTableColumns = confee.tableColumns.filter(
  (item) => item.projectTableCode === confeeTable?.code
);

const paginationOption = confee.paginationOptions.find(
  (item) => item.name === '搜索页面'
) as PaginationOption;

const showInSearchPageOption = paginationOption.attr.find(
  (item) => item.label === '展示在搜索页'
);
const searchConditionOption = paginationOption.attr.find(
  (item) => item.label === '搜索条件'
);

const pageColumns = confeePagination.data
  .filter(({ option: paginationDataOption }) =>
    paginationDataOption
      .filter(
        ({ code: paginationDataOptionCode }) =>
          paginationDataOptionCode === showInSearchPageOption?.id
      )
      .find(
        ({ value: paginationDataOptionValue }) =>
          paginationDataOptionValue === true
      )
  )
  .sort((a, b) => a.sort - b.sort)
  .map((item) => {
    const [_, columnCode] = item.tableColumnCode.split('.');
    const tableColumn = confeeTableColumns.find(
      (tableColumn) => tableColumn.code === columnCode
    );

    return {
      columnCode: tableColumn?.code as string,
      label: tableColumn?.name as string,
    };
  });
const searchConditionColumns = confeePagination.data
  .filter(({ option: paginationDataOption }) =>
    paginationDataOption
      .filter(
        ({ code: paginationDataOptionCode }) =>
          paginationDataOptionCode === showInSearchPageOption?.id
      )
      .find(({ value: paginationDataOptionValue }) =>
        Boolean(paginationDataOptionValue)
      )
  )
  .sort((a, b) => a.sort - b.sort)
  .map((item) => {
    const [_, columnCode] = item.tableColumnCode.split('.');
    const tableColumn = confeeTableColumns.find(
      (tableColumn) => tableColumn.code === columnCode
    );

    return {
      columnCode: tableColumn?.code as string,
      label: tableColumn?.name as string,
    };
  });

confee.preTplEnd;

type SizeProps = 'mini' | 'small' | 'medium' | 'large';
type Column = TableColumnData & { checked?: true };

const generateFormModel = () => {
  return {
    number: '',
    name: '',
    contentType: '',
    filterType: '',
    createdTime: [],
    status: '',
  };
};
const { loading, setLoading } = useLoading(true);
const renderData = ref<PolicyRecord[]>([]);
const formModel = ref(generateFormModel());
const cloneColumns = ref<Column[]>([]);
const showColumns = ref<Column[]>([]);

const size = ref<SizeProps>('medium');

const basePagination: Pagination = {
  current: 1,
  pageSize: 20,
};
const pagination = reactive({
  ...basePagination,
});
const densityList = computed(() => [
  {
    name: 'searchTable.size.mini',
    value: 'mini',
  },
  {
    name: 'searchTable.size.small',
    value: 'small',
  },
  {
    name: 'searchTable.size.medium',
    value: 'medium',
  },
  {
    name: 'searchTable.size.large',
    value: 'large',
  },
]);
const columns = [
  confee.tpl(`
  <%
  for (const i in pageColumns) {
    const column = pageColumns[i]
  %>
    {
      title: '<%= column.label %>',
      dataIndex: '<%= column.columnCode %>',
    }<% if (i < pageColumns.length - 1) { %>,<% } %>
  <% } %>
  tplEnd`),
];
const contentTypeOptions = computed<SelectOptionData[]>(() => [
  {
    label: 'searchTable.form.contentType.img',
    value: 'img',
  },
  {
    label: 'searchTable.form.contentType.horizontalVideo',
    value: 'horizontalVideo',
  },
  {
    label: 'searchTable.form.contentType.verticalVideo',
    value: 'verticalVideo',
  },
]);
const filterTypeOptions = computed<SelectOptionData[]>(() => [
  {
    label: 'searchTable.form.filterType.artificial',
    value: 'artificial',
  },
  {
    label: 'searchTable.form.filterType.rules',
    value: 'rules',
  },
]);
const statusOptions = computed<SelectOptionData[]>(() => [
  {
    label: 'searchTable.form.status.online',
    value: 'online',
  },
  {
    label: 'searchTable.form.status.offline',
    value: 'offline',
  },
]);
const fetchData = async (
  params: PolicyParams = { current: 1, pageSize: 20 }
) => {
  setLoading(true);
  try {
    // const { data } = await queryPolicyList(params);
    // renderData.value = data.list;
    // pagination.current = params.current;
    // pagination.total = data.total;
  } catch (err) {
    // you can report use errorHandler or other
  } finally {
    setLoading(false);
  }
};

const search = () => {
  fetchData({
    ...basePagination,
    ...formModel.value,
  } as unknown as PolicyParams);
};
const onPageChange = (current: number) => {
  fetchData({ ...basePagination, current });
};

fetchData();
const reset = () => {
  formModel.value = generateFormModel();
};

const handleSelectDensity = (
  val: string | number | Record<string, any> | undefined,
  e: Event
) => {
  size.value = val as SizeProps;
};

const handleChange = (
  checked: boolean | (string | boolean | number)[],
  column: Column,
  index: number
) => {
  if (!checked) {
    cloneColumns.value = showColumns.value.filter(
      (item) => item.dataIndex !== column.dataIndex
    );
  } else {
    cloneColumns.value.splice(index, 0, column);
  }
};

const exchangeArray = <T extends Array<any>>(
  array: T,
  beforeIdx: number,
  newIdx: number,
  isDeep = false
): T => {
  const newArray = isDeep ? cloneDeep(array) : array;
  if (beforeIdx > -1 && newIdx > -1) {
    // 先替换后面的，然后拿到替换的结果替换前面的
    newArray.splice(
      beforeIdx,
      1,
      newArray.splice(newIdx, 1, newArray[beforeIdx]).pop()
    );
  }
  return newArray;
};

const popupVisibleChange = (val: boolean) => {
  if (val) {
    nextTick(() => {
      const el = document.getElementById('tableSetting') as HTMLElement;
    });
  }
};

// watch(
//   () => columns.value,
//   (val) => {
//     cloneColumns.value = cloneDeep(val);
//     cloneColumns.value.forEach((item, index) => {
//       item.checked = true;
//     });
//     showColumns.value = cloneDeep(cloneColumns.value);
//   },
//   { deep: true, immediate: true }
// );
</script>

<script lang="ts">
export default {
  name: 'SearchTable',
};
</script>

<template>
  <div class="container">
    <Breadcrumb :items="['menu.list', 'menu.list.searchTable']" />
    <a-card class="general-card" title="搜索表格">
      <a-row>
        <a-col :flex="1">
          <a-form
            :model="formModel"
            :label-col-props="{ span: 6 }"
            :wrapper-col-props="{ span: 18 }"
            label-align="left"
          >
            <a-row :gutter="16">
              <% for (const searchConditionColumn of searchConditionColumns) {
              %>
              <a-col :span="8">
                <a-form-item
                  field="number"
                  label="<%- searchConditionColumn.label %>"
                >
                  <a-input
                    v-model="formModel.number"
                    placeholder="请输入 <%- searchConditionColumn.label %>"
                  />
                </a-form-item>
              </a-col>
              <% } %>
            </a-row>
          </a-form>
        </a-col>
        <a-divider style="height: 84px" direction="vertical" />
        <a-col :flex="'86px'" style="text-align: right">
          <a-space direction="vertical" :size="18">
            <a-button type="primary" @click="search">
              <template #icon>
                <icon-search />
              </template>
              查询
            </a-button>
            <a-button @click="reset">
              <template #icon>
                <icon-refresh />
              </template>
              重置
            </a-button>
          </a-space>
        </a-col>
      </a-row>
      <a-divider style="margin-top: 0" />
      <a-row style="margin-bottom: 16px">
        <a-col :span="12">
          <a-space>
            <a-button type="primary">
              <template #icon>
                <icon-plus />
              </template>
              创建
            </a-button>
            <a-upload action="/">
              <template #upload-button>
                <a-button> 导入 </a-button>
              </template>
            </a-upload>
          </a-space>
        </a-col>
        <a-col
          :span="12"
          style="display: flex; align-items: center; justify-content: end"
        >
          <a-tooltip :content="'searchTable.actions.refresh'">
            <div class="action-icon" @click="search">
              <icon-refresh size="18" />
            </div>
          </a-tooltip>
          <a-dropdown @select="handleSelectDensity">
            <a-tooltip :content="'searchTable.actions.density'">
              <div class="action-icon"><icon-line-height size="18" /></div>
            </a-tooltip>
            <template #content>
              <a-doption
                v-for="item in densityList"
                :key="item.value"
                :value="item.value"
                :class="{ active: item.value === size }"
              >
                <span>{{ item.name }}</span>
              </a-doption>
            </template>
          </a-dropdown>
          <a-tooltip :content="'searchTable.actions.columnSetting'">
            <a-popover
              trigger="click"
              position="bl"
              @popup-visible-change="popupVisibleChange"
            >
              <div class="action-icon"><icon-settings size="18" /></div>
              <template #content>
                <div id="tableSetting">
                  <div
                    v-for="(item, index) in showColumns"
                    :key="item.dataIndex"
                    class="setting"
                  >
                    <div style="margin-right: 4px; cursor: move">
                      <icon-drag-arrow />
                    </div>
                    <div>
                      <a-checkbox
                        v-model="item.checked"
                        @change="
                          handleChange($event, item as TableColumnData, index)
                        "
                      >
                      </a-checkbox>
                    </div>
                    <div class="title">
                      {{ item.title === '#' ? '序列号' : item.title }}
                    </div>
                  </div>
                </div>
              </template>
            </a-popover>
          </a-tooltip>
        </a-col>
      </a-row>
      <a-table
        row-key="id"
        :loading="loading"
        :pagination="pagination"
        :columns="columns"
        :data="renderData"
        :bordered="false"
        :size="size"
        @page-change="onPageChange"
      >
        <template #index="{ rowIndex }">
          {{ rowIndex + 1 + (pagination.current - 1) * pagination.pageSize }}
        </template>
        <template #contentType="{ record }">
          <a-space>
            <a-avatar
              v-if="record.contentType === 'img'"
              :size="16"
              shape="square"
            >
              <img
                alt="avatar"
                src="//p3-armor.byteimg.com/tos-cn-i-49unhts6dw/581b17753093199839f2e327e726b157.svg~tplv-49unhts6dw-image.image"
              />
            </a-avatar>
            <a-avatar
              v-else-if="record.contentType === 'horizontalVideo'"
              :size="16"
              shape="square"
            >
              <img
                alt="avatar"
                src="//p3-armor.byteimg.com/tos-cn-i-49unhts6dw/77721e365eb2ab786c889682cbc721c1.svg~tplv-49unhts6dw-image.image"
              />
            </a-avatar>
            <a-avatar v-else :size="16" shape="square">
              <img
                alt="avatar"
                src="//p3-armor.byteimg.com/tos-cn-i-49unhts6dw/ea8b09190046da0ea7e070d83c5d1731.svg~tplv-49unhts6dw-image.image"
              />
            </a-avatar>
            {{ `searchTable.form.contentType.${record.contentType}` }}
          </a-space>
        </template>
        <template #filterType="{ record }">
          {{ `searchTable.form.filterType.${record.filterType}` }}
        </template>
        <template #status="{ record }">
          <span v-if="record.status === 'offline'" class="circle"></span>
          <span v-else class="circle pass"></span>
          {{ `searchTable.form.status.${record.status}` }}
        </template>
        <template #operations>
          <a-button v-permission="['admin']" type="text" size="small">
            {{ 'searchTable.columns.operations.view' }}
          </a-button>
        </template>
      </a-table>
    </a-card>
  </div>
</template>

<style scoped lang="less">
.container {
}
:deep(.arco-table-th) {
  &:last-child {
    .arco-table-th-item-title {
      margin-left: 16px;
    }
  }
}
.action-icon {
  margin-left: 12px;
  cursor: pointer;
}
.active {
  color: #0960bd;
  background-color: #e3f4fc;
}
.setting {
  display: flex;
  align-items: center;
  width: 200px;
  .title {
    margin-left: 12px;
    cursor: pointer;
  }
}
</style>
