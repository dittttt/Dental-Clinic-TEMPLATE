import React, { useState } from 'react';
import { Plus, Minus } from 'lucide-react';
import { FadeIn } from './ui/FadeIn';
import { FaqItem } from '../types';

export const FAQ: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs: FaqItem[] = [
    {
      question: "Do you accept health insurance?",
      answer: "We accept a variety of major health insurance providers. Please bring your card during your visit, or contact us beforehand to verify if your specific provider is covered."
    },
    {
      question: "What payment methods do you accept?",
      answer: "We accept cash, major credit/debit cards, and bank transfers. Installment plans may be available for major orthodontic or cosmetic procedures."
    },
    {
      question: "How long does a typical check-up and cleaning take?",
      answer: "A standard cleaning and check-up usually takes about 45 minutes to an hour. We take our time to ensure a thorough cleaning and comprehensive examination."
    },
    {
      question: "Is the teeth whitening procedure painful?",
      answer: "Most patients experience little to no sensitivity. We use modern, gentle whitening agents that protect your enamel while effectively removing stains."
    }
  ];

  return (
    <section id="faq" className="py-24 bg-white">
      <div className="container mx-auto px-4 max-w-3xl">
        <FadeIn>
          <div className="text-center mb-12">
            <h2 className="text-teal-600 font-bold tracking-wider uppercase text-sm mb-2">Common Questions</h2>
            <h3 className="text-3xl font-serif font-bold text-slate-900">Frequently Asked Questions</h3>
          </div>
        </FadeIn>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <FadeIn key={index} delay={index * 0.1}>
              <div 
                className={`border rounded-2xl transition-all duration-300 ${openIndex === index ? 'border-teal-200 bg-teal-50/50' : 'border-slate-200 bg-white hover:border-teal-200'}`}
              >
                <button
                  onClick={() => setOpenIndex(openIndex === index ? null : index)}
                  className="w-full flex items-center justify-between p-6 text-left"
                >
                  <span className={`font-semibold text-lg ${openIndex === index ? 'text-teal-800' : 'text-slate-800'}`}>
                    {faq.question}
                  </span>
                  {openIndex === index ? (
                    <Minus className="text-teal-600 flex-shrink-0" />
                  ) : (
                    <Plus className="text-slate-400 flex-shrink-0" />
                  )}
                </button>
                <div 
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${openIndex === index ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'}`}
                >
                  <div className="p-6 pt-0 text-slate-600 leading-relaxed">
                    {faq.answer}
                  </div>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
};