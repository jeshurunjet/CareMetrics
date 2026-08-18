"use client";
import { useRouter } from "next/navigation";
import LoginView from "@/views/LoginView";
export default function LoginPage() { const router = useRouter(); return <LoginView onLogin={(role) => router.push(role === "manager" ? "/dashboard" : "/employee/dashboard")} />; }
