import React from 'react';
import { Select } from 'antd';
import { GlobalOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import './LanguageSwitcher.css';

const { Option } = Select;

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'es', name: 'Español', flag: '🇪🇸' }
  ];

  const handleLanguageChange = (langCode) => {
    i18n.changeLanguage(langCode);
    localStorage.setItem('language', langCode);
  };

  return (
    <div className="language-switcher">
      <Select
        value={i18n.language}
        onChange={handleLanguageChange}
        suffixIcon={<GlobalOutlined />}
        className="language-select"
        dropdownClassName="language-dropdown"
      >
        {languages.map((lang) => (
          <Option key={lang.code} value={lang.code}>
            <span className="language-option">
              <span className="language-flag">{lang.flag}</span>
              <span className="language-name">{lang.name}</span>
            </span>
          </Option>
        ))}
      </Select>
    </div>
  );
};

export default LanguageSwitcher;
