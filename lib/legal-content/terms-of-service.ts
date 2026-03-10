export interface TermsSection {
  title: string;
  content?: string;
  items?: string[];
}

export interface TermsContent {
  title: string;
  lastUpdated: string;
  sections: {
    agreement: TermsSection;
    account: TermsSection;
    conduct: TermsSection;
    content: TermsSection;
    ip: TermsSection;
    disclaimer: TermsSection;
    liability: TermsSection;
    indemnification: TermsSection;
    termination: TermsSection;
    governing: TermsSection;
    changes: TermsSection;
    contact: TermsSection;
  };
}

export const termsOfServiceContent: Record<string, TermsContent> = {
  en: {
    title: "Terms of Service",
    lastUpdated: "Last Updated",
    sections: {
      agreement: {
        title: "Agreement to Terms",
        content: "By accessing or using Slang Home ('the Service'), you agree to be bound by these Terms of Service ('Terms'). If you disagree with any part of the terms, then you may not access the service.",
      },
      account: {
        title: "Accounts and Registration",
        content: "To use certain features of the Service, you may be required to register for an account. You are responsible for maintaining the security of your account and for any activities that occur under your account.",
        items: [
          "You must provide truthful and accurate registration information",
          "You are responsible for maintaining the security of your account credentials",
          "You must immediately notify us of any unauthorized use of your account",
          "You must be at least 13 years old to use the Service",
        ],
      },
      conduct: {
        title: "User Conduct",
        content: "You agree not to engage in any of the following prohibited activities:",
        items: [
          "Using the Service for any illegal purpose or in violation of any laws",
          "Posting content that is harmful, threatening, abusive, harassing, or defamatory",
          "Spamming or sending unsolicited messages to other users",
          "Infringing on the intellectual property rights of others",
          "Interfering with or disrupting the Service or servers",
          "Attempting to gain unauthorized access to the Service or user accounts",
        ],
      },
      content: {
        title: "User Content",
        content: "You retain ownership of any content you submit, post, or display on the Service. However, by submitting content, you grant us a worldwide, non-exclusive, royalty-free license to use, reproduce, modify, and display that content in connection with the Service.",
        items: [
          "You are solely responsible for your content and the consequences of posting it",
          "You represent that you own or have the necessary rights to any content you submit",
          "We reserve the right to remove any content that violates these Terms",
        ],
      },
      ip: {
        title: "Intellectual Property",
        content: "The Service and its original content, features, and functionality are owned by Slang Home and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.",
      },
      disclaimer: {
        title: "Disclaimer of Warranties",
        content: "The Service is provided on an 'AS IS' and 'AS AVAILABLE' basis without any warranties of any kind, whether express or implied. We do not warrant that the Service will be uninterrupted, secure, or error-free.",
      },
      liability: {
        title: "Limitation of Liability",
        content: "Slang Home shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the Service.",
      },
      indemnification: {
        title: "Indemnification",
        content: "You agree to defend, indemnify, and hold harmless Slang Home and its affiliates, officers, agents, and employees from and against any claims, liabilities, damages, judgments, awards, losses, costs, expenses, or fees arising out of or relating to your violation of these Terms or your use of the Service.",
      },
      termination: {
        title: "Termination",
        content: "We may terminate or suspend your account and access to the Service immediately, without prior notice or liability, for any reason whatsoever, including but not limited to:",
        items: [
          "If you breach these Terms",
          "At our sole discretion, with or without cause",
          "Upon written notice to you, which may be via email",
          "Provisions of these Terms that by their nature should survive termination shall survive",
        ],
      },
      governing: {
        title: "Governing Law",
        content: "These Terms shall be governed by and construed in accordance with the laws of the jurisdiction where Slang Home operates, without regard to its conflict of law provisions.",
      },
      changes: {
        title: "Changes to Terms",
        content: "We reserve the right to modify or replace these Terms at any time. If a revision is material, we will provide at least 30 days' notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion.",
      },
      contact: {
        title: "Contact Information",
        content: "If you have any questions about these Terms, please contact us:",
      },
    },
  },
  zh: {
    title: "用户服务协议",
    lastUpdated: "最后更新",
    sections: {
      agreement: {
        title: "协议条款",
        content: "通过访问或使用 Slang Home（'服务'），您同意受本服务条款（'条款'）的约束。如果您不同意任何部分条款，则您不得访问本服务。",
      },
      account: {
        title: "账户和注册",
        content: "要使用服务的某些功能，您可能需要注册账户。您有责任维护账户的安全，并对您账户下发生的任何活动负责。",
        items: [
          "您必须提供真实、准确的注册信息",
          "您有责任维护账户凭证的安全",
          "您必须立即通知我们任何未经授权使用您账户的行为",
          "您必须年满 13 岁才能使用本服务",
        ],
      },
      conduct: {
        title: "用户行为",
        content: "您同意不参与以下任何被禁止的活动：",
        items: [
          "将服务用于任何非法目的或违反任何法律",
          "发布有害、威胁、辱骂、骚扰或诽谤的内容",
          "向其他用户发送垃圾邮件或未经请求的消息",
          "侵犯他人的知识产权",
          "干扰或破坏服务或服务器",
          "试图未经授权访问服务或用户账户",
        ],
      },
      content: {
        title: "用户内容",
        content: "您保留您提交、发布或展示在服务上的任何内容的所有权。但是，通过提交内容，您授予我们全球性、非独占、免版税的许可，以便在服务中使用、复制、修改和展示该内容。",
        items: [
          "您独自对您的内容及发布后果负责",
          "您保证您拥有或拥有提交任何内容的必要权利",
          "我们保留删除任何违反本条款的内容的权利",
        ],
      },
      ip: {
        title: "知识产权",
        content: "服务及其原始内容、功能和功能归 Slang Home 所有，并受国际版权、商标、专利、商业秘密和其他知识产权法保护。",
      },
      disclaimer: {
        title: "免责声明",
        content: "服务按'现状'和'可用'基础提供，不提供任何形式的保证，无论是明示还是暗示。我们不保证服务将不间断、安全或无错误。",
      },
      liability: {
        title: "责任限制",
        content: "Slang Home 不对任何间接、偶然、特殊、后果性或惩罚性损害赔偿承担责任，包括但不限于利润、数据、使用、商誉或其他无形损失的损失，这些损失源于您访问或使用服务或无法访问或使用服务。",
      },
      indemnification: {
        title: "赔偿",
        content: "您同意为 Slang Home 及其关联公司、高管、代理人和员工辩护、赔偿并使其免受因您违反本条款或使用服务而引起或与之相关的任何索赔、责任、损害、判决、损失、成本、费用或费用的损害。",
      },
      termination: {
        title: "终止",
        content: "我们可能会立即终止或暂停您的账户和服务访问权限，无需事先通知或承担责任，原因包括但不限于：",
        items: [
          "如果您违反本条款",
          "由我们自行决定，无论是否有原因",
          "向您发出书面通知，可通过电子邮件",
          "本条款中按其性质应在终止后继续有效的条款应继续有效",
        ],
      },
      governing: {
        title: "管辖法律",
        content: "本条款应受 Slang Home 运营所在司法管辖区的法律管辖并按其解释，不考虑其法律冲突规定。",
      },
      changes: {
        title: "条款变更",
        content: "我们保留随时修改或替换本条款的权利。如果修订是实质性的，我们将在新条款生效前至少提前 30 天发出通知。什么构成实质性变更将由我们自行决定。",
      },
      contact: {
        title: "联系信息",
        content: "如果您对这些条款有任何疑问，请联系我们：",
      },
    },
  },
};
