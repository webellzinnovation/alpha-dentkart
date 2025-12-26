import React from 'react';
import '../styles/theme.css';

interface HeroCardProps {
    title: string;
    subtitle: string;
    description: string;
    buttonText: string;
    image: string;
    onButtonClick?: () => void;
}

export const HeroCard: React.FC<HeroCardProps> = ({
    title,
    subtitle,
    description,
    buttonText,
    image,
    onButtonClick
}) => {
    return (
        <div className="card-hero relative overflow-hidden">
            <div className="flex items-center justify-between gap-6">
                {/* Left Content */}
                <div className="flex-1 space-y-4 z-10">
                    {/* Subtitle Badge */}
                    <div className="inline-block bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                        <span className="text-white text-sm font-semibold">
                            ✨ {subtitle}
                        </span>
                    </div>

                    {/* Title */}
                    <h2 className="text-3xl md:text-4xl font-bold text-white leading-tight">
                        {title}
                    </h2>

                    {/* Description */}
                    <p className="text-white/90 text-base md:text-lg max-w-md">
                        {description}
                    </p>

                    {/* CTA Button */}
                    <button
                        onClick={onButtonClick}
                        className="bg-white text-[var(--t2-orange-primary)] px-8 py-3 rounded-full font-bold text-lg hover:bg-[var(--t2-cream-light)] transition-all shadow-lg hover:shadow-xl hover:scale-105 inline-flex items-center gap-2"
                    >
                        {buttonText}
                        <i className="fas fa-arrow-right"></i>
                    </button>

                    {/* Stats */}
                    <div className="flex gap-6 pt-4">
                        <div className="text-white">
                            <div className="text-2xl font-bold">500+</div>
                            <div className="text-sm text-white/80">Products</div>
                        </div>
                        <div className="text-white">
                            <div className="text-2xl font-bold">50+</div>
                            <div className="text-sm text-white/80">Brands</div>
                        </div>
                        <div className="text-white">
                            <div className="text-2xl font-bold">4.8★</div>
                            <div className="text-sm text-white/80">Rating</div>
                        </div>
                    </div>
                </div>

                {/* Right Image */}
                <div className="hidden md:block flex-shrink-0 relative">
                    <div className="w-64 h-64 relative">
                        {/* Decorative Circle */}
                        <div className="absolute inset-0 bg-white/10 rounded-full blur-2xl"></div>

                        {/* Product Image */}
                        <img
                            src={image}
                            alt={title}
                            className="relative z-10 w-full h-full object-contain drop-shadow-2xl transform hover:scale-110 transition-transform duration-500"
                        />

                        {/* Floating Badge */}
                        <div className="absolute -top-4 -right-4 bg-white px-4 py-2 rounded-2xl shadow-xl z-20">
                            <div className="text-[var(--t2-orange-primary)] font-bold text-lg">
                                🔥 Hot Deal
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Decorative Elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -z-0"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-3xl -z-0"></div>
        </div>
    );
};
