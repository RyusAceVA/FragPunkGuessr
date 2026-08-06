"use server";

import { AuthError } from "next-auth";

import { signIn, signOut } from "./auth";
import { loginSchema } from "./schemas";

/** N'autorise que des chemins internes — jamais de redirection externe. */
function safeCallbackUrl(raw: unknown): string {
  if (typeof raw === "string" && raw.startsWith("/") && !raw.startsWith("//")) {
    return raw;
  }
  return "/admin";
}

/** Codes d'erreur traduits côté client (messages/<locale>.json). */
export type AuthErrorCode = "invalid" | "incorrect";

/**
 * Server Action de connexion (utilisée par useActionState).
 * Retourne un CODE d'erreur i18n, ou redirige en cas de succès.
 */
export async function authenticate(
  _previousState: AuthErrorCode | undefined,
  formData: FormData,
): Promise<AuthErrorCode | undefined> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return "invalid";
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: safeCallbackUrl(formData.get("callbackUrl")),
    });
    return undefined;
  } catch (error) {
    if (error instanceof AuthError) {
      // Code volontairement générique : ne révèle pas si l'email existe
      return "incorrect";
    }
    // NEXT_REDIRECT (succès) et erreurs inattendues doivent se propager
    throw error;
  }
}

/** Server Action de déconnexion. */
export async function logout(): Promise<void> {
  await signOut({ redirectTo: "/" });
}
