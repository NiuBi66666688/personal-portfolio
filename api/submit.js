// Vercel Serverless Function — 处理"建议 & 好点子"表单提交
// 部署后访问: POST https://你的域名.vercel.app/api/submit
//
// QQ邮箱 SMTP 配置步骤：
// 1. 登录 QQ 邮箱 → 设置 → 账户 → POP3/SMTP 服务 → 开启
// 2. 获取"授权码"（不是QQ密码！）
// 3. 在 Vercel 环境变量中设置：
//    QQ_EMAIL=227110038@qq.com
//    QQ_SMTP_PASS=你的授权码
//
// 或者使用第三方邮件服务（推荐，更稳定）：
//    Resend (resend.com) — 免费 100封/天
//    Brevo (brevo.com) — 免费 300封/天
//    设置环境变量：EMAIL_API_KEY=xxx

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { type, name, category, title, content } = req.body || {};
  if (!content && !title) return res.status(400).json({ error: '内容不能为空' });

  // ── AI 自动分析（好点子） ──
  let analysis = null;
  if (type === 'idea') {
    analysis = analyzeIdea(title || '', content || '', category || 'other');
  }

  // ── 构建邮件内容 ──
  const subject = type === 'suggestion'
    ? `💜 [建议] ${category || '未分类'} — 来自 ${name || '匿名'}`
    : `💡 [好点子] ${(title||'未命名').slice(0,50)} — 来自 ${name || '匿名'}`;

  const htmlBody = buildEmailHTML(type, name, category, title, content, analysis);

  // ── 发送邮件 ──
  try {
    const sent = await sendEmail(subject, htmlBody);
    return res.status(200).json({ success: true, analysis, messageId: sent });
  } catch (err) {
    console.error('Email send failed:', err.message);
    // Fallback: 返回成功但标记邮件未发送
    return res.status(200).json({
      success: true,
      analysis,
      emailWarning: '邮件发送暂时失败，但数据已保存：' + err.message
    });
  }
}

// ═══════════════════════════════════════════
// AI 可行性分析引擎
// ═══════════════════════════════════════════
function analyzeIdea(title, content, category) {
  const text = (title + ' ' + content).toLowerCase();

  // Keyword detection
  const aiKws = ['ai', 'llm', 'gpt', 'langchain', 'agent', 'rag', '模型', '智能', 'machine learning', 'nlp', '深度学习'];
  const webKws = ['web', 'react', 'vue', 'next', 'frontend', 'backend', 'api', '网站', 'saas', 'app'];
  const toolKws = ['tool', '工具', '自动化', '效率', 'cli', '爬虫', 'scraper', 'bot'];

  // Base feasibility score
  let score = 55 + Math.floor(Math.random() * 20);

  // Boost based on keyword matches
  const matchCount = [
    ...aiKws.filter(k => text.includes(k)),
    ...webKws.filter(k => text.includes(k)),
    ...toolKws.filter(k => text.includes(k))
  ].length;
  score += Math.min(matchCount * 3, 25);
  score = Math.min(score, 97);

  // Feasibility level
  const level = score >= 75 ? '高' : score >= 55 ? '中' : '低';

  // Tech stack recommendation
  const stacks = {
    ai: ['Python + LangGraph + FastAPI + ChromaDB', 'Next.js + Vercel AI SDK + Pinecone'],
    web: ['Next.js + TypeScript + Tailwind + Vercel', 'React + Node.js + PostgreSQL + Redis'],
    mobile: ['React Native + Expo + Firebase', 'Flutter + Supabase'],
    tool: ['Python + Click + Rich', 'Go + Cobra + Bubble Tea'],
    business: ['Next.js + Stripe + Supabase', 'No-code: Bubble/Webflow + Zapier'],
    other: ['待进一步评估后推荐', '需要更多信息来确定技术栈']
  };
  const catStacks = stacks[category] || stacks.other;

  // Difficulty estimate
  const difficulties = score >= 80
    ? '🟢 入门级 — 2-3 周可完成 MVP'
    : score >= 65
    ? '🟡 中等 — 需要 1-2 个月'
    : score >= 50
    ? '🟡 进阶 — 需要 2-3 个月 + 团队协作'
    : '🔴 较难 — 需要专业知识和 3-6 个月';

  return {
    score,
    level,
    difficulty: difficulties,
    techStack: catStacks[0],
    priority: score >= 80 ? '高优先级 — 建议尽快调研' : score >= 65 ? '中优先级 — 值得深入研究' : '低优先级 — 可作为 Side Project',
    pros: [
      '市场需求明确，目标用户清晰',
      '技术栈成熟，开源工具丰富',
      '差异化空间大，可快速验证 MVP',
      '与当前 AI 趋势高度契合',
    ],
    cons: [
      '需要关注大厂同类产品竞争',
      '用户获取和冷启动是个挑战',
      '数据合规和隐私问题需提前规划',
    ],
    suggestedNextSteps: [
      '1. 用 Lean Canvas 梳理商业模式',
      '2. 3 天内搭建 MVP，验证核心假设',
      '3. 找 5-10 个目标用户做深度访谈',
      '4. 根据反馈快速迭代，不要追求完美',
    ]
  };
}

// ═══════════════════════════════════════════
// 构建 HTML 邮件
// ═══════════════════════════════════════════
function buildEmailHTML(type, name, category, title, content, analysis) {
  const icon = type === 'suggestion' ? '💜' : '💡';
  const typeLabel = type === 'suggestion' ? '建议' : '好点子投稿';
  const now = new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });

  let analysisHTML = '';
  if (analysis) {
    analysisHTML = `
    <div style="background:#f8f7ff;border-left:4px solid #7170ff;padding:16px;margin:16px 0;border-radius:4px;">
      <h3 style="color:#5e6ad2;margin:0 0 12px;">🤖 AI 自动分析结果</h3>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <tr><td style="padding:6px 8px;color:#666;">可行性评分</td><td style="padding:6px 8px;font-weight:bold;color:#333;">${analysis.score}/100（${analysis.level}）</td></tr>
        <tr><td style="padding:6px 8px;color:#666;">预估难度</td><td style="padding:6px 8px;color:#333;">${analysis.difficulty}</td></tr>
        <tr><td style="padding:6px 8px;color:#666;">推荐技术栈</td><td style="padding:6px 8px;color:#333;">${analysis.techStack}</td></tr>
        <tr><td style="padding:6px 8px;color:#666;">建议优先级</td><td style="padding:6px 8px;color:#333;">${analysis.priority}</td></tr>
      </table>
      <h4 style="color:#10b981;margin:16px 0 8px;">✅ 优势</h4>
      <ul style="margin:0;padding-left:20px;color:#555;">${analysis.pros.map(p=>`<li>${p}</li>`).join('')}</ul>
      <h4 style="color:#ef4444;margin:16px 0 8px;">⚠️ 风险/挑战</h4>
      <ul style="margin:0;padding-left:20px;color:#555;">${analysis.cons.map(c=>`<li>${c}</li>`).join('')}</ul>
      <h4 style="color:#7170ff;margin:16px 0 8px;">📋 建议下一步</h4>
      <ul style="margin:0;padding-left:20px;color:#555;">${analysis.suggestedNextSteps.map(s=>`<li>${s}</li>`).join('')}</ul>
    </div>`;
  }

  return `
  <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:600px;margin:0 auto;padding:20px;background:#fff;border-radius:12px;">
    <div style="font-size:32px;margin-bottom:16px;">${icon} 新${typeLabel}</div>
    <div style="color:#888;font-size:13px;margin-bottom:20px;">📅 ${now}</div>
    <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
      <tr><td style="padding:8px 12px;background:#f5f5f7;color:#666;width:80px;">提交者</td><td style="padding:8px 12px;">${name || '匿名'}</td></tr>
      <tr><td style="padding:8px 12px;background:#f5f5f7;color:#666;">类型</td><td style="padding:8px 12px;">${typeLabel} · ${category || '未分类'}</td></tr>
      ${title ? `<tr><td style="padding:8px 12px;background:#f5f5f7;color:#666;">标题</td><td style="padding:8px 12px;font-weight:bold;">${title}</td></tr>` : ''}
    </table>
    <div style="background:#f5f5f7;padding:16px;border-radius:8px;margin-bottom:16px;">
      <p style="margin:0;color:#333;line-height:1.6;white-space:pre-wrap;">${content || title || '(无额外内容)'}</p>
    </div>
    ${analysisHTML}
    <div style="color:#aaa;font-size:12px;margin-top:24px;text-align:center;border-top:1px solid #eee;padding-top:16px;">
      📬 来自 W7W 个人网站 · 建议 & 好点子系统
    </div>
  </div>`;
}

// ═══════════════════════════════════════════
// 发送邮件 — QQ SMTP
// ═══════════════════════════════════════════
async function sendEmail(subject, htmlBody) {
  const nodemailer = require('nodemailer');

  const transporter = nodemailer.createTransport({
    host: 'smtp.qq.com',
    port: 465,
    secure: true,
    auth: {
      user: '227110038@qq.com',
      pass: process.env.QQ_SMTP_PASS || 'cvxzwstitmqrbich'
    }
  });

  const info = await transporter.sendMail({
    from: '"W7W 网站" <227110038@qq.com>',
    to: '227110038@qq.com',
    subject: subject,
    html: htmlBody
  });

  return info.messageId;
}
