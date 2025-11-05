'use client';

import Image from 'next/image';

export default function AboutPage() {

  return (
    <div className="container py-8 md:py-12">
      <div className="text-center mb-12">
        <h1 className="font-headline text-4xl md:text-5xl lg:text-6xl">À Propos de Nous</h1>
        <p className="mt-4 max-w-3xl mx-auto text-lg text-muted-foreground">Découvrez l'histoire de votre supermarché de quartier.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
        <div className="relative aspect-square md:aspect-[4/3] rounded-lg overflow-hidden">
          <Image
            src="https://images.unsplash.com/photo-1542838132-92c53300491e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwxfHxzdXBlcm1hcmtldCUyMGludGVyaW9yfGVufDB8fHx8MTc2MjY0MjIzM3ww&ixlib=rb-4.1.0&q=80&w=1080"
            alt="Supermarket Interior"
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
            data-ai-hint="supermarket interior"
          />
        </div>
        <div className="space-y-4 text-muted-foreground">
          <p className="text-lg leading-relaxed">Bienvenue au Supermarché Intelligent de Tlemcen, où la tradition rencontre la technologie. Notre mission est de fournir à notre communauté des produits frais et de haute qualité tout en offrant une expérience d'achat moderne et pratique.</p>
          <p className="leading-relaxed">Fondé au cœur de Tlemcen, notre supermarché est une entreprise familiale qui a grandi avec la ville. Nous sommes fiers de soutenir les agriculteurs et producteurs locaux, en veillant à ce que les meilleurs produits de la région soient toujours disponibles sur nos étagères.</p>
          <p className="leading-relaxed">Avec le lancement de notre plateforme en ligne, nous amenons la commodité à un niveau supérieur. Parcourez, commandez et faites-vous livrer vos courses directement à votre porte, le tout grâce à notre technologie intelligente et à notre engagement envers un service exceptionnel.</p>
        </div>
      </div>
    </div>
  );
}
