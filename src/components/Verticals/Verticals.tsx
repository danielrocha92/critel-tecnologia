import styles from './Verticals.module.css';
import { Cctv, Wifi, Network, ShieldCheck, Building2 } from 'lucide-react';
import Link from 'next/link';

export default function Verticals({ dict, lang }: { dict: any, lang: string }) {
  const cards = [
    {
      title: dict.card1_title,
      description: dict.card1_desc,
      icon: <ShieldCheck size={46} strokeWidth={1.5} />,
      link: `/${lang}/solucoes/seguranca-da-informacao`
    },
    {
      title: dict.card2_title,
      description: dict.card2_desc,
      icon: <Wifi size={46} strokeWidth={1.5} />,
      link: `/${lang}/solucoes/ativos-de-rede`
    },
    {
      title: dict.card3_title,
      description: dict.card3_desc,
      icon: <Network size={46} strokeWidth={1.5} />,
      link: `/${lang}/solucoes/cabeamento-estruturado`
    },
    {
      title: dict.card4_title,
      description: dict.card4_desc,
      icon: <Building2 size={46} strokeWidth={1.5} />,
      link: `/${lang}/solucoes/tecnologia-predial`
    }
  ];

  return (
    <section className={styles.verticals} id="solucoes">
      <div className={`container`}>
        <div className={styles.header}>
          <h2 className={styles.title}>{dict.title}</h2>
        </div>
        
        <div className={styles.grid}>
          {cards.map((card, index) => (
            <Link href={card.link} key={index} className={styles.cardLink}>
              <div className={styles.card}>
                <div className={styles.icon}>{card.icon}</div>
                <h3 className={styles.cardTitle}>{card.title}</h3>
                <p className={styles.cardDesc}>{card.description}</p>
                <div className={styles.cardAction}>{dict.learnMore}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
