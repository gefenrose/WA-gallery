export const translations = {
  appName: "יוצר אלבומי WhatsApp",
  importTitle: "ייבוא קובץ ZIP מ-WhatsApp",
  importHelp: "גררו לכאן קובץ ZIP שיוצא מ-WhatsApp, או לחצו לבחירה.",
  chooseZip: "בחירת קובץ ZIP",
  privacy: "ייצוא ה-WhatsApp מעובד מקומית בדפדפן ואינו מועלה לשום מקום.",
  ready: "מוכן לייבוא",
  loading: "קורא את ה-ZIP מקומית...",
  parsed: "האלבום מוכן",
  allPhotos: "כל המדיה",
  withCaptions: "עם כיתוב",
  missingCaptions: "חסר כיתוב",
  sender: "שולח/ת",
  allSenders: "כל השולחים",
  exportAlbum: "ייצוא אלבום אישי",
  exportingAlbum: "מייצא אלבום אישי...",
  exportedAlbum: "האלבום האישי מוכן להורדה",
  exportAlbumDisabled: "ייבאו ZIP כדי לייצא אלבום אישי",
  noItems: "אין פריטי מדיה שמתאימים לסינון הנוכחי.",
  caption: "כיתוב",
  addCaption: "הוספת כיתוב...",
  confidence: "רמת התאמה",
  high: "גבוהה",
  medium: "בינונית",
  low: "נמוכה",
  noChat: "לא נמצא בקובץ ה-ZIP קובץ _chat.txt או קובץ טקסט של הצ'אט.",
  noMedia: "לא נמצאו תמונות או סרטונים בקובץ ה-ZIP.",
  noMessages: "לא ניתן היה לפענח הודעות מטקסט הצ'אט.",
  badZip: "לא ניתן לקרוא את קובץ ה-ZIP. בחרו קובץ ייצוא תקין מ-WhatsApp.",
  itemsFound: "פריטי מדיה נמצאו",
  privacyTitle: "פרטיות קודם",
  privacyBullets: "עיבוד מקומי בלבד|בלי העלאות ובלי מעקב|עובד גם אחרי טעינה",
  mediaKindImage: "תמונה",
  mediaKindVideo: "סרטון",
  viewerTitle: "תצוגת מדיה",
  closeViewer: "סגירת תצוגה",
  nextMedia: "המדיה הבאה",
  previousMedia: "המדיה הקודמת",
  noCaption: "אין כיתוב"
};

export type TranslationKey = keyof typeof translations;

export function t(key: TranslationKey) {
  return translations[key];
}
