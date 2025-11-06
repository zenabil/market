'use client';

import Image from 'next/image';
import { Award, Code, Users, Leaf } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PlaceHolderImages } from '@/lib/placeholder-images';


const values = [
    {
        icon: Leaf,
        title: "Qualité et Fraîcheur",
        description: "Nous nous engageons à offrir les produits les plus frais, en soutenant les agriculteurs locaux de Tlemcen."
    },
    {
        icon: Code,
        title: "Technologie Intelligente",
        description: "Nous utilisons la technologie pour rendre vos courses plus simples, plus rapides et plus agréables."
    },
    {
        icon: Users,
        title: "Esprit de Communauté",
        description: "Nous sommes plus qu'un supermarché; nous sommes un voisin engagé dans le bien-être de notre communauté."
    }
]

const team = [
    {
        name: "Amina Ziani",
        role: "Fondatrice & PDG",
        avatar: PlaceHolderImages.find(p => p.id === 'about-amina')?.imageUrl || "https://picsum.photos/seed/amina/200/200"
    },
    {
        name: "Karim Belfodil",
        role: "Responsable des Opérations",
        avatar: PlaceHolderImages.find(p => p.id === 'about-karim')?.imageUrl || "https://picsum.photos/seed/karim/200/200"
    },
    {
        name: "Fatima Hadjadj",
        role: "Chef de Produit",
        avatar: PlaceHolderImages.find(p => p.id === 'about-fatima')?.imageUrl || "https://picsum.photos/seed/fatima/200/200"
    }
]

const supermarketImage = PlaceHolderImages.find(p => p.id === 'about-supermarket-interior');

export default function AboutPage() {

  return (
    <div className="container py-8 md:py-12">
      <div className="text-center mb-12">
        <h1 className="font-headline text-4xl md:text-5xl lg:text-6xl">À Propos de Nous</h1>
        <p className="mt-4 max-w-3xl mx-auto text-lg text-muted-foreground">Découvrez l'histoire de votre supermarché de quartier.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
        <div className="relative aspect-square md:aspect-[4/3] rounded-lg overflow-hidden">
          {supermarketImage && (
            <Image
                src={supermarketImage.imageUrl}
                alt={supermarketImage.description}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
                data-ai-hint={supermarketImage.imageHint}
            />
          )}
        </div>
        <div className="space-y-4 text-muted-foreground">
          <h2 className="font-headline text-2xl text-foreground">Notre Histoire</h2>
          <p className="text-lg leading-relaxed">Bienvenue au Supermarché Intelligent de Tlemcen, où la tradition rencontre la technologie. Notre mission est de fournir à notre communauté des produits frais et de haute qualité tout en offrant une expérience d'achat moderne et pratique.</p>
          <p className="leading-relaxed">Fondé au cœur de Tlemcen, notre supermarché est une entreprise familiale qui a grandi avec la ville. Nous sommes fiers de soutenir les agriculteurs et producteurs locaux, en veillant à ce que les meilleurs produits de la région soient toujours disponibles sur nos étagères.</p>
          <p className="leading-relaxed">Avec le lancement de notre plateforme en ligne, nous amenons la commodité à un niveau supérieur. Parcourez, commandez et faites-vous livrer vos courses directement à votre porte, le tout grâce à notre technologie intelligente et à notre engagement envers un service exceptionnel.</p>
        </div>
      </div>

        <section className="mt-16 md:mt-24 text-center">
            <h2 className="font-headline text-3xl md:text-4xl">Nos Valeurs</h2>
            <div className="mt-8 grid md:grid-cols-3 gap-8">
                {values.map((value) => {
                    const Icon = value.icon;
                    return (
                        <Card key={value.title} className="text-center">
                            <CardContent className="p-6">
                                <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-primary/20 text-primary mb-4">
                                    <Icon className="h-6 w-6"/>
                                </div>
                                <h3 className="font-bold text-lg">{value.title}</h3>
                                <p className="mt-2 text-sm text-muted-foreground">{value.description}</p>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>
        </section>

        <section className="mt-16 md:mt-24 text-center">
            <h2 className="font-headline text-3xl md:text-4xl">Notre Équipe</h2>
            <p className="mt-2 text-muted-foreground">Les visages qui rendent votre expérience d'achat exceptionnelle.</p>
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
                {team.map((member) => (
                    <div key={member.name} className="flex flex-col items-center">
                        <Avatar className="h-24 w-24 mb-4">
                            <AvatarImage src={member.avatar} alt={member.name} />
                            <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <h3 className="font-bold">{member.name}</h3>
                        <p className="text-sm text-primary">{member.role}</p>
                    </div>
                ))}
            </div>
        </section>
    </div>
  );
}
