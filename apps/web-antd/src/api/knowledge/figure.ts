import type { Recordable } from '@vben/types';

import { requestClient } from '#/api/request';

/**
 * 知识库 - 人物管理接口
 * 后端接口前缀：/api/v1/knowledge/figures
 * 接口文档：http://showdoc.canliang.wang/web/#/669266166/297761767 等
 *
 * 注意：列表接口返回 Laravel 分页器结构，字段为 snake_case（birth_year/created_at 等）；
 * 详情/新建接口返回值字段为 camelCase（birthYear/createdAt 等）。
 * 表格以列表数据为准，故 Figure 类型采用 snake_case；提交体同样采用 snake_case。
 */
export namespace FigureApi {
  /** 状态：enabled=启用 disabled=禁用 */
  export type FigureStatus = 'disabled' | 'enabled';

  /** 列表接口返回的人物记录（snake_case，直接来自数据库） */
  export interface Figure {
    /** 扩展字段（对象或 null） */
    attributes: null | Record<string, any>;
    /** 别名/字/号 */
    aliases: string[];
    /** 生年 */
    birth_year?: null | number;
    /** 籍贯/出生地 */
    birth_place?: null | string;
    /** 唯一编码（全表唯一） */
    code: string;
    /** 创建时间 */
    created_at?: null | string;
    /** 删除时间（软删除） */
    deleted_at?: null | string;
    /** 简介/传记 */
    description?: null | string;
    /** 卒年（不得早于 birth_year） */
    death_year?: null | number;
    /** 朝代 */
    dynasty?: null | string;
    id: number;
    /** 姓名 */
    name: string;
    /** 职业/身份 */
    occupation?: null | string;
    /** 状态 */
    status: FigureStatus;
    /** 标签 */
    tags: string[];
    /** 更新时间 */
    updated_at?: null | string;
  }

  /** 详情接口返回的人物记录（camelCase，经过资源转换） */
  export interface FigureDetail {
    attributes: null | Record<string, any>;
    aliases: string[];
    birthPlace?: null | string;
    birthYear?: null | number;
    code: string;
    createdAt?: null | string;
    deathYear?: null | number;
    description?: null | string;
    dynasty?: null | string;
    id: number;
    name: string;
    occupation?: null | string;
    status: FigureStatus;
    tags: string[];
    updatedAt?: null | string;
  }

  /** 新建/修改人物请求体（snake_case） */
  export interface FigurePayload {
    aliases?: string[];
    attributes?: null | Record<string, any>;
    birth_place?: null | string;
    birth_year?: null | number;
    code: string;
    death_year?: null | number;
    description?: null | string;
    dynasty?: null | string;
    name: string;
    occupation?: null | string;
    status?: FigureStatus;
    tags?: string[];
  }

  /** 列表查询参数 */
  export interface FigureListParams extends Recordable<any> {
    /** 按 code 模糊匹配 */
    code?: string;
    /** 按 dynasty 精确匹配 */
    dynasty?: string;
    /** 关键字：在 name/description/code 上模糊匹配 */
    keyword?: string;
    /** 姓名：模糊匹配 */
    name?: string;
    /** 页码 */
    page?: number;
    /** 每页条数（默认 15，上限 100） */
    per_page?: number;
    /** 按 status 精确匹配（enabled/disabled） */
    status?: FigureStatus;
  }

  /** vxe-grid 代理所需的结构 */
  export interface FigurePageResult {
    items: Figure[];
    total: number;
  }

  /** Excel 批量导入结果汇总 */
  export interface ImportResult {
    created: number;
    errors: Array<
      | string
      | {
          [key: string]: any;
          message?: string;
          row?: number;
        }
    >;
    failed: number;
    skipped: number;
    updated: number;
  }
}

/**
 * 获取人物分页列表
 * 后端接口：GET /api/v1/knowledge/figures
 * 返回 Laravel 分页器，此处转换为 vxe-grid 所需的 { items, total } 结构。
 */
export async function getFigureList(
  params: FigureApi.FigureListParams,
): Promise<FigureApi.FigurePageResult> {
  const pageData = await requestClient.get<{
    data: FigureApi.Figure[];
    total: number;
  }>('/v1/knowledge/figures', { params });
  return {
    items: pageData.data ?? [],
    total: pageData.total ?? 0,
  };
}

/**
 * 获取人物详情
 * 后端接口：GET /api/v1/knowledge/figures/{id}
 */
export async function getFigureDetail(
  id: number,
): Promise<FigureApi.FigureDetail> {
  return requestClient.get<FigureApi.FigureDetail>(
    `/v1/knowledge/figures/${id}`,
  );
}

/**
 * 新建人物
 * 后端接口：POST /api/v1/knowledge/figures
 */
export async function createFigure(
  data: FigureApi.FigurePayload,
): Promise<FigureApi.FigureDetail> {
  return requestClient.post<FigureApi.FigureDetail>(
    '/v1/knowledge/figures',
    data,
  );
}

/**
 * 修改人物
 * 后端接口：PUT /api/v1/knowledge/figures/{id}
 */
export async function updateFigure(
  id: number,
  data: FigureApi.FigurePayload,
): Promise<FigureApi.FigureDetail> {
  return requestClient.put<FigureApi.FigureDetail>(
    `/v1/knowledge/figures/${id}`,
    data,
  );
}

/**
 * 删除人物（软删除）
 * 后端接口：DELETE /api/v1/knowledge/figures/{id}
 */
export async function deleteFigure(id: number) {
  return requestClient.delete(`/v1/knowledge/figures/${id}`);
}

/**
 * 下载人物导入模板（.xlsx）
 * 后端接口：GET /api/v1/knowledge/figures/import-template
 * @returns Blob（.xlsx 文件）
 */
export async function downloadFigureImportTemplate(): Promise<Blob> {
  return requestClient.download<Blob>('/v1/knowledge/figures/import-template');
}

/**
 * Excel 批量导入人物
 * 后端接口：POST /api/v1/knowledge/figures/import（multipart/form-data，字段名 file）
 * @param file Excel 文件（.xlsx/.xls/.csv）
 * @returns 导入汇总：created/updated/skipped/failed 及失败详情
 */
export async function importFigures(
  file: File,
): Promise<FigureApi.ImportResult> {
  return requestClient.upload<FigureApi.ImportResult>(
    '/v1/knowledge/figures/import',
    { file },
  );
}
