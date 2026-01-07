
import Ariza from "@/models/Ariza";
import Match from "@/models/Match";

// Oddiy matn o'xshashligini tekshirish funksiyasi (Levenshtein masofasi o'rniga soddalashtirilgan)
function calculateSimilarity(str1, str2) {
  if (!str1 || !str2) return 0;
  
  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();
  
  const words1 = s1.split(/\s+/);
  const words2 = s2.split(/\s+/);
  
  const intersection = words1.filter(word => words2.includes(word) && word.length > 2); // 2 harfdan uzun so'zlar
  
  // Jaccard similarity like approach for words
  const union = new Set([...words1, ...words2]).size;
  if (union === 0) return 0;
  
  return (intersection.length / union) * 100;
}

export async function findAndCreateMatches(newItem) {
  try {
    const targetStatus = newItem.status === "lost" ? "found" : "lost";
    
    // Potentsial nomzodlarni qidirish (Statusi teskari, Moderatsiyadan o'tgan)
    // Hudud bo'yicha ham filterlasak bo'ladi, lekin hozircha kengroq qidiring
    // OPTIMIZATSIYA: Barcha ma'lumotlarni tortib olmaslik uchun region bo'yicha filtrlash qo'shildi.
    const query = {
      status: targetStatus,
      moderationStatus: "approved", // Faqat tasdiqlangan e'lolar bilan solishtiramiz
      _id: { $ne: newItem._id }, // O'zi bilan o'zi emas
    };

    if (newItem.region) {
      query.region = newItem.region;
    }

    const candidates = await Ariza.find(query).select("itemType region district itemDescription user coordinates");

    const matches = [];

    for (const candidate of candidates) {
      let score = 0;
      let reasons = [];

      // 1. Kategoriya mosligi (Agar sizda kategoriya maydoni bo'lsa)
      // Hozir itemType bor.
      if (newItem.itemType && candidate.itemType && newItem.itemType.toLowerCase() === candidate.itemType.toLowerCase()) {
        score += 30;
        reasons.push("Buyum turi");
      }

      // 2. Hudud mosligi
      if (newItem.region === candidate.region) {
        score += 20;
        reasons.push("Hudud");
        if (newItem.district === candidate.district) {
          score += 10;
          reasons.push("Tuman");
        }
      }

      // 3. Matnli qidiruv (Title/Description)
      // Oddiy keyword matching
      const titleSim = calculateSimilarity(newItem.itemType, candidate.itemType); // Aslida title bo'lishi kerak, lekin itemType ishlatamiz
      const descSim = calculateSimilarity(newItem.itemDescription, candidate.itemDescription);
      
      if (titleSim > 0 || descSim > 0) {
         // Qo'shimcha ball
         score += Math.min((titleSim + descSim) * 2, 40); // Max 40 ball matndan
      }

      // Agar ball yetarli bo'lsa (masalan > 40%)
      if (score >= 40) {
        // Match yaratamiz
        const lostItem = newItem.status === "lost" ? newItem : candidate;
        const foundItem = newItem.status === "found" ? newItem : candidate;

        // Oldin yaratilganligini tekshiramiz
        const exists = await Match.findOne({ lostItem: lostItem._id, foundItem: foundItem._id });
        
        if (!exists) {
          await Match.create({
            lostItem: lostItem._id,
            foundItem: foundItem._id,
            similarity: Math.round(score),
            reason: `${reasons.join(", ")} mos keldi.`,
            user1: lostItem.user,
            user2: foundItem.user
          });
          matches.push(candidate._id);
        }
      }
    }
    
    console.log(`Matching completed. Found ${matches.length} matches for item ${newItem._id}`);
    return matches;

  } catch (error) {
    console.error("Matching algoritm error:", error);
    return [];
  }
}
