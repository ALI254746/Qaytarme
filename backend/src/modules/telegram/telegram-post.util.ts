import {normalizeUzbekText} from '../../utils/text-normalization.util';
export function telegramBatchKey(message:{id?:unknown;groupedId?:unknown}):string {
 return message.groupedId ? 'album:'+String(message.groupedId) : 'post:'+String(message.id);
}
export function isLostFoundPost(text:string):boolean {
 const value=normalizeUzbekText(text).replace(/'/g,'');
 if(/\b(yoqol\w*|yoqal\w*|topil\w*|topib|tushirib|qoldirib|poter\w*|nayden\w*|nashli|uter\w*|lost|found)\b/i.test(value))return true;
 return /\b(pasport|hujjat|guvohnoma|kalit|hamyon|sumka|telefon|karta|ryukzak)\b/.test(value) && /\b(egasi|egasiga|murojaat|boglan|tel|telefon)\b/.test(value);
}

