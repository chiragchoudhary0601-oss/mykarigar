import { supabase } from "@/lib/supabase";

export async function getCurrentUser() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user;
}

export async function getCurrentProfile() {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  const { data, error } = await supabase
    .from("users")
    .select("id, name, phone, email, role")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    console.error("PROFILE ERROR:", error);
    return null;
  }

  return data;
}

export async function getCurrentRole() {
  const profile = await getCurrentProfile();
  return profile?.role ?? null;
}

export async function logout() {
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error("LOGOUT ERROR:", error);
    throw error;
  }

  window.location.href = "/login";
}