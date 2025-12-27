import React from 'react';
import '../styles/theme.css';

interface HeroCardProps {
    title: string;
    subtitle: string;
    description: string;
    buttonText: string;
    image: string;
    backgroundColor?: string;
    onButtonClick?: () => void;
}

export const HeroCard: React.FC<HeroCardProps> = ({
    title,
    subtitle,
    description,
    buttonText,
    image,
    backgroundColor = 'var(--t2-mint-bg)',
    onButtonClick
}) => {
    return (
        <div
            className="rounded-2xl p-8 md:p-12 overflow-hidden"
            style={{ background: backgroundColor }}
        >
            <div className="flex items-center justify-between gap-8">
                {/* Left Content */}
                <div className="flex-1 space-y-4">
                    {/* Subtitle */}
                    <div className="inline-block bg-white px-4 py-1.5 rounded-full">
                        <span className="text-[var(--t2-text-dark)] text-sm font-semibold">
                            {subtitle}
                        </span>
                    </div>

                    {/* Title */}
                    <h2 className="text-3xl md:text-5xl font-bold text-[var(--t2-text-dark)] leading-tight max-w-md">
                        {title}
                    </h2>

                    {/* Description */}
                    <p className="text-[var(--t2-text-gray)] text-base md:text-lg max-w-md">
                        {description}
                    </p>

                    {/* CTA Button */}
                    <button
                        onClick={onButtonClick}
                        className="btn-primary inline-flex items-center gap-2 mt-4"
                    >
                        {buttonText}
                        <i className="fas fa-arrow-right"></i>
                    </button>
                </div>

                {/* Right Image */}
                <div className="hidden md:block flex-shrink-0">
                    <img
                        src={image}
                        alt={title}
                        className="w-80 h-80 object-contain"
                    />
                </div>
            </div>
        </div>
    );
};
