"use client";

import { Globe } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { setLocale } from "@/i18n/actions";
import { LOCALE_LABELS, LOCALES } from "@/i18n/config";

const ITEMS = LOCALES.map((locale) => ({
  label: LOCALE_LABELS[locale],
  value: locale,
}));

/** Sélecteur de langue — choix conservé en cookie (1 an). */
export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const t = useTranslations("language");
  const [isPending, startTransition] = useTransition();

  return (
    <Select
      items={ITEMS}
      value={locale}
      onValueChange={(value) => {
        startTransition(async () => {
          await setLocale(value as string);
          router.refresh();
        });
      }}
    >
      <SelectTrigger
        size="sm"
        aria-label={t("label")}
        className={isPending ? "opacity-60" : undefined}
      >
        <Globe className="size-3.5" aria-hidden />
        <span className="font-heading text-xs tracking-wide uppercase">
          {locale}
        </span>
      </SelectTrigger>
      <SelectContent align="end">
        {ITEMS.map((item) => (
          <SelectItem key={item.value} value={item.value}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
