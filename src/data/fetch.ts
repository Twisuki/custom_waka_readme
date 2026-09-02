import type { StatsRange, WakaResponse } from "@/data/schema"

export async function fetchData(apiKey: string, range: StatsRange): Promise<WakaResponse> {
  const url = `https://wakatime.com/api/v1/users/current/stats/${range}?api_key=${encodeURIComponent(apiKey)}`
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`wakatime ${range}: HTTP ${res.status} ${res.statusText}`)
  }
  return await res.json() as WakaResponse
}
