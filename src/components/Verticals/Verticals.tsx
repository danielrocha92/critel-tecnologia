import styles from './Verticals.module.css';
import { Cctv, Wifi, Network, Headset, Cpu, CarFront } from 'lucide-react';

export default function Verticals() {
  const cards = [
    {
      title: 'Segurança Eletrônica - CFTV',
      description: 'Monitoramento eficaz do interior e exterior de empresas, condomínios empresariais e residenciais e galpões de armazenagem.',
      icon: <Cctv size={46} strokeWidth={1.5} />
    },
    {
      title: 'Wi-Fi Social',
      description: 'O Wi-Fi Social pode ser usado por estabelecimentos comerciais, como restaurantes, clínicas, hotéis, escolas, universidades, entre outros.',
      icon: <Wifi size={46} strokeWidth={1.5} />
    },
    {
      title: 'Cabeamento de Rede',
      description: 'Ideal para organizar e padronizar sua rede de dados e telecomunicações, permitindo uma ligação eficiente a toda a infraestrutura.',
      icon: <Network size={46} strokeWidth={1.5} />
    },
    {
      title: 'Service Desk & Field Services',
      description: 'Para centralização das demandas de suporte de TI, possuímos uma oferta de Service Desk e Field Services para todo o território nacional.',
      icon: <Headset size={46} strokeWidth={1.5} />
    },
    {
      title: 'Outsourcing',
      description: 'Adotar o Outsourcing de TI permite que sua empresa tenha especialistas cuidando de toda a operação, garantindo segurança contínua.',
      icon: <Cpu size={46} strokeWidth={1.5} />
    },
    {
      title: 'Automação de Estacionamento',
      description: 'Facilita o contato com fornecedores e a padronização de serviços, gerando maior qualidade das funções prestadas.',
      icon: <CarFront size={46} strokeWidth={1.5} />
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
