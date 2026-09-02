# custom_waka_readme - 产品规范

> GitHub Action: 编译 profile.md 模板至 README.md, 集成 wakatime 统计与可编程插值.
>
> 本文件描述产品需求与基础架构, 作为长期开发与跨设备协作的事实来源. 任何对外契约 (用户可见行为) 的变更, 须先在本文件更新, 再进入实现.

## 目录

- [1. 概述](#1-概述)
- [2. 设计目标](#2-设计目标)
- [3. 非目标](#3-非目标)
- [4. 核心能力](#4-核心能力)
- [5. 架构](#5-架构)
- [6. 沙箱与安全](#6-沙箱与安全)
- [7. 配置](#7-配置)
- [8. 输出与提交](#8-输出与提交)
- [9. 错误处理](#9-错误处理)
- [11. 附录](#11-附录)

---

## 1. 概述

### 1.1 项目定位

`custom_waka_readme` 是一个公开的 GitHub Action, 用于将用户编写的 `profile.md` 模板文件编译为 GitHub Profile 仓库中的 `README.md`. 编译过程支持两类能力:

- **waka**: 从 wakatime 拉取编码统计数据, 在模板中可直接引用
- **custom**: 通过自定义 JS 表达式与代码块, 在模板中实现任意可编程插值

### 1.2 问题陈述

现有 wakatime 相关 Action (如 `anmol098/waka-readme-stats`) 通过在 `README.md` 中读取一对特殊 HTML 注释, 写入固定格式的统计图. 该模式存在两个根本限制:

1. **不可定制**: 写入内容由 Action 硬编码, 用户无法调整布局, 文案, 配色, 排序或聚合方式
2. **二次迭代困难**: Action 输出的内容混入 `README.md` 后, 模板语义消失, 后续 push 只能更新既有内容, 无法重新组织

### 1.3 解决方案

引入**源 - 产物分离**模型:

- `profile.md` 为源文件, 由用户维护
- `README.md` 为产物, 由 Action 生成
- Action 读取 `profile.md`, 解析其中两类插值语法, 渲染为 `README.md` 并提交

该模型使用户可以:

- 任意调整模板结构与样式
- 复用 Action 输出作为其他模板输入 (例如嵌入 SVG 卡)
- 自由组合 wakatime 数据与自定义计算
- 跨设备同步与多人协作同一份 `profile.md`

---

## 2. 设计目标

| 目标       | 描述                                                                                         |
| ---------- | -------------------------------------------------------------------------------------------- |
| 可定制性   | 用户完全控制 `README.md` 的最终结构与内容, 不受 Action 模板约束                              |
| 可编程性   | 模板支持任意 JS 表达式与多语句代码块, 满足复杂计算需求                                       |
| 可复用性   | `profile.md` 可纳入版本控制, 跨设备同步, 多人协作                                            |
| 安全性     | 用户脚本在沙箱中执行, 物理隔离, 真超时, 内存受控                                             |
| 可移植性   | 支持全部 GitHub-hosted runner 平台 (linux-x64, linux-arm64, win-x64, macos-x64, macos-arm64) |
| 可观测性   | 错误位置 (行号, 表达式) 准确输出至 Action 日志, 便于排障                                     |
| 幂等性     | 输入不变时输出不变, 不产生空 commit                                                          |
| 零外部状态 | Action 不依赖本地配置文件, 全部配置来自 `profile.md` frontmatter 与 Action inputs            |

---

## 3. 非目标

明确不实现, 以避免范围蔓延:

- **多 Profile 输出**: 不支持一个仓库渲染多份 `README.md`
- **Profile 市场**: 不提供模板分享与发现功能
- **数据可视化**: 不内置图表与 SVG 生成 (用户可在代码块内自行构建)
- **多 wakatime 账号**: 不支持聚合多用户统计
- **定时触发**: 触发逻辑由用户 workflow 控制, Action 仅在被调用时执行
- **回写 wakatime**: 不修改 wakatime 端任何数据
- **本地 CLI**: 暂不提供 `npx` 本地执行模式, 全部经由 GitHub Actions

---

## 4. 核心能力

### 4.1 模板插值 (custom)

#### 4.1.1 Token

`{expr}` 为单行 Token, 其中 `expr` 为可作为 `return` 语句的合法 JS 表达式. Action 将其作为表达式执行, 以结果的字符串形式替换原文.

约束:

- **单行**: Token 不可跨行
- **单层**: 解析器仅识别 1 层大括号, 多层通过 escape 处理 (见 4.1.2)
- **作用域**: Token 与代码块共享同一求值上下文, 变量可跨语法节点复用

```markdown
当前值: {currentValue}
首项名称: {data[0].name}
```

#### 4.1.2 Escape

用户在模板中如需输出字面量大括号, 采用 `n + 1` 层输入法. 解析器每次从最外层吃掉一对, 输出 `n` 层:

| 输入   | 输出  |
| ------ | ----- |
| `{{`   | `{`   |
| `{{{`  | `{{`  |
| `{{{{` | `{{{` |

注: 转义在 Token 解析之前进行, 以避免误触发.

#### 4.1.3 代码块

`<!--CUSTOM_WAKA_START-->` 与 `<!--CUSTOM_WAKA_END-->` 之间的内容视为一段 JS 脚本. 可包含多语句 (变量声明, 函数定义 等), 在模板首次求值时执行一次, 其定义的变量持久化于求值上下文, 供后续 Token 引用.

```markdown
<!--CUSTOM_WAKA_START-->

const top3 = data
.slice(0, 3)
.map(l => `- ${l.name}: ${l.text} (${l.percent}%)`)
.join('\n');
<!--CUSTOM_WAKA_END-->

本月排行:

{top3}
```

约束:

- 代码块内 `{` 与 `}` 不触发 Token 解析, 一律视为字面量
- 代码块执行后, 其顶层 `const`, `let`, `var`, `function` 声明进入共享作用域

#### 4.1.4 求值上下文

模板求值时, 沙箱内默认暴露以下顶层变量 (供 Token 与代码块引用):

- `waka` — 编码总览 (时间/编辑行数/AI 成本/token)
- `categories` / `projects` / `languages` / `editors` / `oss` / `dependencies` / `machines` — 7 类分组统计数组

类型定义与字段说明见 [model.md §上下文字段设计](./model.md#上下文字段设计), 本节不重复.

#### 4.1.5 求值流程

Parser 把 `profile.md` 切成节点序列 (静态文本 / 代码块 / Token). 代码块与 Token 按源序拼成一段脚本, 在沙箱内执行一次, 共享脚本级词法作用域 (`const` / `let` 跨代码块可见).

拼接模板:

```js
let __flag__
const __token__ = []
try {
  __flag__ = { type: "block", line: 5 }
  /* code block 0 原样插入 */
  __flag__ = { type: "token", line: 12 }
  __token__[0] = (tokenExpr0)
  __flag__ = { type: "block", line: 18 }
  /* code block 1 原样插入 */
  __flag__ = { type: "token", line: 27 }
  __token__[1] = (tokenExpr1)
  __flag__ = null
}
catch (e) {
  const f = __flag__
  throw f ? new Error(`profile.md:${f.line} (${f.type}) ${e.message}`) : e
}
```

要点:

- 每节点执行前一行写 `__flag__ = { type, line }`, 抛错时 catch 读回溯定位
- Token 表达式以 `(...)` 包裹, 强制求值上下文
- 代码块行号 = 起始注释 `<!--CUSTOM_WAKA_START-->` 所在行
- Token 行号 = token 表达式所在行; 同一行多 token 不细分
- 执行完毕 host 从沙箱读取 `__token__` 数组, 按索引替换回模板

错误粒度: 块级 (代码块内具体哪条语句挂的, 用户自己看代码块定位).

### 4.2 wakatime 集成 (waka)

#### 4.2.1 接口

唯一数据源为 wakatime REST API. Action 自动拉取编码统计, 覆盖 `last_7_days` 与 `all_time` 两种范围, 用户无需在模板或配置中指定.

```
GET https://wakatime.com/api/v1/users/current/stats/{range}
```

#### 4.2.2 鉴权

凭据通过 URL query string 传递, 来源为 Secret `WAKATIME_API_KEY`:

```
GET https://wakatime.com/api/v1/users/current/stats/{range}?api_key={WAKATIME_API_KEY}
```

注: wakatime 同时支持 HTTP Basic Auth 与 query string 两种鉴权方式, 本规格选择 query string — 客户端无需拼装 `Authorization` 头, 实现更轻.

#### 4.2.3 响应结构

`last_7_days` 与 `all_time` 形态一致, 差异在 `range` 字段. 完整字段定义见 [model.md §API 返回结构](./model.md#api-返回结构); 此处不冗余列举, 避免与上游 API 漂移. 上游文档参考 [wakatime Developer Docs](https://wakatime.com/developers#stats).

模板层不直接消费此结构 — Action 在数据层做清洗, 暴露字段见 [model.md §上下文字段设计](./model.md#上下文字段设计).

#### 4.2.4 体积

- `last_7_days` 响应约 5-20 KB
- `all_time` 响应约 200-500 KB (`languages` 等数组可达数百项)
- Action 每次执行按需拉取, 不跨 run 缓存

#### 4.2.5 Mock 模式

Action 提供 mock 模式用于本地开发与单元测试. 启用后, wakatime 调用被替换为读取仓库内置的 JSON fixture, 行为对上层完全一致 (返回相同结构的对象), 仅数据来源不同.

启用方式: Action input `mock_wakatime: "true"` (详见 §7.2).

启用后:

- 不发出任何 HTTP 请求至 wakatime
- `WAKATIME_API_KEY` 可缺失 (mock 模式不消费凭据)
- 数据来自仓库 `mock/` 目录下两份固定 fixture: `last_7_days.json` 与 `all_time.json`, 结构与真实响应字段一致
- 阶段十测试可借此跑出确定性结果, 不依赖网络或真实 wakatime 账号

---

## 5. 架构

### 5.1 概念分层

产品按以下五层组织, 各层职责清晰分离:

| 层       | 职责                                                                |
| -------- | ------------------------------------------------------------------- |
| 配置层   | 解析 `profile.md` frontmatter, 合并 Action inputs, 提供统一配置对象 |
| 解析层   | 对模板文本做词法分析, 切分 escape / Token / 代码块 / 静态文本       |
| 数据层   | 拉取 wakatime 统计数据, 鉴权与重试                                  |
| 运行时层 | 沙箱环境, 注入 waka 数据, 执行代码块与 Token                        |
| 输出层   | 渲染结果, 写入 `README.md`, 触发 commit                             |

### 5.2 执行流程

Action 按以下顺序执行:

1. **配置**: 解析 `profile.md` frontmatter, 合并 Action inputs
2. **解析**: 切分模板为 escape / token / code block / 静态文本
3. **数据**: 并行拉取 wakatime stats (`last_7_days` 与 `all_time`)
4. **运行时**: 初始化沙箱, 执行 code block, 依次求值 token
5. **输出**: 拼接渲染结果, 写入 `README.md`, 内容变更时触发 commit

---

## 6. 沙箱与安全

### 6.1 沙箱

用户脚本在 [`isolated-vm`](https://github.com/laverdet/isolated-vm) 沙箱中执行.

### 6.2 资源限制

- 单 Token 与代码块均设执行超时, 防止死循环阻塞 Action
- Isolate 设内存上限, 防止脚本耗尽资源
- 上述参数均可在 frontmatter 中配置, 默认值见实现

### 6.3 威胁模型

| 威胁                 | 缓解                              |
| -------------------- | --------------------------------- |
| 用户脚本访问文件系统 | 沙箱无 `fs` 概念, 物理隔离        |
| 用户脚本访问网络     | 沙箱无 `fetch` 概念, 物理隔离     |
| 用户脚本执行死循环   | 原生 CPU 超时强制中断             |
| 用户脚本耗尽内存     | Isolate 内存上限                  |
| 用户脚本攻击 host V8 | 独立堆, 无原型链共享              |
| 用户脚本窃取 Secret  | Secret 仅在 host 环境, 不注入沙箱 |

---

## 7. 配置

### 7.1 profile.md frontmatter

```yaml
---
# git 提交配置
commit:
  author: Your Name
  email: you@example.com
  message: "chore: update waka stats"

# 沙箱配置
sandbox:
  tokenTimeoutMs: 1000
  blockTimeoutMs: 5000
  memoryMb: 64
---
```

注: 上述 schema 为对外契约, 字段新增或语义变更视为破坏性改动.

### 7.2 action inputs

| Input              | 必填 | 默认                              | 说明                                                  |
| ------------------ | ---- | --------------------------------- | ----------------------------------------------------- |
| `profile_path`     | 否   | `profile.md`                      | 源文件路径                                            |
| `output_path`      | 否   | `README.md`                       | 产物文件路径                                          |
| `wakatime_api_key` | 否   | `${{ secrets.WAKATIME_API_KEY }}` | wakatime 凭据, 推荐从 Secret 注入; mock 模式下可缺失  |
| `mock_wakatime`    | 否   | `"false"`                         | 启用 wakatime mock 模式, 取值遵循 `_TRUTHY` (见 §7.5) |
| `commit_author`    | 否   | frontmatter `commit.author`       | 提交作者                                              |
| `commit_email`     | 否   | frontmatter `commit.email`        | 提交邮箱                                              |
| `commit_message`   | 否   | frontmatter `commit.message`      | 提交信息                                              |

### 7.3 Secrets

| Secret             | 用途          | 是否必填                     |
| ------------------ | ------------- | ---------------------------- |
| `WAKATIME_API_KEY` | wakatime 鉴权 | mock 模式: 否 / 正常模式: 是 |
| `GITHUB_TOKEN`     | 自动 commit   | 是                           |

Secret 仅从 Action 环境变量读取, **不**写入 frontmatter 或模板文本. frontmatter 中如出现同名字段将被忽略并报警.

### 7.4 优先级

```text
action inputs > frontmatter > 内置默认值
```

### 7.5 布尔解析约定

接受 `_TRUTHY` 列表中任一字符串作为真值, 其余视为假值:

```text
_TRUTHY = ["true", "1", "t", "y", "yes"]
```

比较时大小写不敏感. 此约定适用于所有声明为布尔语义的 input (如 `mock_wakatime`).

---

## 8. 输出与提交

### 8.1 产物

`README.md` 为全量生成. Action 不做局部替换, 以保证模板语义在源文件中可维护. 编译一次后, 模板中的 `{{` 不会被再次吃掉 (Token 已被替换为结果字符串), 故重复 push 仍可正常更新数据, 而非退化为死文本.

### 8.2 提交

- 内容变更时, 触发提交至仓库
- 内容未变 (幂等) 时, **不**产生 commit
- Author, Email, Message 来自 frontmatter, 缺省有内置默认

### 8.3 幂等

通过字节级对比本次渲染结果与仓库当前 `README.md` 内容判定, 一致则跳过提交.

---

## 9. 错误处理

### 9.1 错误分类

产品对以下类别错误做统一处理, 各类行为一致:

| 类别     | 示例                           |
| -------- | ------------------------------ |
| 配置错误 | frontmatter 字段缺失或类型错误 |
| 鉴权错误 | `WAKATIME_API_KEY` 缺失或 401  |
| API 错误 | wakatime 非 2xx 响应或网络超时 |
| 解析错误 | Token 或代码块语法错误         |
| 沙箱错误 | 超时或内存超限                 |
| Git 错误 | commit 或 push 失败            |

具体重试策略与降级行为在实现中确定.

### 9.2 日志

所有错误在 Action 日志中以 `::error file={path},line={line}::` 格式输出, 使 GitHub UI 高亮并定位. 详细信息堆叠于其后.

模板求值阶段的错误额外标注所属节点类型:

```text
::error file=profile.md,line=12 (token):: <message>
::error file=profile.md,line=5  (block):: <message>
```

`line` 为该节点在 `profile.md` 中的源行号 (代码块取起始注释行, Token 取表达式所在行). 同一行多个 Token 不细分, 仅报该行号.

### 9.3 粒度

**整体失败**: 任意错误均终止 Action, 不会部分写入 `README.md`. 此为安全优先选择, 避免产出半完成产物.

---

## 11. 附录

### 11.1 完整 profile.md 示例

以下示例展示模板语法. 暴露字段的真实形态见 [model.md §上下文字段设计](./model.md#上下文字段设计); 示例中字段名为占位符, 落地时按 model.md 替换 (`total` → `waka.all.time`, `items` → `categories.all` / `projects.all` 等).

```markdown
---
commit:
  author: "Your Name"
  email: "you@example.com"
  message: "chore: update coding stats"
---

# Hi there

当前值: {total}
日均: {average}
峰值: {peak.text} ({peak.date})

<!--CUSTOM_WAKA_START-->

const top3 = items
.slice(0, 3)
.map((item, i) => `${i + 1}. **${item.name}** - ${item.value} (${item.percent}%)`)
.join('\n');
<!--CUSTOM_WAKA_END-->

## 排行

{top3}

> 数据来源: wakatime
```

### 11.2 最小 workflow 示例

```yaml
name: Update README
on:
  schedule:
    - cron: "0 */6 * * *"
  workflow_dispatch:

jobs:
  update:
    runs-on: ubuntu-latest
    permissions:
      contents: write
    steps:
      - uses: actions/checkout@v4
      - uses: Twisuki/custom_waka_readme@v1
        with:
          wakatime_api_key: ${{ secrets.WAKATIME_API_KEY }}
      - uses: stefanzweifel/git-auto-commit-action@v5
        with:
          file_pattern: README.md
          commit_message: "chore: update stats"
```

### 11.3 参考资料

- [model.md](./model.md) - API 返回结构 + 模板上下文字段设计 (本仓库)
- [wakatime Developer Docs](https://wakatime.com/developers#stats) - API 规范
- [isolated-vm](https://github.com/laverdet/isolated-vm) - 沙箱实现
