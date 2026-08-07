"use server";

import { AuthError } from "next-auth";

import { signIn, signOut } from "./auth";
import { loginSchema, registerSchema } from "./schemas";
import { registerUser, type RegisterErrorCode } from "./server/register";

/** N'autorise que des chemins internes — jamais de redirection externe. */
function safeCallbackUrl(raw: unknown): string {
  if (typeof raw === "string" && raw.startsWith("/") && !raw.startsWith("//")) {
    return raw;
  }
  return "/";
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

/**
 * Server Action d'inscription : crée le compte USER puis connecte
 * immédiatement (Credentials). Retourne un code d'erreur i18n sinon.
 */
export async function registerAction(
  _previousState: RegisterErrorCode | undefined,
  formData: FormData,
): Promise<RegisterErrorCode | undefined> {
  const parsed = registerSchema.safeParse({
    username: formData.get("username"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    const mismatch = parsed.error.issues.some(
      (issue) => issue.path[0] === "confirmPassword",
    );
    return mismatch ? "passwordMismatch" : "invalid";
  }

  const errorCode = await registerUser(parsed.data);
  if (errorCode) return errorCode;

  await signIn("credentials", {
    email: parsed.data.email,
    password: parsed.data.password,
    redirectTo: "/",
  });
  return undefined;
}

/** Server Action : connexion via Google (redirige vers le consentement). */
export async function signInWithGoogle(formData: FormData): Promise<void> {
  await signIn("google", {
    redirectTo: safeCallbackUrl(formData.get("callbackUrl")),
  });
}
