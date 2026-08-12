import type { Locale } from '../i18n.config';
import pt from './pt.json';
import en from './en.json';
import es from './es.json';

const dictionaries = {
  pt,
  en,
  es,
};

export const getDictionary = async (locale: Locale) => {
  return dictionaries[locale] ?? dictionaries.pt;
};
