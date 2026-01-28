'use client';

import { SessionUserInResponse, UserInResponse } from '@/types/UserInResponse';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface UserContextType {
    user: SessionUserInResponse | null;
    setUser: (user: SessionUserInResponse | null) => void;
    loading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<SessionUserInResponse | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await fetch('/api/auth/me', { credentials: 'include' });
                if (!res.ok) {
                    setUser(null);
                } else {
                    const data = await res.json();
                    setUser(data.user);
                }
            } catch {
                setUser(null);
            } finally {
                setLoading(false);
            }
        };
        fetchUser();
    }, []);

    return (
        <UserContext.Provider value={{ user, setUser, loading }}>{children}</UserContext.Provider>
    );
};

export const useUser = () => {
    const context = useContext(UserContext);
    if (!context) throw new Error('useUser must be used within UserProvider');
    return context;
};
