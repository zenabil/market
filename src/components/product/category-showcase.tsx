

'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import type { Category } from '@/lib/placeholder-data';

interface CategoryShowcaseProps {
  title: string;
  categories: Category[];
}

export default function CategoryShowcase({ title, categories }: CategoryShowcaseProps) {

  return (
    <section>
      <h2 className="font-headline text-3xl md:text-4xl text-center mb-8">{title}</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6">
        {categories.map((category) => (
          <Link href={`/category/${category.slug}`} key={category.id} className="group">
            <Card className="overflow-hidden transition-all duration-300 group-hover:shadow-lg group-hover:-translate-y-1">
              <div className="aspect-square relative">
                <Image
                  src={category.image}
                  alt={category.name}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 17vw"
                />
              </div>
              <div className="p-3 bg-card">
                <h3 className="text-center font-semibold text-sm truncate">{category.name}</h3>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}
