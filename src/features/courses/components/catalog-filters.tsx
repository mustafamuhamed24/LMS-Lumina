'use client';

import { useEffect, useRef, useTransition } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Category } from '@/types/app';

export function CatalogFilters({ categories, total }: { categories: Category[]; total: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const search = searchParams.get('search') ?? '';
  const searchRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeCategory = searchParams.get('category') ?? 'all';
  const activeDifficulty = searchParams.get('difficulty') ?? 'all';
  const activeSort = searchParams.get('sort') ?? 'newest';

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const update = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== 'all') params.set(key, value);
    else params.delete(key);
    params.delete('page');
    startTransition(() => router.push(`${pathname}?${params.toString()}`));
  };

  const scheduleSearch = (value: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => update('search', value || null), 350);
  };

  const clearSearch = () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (searchRef.current) searchRef.current.value = '';
    update('search', null);
  };

  const hasFilters = ['search', 'category', 'difficulty'].some((key) => searchParams.get(key));

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            key={search}
            ref={searchRef}
            defaultValue={search}
            onChange={(event) => scheduleSearch(event.target.value)}
            placeholder="Search courses, topics or skills…"
            className="h-10 pl-9"
            aria-label="Search courses"
          />
          {search ? (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-sm p-1 text-muted-foreground hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="size-3.5" />
            </button>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={activeCategory} onValueChange={(value) => update('category', value)}>
            <SelectTrigger className="h-10 w-[180px]">
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.slug}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={activeDifficulty} onValueChange={(value) => update('difficulty', value)}>
            <SelectTrigger className="h-10 w-[150px]">
              <SelectValue placeholder="All levels" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All levels</SelectItem>
              <SelectItem value="beginner">Beginner</SelectItem>
              <SelectItem value="intermediate">Intermediate</SelectItem>
              <SelectItem value="advanced">Advanced</SelectItem>
            </SelectContent>
          </Select>
          <Select value={activeSort} onValueChange={(value) => update('sort', value)}>
            <SelectTrigger className="h-10 w-[150px]">
              <SlidersHorizontal className="mr-1 size-3.5 opacity-60" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="popular">Most popular</SelectItem>
              <SelectItem value="title">Title A–Z</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
        <span>
          {pending ? 'Updating results…' : `${total} ${total === 1 ? 'course' : 'courses'} available`}
        </span>
        {hasFilters ? (
          <Button variant="ghost" size="sm" onClick={() => startTransition(() => router.push(pathname))}>
            <X /> Clear filters
          </Button>
        ) : null}
      </div>
    </div>
  );
}
