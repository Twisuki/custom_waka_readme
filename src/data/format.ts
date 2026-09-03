import type { StatsData } from "@/data/schema"
import type { CodingData, CommonData, ContextData, Edit, Range, Usage, WakaData } from "@/type"

function formatEdit(ai: number, human: number): Edit {
  return { ai, human, total: ai + human }
}

function formatUsage(s: {
  ai_input_tokens: number
  ai_output_tokens: number
  ai_model_total_cost: number
}): Usage {
  return {
    cost: s.ai_model_total_cost,
    token: {
      input: s.ai_input_tokens,
      output: s.ai_output_tokens,
      total: s.ai_input_tokens + s.ai_output_tokens,
    },
  }
}

function formatRange<T>(all: StatsData | null, week: StatsData | null, formater: (s: StatsData) => T): Range<T> {
  return {
    week: week ? formater(week) : null,
    all: all ? formater(all) : null,
  }
}

export function formatData(all: StatsData | null, week: StatsData | null): ContextData {
  const waka = formatRange<WakaData & CodingData>(all, week, s => ({
    time: s.total_seconds,
    range: {
      start: s.start,
      end: s.end,
      days: s.days_including_holidays,
    },
    username: s.username,
    addition: formatEdit(s.ai_additions, s.human_additions),
    deletion: formatEdit(s.ai_deletions, s.human_deletions),
    ai: formatUsage(s),
  }))

  const categories = formatRange<Array<CommonData>>(all, week, s =>
    s.categories.map(i => ({
      name: i.name,
      time: i.total_seconds,
    })))

  const projects = formatRange<Array<CommonData & CodingData>>(all, week, s =>
    s.projects.map(i => ({
      name: i.name,
      time: i.total_seconds,
      addition: formatEdit(i.ai_additions, i.human_additions),
      deletion: formatEdit(i.ai_deletions, i.human_deletions),
      ai: formatUsage(i),
    })))

  const languages = formatRange<Array<CommonData>>(all, week, s =>
    s.languages.map(i => ({
      name: i.name,
      time: i.total_seconds,
    })))

  const editors = formatRange<Array<CommonData & CodingData>>(all, week, s =>
    s.editors.map(i => ({
      name: i.name,
      time: i.total_seconds,
      addition: formatEdit(i.ai_additions, i.human_additions),
      deletion: formatEdit(i.ai_deletions, i.human_deletions),
      ai: formatUsage(i),
    })))

  const oss = formatRange<Array<CommonData>>(all, week, s =>
    s.operating_systems.map(i => ({
      name: i.name,
      time: i.total_seconds,
    })))

  const dependencies = formatRange<Array<CommonData>>(all, week, s =>
    s.dependencies.map(i => ({
      name: i.name,
      time: i.total_seconds,
    })))

  const machines = formatRange<Array<CommonData>>(all, week, s =>
    s.machines.map(i => ({
      name: i.name,
      time: i.total_seconds,
    })))

  return {
    waka,
    categories,
    projects,
    languages,
    editors,
    oss,
    dependencies,
    machines,
  }
}
