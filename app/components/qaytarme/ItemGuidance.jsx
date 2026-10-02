import {ExternalLink, ShieldCheck} from 'lucide-react';
import {Panel} from './ui';

function guidanceFor(item) {
 const name=[item.itemType,item.itemName].filter(Boolean).join(' ').toLowerCase();
 const lost=item.status==='lost';
 if(/prava|haydovchilik|driver.?s? licen|водитель|права/.test(name)) return {
  title:'Haydovchilik guvohnomasi',
  text:lost?'Yo‘qolgan guvohnomani tiklash tartibini tekshiring. Rasmiylashtirish uchun MyGov xizmatidan foydalanishingiz mumkin.':'Topilgan guvohnoma bo‘yicha hududiy YHXX bo‘limiga murojaat qiling. Egasi bilan Buyum Qidiruv yoki asl e’lon orqali bog‘laning.',
  links:lost?[['MyGov: guvohnomani rasmiylashtirish','https://my.gov.uz/uz/service/255'],['Tiklash tartibi','https://gov.uz/oz/advice/765/document/4013']]:[['YHXX rasmiy sayti','https://yhxx.uz/']],
 };
 if(/pasport|passport|паспорт|id[ -]?karta|id[ -]?card|ид.?карта/.test(name)) return {
  title:'Pasport yoki ID karta',
  text:lost?'Yo‘qolgan hujjat haqida tegishli ma’lumotlarni yig‘ish punktiga xabar bering. ID karta olish yoki almashtirish uchun MyGov xizmatini ochishingiz mumkin.':'Topilgan hujjatni hududiy ichki ishlar bo‘limiga topshirish bo‘yicha murojaat qiling. Hujjat raqami va egasining shaxsiy ma’lumotlarini ommaga tarqatmang.',
  links:lost?[['MyGov: ID karta olish yoki almashtirish','https://my.gov.uz/uz/service/378']]:[['Ichki ishlar vazirligi','https://gov.uz/oz/iiv']],
 };
 if(/bank.*karta|plastik|uzcard|humo|visa|mastercard|банк.*карт|пластик/.test(name)) return {
  title:'Bank kartasi',
  text:lost?'Kartani chiqargan bankning rasmiy aloqa markaziga murojaat qilib, kartani bloklashni so‘rang.':'Kartani chiqargan bank filialiga topshiring yoki uning rasmiy aloqa markaziga murojaat qiling. Topilgan kartadan foydalanmang.',
  links:[['Banklar va rasmiy aloqa ma’lumotlari','https://cbu.uz/uz/credit-organizations/banks/']],
 };
 if(/davlat raqam|avto.*(raqam|nomer)|number plate|license plate|госномер|авто.*номер/.test(name)) return {
  title:'Avtomobil davlat raqami',
  text:lost?'Raqamni qayta rasmiylashtirish tartibi bo‘yicha YHXXga murojaat qiling.':'Road24 yoki MyGov AvtoXabar imkoniyatlarini tekshiring. Xabar turlari va egasiga yetib borishi xizmat shartlariga bog‘liq.',
  links:lost?[['YHXX rasmiy sayti','https://yhxx.uz/']]:[['Road24 xizmatini ochish','https://road24.uz/'],['MyGov AvtoXabar haqida','https://gov.uz/oz/advice/765/document/4023']],
 };
 return {title:'Buyumni xavfsiz qaytarish',text:lost?'Buyumning rangi, modeli va alohida belgilarini yozing. Mos kelgan e’lon egasi bilan bog‘lanib, belgilarni solishtiring.':'Egadan faqat o‘zi biladigan belgilarni so‘rang. Buyumni topshirish uchun qulay jamoat joyini kelishing.',links:[]};
}

export default function ItemGuidance({item}) {
 const advice=guidanceFor(item);
 return <Panel title="Buyum turiga qarab yordam"><div className="qm-panel-body"><strong style={{display:'flex',gap:8,alignItems:'center'}}><ShieldCheck size={17}/>{advice.title}</strong><p className="qm-detail-description" style={{margin:'12px 0'}}>{advice.text}</p><div style={{display:'grid',gap:8}}>{advice.links.map(([label,url])=><a key={url} href={url} target="_blank" rel="noopener noreferrer" className="qm-btn"><ExternalLink size={14}/>{label}</a>)}</div>{advice.links.length>0&&<p className="qm-detail-caption" style={{marginTop:10}}>Rasmiy xizmat yangi oynada ochiladi.</p>}</div></Panel>;
}
