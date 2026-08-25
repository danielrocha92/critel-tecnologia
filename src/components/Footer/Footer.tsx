'use client';

import { useState, useEffect } from 'react';
import styles from './Footer.module.css';
import Link from 'next/link';
import { MapPin, Phone, Mail, Clock, MessageSquare, ShieldCheck } from 'lucide-react';

const LinkedinIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.45a1.6 1.6 0 0 0-1.6 1.6 1.6 1.6 0 0 0 1.6 1.6 1.6 1.6 0 0 0 1.6-1.6 1.6 1.6 0 0 0-1.6-1.6z" /></svg>
);

const InstagramIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
);

const FacebookIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" /></svg>
);

const WhatsappIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
);

export default function Footer({ dict, lang }: { dict: any, lang: string }) {
  const [year, setYear] = useState<number | string>("");

  useEffect(() => {
    setYear(new Date().getFullYear());
  }, []);

  return (
    <footer className={styles.footer} id="contato">
      <div className={`container ${styles.container}`}>

        {/* Coluna 1: Marca, Descrição e Redes Sociais */}
        <div className={styles.column}>
          <div className={styles.brandWrapper}>
            <img src="/400PngdpiLogoCropped.png" alt="Critel Tecnologia" className={styles.logoImage} />
          </div>
          <p className={styles.brandDesc}>
            {dict.brandDesc}
          </p>
          <div className={styles.socialRow}>
            <a
              href="https://www.linkedin.com/in/critel-tecnologia-3802a2363/"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.socialBtn}
              aria-label="LinkedIn"
            >
              <LinkedinIcon />
            </a>
            <a
              href="https://www.instagram.com/criteltecnologia/"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.socialBtn}
              aria-label="Instagram"
            >
              <InstagramIcon />
            </a>
            <a
              href="https://www.facebook.com/criteltecnologia"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.socialBtn}
              aria-label="Facebook"
            >
              <FacebookIcon />
            </a>
          </div>
        </div>

        {/* Coluna 2: Serviços */}
        <div className={styles.column}>
          <h4 className={styles.colTitle}>{dict.servicesTitle}</h4>
          <ul className={styles.linkList}>
            <li>
              <Link href={`/${lang}/solucoes/suporte-ti-empresarial`}>
                {dict.services.support}
              </Link>
            </li>
            <li>
              <Link href={`/${lang}/solucoes/cabeamento-estruturado`}>
                {dict.services.cabling}
              </Link>
            </li>
            <li>
              <Link href={`/${lang}/solucoes/ativos-de-rede`}>
                {dict.services.network}
              </Link>
            </li>
            <li>
              <Link href={`/${lang}/solucoes/seguranca-da-informacao`}>
                {dict.services.security}
              </Link>
            </li>
            <li>
              <Link href={`/${lang}/solucoes/tecnologia-predial`}>
                {dict.services.building}
              </Link>
            </li>
            <li>
              <Link href={`/${lang}/solucoes/field-services`}>
                {dict.services.field}
              </Link>
            </li>
          </ul>
        </div>

        {/* Coluna 3: Institucional */}
        <div className={styles.column}>
          <h4 className={styles.colTitle}>{dict.institutionalTitle}</h4>
          <ul className={styles.linkList}>
            <li>
              <Link href={`/${lang}/sobre`}>
                {dict.institutional.about}
              </Link>
            </li>
            <li>
              <Link href={`/${lang}/sobre/certificacoes-e-premios`}>
                {dict.institutional.certifications || 'Certificações e Prêmios'}
              </Link>
            </li>
            <li>
              <Link href={`/${lang}/clientes`}>
                {dict.institutional.clients}
              </Link>
            </li>
            <li>
              <Link href={`/${lang}/#metodologia`}>
                {dict.institutional.methodology}
              </Link>
            </li>
            <li>
              <Link href={`/${lang}/contato`}>
                {dict.institutional.contact}
              </Link>
            </li>
            <li>
              <Link href={`/${lang}/privacidade`}>
                {dict.institutional.privacy}
              </Link>
            </li>
            <li>
              <Link href={`/${lang}/termos`}>
                {dict.institutional.terms}
              </Link>
            </li>
          </ul>
        </div>

        {/* Coluna 4: Contato */}
        <div className={styles.column}>
          <h4 className={styles.colTitle}>{dict.contactTitle}</h4>
          <ul className={styles.contactList}>
            <li className={styles.contactItem}>
              <MapPin size={17} className={styles.contactIcon} />
              <span>{dict.contact.address}</span>
            </li>
            <li className={styles.contactItem}>
              <Phone size={17} className={styles.contactIcon} />
              <a href="tel:+551131362592">{dict.contact.phone}</a>
            </li>
            <li className={styles.contactItem}>
              <WhatsappIcon className={styles.contactIcon} />
              <a
                href="https://wa.me/5511996839480?text=Ol%C3%A1!%20Vim%20pelo%20site%20da%20Critel%20e%20gostaria%20de%20um%20atendimento."
                target="_blank"
                rel="noopener noreferrer"
              >
                {dict.contact.whatsapp}
              </a>
            </li>
            <li className={styles.contactItem}>
              <Mail size={17} className={styles.contactIcon} />
              <a href="mailto:comercial@criteltecnologia.com.br">{dict.contact.email}</a>
            </li>
            <li className={styles.contactItem}>
              <Clock size={17} className={styles.contactIcon} />
              <span>{dict.contact.hours}</span>
            </li>
          </ul>
        </div>

      </div>

      {/* Barra Inferior */}
      <div className={styles.bottomBar}>
        <div className={`container ${styles.bottomBarContent}`}>
          <p>&copy; {year || 2026} {dict.rights}</p>
          <div className={styles.madeByWrapper}>
            <span>{dict.madeBy || "Feito por:"}</span>
            <a
              href="https://rocha-tech-solutions.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.rochaTechLink}
              title="Desenvolvido por Rocha Tech Solutions"
              aria-label="Rocha Tech Solutions"
            >
              <img
                src="/rocha-tech-logo.png"
                alt="Rocha Tech Solutions"
                className={styles.rochaTechLogo}
              />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
