"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import type { CommandItem } from "@/types";

interface UseCommandBarReturn {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
  query: string;
  setQuery: (q: string) => void;
  filteredItems: CommandItem[];
  selectedIndex: number;
  setSelectedIndex: (i: number) => void;
  executeItem: (item: CommandItem) => void;
  moveUp: () => void;
  moveDown: () => void;
  executeSelected: () => void;
}

export function useCommandBar(): UseCommandBarReturn {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Navigation commands available in the command bar
  const items: CommandItem[] = useMemo(
    () => [
      {
        id: "nav-command-center",
        label: "Command Center",
        description: "Main dashboard and morning briefing",
        category: "navigation",
        action: () => router.push("/command-center"),
      },
      {
        id: "nav-clients",
        label: "Clients",
        description: "View and manage client list",
        category: "navigation",
        action: () => router.push("/clients"),
      },
      {
        id: "nav-meetings",
        label: "Meetings",
        description: "Meeting schedule and recordings",
        category: "navigation",
        action: () => router.push("/meetings"),
      },
      {
        id: "nav-messages",
        label: "Messages",
        description: "Draft and manage client communications",
        category: "navigation",
        action: () => router.push("/messages"),
      },
      {
        id: "nav-market",
        label: "Market",
        description: "Market data and movers",
        category: "navigation",
        action: () => router.push("/market"),
      },
      {
        id: "nav-alerts",
        label: "Alerts",
        description: "View portfolio and compliance alerts",
        category: "navigation",
        action: () => router.push("/alerts"),
      },
      {
        id: "action-new-meeting",
        label: "New Meeting",
        description: "Start a new client meeting",
        category: "action",
        action: () => router.push("/meetings?new=true"),
      },
      {
        id: "action-new-message",
        label: "Compose Message",
        description: "Draft a new client message",
        category: "action",
        action: () => router.push("/messages?compose=true"),
      },
    ],
    [router]
  );

  // Filter items by query
  const filteredItems = useMemo(() => {
    if (!query.trim()) return items;
    const lowerQuery = query.toLowerCase();
    return items.filter(
      (item) =>
        item.label.toLowerCase().includes(lowerQuery) ||
        item.description?.toLowerCase().includes(lowerQuery) ||
        item.category.toLowerCase().includes(lowerQuery)
    );
  }, [items, query]);

  // Reset selection when filtered items change
  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredItems.length]);

  // Cmd+K / Ctrl+K keyboard shortcut to toggle
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen((prev) => {
          if (!prev) {
            setQuery("");
            setSelectedIndex(0);
          }
          return !prev;
        });
      }

      // Escape to close
      if (e.key === "Escape" && isOpen) {
        e.preventDefault();
        setIsOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const open = useCallback(() => {
    setQuery("");
    setSelectedIndex(0);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  const toggle = useCallback(() => {
    setIsOpen((prev) => {
      if (!prev) {
        setQuery("");
        setSelectedIndex(0);
      }
      return !prev;
    });
  }, []);

  const executeItem = useCallback(
    (item: CommandItem) => {
      item.action();
      setIsOpen(false);
    },
    []
  );

  const moveUp = useCallback(() => {
    setSelectedIndex((prev) => (prev <= 0 ? filteredItems.length - 1 : prev - 1));
  }, [filteredItems.length]);

  const moveDown = useCallback(() => {
    setSelectedIndex((prev) => (prev >= filteredItems.length - 1 ? 0 : prev + 1));
  }, [filteredItems.length]);

  const executeSelected = useCallback(() => {
    const item = filteredItems[selectedIndex];
    if (item) {
      executeItem(item);
    }
  }, [filteredItems, selectedIndex, executeItem]);

  return {
    isOpen,
    open,
    close,
    toggle,
    query,
    setQuery,
    filteredItems,
    selectedIndex,
    setSelectedIndex,
    executeItem,
    moveUp,
    moveDown,
    executeSelected,
  };
}
