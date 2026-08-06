import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";

import { DEFAULT_LOCALE, isLocale, LOCALE_COOKIE } from "./config";

/**
 * Résolution de la langue SANS préfixe d'URL : le choix vit dans un
 * cookie persistant (défaut : English). Les URLs ne changent jamais.
 */
export default getRequestConfig(async () => {
  const store = await cookies();
  const cookieLocale = store.get(LOCALE_COOKIE)?.value;
  const locale = isLocale(cookieLocale) ? cookieLocale : DEFAULT_LOCALE;

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
