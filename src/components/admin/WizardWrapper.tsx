'use client';

import dynamic from 'next/dynamic';

const OnboardingWizard = dynamic(() => import('./OnboardingWizard'), { ssr: false });

export default function WizardWrapper({ isCompleted }: { isCompleted?: boolean }) {
    if (isCompleted) return null;
    return <OnboardingWizard />;
}
