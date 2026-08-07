import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";

import { PageContainer } from "@/components/layout/page-container";
import { auth } from "@/features/auth";
import { ProfileForm } from "@/features/profile/components/profile-form";
import type { ProfileData } from "@/features/profile/types";
import { prisma } from "@/lib/prisma";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("profile");
  return { title: t("meta") };
}

/** Page profil — réservée aux joueurs connectés. */
export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/profile");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });
  if (!user) redirect("/login");

  const t = await getTranslations("profile");
  const initial: ProfileData = {
    username: user.username,
    email: user.email,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    country: user.country,
    bio: user.bio,
    createdAt: user.createdAt.toISOString(),
  };

  return (
    <PageContainer>
      <div className="mx-auto w-full max-w-2xl space-y-6">
        <div className="space-y-1.5">
          <h1 className="display text-4xl sm:text-5xl">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
        <ProfileForm initial={initial} />
      </div>
    </PageContainer>
  );
}
