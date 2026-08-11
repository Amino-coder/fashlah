import type { IhjCategory } from "./ihj-types";

export const IHJ_CATEGORIES: { key: IhjCategory; label: string; emoji: string; prompt: (letter: string) => string }[] = [
  { key: "human", label: "اسم إنسان", emoji: "👤", prompt: (l) => `اكتب اسم إنسان يبدأ بحرف ${l}` },
  { key: "animal", label: "حيوان", emoji: "🐪", prompt: (l) => `اكتب حيوان يبدأ بحرف ${l}` },
  { key: "object", label: "جماد", emoji: "📦", prompt: (l) => `اكتب جماد يبدأ بحرف ${l}` },
  { key: "plant", label: "نبات", emoji: "🌿", prompt: (l) => `اكتب نبات يبدأ بحرف ${l}` },
  { key: "country", label: "بلاد", emoji: "🌍", prompt: (l) => `اكتب بلاد تبدأ بحرف ${l}` },
];
