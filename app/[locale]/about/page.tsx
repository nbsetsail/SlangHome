import { staticPagesContent, supportedLocales } from '@/lib/static-content';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export async function generateStaticParams() {
  return supportedLocales.map(locale => ({ locale }));
}

export default function AboutPage({ params }: { params: { locale: string } }) {
  const locale = params.locale || 'en';
  const content = staticPagesContent.about[locale as keyof typeof staticPagesContent.about] 
    || staticPagesContent.about.en;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <Header />
      
      <main className="flex-1 max-w-4xl mx-auto px-4 py-12 w-full">
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
              <circle cx="12" cy="12" r="10" className="stroke-blue-400"/>
              <ellipse cx="12" cy="12" rx="10" ry="4" className="stroke-orange-300"/>
              <path d="M12 2c2.5 2.5 4 6 4 10s-1.5 7.5-4 10" className="stroke-green-400"/>
              <path d="M12 2c-2.5 2.5-4 6-4 10s1.5 7.5 4 10" className="stroke-purple-400"/>
              <path d="M2 12h20" className="stroke-gray-400"/>
              <circle cx="12" cy="12" r="2" className="fill-orange-400 stroke-orange-500"/>
            </svg>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            {content.title}
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            {content.subtitle}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            {content.story.title}
          </h2>
          <div className="space-y-4 text-gray-600 dark:text-gray-400 leading-relaxed">
            {content.story.paragraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            {content.values.title}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {content.values.items.map((value, index) => (
              <div key={index} className="flex gap-4">
                <div className="shrink-0 w-12 h-12 flex items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-500 font-bold">
                  {index + 1}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                    {value.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {value.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            {content.whatWeDo.title}
          </h2>
          <div className="space-y-4">
            {content.whatWeDo.items.map((item, index) => (
              <div key={index} className="flex items-start gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mt-0.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <p className="text-gray-600 dark:text-gray-400">{item}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl shadow-lg p-8 text-center text-white">
          <h2 className="text-2xl font-bold mb-4">
            {content.joinUs.title}
          </h2>
          <p className="mb-6 opacity-90">
            {content.joinUs.desc}
          </p>
          <a
            href={`/${locale}/feedback`}
            className="inline-block px-6 py-3 bg-white text-blue-600 rounded-lg font-medium hover:bg-gray-100 transition-colors"
          >
            {content.joinUs.cta}
          </a>
        </div>
      </main>

      <Footer />
    </div>
  );
}
