"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getApiUrl } from "@/lib/api-config";
import { useLanguage } from "@/context/LanguageContext";

const CATEGORIES = [
  { id: "electronics", label: "Elektronika" },
  { id: "documents", label: "Hujjatlar" },
  { id: "personal", label: "Shaxsiy buyumlar" },
  { id: "clothing", label: "Kiyim-kechak" },
  { id: "accessories", label: "Aksessuarlar" },
  { id: "keys", label: "Kalitlar" },
  { id: "bags", label: "Sumkalar" },
  { id: "automotive", label: "Avtomobil buyumlari" },
  { id: "kids", label: "Bolalar buyumlari" },
  { id: "sports", label: "Sport anjomlari" },
  { id: "books", label: "Kitoblar" },
  { id: "pets", label: "Uy hayvonlari" },
  { id: "other", label: "Boshqa" },
];

const LeafletMap = dynamic(() => import("./LeafletMap"), {
  ssr: false,
  loading: () => <div className="flex h-full items-center justify-center text-xs text-neutral-500">Xarita yuklanmoqda…</div>,
});

export default function AddItemPage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const { t } = useLanguage();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [requiresLogin, setRequiresLogin] = useState(false);
  const [contactViaPlatform, setContactViaPlatform] = useState(true);
  const [showPhone, setShowPhone] = useState(false);
  const [formData, setFormData] = useState({
    type: "lost",
    category: "",
    images: [],
    title: "",
    description: "",
    location: { lat: 41.2995, lng: 69.2401 },
    address: "Toshkent",
    contactPhone: "",
    telegram: "",
    date: "",
  });
  const steps = [
    { id: 1, title: "Buyum haqida" },
    { id: 2, title: "Joylashuv va tekshirish" },
  ];
  const inputClass = "h-[30px] w-full rounded-lg border border-neutral-200 bg-white px-3 text-xs text-neutral-800 outline-none transition placeholder:text-neutral-400 focus:border-neutral-400 focus:ring-2 focus:ring-neutral-100 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:focus:ring-neutral-800";
  const labelClass = "mb-1 block text-xs font-bold text-neutral-800 dark:text-neutral-200";
  const getCategoryLabel = (categoryId) => {
    const translated = t(`cat_${categoryId}`);
    return translated === `cat_${categoryId}`
      ? CATEGORIES.find((category) => category.id === categoryId)?.label || categoryId
      : translated;
  };

  const fetchAddress = React.useCallback(async (lat, lng) => {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
      if (!response.ok) throw new Error("Manzilni aniqlab bo‘lmadi.");
      const result = await response.json();
      setFormData((prev) => ({ ...prev, address: result.display_name || prev.address }));
    } catch (fetchError) {
      console.error("Address fetch error", fetchError);
    }
  }, []);

  useEffect(() => {
    if (currentStep !== 2 || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const position = { lat: coords.latitude, lng: coords.longitude };
        setFormData((prev) => ({ ...prev, location: position }));
        fetchAddress(position.lat, position.lng);
      },
      () => {},
      { enableHighAccuracy: true },
    );
  }, [currentStep, fetchAddress]);

  const handleFileChange = (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = "";
    if (!files.length) return;
    const validFiles = files.filter((file) => /^image\/(jpe?g|png|webp|heic|heif)$/i.test(file.type) && file.size <= 8 * 1024 * 1024);
    const invalidFiles = files.length - validFiles.length;
    const availableSlots = Math.max(0, 5 - formData.images.length);
    const acceptedFiles = validFiles.slice(0, availableSlots);
    if (invalidFiles) {
      setError("JPG, PNG, WebP yoki HEIC formatidagi, 8 MB gacha rasm tanlang.");
    } else if (validFiles.length > availableSlots) {
      setError("Ko‘pi bilan 5 ta rasm tanlash mumkin.");
    } else {
      setError("");
    }
    setFormData((prev) => {
      const newImages = acceptedFiles.slice(0, Math.max(0, 5 - prev.images.length)).map((file) => ({ file, preview: URL.createObjectURL(file) }));
      return { ...prev, images: [...prev.images, ...newImages] };
    });
  };

  const handleNext = () => {
    if (!formData.type || !formData.images.length || !formData.category || !formData.date || !formData.title.trim() || !formData.description.trim()) {
      setError("Majburiy maydonlarni to‘ldiring.");
      return;
    }
    if ((!contactViaPlatform && !showPhone) || (showPhone && !formData.contactPhone.trim())) {
      setError("Kamida bitta aloqa usulini tanlang va telefon raqamini kiriting.");
      return;
    }
    setError("");
    setCurrentStep(2);
  };

  const handleSubmit = async () => {
    setError("");
    setRequiresLogin(false);
    if (sessionStatus === "loading") {
      setError("Sessiya tekshirilmoqda. Birozdan so‘ng qayta urinib ko‘ring.");
      return;
    }
    if (!session?.user?.accessToken) {
      setRequiresLogin(true);
      setError("E’lon joylash uchun tizimga kirishingiz kerak.");
      return;
    }

    setLoading(true);
    try {
      const data = new FormData();
      data.append("status", formData.type);
      data.append("category", formData.category);
      data.append("itemType", formData.title);
      data.append("itemDescription", formData.description);
      data.append("location", formData.address);
      data.append("coordinates", JSON.stringify(formData.location));
      data.append("date", formData.date);
      data.append("phone", showPhone ? formData.contactPhone : "");
      data.append("telegram", formData.telegram);
      formData.images.forEach(({ file }, index) => data.append(index === 0 ? "image" : "images", file));

      const response = await fetch(getApiUrl("ariza"), {
        method: "POST",
        headers: { Authorization: `Bearer ${session?.user?.accessToken || ""}` },
        body: data,
      });
      if (!response.ok) {
        const responseData = await response.json().catch(() => ({}));
        if (response.status === 401) {
          setRequiresLogin(true);
          throw new Error("Sessiya muddati tugagan. E’lon joylash uchun qayta kiring.");
        }
        throw new Error(responseData.message || t("error_generic") || "Xatolik yuz berdi");
      }
      router.push("/desktop");
    } catch (submitError) {
      console.error(submitError);
      setError(submitError.message || "E’lonni yuborishda xatolik yuz berdi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-[1120px] px-4 pb-4 pt-4 text-neutral-900 dark:text-neutral-100 sm:px-8 lg:px-8 lg:pt-[18px]">
      <header className="mb-[14px] flex min-h-[42px] flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-extrabold leading-7 tracking-tight sm:text-[24px]">{t("add_title")}</h1>
          <p className="text-xs leading-4 text-neutral-500">E’lonni 2 daqiqada joylashtiring</p>
        </div>
        <div className="flex items-center gap-3 pb-1" aria-label="E’lon yaratish bosqichlari">
          {steps.map((step, index) => (
            <React.Fragment key={step.id}>
              {index > 0 && <span className="h-px w-8 bg-neutral-300 dark:bg-neutral-700 sm:w-12" />}
              <div className="flex items-center gap-2">
                <span className={`flex h-6 w-6 items-center justify-center rounded-full border text-[11px] font-bold ${currentStep === step.id ? "border-neutral-700 bg-neutral-700 text-white dark:border-neutral-200 dark:bg-neutral-200 dark:text-neutral-900" : "border-neutral-300 text-neutral-500 dark:border-neutral-700"}`}>
                  {currentStep > step.id ? "✓" : step.id}
                </span>
                <span className={`hidden text-[11px] font-semibold sm:block ${currentStep === step.id ? "text-neutral-800 dark:text-neutral-200" : "text-neutral-500"}`}>{step.title}</span>
              </div>
            </React.Fragment>
          ))}
        </div>
      </header>

      <section className="overflow-hidden rounded-[14px] border border-neutral-200 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:border-neutral-800 dark:bg-neutral-950">
        {currentStep === 1 ? (
          <div className="grid md:grid-cols-[0.7fr_1fr]">
            <div className="space-y-5 border-b border-neutral-100 p-4 sm:p-5 md:border-b-0 md:border-r dark:border-neutral-800">
              <div>
                <p className={labelClass}>Nima sodir bo‘ldi? <span aria-hidden="true">*</span></p>
                <div className="grid grid-cols-2 rounded-lg border border-neutral-200 bg-neutral-50 p-0.5 dark:border-neutral-700 dark:bg-neutral-900">
                  {[{ value: "lost", label: t("add_lost") }, { value: "found", label: t("add_found") }].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      aria-pressed={formData.type === option.value}
                      onClick={() => setFormData((prev) => ({ ...prev, type: option.value }))}
                      className={`h-8 rounded-md px-2 text-xs font-semibold transition ${formData.type === option.value ? "bg-neutral-700 text-white shadow-sm dark:bg-neutral-200 dark:text-neutral-900" : "text-neutral-600 hover:bg-white dark:text-neutral-300 dark:hover:bg-neutral-800"}`}
                    >{option.label}</button>
                  ))}
                </div>
              </div>

              <div>
                <p className={labelClass}>Rasm qo‘shing</p>
                <label
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => {
                    event.preventDefault();
                    handleFileChange({ target: { files: event.dataTransfer.files, value: "" } });
                  }}
                  className="group flex h-40 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-neutral-300 bg-neutral-50/70 text-center transition hover:border-neutral-500 hover:bg-neutral-100/70 dark:border-neutral-700 dark:bg-neutral-900/50 dark:hover:bg-neutral-900"
                >
                  <input type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif" multiple onChange={handleFileChange} disabled={formData.images.length >= 5} className="sr-only" />
                  {formData.images.length >= 5 ? (
                    <span className="text-xs font-medium text-neutral-500">5 ta rasm tanlandi</span>
                  ) : (
                    <>
                      <svg className="mb-2 h-8 w-8 text-neutral-500 transition group-hover:text-neutral-800 dark:group-hover:text-neutral-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><path d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5M5 15v4a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-4" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300">Rasmni shu yerga tashlang</span>
                      <span className="mt-1 text-[10px] text-neutral-400">yoki kompyuterdan tanlang</span>
                      <span className="mt-2 rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-[10px] font-bold text-neutral-700 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200">Rasm tanlash</span>
                    </>
                  )}
                </label>
                <p className="mt-1.5 text-[10px] text-neutral-500">{formData.images.length ? `${formData.images.length}/5 ta rasm tanlandi` : "1–5 ta rasm, JPG yoki PNG"}</p>
                {formData.images.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {formData.images.map(({ file, preview }, index) => (
                      <div key={`${file.name}-${file.lastModified}-${index}`} className="relative h-[76px] w-[76px] overflow-hidden rounded-lg bg-neutral-100 dark:bg-neutral-800">
                        <img src={preview} alt={`${index + 1}-rasm`} className="h-full w-full object-cover" />
                        <button
                          type="button"
                          aria-label={`${index + 1}-rasmni olib tashlash`}
                          onClick={() => setFormData((prev) => {
                            URL.revokeObjectURL(prev.images[index].preview);
                            return { ...prev, images: prev.images.filter((_, imageIndex) => imageIndex !== index) };
                          })}
                          className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-neutral-800/80 text-[10px] text-white"
                        >×</button>
                      </div>
                    ))}
                    {formData.images.length < 5 && (
                      <label className="flex h-[76px] w-[76px] cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-neutral-300 text-neutral-500 transition hover:border-neutral-500 hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-900">
                        <input type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif" multiple onChange={handleFileChange} className="sr-only" />
                        <span className="text-2xl leading-none">+</span>
                        <span className="mt-1 text-[9px]">Rasm qo‘shish</span>
                      </label>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2 p-4 sm:p-5">
              <div>
                <label htmlFor="item-title" className={labelClass}>Buyum nomi <span aria-hidden="true">*</span></label>
                <input id="item-title" type="text" value={formData.title} onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))} placeholder="Masalan, qora ryukzak" className={inputClass} required />
              </div>
              <div>
                <label htmlFor="item-category" className={labelClass}>Kategoriya <span aria-hidden="true">*</span></label>
                <select id="item-category" value={formData.category} onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))} className={`${inputClass} ${formData.category ? "" : "text-neutral-400"}`} required>
                  <option value="" disabled>Kategoriyani tanlang</option>
                  {CATEGORIES.map((category) => <option key={category.id} value={category.id}>{getCategoryLabel(category.id)}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="item-date" className={labelClass}>Sana <span aria-hidden="true">*</span></label>
                <div className="relative">
                  <input
                    id="item-date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
                    className={`${inputClass} pr-9 ${formData.date ? "text-neutral-600 dark:text-neutral-300" : "text-transparent dark:text-transparent"} [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-3 [&::-webkit-calendar-picker-indicator]:opacity-0`}
                    required
                  />
                  {!formData.date && <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400">Sana tanlang</span>}
                  <svg className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><rect x="3.5" y="5" width="17" height="16" rx="2" strokeWidth="1.6" /><path d="M7.5 3.5v3M16.5 3.5v3M3.5 9h17" strokeWidth="1.6" strokeLinecap="round" /></svg>
                </div>
              </div>
              <div>
                <label htmlFor="item-description" className={labelClass}>Qisqa tavsif <span aria-hidden="true">*</span></label>
                <textarea id="item-description" value={formData.description} onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value.slice(0, 500) }))} placeholder="Rangi, holati, o‘ziga xos belgilari va nima holatda yo‘qotilganini yozing..." className="min-h-[68px] w-full resize-y rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs leading-5 text-neutral-800 outline-none transition placeholder:text-neutral-400 focus:border-neutral-400 focus:ring-2 focus:ring-neutral-100 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:focus:ring-neutral-800" maxLength={500} required />
                <div className="mt-1 flex items-start justify-between gap-2 text-[9px] text-neutral-400"><span>Iltimos, buyumning rangi va o‘ziga xos belgilarini yozing.</span><span className="shrink-0">{formData.description.length}/500</span></div>
              </div>
              <fieldset>
                <legend className={`${labelClass} mb-2`}>Aloqa afzalligi</legend>
                <label className="mb-2 flex cursor-pointer items-center gap-2 text-[11px] text-neutral-700 dark:text-neutral-300">
                  <input type="checkbox" checked={contactViaPlatform} onChange={(e) => setContactViaPlatform(e.target.checked)} className="h-3.5 w-3.5 rounded border-neutral-300 accent-neutral-800" />
                  Platforma orqali yozish (tavsiya etiladi)
                </label>
                <label className="flex cursor-pointer items-center gap-2 text-[11px] text-neutral-700 dark:text-neutral-300">
                  <input type="checkbox" checked={showPhone} onChange={(e) => setShowPhone(e.target.checked)} className="h-3.5 w-3.5 rounded border-neutral-300 accent-neutral-800" />
                  Telefon raqamimni ko‘rsatish
                </label>
                {showPhone && <input type="tel" required value={formData.contactPhone} onChange={(e) => setFormData((prev) => ({ ...prev, contactPhone: e.target.value }))} placeholder="+998 90 123 45 67" className={`${inputClass} mt-2`} aria-label="Telefon raqamingiz" />}
                <p className="mt-2 flex items-start gap-1.5 text-[9px] leading-4 text-neutral-400">
                  <svg className="mt-0.5 h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><circle cx="12" cy="12" r="9" strokeWidth="1.6" /><path d="M12 11v5m0-8h.01" strokeWidth="1.6" strokeLinecap="round" /></svg>
                  Sizning aloqa ma’lumotlaringiz faqat mos kelgan foydalanuvchilarga ulashiladi.
                </p>
              </fieldset>
            </div>
          </div>
        ) : (
          <div className="grid gap-5 p-4 sm:p-5 lg:grid-cols-[1.25fr_0.75fr]">
            <div>
              <h2 className="mb-1 text-sm font-bold">Joylashuvni belgilang</h2>
              <p className="mb-3 text-[11px] text-neutral-500">{t("add_loc_desc")}</p>
              <div className="relative h-[300px] overflow-hidden rounded-xl border border-neutral-200 bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900">
                <LeafletMap
                  position={formData.location}
                  setPosition={(location) => setFormData((prev) => ({ ...prev, location }))}
                  fetchAddress={fetchAddress}
                />
              </div>
              <label className="mt-2 block text-[11px] text-neutral-500">
                Manzil
                <input value={formData.address} onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))} className={`${inputClass} mt-1`} />
              </label>
            </div>
            <aside className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-900/50">
              <h2 className="mb-3 text-sm font-bold">E’lonni tekshiring</h2>
              {formData.images[0]?.preview && <img src={formData.images[0].preview} alt="" className="mb-3 h-28 w-full rounded-lg bg-white object-contain dark:bg-neutral-800" />}
              <span className="rounded-md bg-neutral-200 px-2 py-1 text-[10px] font-semibold text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200">{formData.type === "lost" ? t("add_lost") : t("add_found")}</span>
              <h3 className="mt-3 text-sm font-bold">{formData.title}</h3>
              <p className="mt-1 text-[11px] text-neutral-500">{formData.description}</p>
              <dl className="mt-4 space-y-2 border-t border-neutral-200 pt-3 text-[11px] dark:border-neutral-700">
                <div className="flex justify-between gap-3"><dt className="text-neutral-500">Kategoriya</dt><dd className="text-right font-medium">{getCategoryLabel(formData.category)}</dd></div>
                <div className="flex justify-between gap-3"><dt className="text-neutral-500">Sana</dt><dd className="font-medium">{formData.date}</dd></div>
              </dl>
            </aside>
          </div>
        )}

        {error && (
          <div role="alert" className="border-t border-red-100 bg-red-50 px-4 py-2.5 text-xs font-medium text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300 sm:px-5">
            {error}
            {requiresLogin && (
              <Link href="/login?callbackUrl=%2Fdesktop%2Fadd" className="ml-1 underline underline-offset-2">
                Tizimga kirish
              </Link>
            )}
          </div>
        )}
        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-neutral-100 px-4 py-3.5 dark:border-neutral-800 sm:px-5">
          <div className="flex items-center gap-4">
            <Link href="/desktop" className="text-xs font-semibold text-neutral-500 underline underline-offset-2 transition hover:text-neutral-900 dark:hover:text-white">Bekor qilish</Link>
            {currentStep === 2 && <button type="button" onClick={() => setCurrentStep(1)} className="text-xs font-semibold text-neutral-500 transition hover:text-neutral-900 dark:hover:text-white">Ortga</button>}
          </div>
          <div className="flex items-center gap-3">
            {currentStep === 1 && <span className="hidden items-center gap-1.5 text-[10px] text-neutral-500 sm:flex"><span className="text-neutral-400">◷</span> E’lon ma’lumotlari</span>}
            {currentStep === 1 ? (
              <button type="button" onClick={handleNext} className="inline-flex h-9 items-center gap-2 rounded-lg bg-neutral-800 px-4 text-xs font-bold text-white transition hover:bg-neutral-700 dark:bg-neutral-200 dark:text-neutral-900 dark:hover:bg-white">
                Joylashuvga o‘tish
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
            ) : (
              <button type="button" onClick={handleSubmit} disabled={loading} className="inline-flex h-9 items-center gap-2 rounded-lg bg-neutral-800 px-4 text-xs font-bold text-white transition hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-neutral-200 dark:text-neutral-900 dark:hover:bg-white">
                {loading ? t("add_btn_submitting") : t("add_btn_submit")}
                {!loading && <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><path d="m5 12 4 4L19 6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>}
              </button>
            )}
          </div>
        </footer>
      </section>
    </div>
  );
}
