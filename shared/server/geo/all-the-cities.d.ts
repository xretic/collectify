declare module 'all-the-cities' {
    type City = {
        cityId: number;
        name: string;
        altName: string;
        country: string;
        featureCode: string;
        adminCode: string;
        population: number;
        loc: { type: 'Point'; coordinates: [number, number] };
    };

    const cities: City[];
    export default cities;
}
