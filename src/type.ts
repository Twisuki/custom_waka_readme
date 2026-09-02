// region ContextData

export interface CommonData {
  name: string
  time: number
}

export interface Edit {
  ai: number
  human: number
  total: number
}

export interface Usage {
  cost: number
  token: {
    input: number
    output: number
    total: number
  }
}

export interface CodingData {
  addition: Edit
  deletion: Edit
  ai: Usage
}

export interface WakaData {
  time: number
  range: {
    start: string
    end: string
    days: number
  }
  username: string
}

export interface Range<T> {
  all: T | null
  week: T | null
}

/**
 * 注入自定义代码块的上下文
 */
export interface ContextData {
  waka: Range<WakaData & CodingData>
  categories: Range<Array<CommonData>>
  projects: Range<Array<CommonData & CodingData>>
  languages: Range<Array<CommonData>>
  editors: Range<Array<CommonData & CodingData>>
  oss: Range<Array<CommonData>>
  dependencies: Range<Array<CommonData>>
  machines: Range<Array<CommonData>>
}

// endregion

// region Node

export type NodeType = "static" | "block" | "token"

/**
 * 文档解析结构
 */
export interface Node {
  type: NodeType
  index: number
  line: number
  content: string
}

// endregion
