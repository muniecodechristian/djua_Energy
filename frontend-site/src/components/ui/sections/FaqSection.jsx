import { motion, useReducedMotion } from "framer-motion";
import { ChevronDown } from "lucide-react";

const questions = [
  {
    question: "Le solaire peut-il couvrir tous mes besoins en énergie ?",
    answer:
      "Cela dépend de votre consommation, de vos équipements et des conditions du site. Une étude permet d’estimer la production et le stockage adaptés à vos priorités.",
  },
  {
    question: "Est-ce adapté à une maison comme à une entreprise ?",
    answer:
      "Oui. Les besoins d’un foyer, d’un commerce ou d’un site isolé ne sont pas les mêmes : la solution se construit à partir de vos usages et des contraintes de votre installation.",
  },
  {
    question: "Ai-je forcément besoin de batteries ?",
    answer:
      "Pas nécessairement. Le choix du stockage dépend de vos horaires de consommation, du niveau d’autonomie recherché et de votre budget. Nous vous aidons à comparer les options.",
  },
  {
    question: "L’accompagnement continue-t-il après l’installation ?",
    answer:
      "Le suivi fait partie de l’approche Djua. Les modalités sont définies selon votre projet et la solution retenue, pour vous aider à garder une bonne visibilité sur votre installation.",
  },
];

export default function FaqSection() {
  const prefersReducedMotion = useReducedMotion();
  const initial = prefersReducedMotion ? false : { opacity: 0, y: 16 };

  return (
    <section
      id="questions"
      className="scroll-mt-20 bg-white px-5 py-16 sm:px-8 sm:py-20 lg:px-10 lg:py-24"
    >
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
        <motion.div
          initial={initial}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.5 }}
          className="max-w-xl"
        >
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500 sm:text-sm">
            Bon à savoir
          </p>
          <h2 className="mt-3 text-3xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-4xl">
            Vos questions, des réponses concrètes.
          </h2>
          <p className="mt-4 text-sm leading-7 text-slate-600 sm:text-base sm:leading-8">
            Un projet solaire soulève de bonnes questions. Voici les premiers
            repères pour avancer sereinement.
          </p>
          <a
            href="#contact"
            className="mt-6 inline-flex min-h-11 items-center justify-center rounded-full border border-slate-300 px-5 py-2.5 text-sm font-bold text-slate-900 transition hover:border-slate-900 hover:bg-slate-950 hover:text-white"
          >
            Poser une question à Djua
          </a>
        </motion.div>

        <div className="divide-y divide-slate-200 border-y border-slate-200">
          {questions.map(({ question, answer }, index) => (
            <motion.details
              key={question}
              initial={initial}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.4, delay: prefersReducedMotion ? 0 : index * 0.05 }}
              className="group py-5 sm:py-6"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-5 text-left text-base font-bold text-slate-900 marker:hidden sm:text-lg">
                {question}
                <ChevronDown
                  size={19}
                  aria-hidden="true"
                  className="shrink-0 text-slate-500 transition-transform duration-200 group-open:rotate-180 motion-reduce:transition-none"
                />
              </summary>
              <p className="max-w-2xl pr-8 pt-4 text-sm leading-7 text-slate-600 sm:text-base">
                {answer}
              </p>
            </motion.details>
          ))}
        </div>
      </div>
    </section>
  );
}
