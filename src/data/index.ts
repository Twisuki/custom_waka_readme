import type { ContextData } from "@/type"
import { fetchData } from "@/data/fetch"
import { formatData } from "@/data/format"
import { log } from "@/logger"

/**
 * 获取 wakatime stats, 转换为上下文格式数据
 */
export async function getData(token: string): Promise<ContextData> {
  const [weekResponse, allResponse] = await Promise.all([
    fetchData(token, "last_7_days").catch((error: Error) => {
      log.error("failed to fetch wakatime stats: last_7_days,", error.message)
      return null
    }),
    fetchData(token, "all_time").catch((error: Error) => {
      log.error("failed to fetch wakatime stats: all_time,", error.message)
      return null
    }),
  ])

  // 过滤非空值: 提取 .data, 处理 null
  const all = allResponse?.data ?? null
  const week = weekResponse?.data ?? null

  return formatData(all, week)
}
