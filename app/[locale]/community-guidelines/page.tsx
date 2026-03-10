import { staticPagesContent, supportedLocales } from '@/lib/static-content';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export async function generateStaticParams() {
  return supportedLocales.map(locale => ({ locale }));
}

export default function CommunityGuidelinesPage({ params }: { params: { locale: string } }) {
  const locale = params.locale || 'en';
  const content = staticPagesContent.guidelines[locale as keyof typeof staticPagesContent.guidelines] 
    || staticPagesContent.guidelines.en;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <Header />
      
      <main className="flex-1 max-w-3xl mx-auto px-4 py-12 w-full">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            {content.title}
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            {content.subtitle}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-8">
          <div className="space-y-6">
            {content.rules.map((rule, index) => (
              <div key={index} className="flex gap-4">
                <div className="shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-500 font-bold">
                  {index + 1}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                    {rule.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {rule.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl shadow-lg p-8 text-center text-white">
          <h2 className="text-xl font-bold mb-4">
            {content.contact.title}
          </h2>
          <p className="mb-6 opacity-90">
            {content.contact.desc}
          </p>
          <a
            href={`/${locale}/feedback`}
            className="inline-block px-6 py-3 bg-white text-blue-600 rounded-lg font-medium hover:bg-gray-100 transition-colors"
          >
            {content.contact.cta}
          </a>
        </div>
      </main>

      <Footer />
    </div>
  );
}
