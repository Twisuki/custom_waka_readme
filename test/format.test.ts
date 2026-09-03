import type { StatsData } from "@/data/schema"
import { describe, expect, it } from "vitest"
import { formatData } from "@/data/format"

function baseStats(overrides: Partial<StatsData> = {}): StatsData {
  return {
    total_seconds: 3600,
    total_seconds_including_other_language: 3600,
    human_readable_total: "1 hr",
    human_readable_total_including_other_language: "1 hr",
    daily_average: 0,
    daily_average_including_other_language: 0,
    human_readable_daily_average: "0 secs",
    human_readable_daily_average_including_other_language: "0 secs",
    ai_additions: 10,
    ai_deletions: 5,
    human_additions: 20,
    human_deletions: 15,
    ai_model_line_changes: {},
    ai_line_changes_total: 50,
    ai_model_costs: {},
    ai_model_breakdown: [],
    ai_model_total_cost: 0.5,
    ai_input_tokens: 1000,
    ai_output_tokens: 500,
    ai_prompt_length_avg: 100,
    ai_prompt_length_avg_per_session: 50,
    ai_prompt_length_median_per_session: 40,
    ai_prompt_length_sum: 500,
    ai_prompt_events_total: 10,
    ai_prompt_events_avg_per_session: 2,
    ai_prompt_events_median_per_session: 2,
    ai_sessions: 5,
    categories: [],
    projects: [],
    languages: [],
    editors: [],
    operating_systems: [],
    dependencies: [],
    machines: [],
    best_day: null,
    range: "last_7_days",
    human_readable_range: "Last 7 Days",
    start: "2024-01-01",
    end: "2024-01-07",
    timezone: "UTC",
    holidays: 0,
    days_including_holidays: 7,
    days_minus_holidays: 7,
    timeout: 0,
    writes_only: false,
    created_at: "2024-01-07T00:00:00Z",
    modified_at: "2024-01-07T00:00:00Z",
    status: "ok",
    is_up_to_date: true,
    percent_calculated: 100,
    is_already_updating: false,
    is_stuck: false,
    is_including_today: true,
    is_coding_activity_visible: true,
    is_language_usage_visible: true,
    is_editor_usage_visible: true,
    is_category_usage_visible: true,
    is_os_usage_visible: true,
    user_id: "u1",
    username: "test",
    ...overrides,
  }
}

describe("formatData", () => {
  it("全 null: 8 个 Range 字段均为 { all: null, week: null }", () => {
    const ctx = formatData(null, null)
    expect(ctx.waka.all).toBeNull()
    expect(ctx.waka.week).toBeNull()
    expect(ctx.languages.all).toBeNull()
    expect(ctx.languages.week).toBeNull()
    expect(ctx.projects.all).toBeNull()
    expect(ctx.editors.all).toBeNull()
    expect(ctx.categories.all).toBeNull()
    expect(ctx.oss.all).toBeNull()
    expect(ctx.dependencies.all).toBeNull()
    expect(ctx.machines.all).toBeNull()
  })

  it("all 有值, week null", () => {
    const ctx = formatData(baseStats(), null)
    expect(ctx.waka.all).not.toBeNull()
    expect(ctx.waka.week).toBeNull()
  })

  it("week 有值, all null", () => {
    const ctx = formatData(null, baseStats())
    expect(ctx.waka.all).toBeNull()
    expect(ctx.waka.week).not.toBeNull()
  })

  it("waka.time 来自 total_seconds", () => {
    const ctx = formatData(baseStats({ total_seconds: 7200 }), null)
    expect(ctx.waka.all?.time).toBe(7200)
  })

  it("waka.username / range 映射", () => {
    const ctx = formatData(baseStats({ username: "alice", start: "2024-02-01", end: "2024-02-07", days_including_holidays: 7 }), null)
    expect(ctx.waka.all?.username).toBe("alice")
    expect(ctx.waka.all?.range).toEqual({ start: "2024-02-01", end: "2024-02-07", days: 7 })
  })

  it("addition / deletion 聚合: ai + human = total", () => {
    const ctx = formatData(baseStats({ ai_additions: 10, human_additions: 30, ai_deletions: 5, human_deletions: 15 }), null)
    expect(ctx.waka.all?.addition).toEqual({ ai: 10, human: 30, total: 40 })
    expect(ctx.waka.all?.deletion).toEqual({ ai: 5, human: 15, total: 20 })
  })

  it("ai 用量聚合: token.input + output = total, cost 来自 ai_model_total_cost", () => {
    const ctx = formatData(baseStats({ ai_input_tokens: 1000, ai_output_tokens: 500, ai_model_total_cost: 0.42 }), null)
    expect(ctx.waka.all?.ai).toEqual({ cost: 0.42, token: { input: 1000, output: 500, total: 1500 } })
  })

  it("languages 数组: { name, time } 映射", () => {
    const ctx = formatData(baseStats({
      languages: [{ name: "TS", total_seconds: 1000, percent: 50, digital: "16:40", text: "16 hrs", hours: 16, minutes: 40, seconds: 1000 }],
    }), null)
    expect(ctx.languages.all).toEqual([{ name: "TS", time: 1000 }])
  })

  it("projects 数组: name + time + addition/deletion/ai", () => {
    const ctx = formatData(baseStats({
      projects: [{
        name: "proj",
        total_seconds: 500,
        percent: 100,
        digital: "8:20",
        text: "8 hrs",
        hours: 8,
        minutes: 20,
        ai_additions: 7,
        ai_deletions: 3,
        human_additions: 13,
        human_deletions: 17,
        ai_model_line_changes: {},
        ai_model_costs: {},
        ai_model_breakdown: [],
        ai_model_total_cost: 0.1,
        ai_input_tokens: 100,
        ai_output_tokens: 50,
        ai_prompt_length_avg: 10,
        ai_prompt_length_avg_per_session: 5,
        ai_prompt_length_median_per_session: 5,
        ai_prompt_length_sum: 50,
        ai_prompt_events_total: 1,
        ai_prompt_events_avg_per_session: 1,
        ai_prompt_events_median_per_session: 1,
        ai_sessions: 1,
      }],
    }), null)
    expect(ctx.projects.all).toEqual([{
      name: "proj",
      time: 500,
      addition: { ai: 7, human: 13, total: 20 },
      deletion: { ai: 3, human: 17, total: 20 },
      ai: { cost: 0.1, token: { input: 100, output: 50, total: 150 } },
    }])
  })
})
