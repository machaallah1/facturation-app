'use client';

import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const [mounted, setMounted] = useState(false);
    const [user, loading] = useAuthState(auth);
    const router = useRouter();

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (mounted && !loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router, mounted]);

    if (!mounted) {
        // Retourne un élément vide pendant le SSR et le premier rendu client
        return null;
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (!user) {
        // Retourne null si pas d'utilisateur (la redirection est gérée par useEffect)
        return null;
    }

    return <>{children}</>;
}