<template>
  <a-table :columns="columns" :data="data" />
</template>

<script>
import { reactive } from 'vue';
import { confee } from '@sia-fl/convite-dev';

confee.preTpl();

const paginationCode = ':paginationCode';

const pagination = confee.paginations.find((p) => p.code === paginationCode);
const paginationFields = confee.paginationFields.filter(
  (paginationField) => (paginationField.projectPaginationCode = paginationCode)
);

confee.preTplEnd();

export default {
  setup() {
    const columns = [
      {
        title: 'Name',
        dataIndex: 'name',
      },
      {
        title: 'Salary',
        dataIndex: 'salary',
      },
      {
        title: 'Address',
        dataIndex: 'address',
      },
      {
        title: 'Email',
        dataIndex: 'email',
      },
    ];
    const data = reactive([
      {
        key: '1',
        name: 'Jane Doe',
        salary: 23000,
        address: '32 Park Road, London',
        email: 'jane.doe@example.com',
      },
      {
        key: '2',
        name: 'Alisa Ross',
        salary: 25000,
        address: '35 Park Road, London',
        email: 'alisa.ross@example.com',
      },
      {
        key: '3',
        name: 'Kevin Sandra',
        salary: 22000,
        address: '31 Park Road, London',
        email: 'kevin.sandra@example.com',
      },
      {
        key: '4',
        name: 'Ed Hellen',
        salary: 17000,
        address: '42 Park Road, London',
        email: 'ed.hellen@example.com',
      },
      {
        key: '5',
        name: 'William Smith',
        salary: 27000,
        address: '62 Park Road, London',
        email: 'william.smith@example.com',
      },
    ]);

    return {
      columns,
      data,
    };
  },
};
</script>
