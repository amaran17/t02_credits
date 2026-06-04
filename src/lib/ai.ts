export interface AIFunctionResponse {
  success: boolean
  data?: ParsedWorkRecord
  error?: string
}

export interface ParsedWorkRecord {
  project_name?: string
  customer_name?: string
  industry?: string
  stage?: string
  customer_manager?: string
  support_role?: string
  support_units?: string[]
  work_content?: string
  work_date?: string
  work_categories?: string[]
}

export async function parseWorkRecord(
  text: string,
  config: {
    api_key: string
    base_url: string
    model_id: string
  }
): Promise<AIFunctionResponse> {
  const systemPrompt = `你是一个工作记录解析助手。用户会输入一段自然语言描述工作内容，你需要从中提取以下字段：
- project_name: 项目/商机名称
- customer_name: 客户名称（可能以简称形式出现）
- industry: 行业分类（文旅/住建/传媒/体育）
- stage: 进展阶段（方案阶段/招投标过程/已签合同/项目暂停/项目关闭）
- customer_manager: 客户经理
- support_role: 支撑角色（一线支撑/二线支撑）
- support_units: 调用支撑单位（数智北分/云北分/云中台/AI团队/专业公司，可多选，或填写"不涉及"/"无"）
- work_content: 工作事项描述
- work_date: 工作日期（格式：YYYY-MM-DD）
- work_categories: 工作分类（可多选：内部部门需求对接/生态交流/简单方案/复杂方案/日常方案汇报/客户简单交流/招投标/流程支撑/方案审核/培训/内部会议/高层汇报/展厅讲解）
请以JSON格式返回提取到的信息。`

  try {
    const response = await fetch(`${config.base_url}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.api_key}`,
      },
      body: JSON.stringify({
        model: config.model_id,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: text },
        ],
        temperature: 0.1,
      }),
    })

    if (!response.ok) {
      return { success: false, error: `API调用失败: ${response.status}` }
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content

    if (!content) {
      return { success: false, error: '无法解析工作记录' }
    }

    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return { success: false, error: '解析结果格式错误' }
    }

    const parsed = JSON.parse(jsonMatch[0]) as ParsedWorkRecord
    return { success: true, data: parsed }
  } catch (error) {
    return { success: false, error: `解析失败: ${error}` }
  }
}

export async function testModelConnection(config: {
  api_key: string
  base_url: string
  model_id: string
}): Promise<boolean> {
  try {
    const response = await fetch(`${config.base_url}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.api_key}`,
      },
      body: JSON.stringify({
        model: config.model_id,
        messages: [{ role: 'user', content: 'Hi' }],
        max_tokens: 10,
      }),
    })
    return response.ok
  } catch {
    return false
  }
}