'use client';

import { api } from '@/lib/api';
import { SessionUserInResponse } from '@/types/UserInResponse';
import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

interface UserContextType {
    user: SessionUserInResponse | null;
    setUser: (user: SessionUserInResponse | null) => void;
    loading: boolean;
    refreshUser: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<SessionUserInResponse | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchUser = useCallback(async () => {
        setLoading(true);

        try {
            const data = await api.get('api/auth/me').json<{ user: SessionUserInResponse }>();

            setUser(data.user ?? null);
        } catch {
            setUser(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUser();
    }, [fetchUser]);

    return (
        <UserContext.Provider
            value={{
                user,
                setUser,
                loading,
                refreshUser: fetchUser,
            }}
        >
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => {
    const context = useContext(UserContext);
    if (!context) throw new Error('useUser must be used within UserProvider');
    return context;
};
