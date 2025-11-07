'use client';

import Image from 'next/image';
import { ShieldCheck, Code, Users, Leaf, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import type { TeamMember } from '@/lib/placeholder-data';
import { Skeleton } from '@/components/ui/skeleton';
import { teamMembers } from '@/lib/team-data';


const values = [
    {
        icon: Leaf,
        title: "الجودة والنضارة",
        description: "نلتزم بتقديم المنتجات الطازجة، ودعم المزارعين المحليين في تلمسان."
    },
    {
        icon: Code,
        title: "التكنولوجيا الذكية",
        description: "نستخدم التكنولوجيا لجعل تسوقك أبسط وأسرع وأكثر متعة."
    },
    {
        icon: Users,
        title: "روح المجتمع",
        description: "نحن أكثر من مجرد سوبر ماركت؛ نحن جار ملتزم برفاهية مجتمعنا."
    },
    {
        icon: ShieldCheck,
        title: "الالتزام بالجودة",
        description: "ثقتكم هي أولويتنا. نحن نضمن جودة كل منتج نبيعه."
    }
]

const supermarketImage = PlaceHolderImages.find(p => p.id === 'about-supermarket-interior');

export default function AboutPage() {
  const team = teamMembers;
  const areMembersLoading = false;

  return (
    <div className="container py-8 md:py-12">
      <div className="text-center mb-12">
        <h1 className="font-headline text-4xl md:text-5xl lg:text-6xl">من نحن</h1>
        <p className="mt-4 max-w-3xl mx-auto text-lg text-muted-foreground">اكتشف قصة متجر حيك.</p>
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
          <h2 className="font-headline text-2xl text-foreground">قصتنا</h2>
          <p className="text-lg leading-relaxed">مرحبًا بكم في سوبر ماركت تلمسان الذكي، حيث يلتقي التقليد بالتكنولوجيا. مهمتنا هي تزويد مجتمعنا بمنتجات طازجة وعالية الجودة مع تقديم تجربة تسوق عصرية ومريحة.</p>
          <p className="leading-relaxed">تأسس متجرنا في قلب تلمسان، وهو شركة عائلية نمت مع المدينة. نحن فخورون بدعم المزارعين والمنتجين المحليين، مما يضمن أن أفضل المنتجات في المنطقة متوفرة دائمًا على رفوفنا.</p>
          <p className="leading-relaxed">مع إطلاق منصتنا عبر الإنترنت، نرتقي بالراحة إلى مستوى جديد. تصفح واطلب واحصل على مشترياتك مباشرة إلى باب منزلك، كل ذلك بفضل تقنيتنا الذكية والتزامنا بالخدمة المتميزة.</p>
        </div>
      </div>

        <section className="mt-16 md:mt-24 text-center">
            <h2 className="font-headline text-3xl md:text-4xl">قيمنا</h2>
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
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
            <h2 className="font-headline text-3xl md:text-4xl">فريقنا</h2>
            <p className="mt-2 text-muted-foreground">الوجوه التي تجعل تجربة التسوق الخاصة بك استثنائية.</p>
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
                {areMembersLoading && Array.from({length: 3}).map((_, i) => (
                    <div key={i} className="flex flex-col items-center">
                        <Skeleton className="h-24 w-24 rounded-full mb-4" />
                        <Skeleton className="h-6 w-32 mb-1" />
                        <Skeleton className="h-4 w-48" />
                    </div>
                ))}
                {!areMembersLoading && team && team.map((member) => (
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
             {!areMembersLoading && (!team || team.length === 0) && (
                <p className='text-muted-foreground mt-8'>سيتم تقديم الفريق قريبًا.</p>
             )}
        </section>
    </div>
  );
}
