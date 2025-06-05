"use client";

import React from "react";
import { Bell, UserCircle, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useState, useEffect } from "react";

const Header = () => {
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data, error } = await supabase.auth.getUser();
        if (error) {
          console.error("Erro ao obter usuário:", error.message);
          return;
        }
        setUser(data.user);
      } catch (error) {
        console.error("Erro ao verificar usuário:", error);
      } finally {
        setLoading(false);
      }
    };

    getUser();
  }, [supabase]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      router.push("/login");
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    }
  };

  return (
    <header className="bg-white dark:bg-gray-800 shadow-md p-4 flex justify-between items-center">
      <div>
        <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200">Dashboard</h2>
      </div>
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="icon">
          <Bell className="h-6 w-6 text-gray-600 dark:text-gray-400" />
        </Button>
        <div className="flex items-center space-x-2">
          <UserCircle className="h-8 w-8 text-gray-600 dark:text-gray-400" />
          <span className="text-gray-700 dark:text-gray-200">
            {loading ? "Carregando..." : (user?.email || "Usuário")}
          </span>
        </div>
        <Button variant="ghost" size="icon" onClick={handleLogout} title="Sair">
          <LogOut className="h-6 w-6 text-red-500" />
        </Button>
      </div>
    </header>
  );
};

export default Header;
