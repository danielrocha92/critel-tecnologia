import styles from './Hero.module.css';
import ScrollReveal from '../ScrollReveal/ScrollReveal';

import Typewriter from '../Typewriter/Typewriter';

export default function Hero({ dict, lang }: { dict: any, lang: string }) {
  const typewriterWords = dict.typewriter;

  return (
    <section className={styles.hero}>
      <div className={styles.overlay}></div>
      <div className={`container ${styles.content}`}>
        <ScrollReveal animation="fadeInUp" duration={0.8}>
          <div className={styles.badge}>{dict.badge}</div>
          <h1 className={styles.title}>
            {dict.titlePrefix}<br />
            <span className={styles.typewriterWrapper}>
              <span className={styles.typewriterText}>
                <Typewriter 
                  words={typewriterWords} 
                  typingSpeed={50} 
                  deletingSpeed={25} 
                  pauseTime={1500} 
                />
              </span>
            </span>
          </h1>
          <p className={styles.subtitle}>
            {dict.subtitle}
          </p>
          <div className={styles.actions}>
            <a href={`/${lang}/#formulario`} className={styles.primaryBtn}>
              {dict.primaryBtn}
            </a>
            <a href={`/${lang}/#solucoes`} className={styles.secondaryBtn}>
              {dict.secondaryBtn}
            </a>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
