# UniFlow 智汇流产品技术白皮书

> **版本**: 1.0.0
> **日期**: 2025-12-21
> **状态**: 已发布 (Phase A Chatbot Integrated)

---

## 1. 产品愿景与设计初衷

**UniFlow (智汇流)** 定义为一台**对抗校园信息熵增的 AI 引擎**。

在当前的校园生态中，高价值信息（如招聘、讲座、学术活动）往往以极度碎片化的形式散落在微信群聊、朋友圈海报、公众号推文以及各类文档中。这些信息存在以下痛点：
- **碎片化与瞬时性**：信息流转快，难以留存，稍纵即逝。
- **非结构化**：海报图片、长文本、PDF 混杂，难以检索和结构化利用。
- **语言壁垒**：国际化校园环境中，中文与英文信息往往割裂，留学生群体获取信息困难。

**UniFlow 的核心使命**是将这些非结构化的碎片信息，通过 AI 技术重塑为**结构化、中英双语、可检索的数据资产**，打破信息壁垒，实现信息的长效价值。

---

## 2. 设计哲学

UniFlow 遵循**"极简工具"**的设计哲学，拒绝做繁重的社交平台，专注于信息分发本身。

### 2.1 核心理念
*   **随手记、随手查、不打扰**：
    *   用户用完即走，不通过红点、推送制造焦虑。
    *   极简的交互路径，从打开到获取信息不超过 3 步。
*   **极简即美 (Minimalism)**：
    *   全站采用清华紫视觉体系，界面克制、留白，提供沉浸式阅读体验。
*   **数据确权 (Data Ownership)**：
    *   尊重原始发布者，所有信息均可追溯原始来源（Source Group），支持一键复制原文。

---

## 3. 产品功能架构

UniFlow 采用 **"前台小程序 (C端) + 后台管理中台 (B端)"** 的双端架构。

### 3.1 前台小程序 (UniFlow Mini Program)
面向校园用户，提供极致的信息获取体验。

*   **智能信息流 (Smart Feed)**：
    *   按 `实习招聘`、`讲座活动` 分类展示。
    *   **动态清洗**：自动识别过期时间，智能过滤失效信息，保证信息流的新鲜度。
*   **沉浸式详情页**：
    *   结构化展示关键字段（公司、岗位、时间、地点）。
    *   **文件直读**：支持直接在小程序内预览 PDF 附件（如 JD、宣讲 PPT）。
*   **效率工具**：
    *   **一键锁日程**：自动提取活动时间，一键同步至手机系统日历。
    *   **一键搜索**：支持全文检索，快速定位历史信息。
*   **个人资产管理**：
    *   收藏夹与浏览历史，帮助用户建立个人信息库。

### 3.2 智能采集管理台 (UniFlow Admin Console)
面向管理员与运营者，是数据生产的核心工厂。

*   **多模态 AI 采集 (AI Ingestion)**：
    *   支持 **文本 / URL / 海报图片 / PDF** 等多种输入格式。
    *   **多源合并 (Multi-Source Parsing)**：允许同时输入多份素材（例如：一张海报 + 一段补充文本 + 一个报名链接），AI 自动去重、融合，生成单一标准事件。
*   **对话式采集 (Conversational Ingest) [Phase A]**：
    *   提供类似 ChatGPT 的对话界面。
    *   支持自然语言描述活动，AI 自动多轮追问补全缺失字段（如时间、地点）。
    *   支持在对话中直接上传/粘贴图片和文件。
*   **中英双语生产**：
    *   AI 自动将中文源信息翻译并格式化为标准双语内容（Title | 标题）。
*   **结构化审核 (Review & Publish)**：
    *   提供人工校对界面，确保 AI 提取准确无误后一键发布。

---

## 4. 技术架构方案

### 4.1 技术栈 (Tech Stack)

| 模块 | 技术选型 | 说明 |
| :--- | :--- | :--- |
| **前端 (小程序)** | **Taro + React** | 跨端框架，编译为微信小程序，支持 TypeScript |
| **前端 (管理台)** | **Next.js (App Router)** | React 服务端渲染框架，提供高性能管理界面 |
| **后端 API** | **Next.js API Routes** | Serverless 风格的 API，轻量级后端 |
| **数据库 & Auth** | **Supabase** | 基于 PostgreSQL，提供 Database, Auth, Storage, Edge Functions |
| **AI 引擎** | **DeepSeek API** | 高性价比 LLM，负责非结构化数据的理解与提取 |
| **基础设施** | **Vercel** | 自动化部署与托管 (管理台) |

### 4.2 核心技术实现

#### A. AI 结构化解析引擎
这是 UniFlow 的"心脏"。通过精心设计的 Prompt Engineering，实现高精度的信息提取。

*   **输入**：Text, Image (OCR), PDF, URL Content。
*   **处理流程**：
    1.  **预处理**：提取多源内容中的文本。
    2.  **Context 注入**：注入系统 Prompt（包含双语格式要求、时间提取规则、字段定义）。
    3.  **LLM 推理**：调用 DeepSeek 模型，输出标准 JSON。
    4.  **后处理**：
        *   **日期标准化**：将相对日期（"下周三"）转化为绝对日期（"2025年12月24日"）。
        *   **双语格式校验**：强制执行 `中文 | English` 的字段格式。
*   **输出**：符合 `ParsedEvent` 接口的结构化数据。

#### B. 多源合并策略 (Multi-Source Merge)
解决"信息分散"问题。
*   系统允许用户一次性上传 `[海报, 补充文本, PDF]`。
*   后端将所有素材内容拼接，并在 Prompt 中指示 AI："综合所有来源，以海报信息为准，补充文本为辅，去重并生成唯一事件"。

#### C. 对话式采集 (Chatbot Phase A)
当前的对话模式实现方案：
*   **架构**：HTTP Request/Response (无 WebSocket)。
*   **状态管理**：基于内存的 Session Store（开发阶段），支持 30 分钟会话上下文。
*   **策略**：
    *   **Intent Recognition**：识别用户是在"描述新信息"还是"修改已有信息"。
    *   **Slot Filling**：检测缺失的关键字段（如 `date`, `location`），并在回复中主动追问。
    *   **Ambiguity Handling**：对于模糊时间（如"周三"），强制追问具体日期，而非猜测。

---

## 5. 数据模型设计

UniFlow 的核心数据资产是 **Event (事件)**。

```typescript
interface Event {
  id: number;
  title: string;          // 双语标题
  type: 'recruit' | 'activity' | 'lecture';
  source_group: string;   // 来源归属
  
  // 核心结构化信息 (JSONB)
  key_info: {
    date?: string;        // 标准化日期 YYYY年MM月DD日
    time?: string;        // 时间段
    location?: string;    // 地点
    company?: string;     // 招聘主体
    position?: string;    // 岗位
    education?: string;   // 学历要求
    link?: string;        // 投递/原文链接
    registration_link?: string; // 报名链接
  };
  
  summary: string;        // AI 生成的双语摘要
  raw_content: string;    // 原始素材备份
  
  // 多模态附件
  image_url?: string;     // 主视觉海报
  attachments?: {         // 附加文件列表
    type: 'pdf' | 'image';
    url: string;
    name: string;
  }[];
  
  status: 'draft' | 'published' | 'expired';
}
```

---

## 6. 未来演进规划

*   **Phase B (体验增强)**：
    *   引入 SSE (Server-Sent Events) 实现打字机流式回复。
    *   支持更多文件格式解析（Word, Excel）。
*   **Phase C (生态化)**：
    *   **推荐算法**：基于用户收藏历史的个性化推荐。
    *   **企业端**：开放企业入驻接口，实现源头直发。

---

**UniFlow** 不仅仅是一个工具，更是一种对校园信息流转效率的极致追求。我们希望通过 AI 的力量，让每一条有价值的信息都能精准地流向需要它的同学。
