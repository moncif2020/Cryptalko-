export interface Language {
  code: string;
  name: string;
  englishName: string;
}

export const GLOBAL_LANGUAGES: Language[] = [
  { code: 'ar', name: 'العربية', englishName: 'Arabic' },
  { code: 'he', name: 'עברית', englishName: 'Hebrew' },
  { code: 'en', name: 'English', englishName: 'English' },
  { code: 'es', name: 'Español', englishName: 'Spanish' },
  { code: 'fr', name: 'Français', englishName: 'French' },
  { code: 'de', name: 'Deutsch', englishName: 'German' },
  { code: 'it', name: 'Italiano', englishName: 'Italian' },
  { code: 'ru', name: 'Русский', englishName: 'Russian' },
  { code: 'zh', name: '中文', englishName: 'Chinese' },
  { code: 'ja', name: '日本語', englishName: 'Japanese' },
  { code: 'ko', name: '한국어', englishName: 'Korean' },
  { code: 'tr', name: 'Türkçe', englishName: 'Turkish' },
  { code: 'hi', name: 'हिन्दी', englishName: 'Hindi' },
  { code: 'fa', name: 'فارسی', englishName: 'Persian' },
  { code: 'ur', name: 'اردو', englishName: 'Urdu' },
  { code: 'id', name: 'Bahasa Indonesia', englishName: 'Indonesian' },
  { code: 'pt', name: 'Português', englishName: 'Portuguese' },
  { code: 'vi', name: 'Tiếng Việt', englishName: 'Vietnamese' },
];
