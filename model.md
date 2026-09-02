# API 结构和上下文字段设计

## API 返回结构

```ts
interface WakaResponse {
  data?: StatsData
  errors?: string[]
}

interface StatsData {
  total_seconds: number
  total_seconds_including_other_language: number
  human_readable_total: string
  human_readable_total_including_other_language: string

  daily_average: number
  daily_average_including_other_language: number
  human_readable_daily_average: string
  human_readable_daily_average_including_other_language: string

  ai_additions: number
  ai_deletions: number
  human_additions: number
  human_deletions: number
  ai_model_line_changes: Record<string, number>
  ai_line_changes_total: number
  ai_model_costs: Record<string, number>
  ai_model_breakdown: AIModelBreakdown[]
  ai_model_total_cost: number
  ai_input_tokens: number
  ai_output_tokens: number
  ai_prompt_length_avg: number
  ai_prompt_length_avg_per_session: number
  ai_prompt_length_median_per_session: number
  ai_prompt_length_sum: number
  ai_prompt_events_total: number
  ai_prompt_events_avg_per_session: number
  ai_prompt_events_median_per_session: number
  ai_sessions: number

  categories: CategoryItem[]
  projects: ProjectItem[]
  languages: LanguageItem[]
  editors: EditorItem[]
  operating_systems: OperatingSystemItem[]
  dependencies: DependencyItem[]
  machines: MachineItem[]

  best_day: BestDay | null

  range: string
  human_readable_range: string
  start: string
  end: string
  timezone: string
  holidays: number
  days_including_holidays: number
  days_minus_holidays: number
  timeout: number
  writes_only: boolean
  created_at: string
  modified_at: string

  status: string
  is_up_to_date: boolean
  percent_calculated: number
  is_already_updating: boolean
  is_cached?: boolean
  is_stuck: boolean
  is_including_today: boolean

  is_coding_activity_visible: boolean
  is_language_usage_visible: boolean
  is_editor_usage_visible: boolean
  is_category_usage_visible: boolean
  is_os_usage_visible: boolean

  user_id: string
  username: string
}

interface BestDay {
  date: string
  text: string
  total_seconds: number
}

interface AIModelBreakdown {
  name: string
  lines: number
  cost: number
}

interface CommonItem {
  name: string
  total_seconds: number
  percent: number
  digital: string
  text: string
  hours: number
  minutes: number
}

interface CategoryItem extends CommonItem {}

interface LanguageItem extends CommonItem {
  seconds: number
}

interface OperatingSystemItem extends CommonItem {
  seconds: number
}

interface DependencyItem extends CommonItem {
  seconds: number
}

interface MachineItem extends CommonItem {
  seconds: number
  machine_name_id: string
}

interface AIItemFields {
  ai_additions: number
  ai_deletions: number
  human_additions: number
  human_deletions: number
  ai_model_line_changes: Record<string, number>
  ai_model_costs: Record<string, number>
  ai_model_breakdown: AIModelBreakdown[]
  ai_model_total_cost: number
  ai_input_tokens: number
  ai_output_tokens: number
  ai_prompt_length_avg: number
  ai_prompt_length_avg_per_session: number
  ai_prompt_length_median_per_session: number
  ai_prompt_length_sum: number
  ai_prompt_events_total: number
  ai_prompt_events_avg_per_session: number
  ai_prompt_events_median_per_session: number
  ai_sessions: number
}

interface ProjectItem extends CommonItem, AIItemFields {}

interface EditorItem extends CommonItem, AIItemFields {}
```

## 上下文字段设计

```ts
/**
 * @param {string} name - 显示名
 * @param {number} time - 总时长 (s)
 */
interface CommonData {
  name: string
  time: number
}

/**
 * @param {number} ai - AI 增/删行数
 * @param {number} human - 人工增/删行数
 * @param {number} total - 总行数 (ai + human)
 */
interface Edit {
  ai: number
  human: number
  total: number
}

/**
 * @param {Edit} addition - 增加行数
 * @param {Edit} deletion - 删除行数
 * @param {object} ai - AI 成本与 token
 * @param {number} ai.cost - 总花费 (USD)
 * @param {object} ai.token - token 用量
 * @param {number} ai.token.input - 输入 token
 * @param {number} ai.token.output - 输出 token
 * @param {number} ai.token.total - 总 token (input + output)
 */
interface CodingData {
  addition: Edit
  deletion: Edit
  ai: {
    cost: number
    token: {
      input: number
      output: number
      total: number
    }
  }
}

/**
 * @param {object} range - 时间范围
 * @param {string} range.start - 起点 (ISO 8601)
 * @param {string} range.end - 终点 (ISO 8601)
 * @param {number} range.days - 天数
 * @param {string} username - wakatime 用户名
 */
interface WakaData {
  range: {
    start: string
    end: string
    days: number
  }
  username: string
}

/**
 * @param {T | null} all - 全时段 (all_time), 拉取失败或无数据时为 null
 * @param {T | null} week - 最近一周 (last_7_days), 拉取失败或无数据时为 null
 */
interface Range<T> {
  all: T | null
  week: T | null
}

const waka: Range<CommonData & CodingData & WakaData> = {}
const categories: Range<Array<CommonData>> = {}
const projects: Range<Array<CommonData & CodingData>> = {}
const languages: Range<Array<CommonData>> = {}
const editors: Range<Array<CommonData & CodingData>> = {}
const oss: Range<Array<CommonData>> = {}
const dependencies: Range<Array<CommonData>> = {}
const machines: Range<Array<CommonData>> = {}
```
