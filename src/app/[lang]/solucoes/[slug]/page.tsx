import { notFound } from 'next/navigation';
import styles from './Solution.module.css';
import ScrollReveal from '@/components/ScrollReveal/ScrollReveal';
import { getDictionary } from '@/dictionaries';

const solutions = {
  'seguranca-da-informacao': {
    title: 'Segurança da Informação',
    description: 'Proteção completa e avançada para os dados críticos da sua operação. Mitigamos riscos e garantimos a continuidade do seu negócio.',
    detailedText: 'No cenário corporativo atual, a proteção de dados não é apenas uma necessidade técnica, mas um pilar estratégico. Nossas soluções de Segurança da Informação são baseadas nas tecnologias líderes do Quadrante Mágico do Gartner, oferecendo defesa em múltiplas camadas contra ameaças cibernéticas. Desde a auditoria inicial até a implementação de políticas de acesso Zero Trust, nossa equipe atua proativamente para identificar vulnerabilidades e blindar sua infraestrutura contra invasões, ransomware e vazamentos de dados.',
    features: ['Firewalls de Próxima Geração (NGFW)', 'Controle de Acessos de Rede (NAC)', 'Prevenção de Intrusões (IPS/IDS)', 'Auditoria, Compliance e LGPD', 'Proteção de Endpoints (EDR/XDR)'],
    image: '/images/seguranca.png',
  },
  'ativos-de-rede': {
    title: 'Ativos de Rede',
    description: 'Conectividade ininterrupta e alta performance com equipamentos de ponta para suportar o crescimento da sua empresa.',
    detailedText: 'A espinha dorsal de qualquer operação moderna é a sua rede de dados. Fornecemos e configuramos Ativos de Rede de alta disponibilidade que garantem que sua comunicação e seus sistemas de missão crítica nunca parem. Trabalhamos com roteamento inteligente, switching de alta densidade e conectividade wireless de última geração (Wi-Fi 6). Nossa consultoria ajuda a dimensionar exatamente o equipamento que você precisa, otimizando o seu investimento (ROI) e garantindo escalabilidade futura.',
    features: ['Switches Gerenciáveis L2/L3', 'Roteadores de Alta Capacidade', 'Redes Wireless Enterprise (Wi-Fi 6)', 'Balanceadores de Carga', 'SD-WAN e Conectividade Segura'],
    image: '/images/rede.png',
  },
  'tecnologia-predial': {
    title: 'Tecnologia Predial',
    description: 'Inteligência e segurança física integradas em um único ecossistema para ambientes corporativos e industriais.',
    detailedText: 'Transformamos espaços tradicionais em ambientes inteligentes e altamente seguros. Nossa vertical de Tecnologia Predial integra todos os sistemas vitais do seu edifício: desde o controle rigoroso de quem entra e sai, até o monitoramento por vídeo analítico e sistemas de alarme de incêndio. Com a automação predial (BMS), sua empresa não apenas ganha em segurança patrimonial, mas também em eficiência energética e gestão centralizada, reduzindo custos operacionais de forma significativa.',
    features: ['Monitoramento por CFTV com IA', 'Controle de Acesso Biométrico e Facial', 'Sistemas de Alarme e Detecção de Incêndio (SDAI)', 'Automação Predial (BMS)', 'Sonorização e Comunicação Visual'],
    image: '/images/predial.png',
  },
  'cabeamento-estruturado': {
    title: 'Cabeamento Estruturado',
    description: 'A base física de alta confiabilidade para transmissão de dados, voz e imagem na sua infraestrutura.',
    detailedText: 'Um sistema de TI só é tão forte quanto a sua infraestrutura física. Nossa equipe de engenharia projeta e executa soluções de Cabeamento Estruturado seguindo as mais rigorosas normas internacionais (EIA/TIA, ISO, ABNT). Seja em cabo metálico (Cat6, Cat6A) ou em fibra óptica de altíssima velocidade, garantimos uma rede organizada, documentada e livre de gargalos. Entregamos desde a montagem completa de Data Centers até o cabeamento horizontal de escritórios, sempre com certificação e garantia de performance.',
    features: ['Projetos e Execução de Rede Lógica', 'Certificação de Redes (Fluke Networks)', 'Montagem de Racks e Data Centers', 'Lançamento e Fusão de Fibra Óptica', 'As-built e Documentação Técnica'],
    image: '/images/cabeamento.png',
  }
};

export default async function SolutionPage({ params }: { params: Promise<{ slug: string, lang: string }> }) {
  const resolvedParams = await params;
  const dict = await getDictionary(resolvedParams.lang as any);
  
  // Acessa as soluções traduzidas
  const solutions = dict.solutionsData as Record<string, any>;
  const solution = solutions[resolvedParams.slug];

  if (!solution) {
    notFound();
  }

  // Fallback se a imagem não estiver no dicionário (pois não coloquei as imagens no dict)
  const imageMap: Record<string, string> = {
    'seguranca-da-informacao': '/images/seguranca.png',
    'ativos-de-rede': '/images/rede.png',
    'tecnologia-predial': '/images/predial.png',
    'cabeamento-estruturado': '/images/cabeamento.png'
  };

  return (
    <div className={styles.pageContainer}>
      <section className={styles.hero}>
        <div className="container">
          <ScrollReveal animation="fadeInUp">
            <div className={styles.badge}>{dict.solutionPage.badge}</div>
            <h1 className={styles.title}>{solution.title}</h1>
            <p className={styles.subtitle}>{solution.description}</p>
          </ScrollReveal>
        </div>
      </section>

      <section className={styles.contentSection}>
        <div className="container">
          <div className={styles.grid}>
            <ScrollReveal animation="fadeInLeft" className={styles.textContent}>
              <h2>{dict.solutionPage.overview}</h2>
              <p>
                {solution.detailedText}
              </p>
              <h3 className={styles.featuresTitle}>{dict.solutionPage.featuresTitle}</h3>
              <ul className={styles.featureList}>
                {solution.features.map((feat: string, idx: number) => (
                  <li key={idx}>
                    <span className={styles.checkIcon}>✓</span> {feat}
                  </li>
                ))}
              </ul>
            </ScrollReveal>
            <ScrollReveal animation="fadeInRight" className={styles.imageContent}>
              <img src={imageMap[resolvedParams.slug]} alt={solution.title} className={styles.image} />
            </ScrollReveal>
          </div>
        </div>
      </section>
    </div>
  );
}
