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

/**
 * Server Action de connexion (utilisée par useActionState).
 * Retourne un message d'erreur, ou redirige en cas de succès.
 */
export async function authenticate(
  _previousState: string | undefined,
  formData: FormData,
): Promise<string | undefined> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return "Email ou mot de passe invalide.";
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
      // Message volontairement générique : ne révèle pas si l'email existe
      return "Email ou mot de passe incorrect.";
    }
    // NEXT_REDIRECT (succès) et erreurs inattendues doivent se propager
    throw error;
  }
}

/** Server Action de déconnexion. */
export async function logout(): Promise<void> {
  await signOut({ redirectTo: "/" });
}
