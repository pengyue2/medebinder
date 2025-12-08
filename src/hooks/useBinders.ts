import { useState, useCallback, useMemo } from "react";
import { mockBinders } from "@/data/mockBinders";
import type { Binder } from "@/types/binder";

export function useBinders() {
  const [binders, setBinders] = useState<Binder[]>(mockBinders);
  const [searchQuery, setSearchQuery] = useState("");

  const createBinder = useCallback((name: string) => {
    const newBinder: Binder = {
      id: `binder-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: name.trim(),
      coverImage: "", // Empty cover for new binders
      photoCount: 0,
      photos: [],
    };
    setBinders((prev) => [newBinder, ...prev]);
    return newBinder;
  }, []);

  const deleteBinder = useCallback((id: string) => {
    setBinders((prev) => prev.filter((b) => b.id !== id));
  }, []);

  const filteredBinders = useMemo(() => {
    if (!searchQuery.trim()) {
      return binders;
    }
    const query = searchQuery.toLowerCase().trim();
    return binders.filter((binder) =>
      binder.title.toLowerCase().includes(query)
    );
  }, [binders, searchQuery]);

  return {
    binders,
    filteredBinders,
    searchQuery,
    setSearchQuery,
    createBinder,
    deleteBinder,
    totalCount: binders.length,
  };
}
