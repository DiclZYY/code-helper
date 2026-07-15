<!--
  =============================================================================
  apc 表单一键模拟数据按钮（create.vue 模板片段）
  =============================================================================
  使用说明：
    1. 复制底部按钮组到 create.vue（非弹窗模式）
    2. 复制 methods 中的 fillMockData 方法
    3. 按当前模块的实际字段调整 mockData 对象
    4. 字典字段：从 this.dict['xxx'] 随机取值；字典未就绪时使用 fallback
    5. 编辑模式：若 form.id 存在，merge 时保留 id 避免误当新增
    6. 完成后 $nextTick 调用 clearValidate() 避免残留红框
    7. 敏感信息必须虚构：禁止真实身份证 / 手机号 / 银行卡
  =============================================================================
-->

<template>
  <!-- ... 表单内容 ... -->

  <!-- 底部操作栏：与提交并列，仅非弹窗模式显示 -->
  <div v-if="!dialog" class="form-footer">
    <el-button @click="closeCurrentTab(null, { params: ... })">返回</el-button>
    <el-button type="primary" :loading="submitting" @click="submit">保存</el-button>
    <el-button plain :disabled="submitting" @click="fillMockData">添加模拟数据</el-button>
  </div>
</template>

<script>
export default {
  data() {
    return {
      submitting: false,
      form: {
        // ... 实际字段
      }
    }
  },
  methods: {
    /**
     * 一键填充模拟数据
     * 满足校验：类型 / 长度 / 日期格式 / 日期逻辑
     * 字典字段：已加载时从 dict 随机取，未加载时用 fallback
     * 编辑模式：若 form.id 存在，merge 保留 id
     */
    fillMockData() {
      const id = this.form.id
      const now = new Date()
      const dateStr = now.toISOString().slice(0, 10)

      // 按业务调整：以下为通用骨架
      const mockData = {
        // === 基础信息 ===
        name: `模拟数据-${dateStr}`,
        code: `MOCK-${Date.now()}`,

        // === 时间节点（日期逻辑合理：结束 >= 开始） ===
        start_date: dateStr,
        end_date: dateStr,

        // === 字典字段（已加载时随机取值） ===
        status: this.dict?.status?.[0]?.value ?? 1,

        // === 区域（必须用 RegionSelector 选出来的编码，不要手输） ===
        // region: '110000',  // 北京（示例编码，须 config/region.json 中存在）

        // === 长文本（避免敏感信息） ===
        remark: `模拟数据生成 @ ${dateStr}`
      }

      // 编辑模式：保留 id，避免误当新增
      this.form = id ? { ...mockData, id } : { ...this.form, ...mockData }

      // 清除残留校验状态
      this.$nextTick(() => {
        this.$refs.form?.clearValidate()
      })
    },

    // ... 其他方法（submit / getDetail 等）
  }
}
</script>