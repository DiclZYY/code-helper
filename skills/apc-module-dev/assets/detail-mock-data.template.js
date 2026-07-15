// =============================================================================
// apc 详情补充区块静态 Mock 数据（detailMockData.js 模板）
// =============================================================================
// 使用说明：
//   1. 文件位置：backend/src/views/<module>/detailMockData.js（与 detail.vue 同目录）
//   2. 导出纯函数 get<Module>DetailMock(recordId)，入参为当前主记录 id
//   3. 按 id 分支：使用 Map / 对象字面量对少量 id 配置不同演示数据
//   4. 未知 id 返回深拷贝的默认结构（避免多实例共享引用被改坏）
//   5. 接口数据赋给 data；Mock 仅赋给 detailMock，两者职责分离
//   6. detail.vue 的 getDetail() 内根据当前 id 重新取 Mock
//   7. 金额字段存原始数值（如分或元），展示时统一走 money.js 的 formatMoney
// =============================================================================

/**
 * 默认结构：所有未指定 id 的记录都使用此结构（深拷贝后返回）
 * 金额字段约定：存原始数值（如元），展示层用 formatMoney / formatMoneyCompact
 */
const defaultMock = {
  // 统计卡片（金额：原始数值）
  statistics: {
    totalAmount: 0,
    paidAmount: 0,
    pendingAmount: 0
  },

  // 子表（如有）
  subTable: [],

  // 流程概况（如有）
  progress: []
}

/**
 * 按 id 配置的演示数据
 * 仅配置少量关键 id 的差异化数据；其余 id 走默认结构
 */
const idSpecificMock = new Map([
  // 示例：id 为 1 的演示数据
  // [
  //   1,
  //   {
  //     statistics: { totalAmount: 1234567, paidAmount: 800000, pendingAmount: 434567 },
  //     subTable: [
  //       { id: 101, name: '示例子项 A', amount: 500000 },
  //       { id: 102, name: '示例子项 B', amount: 300000 }
  //     ],
  //     progress: [
  //       { step: '创建', time: '2026-01-01 10:00:00' },
  //       { step: '审核', time: '2026-01-02 14:30:00' }
  //     ]
  //   }
  // ]
])

/**
 * 获取详情补充区块的 Mock 数据
 * @param {number|string} recordId 主记录 id
 * @returns {object} 深拷贝后的 Mock 数据
 */
export function getModuleDetailMock(recordId) {
  const source = idSpecificMock.get(recordId) || defaultMock
  // 深拷贝避免多实例共享引用被改坏
  return JSON.parse(JSON.stringify(source))
}