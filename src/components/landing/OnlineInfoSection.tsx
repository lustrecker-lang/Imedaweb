
"use client";

import { Monitor, Award, Clock, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function OnlineInfoSection() {
    const benefits = [
        {
            title: "Flexibilité Totale",
            description: "Apprenez à votre rythme, où que vous soyez. Nos formations sont conçues pour s'adapter aux agendas les plus chargés.",
            icon: Clock,
        },
        {
            title: "Diplôme Identique",
            description: "La certification délivrée à l'issue de nos parcours en ligne a la même valeur et reconnaissance que nos formations en présentiel.",
            icon: Award,
        },
        {
            title: "Expertise de Pointe",
            description: "Accédez aux meilleurs experts internationaux et à des contenus pédagogiques de haute qualité, optimisés pour le digital.",
            icon: Monitor,
        },
        {
            title: "Réseau de Décideurs",
            description: "Rejoignez une communauté dynamique de professionnels et échangez via nos plateformes interactives.",
            icon: Users,
        }
    ];

    return (
        <section className="py-16 md:py-24 bg-slate-50 border-y border-slate-200">
            <div className="container px-4 md:px-6">
                <div className="text-center mb-16 space-y-4">
                    <h2 className="text-3xl font-normal tracking-tighter sm:text-4xl md:text-5xl font-headline">
                        L'excellence IMEDA, 100% en ligne
                    </h2>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                        Une expérience d'apprentissage premium conçue pour les leaders d'Afrique francophone qui exigent flexibilité et excellence.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {benefits.map((benefit, index) => (
                        <div key={index} className="flex flex-col space-y-4 p-8 bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300">
                            <div className="w-12 h-12 bg-primary/10 flex items-center justify-center">
                                <benefit.icon className="w-6 h-6 text-primary" />
                            </div>
                            <h3 className="font-headline font-normal text-xl">{benefit.title}</h3>
                            <p className="text-muted-foreground text-sm leading-relaxed">
                                {benefit.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
