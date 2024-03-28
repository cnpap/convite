/* eslint-disable */
export interface ConfeeResponse {
  success: boolean;
  data: ConfeeData;
}

export interface Template {
  /**
   * 分页选项名称
   */
  paginationOptionName: string;
  /**
   * 对应的模板文件路径
   */
  pathname?: string;
  /**
   * 模板文件内容，一般应该是我们通过 pathname 读取以后回写，当然你手写也 ok
   */
  content?: string;
}

export interface PaginationDetail {
  /**
   * 数据是通过与主页 code 和 分页 code 关联产生
   */
  paginationOfMainPageCodes: string[];
  modNameOfMainPage: string;
  /**
   * 所关联的模板路径，当模板发送变化时，如果当前 url 所关联的主页面包含我这个分页，则我会通过自身配置重新加载
   */
  template: Template;
  /**
   * 关联对象
   */
  mainPage: MainPage;
  pagination: Pagination;
  paginationFields: PaginationField[];
  paginationOption: PaginationOption;
}

export interface ConfeeComputed {
  /**
   * 明确当路由更新了以后，哪些模块需要热更新
   */
  hotModuleByRoute: Record<string, PaginationDetail[]>;
}

export interface ConfeeData {
  preTpl: () => void;
  preTplEnd: () => void;
  tpl: (code: string) => any;
  tplEnd: () => void;
  project: Project[];
  enums: Enum[];
  enumItems: EnumItem[];
  dataTypes: DataType[];
  uis: Ui[];
  tables: Table[];
  tableColumns: TableColumn[];
  mainPages: MainPage[];
  paginationOptions: PaginationOption[];
  paginationFields: PaginationField[];
  paginations: Pagination[];
  computed: ConfeeComputed;
}

export interface Project {
  id: string;
  name: string;
}

export interface Enum {
  id: string;
  name: string;
  code: string;
}

export interface EnumItem {
  id: string;
  name: string;
  code: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
}

export interface DataType {
  id: string;
  name: string;
  data: DataTypeData;
}

export interface DataTypeData {
  translate: Translate;
}

export interface Translate {
  typescript: string;
}

export interface Ui {
  id: string;
  code: string;
  cate: string;
}

export interface Table {
  id: string;
  code: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  attr: any;
}

export interface TableColumn {
  id: string;
  name: string;
  code: string;
  primaryKey: boolean;
  index: boolean;
  dbType: string;
  dbLength?: string;
  dbDefault?: string;
  dbNotnull: boolean;
  dbUnsigned: boolean;
  dbAutoIncrement: boolean;
  dbComment?: string;
  desc?: string;
  attr: Attr;
  createdAt: string;
  updatedAt: string;
  projectTableCode: string;
  projectFieldId: any;
  projectId: string;
  projectEnumCode: any;
  projectUiCode: any;
}

export interface Attr {
  name?: string;
  type?: Type;
  fixed?: boolean;
  scale?: number;
  length?: number;
  comment?: string;
  default: any;
  notnull?: boolean;
  unsigned?: boolean;
  precision?: number;
  autoincrement?: boolean;
  columnDefinition: any;
}

export interface Type {}

export interface MainPage {
  id: string;
  name: string;
  code: string;
  data: MainPageData;
}

export interface MainPageData {
  menu?: Menu;
}

export interface Menu {
  code: string;
  sort: number;
  parentGroup: ParentGroup[];
  paginationOptions: Record<
    string,
    {
      container: 'page' | 'modal';
    }
  >[];
  paginationPathnameDict: PaginationPathnameDict;
}

export interface ParentGroup {
  icon?: string;
  sort?: number;
  label?: string;
  value?: string;
  ['icon-open']?: string;
}

export interface PaginationPathnameDict {
  [key: string]: string;
}

export interface PaginationOption {
  id: string;
  name: string;
  attr: PaginationOptionAttr[];
  relationAttr: PaginationOptionAttr[];
}

export interface PaginationOptionAttr {
  id: string;
  '#id'?: string;
  code: string;
  label: string;
  props: string;
}

export interface Pagination {
  id: string;
  code: string;
  data: PaginationData[];
  groupCode: string;
  projectTableCode: string;
  projectPaginationOptionId: string;
}

export interface PaginationData {
  option: PaginationDataOption[];
  tableColumnCode: string;
  sort: number;
  dbType: string;
}

export interface PaginationDataOption {
  code: string;
  value: any;
}

export interface PaginationField {
  id: string;
  projectId: string;
  projectPaginationCode: string;
  prefix: string;
  projectTableRelationId: string;
  data: PaginationFieldData[];
  projectTableCode: string;
  relationData: any;
}

export interface PaginationFieldData {
  dbType: string;
  option: PaginationFieldDataOption[];
  relationTypes: string[];
  tableColumnCode: string;
  sort?: number;
  package: any;
}

export interface PaginationFieldDataOption {
  code: string;
  value: any;
}
