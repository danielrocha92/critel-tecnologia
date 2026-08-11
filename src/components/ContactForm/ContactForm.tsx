'use client';

import { useState } from 'react';
import styles from './ContactForm.module.css';
import ScrollReveal from '../ScrollReveal/ScrollReveal';

export default function ContactForm() {
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    company: '',
    email: '',
    challenge: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Construct WhatsApp message
    const phoneNumber = "5511996839480"; // The phone number from previous context
    const message = `Olá, gostaria de solicitar um diagnóstico gratuito!
    
*Nome:* ${formData.name}
*Cargo:* ${formData.role}
*Empresa:* ${formData.company}
*E-mail:* ${formData.email}

*Desafio atual em TI:*
${formData.challenge}`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
    
    window.open(whatsappUrl, '_blank');
  };

  return (
    <section className={styles.contactFormSection} id="formulario">
      <div className={`container ${styles.container}`}>
        <ScrollReveal animation="fadeInUp" className={styles.header}>
          <h2 className={styles.title}>Vamos entender seu cenário e propor uma solução técnica personalizada, sem compromisso.</h2>
          <p className={styles.subtitle}>Atendimento consultivo • Resposta em até 24h úteis • Sem compromisso</p>
        </ScrollReveal>
        
        <div className={styles.formWrapper}>
          <ScrollReveal animation="fadeInUp" delay={200}>
            <form className={styles.form} onSubmit={handleSubmit}>
              <div className={styles.formGroup}>
                <label htmlFor="name">Nome completo</label>
                <input type="text" id="name" name="name" placeholder="Como podemos chamar você?" required value={formData.name} onChange={handleChange} />
              </div>
              
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="role">Cargo</label>
                  <input type="text" id="role" name="role" placeholder="Ex: Diretor de TI, Gerente..." required value={formData.role} onChange={handleChange} />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="company">Nome da empresa</label>
                  <input type="text" id="company" name="company" placeholder="Sua empresa" required value={formData.company} onChange={handleChange} />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="email">E-mail corporativo</label>
                <input type="email" id="email" name="email" placeholder="seu.nome@empresa.com.br" required value={formData.email} onChange={handleChange} />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="challenge">Qual seu desafio atual em TI?</label>
                <textarea id="challenge" name="challenge" rows={4} placeholder="Conte-nos brevemente o que precisa resolver..." required value={formData.challenge} onChange={handleChange}></textarea>
              </div>

              <button type="submit" className={styles.submitBtn}>
                Solicitar Diagnóstico Gratuito pelo WhatsApp
              </button>
            </form>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
