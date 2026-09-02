export type StatsRange = "last_7_days" | "all_time"

export interface WakaResponse {
  data?: StatsData
  errors?: string[]
}

export interface StatsData {
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
