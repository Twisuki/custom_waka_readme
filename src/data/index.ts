import type { ContextData } from "@/type"
import { fetchData } from "@/data/fetch"
import { formatData } from "@/data/format"

/**
 * 获取 wakatime stats, 转换为上下文格式数据
 */
export async function getData(apiKey: string): Promise<ContextData> {
  const [weekResponse, allResponse] = await Promise.all([
    fetchData(apiKey, "last_7_days").catch(() => null),
    fetchData(apiKey, "all_time").catch(() => null),
  ])

  // 过滤非空值: 提取 .data, 处理 null
  const all = allResponse?.data ?? null
  const week = weekResponse?.data ?? null

  return formatData(all, week)
}
