# custom_waka_readme - Render your custom wakatime-powered README

Most waka README tools ship a template. You can configure it, but only within limits. Custom rendering means implementing it yourself.

This project treats the template as a JavaScript program with inline `{expr}`, letting you customize your waka README structure.

- Inline `{expr}` for custom rendering
- Multi-line blocks for advanced logic
- Sandbox keeps execution safe
- Composite action, no `dist/index.js` checked in
- Auto commit and push

## Usage

### 1. Prepare

You need two things:

- A wakatime API key from your [wakatime settings](https://wakatime.com/settings/api-key)
- A GitHub token with `contents: write` on the target repo

Get the wakatime key from your wakatime account: log in at wakatime.com, open Settings > API Key, and copy the secret.

For the GitHub token, the built-in `secrets.GITHUB_TOKEN` is enough if you add `permissions: contents: write` to the workflow (it is read-only by default). For cross-repo writes, create a fine-grained PAT at Settings > Developer settings > Personal access tokens > Fine-grained tokens, grant `Contents: Read and write` on the target repo, and store it as a repository secret.

### 2. Add a template

Create `profile.md` at the repo root. The file supports two markers:

- `{expr}` - inline JS expression, stringified into the output
- `<!--CUSTOM_WAKA_START-->` ... `<!--CUSTOM_WAKA_END-->` - multi-line code block, declares variables for later tokens

Example:

```md
# Hi there

This week I coded for **{waka.week.time / 3600} hrs**, **{waka.all.time / 3600} hrs** all time.

## Top languages this week

<!--CUSTOM_WAKA_START-->

const list = languages.week
.slice(0, 5)
.map((l, i) => `${i + 1}. ${l.name} - ${Math.round(l.time / 60)} min`)
.join('\n')
<!--CUSTOM_WAKA_END-->

{list}
```

The wakatime variables are pre-injected and ready to use; see [API](#api) for the full list.

The `{list}` token on the last line uses `list` defined in the block above. Code blocks and tokens execute top to bottom in source order, sharing the same scope.

To emit a literal `{` or `}`, write it as `{{` or `}}`. If you need n braces, write n + 1 braces.

> Do not define `__token__` or `__flag__` in your template. They are reserved for internal use by the action.

### 3. Write the action

Create `.github/workflows/waka.yaml` in your repo:

```yaml
name: Update Waka README
on:
  # Daily at midnight UTC
  schedule:
    - cron: "0 0 * * *"
  workflow_dispatch:

permissions:
  contents: write

jobs:
  update:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: Twisuki/custom_waka_readme@v1
        with:
          wakatime_api_key: ${{ secrets.WAKATIME_API_KEY }}
```

Store the wakatime API key as a repository secret: Settings > Secrets and variables > Actions > New repository secret, name it `WAKATIME_API_KEY`, and paste the key from your wakatime dashboard.

The built-in `${{ secrets.GITHUB_TOKEN }}` works as long as the workflow declares `permissions: contents: write` (the default is read-only). For cross-repo writes, swap it for a fine-grained PAT with `contents: write`, stored as a repository secret.

## Config

All inputs go inside the step's `with:` block:

```yaml
jobs:
  update:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: Twisuki/custom_waka_readme@v1
        with:
          profile_path: profile.md
          output_path: README.md
          wakatime_api_key: ${{ secrets.WAKATIME_API_KEY }}
          commit_author: waka_bot
          commit_email: 41898282+github-actions[bot]@users.noreply.github.com
          commit_message: "feat: Update custom waka readme"
          sandbox_timeout: 10000
          sandbox_memory: 128
```

| Input              | Required | Default                                                 | Description                |
| ------------------ | -------- | ------------------------------------------------------- | -------------------------- |
| `profile_path`     | no       | `profile.md`                                            | Source template path       |
| `output_path`      | no       | `README.md`                                             | Output README path         |
| `wakatime_api_key` | yes      | -                                                       | Wakatime API key           |
| `commit_author`    | no       | `waka_bot`                                              | Git commit author name     |
| `commit_email`     | no       | `41898282+github-actions[bot]@users.noreply.github.com` | Git commit author email    |
| `commit_message`   | no       | `feat: Update custom waka readme`                       | Git commit message         |
| `sandbox_timeout`  | no       | `10000`                                                 | Execution timeout in ms    |
| `sandbox_memory`   | no       | `128`                                                   | Sandbox memory limit in MB |

## API

Eight variables are injected into the sandbox. Each is a `Range<T>`, which is `{ all: T | null, week: T | null }`. Either side can be `null` if the wakatime fetch for that range fails. Null-check before dereferencing.

| Variable       | Type                                    |
| -------------- | --------------------------------------- |
| `waka`         | `Range<WakaData & CodingData>`          |
| `categories`   | `Range<Array<CommonData>>`              |
| `projects`     | `Range<Array<CommonData & CodingData>>` |
| `languages`    | `Range<Array<CommonData>>`              |
| `editors`      | `Range<Array<CommonData & CodingData>>` |
| `oss`          | `Range<Array<CommonData>>`              |
| `dependencies` | `Range<Array<CommonData>>`              |
| `machines`     | `Range<Array<CommonData>>`              |

```ts
interface Range<T> {
  all: T | null
  week: T | null
}

interface CommonData {
  name: string
  time: number
}

interface Edit {
  ai: number
  human: number
  total: number
}

interface Usage {
  cost: number
  token: {
    input: number
    output: number
    total: number
  }
}

interface CodingData {
  addition: Edit
  deletion: Edit
  ai: Usage
}

interface WakaData {
  time: number
  range: {
    start: string
    end: string
    days: number
  }
  username: string
}
```
