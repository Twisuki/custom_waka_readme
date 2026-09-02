import type { ContextData, Range } from "@/type"
import { fetchData } from "@/data/fetch"
import { formatData } from "@/data/format"

export interface GetDataOptions {
  mock?: boolean
}

function emptyRange<T>(): Range<T> {
  return { all: null, week: null }
}

/**
 * 获取 wakatime stats, 转换为上下文格式数据
 */
export async function getData(apiKey: string, options: GetDataOptions = {}): Promise<ContextData> {
  if (options.mock) {
    return {
      waka: emptyRange(),
      categories: emptyRange(),
      projects: emptyRange(),
      languages: emptyRange(),
      editors: emptyRange(),
      oss: emptyRange(),
      dependencies: emptyRange(),
      machines: emptyRange(),
    }
  }

  const [weekResponse, allResponse] = await Promise.all([
    fetchData(apiKey, "last_7_days").catch(() => null),
    fetchData(apiKey, "all_time").catch(() => null),
  ])

  // 过滤非空值: 提取 .data, 处理 null
  const all = allResponse?.data ?? null
  const week = weekResponse?.data ?? null

  return formatData(all, week)
}
