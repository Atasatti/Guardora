"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { login } from "@/lib/actions/auth";

export function useLoginViewModel() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);

    const result = await login({ email, password });

    if (result.success) {
      toast.success(result.message);
      router.push("/");
      return;
    }

    toast.error(result.message);
    setLoading(false);
  }

  return {
    email,
    password,
    loading,
    setEmail,
    setPassword,
    submit,
  };
}
