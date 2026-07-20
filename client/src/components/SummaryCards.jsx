import { Activity, CheckCheck, Flame, Target } from 'lucide-react';

const cards = [
  {
    key: 'totalHabits',
    label: 'Habilidades ativas',
    icon: Target,
    formatter: (value) => value ?? 0,
  },
  {
    key: 'completionRate',
    label: 'Taxa de conclusao',
    icon: Activity,
    formatter: (value) => `${value ?? 0}%`,
  },
  {
    key: 'totalDone',
    label: 'Dias concluidos',
    icon: CheckCheck,
    formatter: (value) => value ?? 0,
  },
  {
    key: 'bestStreak',
    label: 'Melhor sequencia',
    icon: Flame,
    formatter: (value) => `${value ?? 0} dias`,
  },
];

export default function SummaryCards({ summary }) {
  return (
    <section className="summary-grid" aria-label="Resumo do mes">
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <article key={card.key} className="summary-card">
            <div className="summary-card__icon">
              <Icon size={18} />
            </div>
            <div>
              <p className="summary-card__label">{card.label}</p>
              <strong className="summary-card__value">
                {card.formatter(summary?.[card.key])}
              </strong>
            </div>
          </article>
        );
      })}
    </section>
  );
}
