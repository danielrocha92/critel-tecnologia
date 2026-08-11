import styles from './Verticals.module.css';
import { Cctv, Wifi, Network, ShieldCheck, Building2 } from 'lucide-react';
import Link from 'next/link';

export default function Verticals() {
  const cards = [
    {
      title: 'Segurança da Informação',
      description: 'Proteja os dados da sua empresa com as melhores ferramentas e estratégias do mercado corporativo.',
      icon: <ShieldCheck size={46} strokeWidth={1.5} />,
      link: '/solucoes/seguranca-da-informacao'
    },
    {
      title: 'Ativos de Rede',
      description: 'Conectividade e performance garantidas com equipamentos líderes de mercado para o seu negócio.',
      icon: <Wifi size={46} strokeWidth={1.5} />,
      link: '/solucoes/ativos-de-rede'
    },
    {
      title: 'Cabeamento Estruturado',
      description: 'Redes organizadas, estáveis e com performance garantida para transmissão de voz, dados e imagem.',
      icon: <Network size={46} strokeWidth={1.5} />,
      link: '/solucoes/cabeamento-estruturado'
    },
    {
      title: 'Tecnologia Predial',
      description: 'Projetos completos de CFTV, controle de acesso, biometria e automação para a sua infraestrutura.',
      icon: <Building2 size={46} strokeWidth={1.5} />,
      link: '/solucoes/tecnologia-predial'
    }
  ];

  return (
    <section className={styles.verticals} id="solucoes">
      <div className={`container`}>
        <div className={styles.header}>
          <h2 className={styles.title}>Nossas Soluções</h2>
        </div>
        
        <div className={styles.grid}>
          {cards.map((card, index) => (
            <Link href={card.link} key={index} className={styles.cardLink}>
              <div className={styles.card}>
                <div className={styles.icon}>{card.icon}</div>
                <h3 className={styles.cardTitle}>{card.title}</h3>
                <p className={styles.cardDesc}>{card.description}</p>
                <div className={styles.cardAction}>Saiba mais →</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
