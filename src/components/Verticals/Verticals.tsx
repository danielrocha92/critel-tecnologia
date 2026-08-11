import styles from './Verticals.module.css';
import { Cctv, Wifi, Network, Headset, Cpu, CarFront } from 'lucide-react';

export default function Verticals() {
  const cards = [
    {
      title: 'Help Desk com SLA definido',
      description: 'Atendimento remoto com rastreabilidade e alta disponibilidade.',
      icon: <Headset size={46} strokeWidth={1.5} />
    },
    {
      title: 'Equipamentos de Segurança',
      description: 'Câmeras, sensores e gravadores com manutenção e troca incluídas.',
      icon: <Cctv size={46} strokeWidth={1.5} />
    },
    {
      title: 'Cabeamento Estruturado',
      description: 'Redes organizadas, estáveis e com performance garantida.',
      icon: <Network size={46} strokeWidth={1.5} />
    }
  ];

  return (
    <section className={styles.verticals} id="servicos">
      <div className={`container`}>
        <div className={styles.header}>
          <h2 className={styles.title}>Serviços</h2>
        </div>
        
        <div className={styles.grid}>
          {cards.map((card, index) => (
            <div key={index} className={styles.card}>
              <div className={styles.icon}>{card.icon}</div>
              <h3 className={styles.cardTitle}>{card.title}</h3>
              <p className={styles.cardDesc}>{card.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
