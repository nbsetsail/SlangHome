/**
 * Static Page Content Management
 * 
 * All static page content is managed in this file
 * Changes take effect after rebuild
 * 
 * Directory:
 * - legal/ Legal documents
 *   - privacyPolicy Privacy Policy
 *   - termsOfService Terms of Service
 *   - cookiePolicy Cookie Policy
 * - about/ About Us
 * - help/ Help Center
 * - guidelines/ Community Guidelines
 */

export const staticPagesContent = {
  
  // ==================== Legal Documents ====================
  legal: {
    privacyPolicy: {
      en: {
        title: "Privacy Policy",
        lastUpdated: "Last Updated: 2026-02-28",
        sections: [
          {
            title: "Introduction",
            content: "SlangHome ('we', 'our', or 'us') respects your privacy and is committed to protecting your personal data. This privacy policy will inform you about how we look after your personal data when you visit our website and tell you about your privacy rights and how the law protects you."
          },
          {
            title: "Information We Collect",
            content: "We may collect, use, store and transfer different kinds of personal data about you:",
            items: [
              "Personal Information: name, email address, username",
              "Usage Data: information about how you use our website",
              "Technical Data: IP address, browser type, time zone",
              "Cookie Data: information collected through cookies"
            ]
          },
          {
            title: "How We Use Your Information",
            content: "We will only use your personal data when the law allows us to:",
            items: [
              "To provide and maintain our service",
              "To improve and optimize our website",
              "To communicate with you about updates and offers",
              "To detect and prevent fraud and security issues",
              "To comply with legal obligations"
            ]
          },
          {
            title: "Data Security",
            content: "We have put in place appropriate security measures to prevent your personal data from being accidentally lost, used or accessed in an unauthorized way, altered or disclosed."
          },
          {
            title: "Your Legal Rights",
            content: "Under certain circumstances, you have rights under data protection laws:",
            items: [
              "Request access to your personal data",
              "Request correction of your personal data",
              "Request deletion of your personal data",
              "Request export of your personal data",
              "Object to processing of your personal data"
            ]
          },
          {
            title: "Contact Us",
            content: "If you have any questions about this privacy policy, please contact us through our feedback page."
          }
        ]
      },
      zh: {
        title: "隐私政策",
        lastUpdated: "最后更新: 2026-02-28",
        sections: [
          {
            title: "引言",
            content: "SlangHome（'我们'）尊重您的隐私，致力于保护您的个人数据。本隐私政策将告知您我们如何处理您的个人数据。"
          },
          {
            title: "我们收集的信息",
            content: "我们可能会收集关于您的不同类型的个人数据：",
            items: [
              "个人信息：姓名、电子邮件地址、用户名",
              "使用数据：有关您如何使用我们网站的信息",
              "技术数据：IP 地址、浏览器类型、时区",
              "Cookie 数据：通过 cookie 收集的信息"
            ]
          },
          {
            title: "我们如何使用您的信息",
            content: "我们只会在法律允许的情况下使用您的个人数据：",
            items: [
              "提供和维护我们的服务",
              "改进和优化我们的网站",
              "就更新和优惠与您沟通",
              "检测和防止欺诈和安全问题",
              "履行法律义务"
            ]
          },
          {
            title: "数据安全",
            content: "我们已采取适当的安全措施，防止您的个人数据被意外丢失、未经授权访问、更改或披露。"
          },
          {
            title: "您的法律权利",
            content: "根据数据保护法，您对个人数据享有以下权利：",
            items: [
              "请求访问您的个人数据",
              "请求更正您的个人数据",
              "请求删除您的个人数据",
              "请求导出您的个人数据",
              "反对处理您的个人数据"
            ]
          },
          {
            title: "联系我们",
            content: "如果您对本隐私政策有任何疑问，请通过我们的反馈页面联系我们。"
          }
        ]
      }
    },

    termsOfService: {
      en: {
        title: "Terms of Service",
        lastUpdated: "Last Updated: 2026-02-28",
        sections: [
          {
            title: "Acceptance of Terms",
            content: "By accessing and using SlangHome, you accept and agree to be bound by the terms and provision of this agreement."
          },
          {
            title: "User Responsibilities",
            content: "As a user of SlangHome, you agree to:",
            items: [
              "Provide accurate and truthful information",
              "Not submit harmful, offensive, or illegal content",
              "Respect the rights of other users",
              "Not attempt to disrupt or damage the service"
            ]
          },
          {
            title: "Content Guidelines",
            content: "All content submitted to SlangHome must be original or properly attributed. We reserve the right to remove any content that violates our guidelines."
          },
          {
            title: "Intellectual Property",
            content: "The content, features, and functionality of SlangHome are owned by us and are protected by international copyright, trademark, and other intellectual property laws."
          },
          {
            title: "Limitation of Liability",
            content: "SlangHome shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of the service."
          },
          {
            title: "Changes to Terms",
            content: "We reserve the right to modify these terms at any time. We will notify users of any material changes by posting the new terms on this page."
          }
        ]
      },
      zh: {
        title: "服务条款",
        lastUpdated: "最后更新: 2026-02-28",
        sections: [
          {
            title: "接受条款",
            content: "通过访问和使用 SlangHome，您接受并同意受本协议条款的约束。"
          },
          {
            title: "用户责任",
            content: "作为 SlangHome 的用户，您同意：",
            items: [
              "提供准确和真实的信息",
              "不提交有害、冒犯性或非法内容",
              "尊重其他用户的权利",
              "不试图干扰或损害服务"
            ]
          },
          {
            title: "内容准则",
            content: "提交给 SlangHome 的所有内容必须是原创的或正确归属的。我们保留删除任何违反我们准则的内容的权利。"
          },
          {
            title: "知识产权",
            content: "SlangHome 的内容、特性和功能归我们所有，受国际版权、商标和其他知识产权法的保护。"
          },
          {
            title: "责任限制",
            content: "SlangHome 不对因您使用服务而产生的任何间接、偶然、特殊、后果性或惩罚性损害承担责任。"
          },
          {
            title: "条款变更",
            content: "我们保留随时修改这些条款的权利。我们将通过在此页面上发布新条款来通知用户任何重大变更。"
          }
        ]
      }
    },

    cookiePolicy: {
      en: {
        title: "Cookie Policy",
        lastUpdated: "Last Updated: 2026-02-28",
        sections: [
          {
            title: "What Are Cookies",
            content: "Cookies are small text files that are stored on your computer or mobile device when you visit a website. They are widely used to make websites work more efficiently."
          },
          {
            title: "How We Use Cookies",
            content: "We use cookies for the following purposes:",
            items: [
              "Essential cookies: Required for the website to function properly",
              "Analytics cookies: Help us understand how visitors interact with our website",
              "Preference cookies: Remember your settings and preferences"
            ]
          },
          {
            title: "Managing Cookies",
            content: "You can control and manage cookies in various ways. Please note that removing or blocking cookies can impact your user experience."
          },
          {
            title: "Contact Us",
            content: "If you have any questions about our use of cookies, please contact us through our feedback page."
          }
        ]
      },
      zh: {
        title: "Cookie 政策",
        lastUpdated: "最后更新: 2026-02-28",
        sections: [
          {
            title: "什么是 Cookie",
            content: "Cookie 是您访问网站时存储在您的计算机或移动设备上的小型文本文件。它们被广泛用于使网站更高效地工作。"
          },
          {
            title: "我们如何使用 Cookie",
            content: "我们使用 Cookie 用于以下目的：",
            items: [
              "必要 Cookie：网站正常运行所必需的",
              "分析 Cookie：帮助我们了解访问者如何与我们的网站互动",
              "偏好 Cookie：记住您的设置和偏好"
            ]
          },
          {
            title: "管理 Cookie",
            content: "您可以通过各种方式控制和管理 Cookie。请注意，删除或阻止 Cookie 可能会影响您的用户体验。"
          },
          {
            title: "联系我们",
            content: "如果您对我们使用 Cookie 有任何疑问，请通过我们的反馈页面联系我们。"
          }
        ]
      }
    }
  },

  // ==================== 关于我们 ====================
  about: {
    en: {
      title: "About SlangHome",
      subtitle: "A community of language enthusiasts preserving and celebrating slang culture worldwide",
      story: {
        title: "Our Story",
        paragraphs: [
          "SlangHome was born from a simple idea: slang is more than just informal language—it's a living, breathing reflection of culture, generation, and identity.",
          "We are a group of language enthusiasts, cultural researchers, and curious minds who came together with a shared passion: to document, preserve, and celebrate the colorful world of slang across all languages and cultures.",
          "From street talk to internet memes, from regional dialects to generational expressions, we believe every piece of slang tells a story worth preserving."
        ]
      },
      values: {
        title: "Our Values",
        items: [
          { title: "Cultural Diversity", desc: "We celebrate slang from every corner of the world." },
          { title: "Community First", desc: "SlangHome is built by the community, for the community." },
          { title: "Quality Content", desc: "We strive for accuracy and cultural context." },
          { title: "Cultural Preservation", desc: "We document slang before it disappears." }
        ]
      },
      whatWeDo: {
        title: "What We Do",
        items: [
          "Collect and document slang from languages around the world",
          "Trace the evolution and cultural origins of expressions",
          "Build a community where language lovers can share and learn",
          "Preserve linguistic heritage for future generations"
        ]
      },
      joinUs: {
        title: "Join Our Community",
        desc: "Whether you're a language learner, cultural enthusiast, or just curious about slang, you're welcome here.",
        cta: "Get in Touch"
      }
    },
    zh: {
      title: "关于 SlangHome",
      subtitle: "一群热爱语言文化的人，共同维护和发扬俚语文化",
      story: {
        title: "我们的故事",
        paragraphs: [
          "SlangHome 诞生于一个简单的想法：俚语不仅仅是非正式语言——它是文化、世代和身份的鲜活反映。",
          "我们是一群语言爱好者、文化研究者和充满好奇心的人，因为共同的热爱走到一起：记录、保存和庆祝各语言和文化中丰富多彩的俚语世界。",
          "从街头流行语到网络热词，从地方方言到代际表达，我们相信每一条俚语都有一个值得保存的故事。"
        ]
      },
      values: {
        title: "我们的价值观",
        items: [
          { title: "文化多样性", desc: "我们庆祝来自世界各地的俚语。" },
          { title: "社区优先", desc: "SlangHome 由社区建设，为社区服务。" },
          { title: "优质内容", desc: "我们追求准确性和文化背景。" },
          { title: "文化传承", desc: "我们在俚语消失之前记录它们。" }
        ]
      },
      whatWeDo: {
        title: "我们做什么",
        items: [
          "收集和记录世界各地语言的俚语",
          "追溯表达的演变和文化起源",
          "建立一个语言爱好者可以分享和学习的社区",
          "为后代保存语言遗产"
        ]
      },
      joinUs: {
        title: "加入我们的社区",
        desc: "无论你是语言学习者、文化爱好者，还是对俚语充满好奇，这里都欢迎你。",
        cta: "联系我们"
      }
    }
  },

  // ==================== 帮助中心 ====================
  help: {
    en: {
      title: "Help Center",
      subtitle: "Find answers to common questions and get support",
      categories: [
        {
          title: "Getting Started",
          faqs: [
            { q: "What is SlangHome?", a: "SlangHome is a community-driven platform for discovering, learning, and sharing slang from languages around the world. We aim to preserve and celebrate the colorful diversity of informal language." },
            { q: "Do I need an account to use SlangHome?", a: "You can browse and search slang without an account. However, creating an account allows you to contribute slang, save favorites, leave comments, and participate in community activities." },
            { q: "How do I create an account?", a: "Click the 'Sign In' button in the top right corner, then select 'Register'. You'll need to provide a username, email, and password. We'll send a verification code to your email." },
            { q: "Is SlangHome free to use?", a: "Yes, SlangHome is completely free to use. All features including browsing, searching, contributing, and favorites are available at no cost." }
          ]
        },
        {
          title: "Contributing Slang",
          faqs: [
            { q: "How can I contribute slang?", a: "Click 'Contribute Slang' in the navigation bar. Fill in the phrase, explanation, example usage, and origin. You can also add evolution phases to show how the slang has changed over time." },
            { q: "What happens after I submit slang?", a: "Your submission enters a review queue. Our moderators check for accuracy, appropriateness, and completeness. Once approved, it becomes visible to all users." },
            { q: "Why was my submission rejected?", a: "Common reasons include: duplicate entries, inaccurate information, inappropriate content, or missing required fields. You'll receive feedback on how to improve your submission." },
            { q: "Can I edit my submissions?", a: "Currently, you cannot directly edit approved submissions. However, you can submit corrections through our feedback page, and moderators will review the changes." }
          ]
        },
        {
          title: "Features & Tools",
          faqs: [
            { q: "What is Advanced Search?", a: "Advanced Search lets you filter slang by language, category, tags, date range, and popularity. Access it from the navigation bar or search results page." },
            { q: "How do favorites work?", a: "Click the heart icon on any slang entry to save it to your favorites. Access your favorites from your profile page. Favorites are private to your account." },
            { q: "What are slang evolutions?", a: "Some slang terms have evolved over time. The evolution feature shows how a phrase's meaning, usage, or popularity has changed across different periods." },
            { q: "Can I share slang entries?", a: "Yes! Each slang entry has a share button. You can copy the link or share directly to social media platforms." }
          ]
        },
        {
          title: "Community & Moderation",
          faqs: [
            { q: "How do I become a moderator?", a: "Active community members who contribute quality content and demonstrate good judgment may be invited to become moderators. Express your interest through our feedback page." },
            { q: "How do I report inappropriate content?", a: "Click the report button (flag icon) on any slang entry or comment. Select the reason for your report and provide details if needed. Our team reviews all reports." },
            { q: "What are the community guidelines?", a: "Our community guidelines emphasize respect, accuracy, and helpfulness. Read the full guidelines on our Community Guidelines page." },
            { q: "What languages are supported?", a: "We support slang from many languages including English, Chinese, Spanish, Japanese, Korean, Arabic, French, German, Portuguese, Russian, and more. We're constantly expanding our language coverage." }
          ]
        },
        {
          title: "Account & Privacy",
          faqs: [
            { q: "How do I change my profile information?", a: "Go to your profile page by clicking your avatar in the navigation bar. Click 'Edit Profile' to update your display name, bio, and other settings." },
            { q: "How do I reset my password?", a: "Click 'Sign In', then 'Forgot Password'. Enter your email address and we'll send a password reset link." },
            { q: "Can I delete my account?", a: "Yes. Go to Privacy Settings in the footer, scroll to 'Account Management', and click 'Delete Account'. This action is irreversible." },
            { q: "How is my data used?", a: "We collect minimal data to provide our services. Read our Privacy Policy for details on data collection, usage, and your rights." }
          ]
        }
      ],
      quickLinks: {
        title: "Quick Links",
        items: [
          { label: "Contribute Slang", href: "/contribute" },
          { label: "Community Guidelines", href: "/community-guidelines" },
          { label: "Privacy Policy", href: "/privacy-policy" },
          { label: "Contact Us", href: "/feedback" }
        ]
      }
    },
    zh: {
      title: "帮助中心",
      subtitle: "查找常见问题的答案并获取支持",
      categories: [
        {
          title: "入门指南",
          faqs: [
            { q: "什么是 SlangHome？", a: "SlangHome 是一个社区驱动的平台，用于发现、学习和分享世界各地语言的俚语。我们旨在保存和庆祝非正式语言的丰富多彩。" },
            { q: "我需要注册账户才能使用吗？", a: "您可以无需账户浏览和搜索俚语。但创建账户后可以贡献俚语、收藏、评论和参与社区活动。" },
            { q: "如何创建账户？", a: "点击右上角的'登录'按钮，然后选择'注册'。您需要提供用户名、邮箱和密码。我们会向您的邮箱发送验证码。" },
            { q: "SlangHome 是免费的吗？", a: "是的，SlangHome 完全免费使用。所有功能包括浏览、搜索、贡献和收藏都不收费。" }
          ]
        },
        {
          title: "贡献俚语",
          faqs: [
            { q: "如何贡献俚语？", a: "点击导航栏中的'贡献俚语'。填写短语、解释、示例用法和起源。您还可以添加演变阶段来展示俚语随时间的变化。" },
            { q: "提交后会怎样？", a: "您的提交会进入审核队列。我们的版主会检查准确性、适当性和完整性。批准后，所有用户都能看到。" },
            { q: "为什么我的提交被拒绝了？", a: "常见原因包括：重复条目、信息不准确、内容不当或缺少必填字段。您会收到改进建议的反馈。" },
            { q: "我可以编辑已提交的内容吗？", a: "目前您不能直接编辑已批准的提交。但可以通过反馈页面提交更正，版主会审核修改。" }
          ]
        },
        {
          title: "功能与工具",
          faqs: [
            { q: "什么是高级搜索？", a: "高级搜索让您可以按语言、分类、标签、日期范围和热度筛选俚语。从导航栏或搜索结果页面访问。" },
            { q: "收藏功能如何使用？", a: "点击任何俚语条目上的心形图标即可收藏。从个人资料页面访问您的收藏。收藏仅对您的账户可见。" },
            { q: "什么是俚语演变？", a: "有些俚语会随时间演变。演变功能展示短语的意义、用法或流行度在不同时期的变化。" },
            { q: "我可以分享俚语条目吗？", a: "可以！每个俚语条目都有分享按钮。您可以复制链接或直接分享到社交媒体平台。" }
          ]
        },
        {
          title: "社区与审核",
          faqs: [
            { q: "如何成为版主？", a: "积极贡献优质内容并表现出良好判断力的社区成员可能会被邀请成为版主。通过反馈页面表达您的意愿。" },
            { q: "如何举报不当内容？", a: "点击任何俚语条目或评论上的举报按钮（旗帜图标）。选择举报原因并在需要时提供详情。我们的团队会审核所有举报。" },
            { q: "社区守则是什么？", a: "我们的社区守则强调尊重、准确性和帮助性。在社区守则页面阅读完整内容。" },
            { q: "支持哪些语言？", a: "我们支持多种语言的俚语，包括英语、中文、西班牙语、日语、韩语、阿拉伯语、法语、德语、葡萄牙语、俄语等。我们正在不断扩大语言覆盖范围。" }
          ]
        },
        {
          title: "账户与隐私",
          faqs: [
            { q: "如何修改个人资料？", a: "点击导航栏中的头像进入个人资料页面。点击'编辑资料'更新您的显示名称、简介和其他设置。" },
            { q: "如何重置密码？", a: "点击'登录'，然后点击'忘记密码'。输入您的邮箱地址，我们会发送密码重置链接。" },
            { q: "我可以删除账户吗？", a: "可以。前往页脚的隐私设置，滚动到'账户管理'，点击'删除账户'。此操作不可撤销。" },
            { q: "我的数据如何被使用？", a: "我们收集最少的数据来提供服务。阅读我们的隐私政策了解数据收集、使用和您的权利的详情。" }
          ]
        }
      ],
      quickLinks: {
        title: "快速链接",
        items: [
          { label: "贡献俚语", href: "/contribute" },
          { label: "社区守则", href: "/community-guidelines" },
          { label: "隐私政策", href: "/privacy-policy" },
          { label: "联系我们", href: "/feedback" }
        ]
      }
    }
  },

  // ==================== 社区守则 ====================
  guidelines: {
    en: {
      title: "Community Guidelines",
      subtitle: "Help us maintain a welcoming and respectful community for everyone",
      rules: [
        { title: "Be Respectful", desc: "Treat all community members with respect. Personal attacks or harassment will not be tolerated." },
        { title: "Be Accurate", desc: "When contributing slang, provide accurate definitions and cultural context." },
        { title: "Support the Community", desc: "Help fellow members learn and grow. Share knowledge and provide constructive feedback." },
        { title: "Report Issues", desc: "If you see content that violates our guidelines, please report it." },
        { title: "Prohibited Content", desc: "Hate speech, explicit content, and spam are strictly prohibited." }
      ],
      contact: {
        title: "Have Questions?",
        desc: "If you have any questions about our community guidelines, please reach out to us.",
        cta: "Contact Us"
      }
    },
    zh: {
      title: "社区守则",
      subtitle: "帮助我们为每个人维护一个友好和尊重的社区",
      rules: [
        { title: "保持尊重", desc: "尊重所有社区成员。人身攻击或骚扰将不被容忍。" },
        { title: "确保准确", desc: "在贡献俚语时，请提供准确的定义和文化背景。" },
        { title: "支持社区", desc: "帮助其他成员学习和成长。分享知识，提供建设性反馈。" },
        { title: "举报问题", desc: "如果您看到违反我们准则的内容，请举报。" },
        { title: "禁止内容", desc: "仇恨言论、露骨内容和垃圾信息均严格禁止。" }
      ],
      contact: {
        title: "有问题？",
        desc: "如果您对我们的社区守则有任何疑问，请联系我们。",
        cta: "联系我们"
      }
    }
  }
};

// 支持的语言
export const supportedLocales = ['en', 'zh', 'ja', 'ko', 'es', 'fr', 'de', 'pt', 'ru', 'ar'] as const;
export type SupportedLocale = typeof supportedLocales[number];

// 获取内容的辅助函数
export function getContent<T extends Record<string, any>>(
  content: T,
  locale: string
): T[keyof T] {
  return content[locale as keyof T] || content.en;
}
