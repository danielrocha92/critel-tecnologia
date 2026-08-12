'use client';

import { useState } from 'react';
import styles from './ContactForm.module.css';
import ScrollReveal from '../ScrollReveal/ScrollReveal';

export default function ContactForm({ dict }: { dict: any }) {
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
          <h2 className={styles.title}>{dict.title}</h2>
          <p className={styles.subtitle}>{dict.subtitle}</p>
        </ScrollReveal>
        
        <div className={styles.formWrapper}>
          <ScrollReveal animation="fadeInUp" delay={0.2}>
            <form className={styles.form} onSubmit={handleSubmit}>
              <div className={styles.formGroup}>
                <label htmlFor="name">{dict.labels.name}</label>
                <input type="text" id="name" name="name" placeholder={dict.placeholders.name} required value={formData.name} onChange={handleChange} />
              </div>
              
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="role">{dict.labels.role}</label>
                  <input type="text" id="role" name="role" placeholder={dict.placeholders.role} required value={formData.role} onChange={handleChange} />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="company">{dict.labels.company}</label>
                  <input type="text" id="company" name="company" placeholder={dict.placeholders.company} required value={formData.company} onChange={handleChange} />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="email">{dict.labels.email}</label>
                <input type="email" id="email" name="email" placeholder={dict.placeholders.email} required value={formData.email} onChange={handleChange} />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="challenge">{dict.labels.challenge}</label>
                <textarea id="challenge" name="challenge" rows={4} placeholder={dict.placeholders.challenge} required value={formData.challenge} onChange={handleChange}></textarea>
              </div>

              <button type="submit" className={styles.submitBtn}>
                {dict.submitBtn}
              </button>
            </form>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
