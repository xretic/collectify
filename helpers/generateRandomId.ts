import { prisma } from '@/lib/prisma';

export function generateRandomId(): Promise<number> {
    const generateId = (): number => {
        return Math.floor(100000000 + Math.random() * 900000000);
    };

    const checkUnique = async (id: number): Promise<number> => {
        return await prisma.user.findUnique({ where: { id } }).then((user) => {
            if (user) {
                return checkUnique(generateId());
            } else {
                return id;
            }
        });
    };

    return checkUnique(generateId());
}
