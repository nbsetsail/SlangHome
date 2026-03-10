export interface CookieInfo {
  name: string;
  type: string;
  purpose: string;
  duration: string;
}

export interface CookieSection {
  title: string;
  content?: string;
  items?: string[];
  subsections?: {
    title: string;
    content: string;
  }[];
  cookies?: CookieInfo[];
}

export interface CookieContent {
  title: string;
  lastUpdated: string;
  tableHeaders: {
    name: string;
    type: string;
    purpose: string;
    duration: string;
  };
  sections: {
    what: CookieSection;
    usage: CookieSection;
    types: CookieSection;
    list: CookieSection;
    management: CookieSection;
    updates: CookieSection;
    contact: CookieSection;
  };
}

export const cookiePolicyContent: Record<string, CookieContent> = {
  en: {
    title: "Cookie Policy",
    lastUpdated: "Last Updated",
    tableHeaders: {
      name: "Name",
      type: "Type",
      purpose: "Purpose",
      duration: "Duration",
    },
    sections: {
      what: {
        title: "What Are Cookies",
        content: "Cookies are small text files that are stored on your device (computer, tablet, or mobile) when you visit our website. They help us provide you with a better experience by remembering your preferences and understanding how you use our service.",
      },
      usage: {
        title: "How We Use Cookies",
        content: "We use cookies for the following purposes:",
        items: [
          "Essential: Cookies that are necessary for the operation of our website",
          "Performance: Cookies that help us understand how visitors use our website",
          "Functional: Cookies that allow our website to remember choices you make",
          "Targeting: Cookies that are used to deliver relevant advertisements",
        ],
      },
      types: {
        title: "Types of Cookies We Use",
        subsections: [
          {
            title: "Session Cookies",
            content: "Temporary cookies that are deleted when you close your browser",
          },
          {
            title: "Persistent Cookies",
            content: "Cookies that remain on your device for a set period or until you delete them",
          },
          {
            title: "First-Party Cookies",
            content: "Cookies set by our website directly",
          },
          {
            title: "Third-Party Cookies",
            content: "Cookies set by third parties such as analytics providers",
          },
        ],
      },
      list: {
        title: "Cookies We Use",
        cookies: [
          {
            name: "next-auth.session-token",
            type: "Essential",
            purpose: "Authentication",
            duration: "30 days",
          },
          {
            name: "color-theme",
            type: "Functional",
            purpose: "UI Preference",
            duration: "1 year",
          },
          {
            name: "locale",
            type: "Functional",
            purpose: "Language",
            duration: "1 year",
          },
          {
            name: "cookie-consent",
            type: "Essential",
            purpose: "Consent Status",
            duration: "1 year",
          },
          {
            name: "_ga",
            type: "Analytics",
            purpose: "Google Analytics",
            duration: "2 years",
          },
        ],
      },
      management: {
        title: "Managing Cookies",
        content: "You can manage cookies in the following ways:",
        items: [
          "Browser Settings: Most browsers allow you to control cookies through their settings",
          "Withdraw Consent: You can withdraw your consent at any time in your privacy settings",
          "Third-Party Cookies: You can opt-out of third-party cookies through their respective websites",
        ],
      },
      updates: {
        title: "Updates to This Policy",
        content: "We may update this Cookie Policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the 'Last Updated' date.",
      },
      contact: {
        title: "Contact Us",
        content: "If you have any questions about our use of cookies, please contact us:",
      },
    },
  },
  zh: {
    title: "Cookie 政策",
    lastUpdated: "最后更新",
    tableHeaders: {
      name: "名称",
      type: "类型",
      purpose: "用途",
      duration: "有效期",
    },
    sections: {
      what: {
        title: "什么是 Cookie",
        content: "Cookie 是当您访问我们的网站时存储在您的设备（电脑、平板或手机）上的小型文本文件。它们通过记住您的偏好并了解您如何使用我们的服务来帮助您获得更好的体验。",
      },
      usage: {
        title: "我们如何使用 Cookie",
        content: "我们将 Cookie 用于以下目的：",
        items: [
          "必要：对网站运营所必需的 Cookie",
          "性能：帮助我们了解访问者如何使用网站的 Cookie",
          "功能：允许我们的网站记住您选择的 Cookie",
          "定向：用于投放相关广告的 Cookie",
        ],
      },
      types: {
        title: "我们使用的 Cookie 类型",
        subsections: [
          {
            title: "会话 Cookie",
            content: "在您关闭浏览器时删除的临时 Cookie",
          },
          {
            title: "持久性 Cookie",
            content: "在设备上保留设定时间段或直到您删除的 Cookie",
          },
          {
            title: "第一方 Cookie",
            content: "由我们的网站直接设置的 Cookie",
          },
          {
            title: "第三方 Cookie",
            content: "由分析提供商等第三方设置的 Cookie",
          },
        ],
      },
      list: {
        title: "我们使用的 Cookie",
        cookies: [
          {
            name: "next-auth.session-token",
            type: "必要",
            purpose: "身份验证",
            duration: "30 天",
          },
          {
            name: "color-theme",
            type: "功能",
            purpose: "界面偏好",
            duration: "1 年",
          },
          {
            name: "locale",
            type: "功能",
            purpose: "语言",
            duration: "1 年",
          },
          {
            name: "cookie-consent",
            type: "必要",
            purpose: "同意状态",
            duration: "1 年",
          },
          {
            name: "_ga",
            type: "分析",
            purpose: "Google 分析",
            duration: "2 年",
          },
        ],
      },
      management: {
        title: "管理 Cookie",
        content: "您可以通过以下方式管理 Cookie：",
        items: [
          "浏览器设置：大多数浏览器允许您通过其设置控制 Cookie",
          "撤回同意：您可以随时在隐私设置中撤回同意",
          "第三方 Cookie：您可以通过各自的网站选择退出第三方 Cookie",
        ],
      },
      updates: {
        title: "本政策的更新",
        content: "我们可能会不时更新本 Cookie 政策。我们将通过在此页面上发布新政策并更新'最后更新'日期来通知您任何更改。",
      },
      contact: {
        title: "联系我们",
        content: "如果您对我们使用 Cookie 有任何疑问，请联系我们：",
      },
    },
  },
};
