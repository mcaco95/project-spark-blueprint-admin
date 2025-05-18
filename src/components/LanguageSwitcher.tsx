
import { useTranslation } from 'react-i18next';
import { Button } from './ui/button';
import { Globe } from 'lucide-react';

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'es' : 'en';
    i18n.changeLanguage(newLang);
  };

  return (
    <Button 
      variant="ghost" 
      size="icon" 
      onClick={toggleLanguage} 
      className="rounded-full"
      aria-label="Change language"
    >
      <Globe className="h-5 w-5" />
      <span className="sr-only">Change Language</span>
      <span className="ml-2 text-xs font-medium">{i18n.language.toUpperCase()}</span>
    </Button>
  );
};

export default LanguageSwitcher;
