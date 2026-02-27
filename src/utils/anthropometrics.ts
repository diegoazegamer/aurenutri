export function calculateAge(birthDateString: string | undefined): number | null {
    if (!birthDateString) return null;
    const today = new Date();
    const birthDate = new Date(birthDateString);
    if (isNaN(birthDate.getTime())) return null;

    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
}

export function calculateIMC(weight: string | number, heightCm: string | number): number | null {
    const w = parseFloat(String(weight));
    const h = parseFloat(String(heightCm)) / 100;
    if (!w || !h || h <= 0) return null;

    return Number((w / (h * h)).toFixed(2));
}

export function getIMCClassification(imc: number | null): string {
    if (!imc) return '-';
    if (imc < 18.5) return 'Magreza';
    if (imc >= 18.5 && imc < 24.9) return 'Normal';
    if (imc >= 25 && imc < 29.9) return 'Sobrepeso';
    if (imc >= 30 && imc < 34.9) return 'Obesidade grau I';
    if (imc >= 35 && imc < 39.9) return 'Obesidade grau II';
    return 'Obesidade grau III';
}

export function calculateIdealWeightRange(heightCm: string | number): string {
    const h = parseFloat(String(heightCm)) / 100;
    if (!h || h <= 0) return '-';
    const min = (18.5 * (h * h)).toFixed(1);
    const max = (24.9 * (h * h)).toFixed(1);
    return `${min}kg - ${max}kg`;
}

// Age and gender based body fat classification (Jackson & Pollock simplified)
export function getIdealBodyFatRange(age: number | null, gender: string | undefined): string {
    if (!age || !gender) return '-';
    const isMale = gender.toLowerCase() === 'masculino' || gender.toLowerCase() === 'homem';

    if (isMale) {
        if (age <= 29) return '8% - 14%';
        if (age <= 39) return '9% - 15%';
        if (age <= 49) return '11% - 17%';
        if (age <= 59) return '12% - 18%';
        return '13% - 19%';
    } else {
        // Female
        if (age <= 29) return '15% - 21%';
        if (age <= 39) return '16% - 22%';
        if (age <= 49) return '18% - 24%';
        if (age <= 59) return '19% - 25%';
        return '20% - 26%';
    }
}

export function classifyBodyFat(bf: string | number | null, age: number | null, gender: string | undefined): string {
    if (!bf || !age || !gender) return '-';
    const fat = parseFloat(String(bf));
    if (isNaN(fat)) return '-';

    const idealRange = getIdealBodyFatRange(age, gender).replace(/%/g, '').split(' - ');
    if (idealRange.length !== 2) return '-';

    const min = parseFloat(idealRange[0]);
    const max = parseFloat(idealRange[1]);

    if (fat < min) return 'Abaixo do normal';
    if (fat > max) return 'Acima do normal';
    return 'Normal';
}

export function calculateFatMass(weight: string | number, bodyFatPercentage: string | number): string {
    const w = parseFloat(String(weight));
    const bf = parseFloat(String(bodyFatPercentage));
    if (!w || !bf) return '-';
    return ((w * bf) / 100).toFixed(2) + ' Kg';
}

export function calculateFatFreeMass(weight: string | number, fatMass: string): string {
    const w = parseFloat(String(weight));
    const fm = parseFloat(fatMass.replace(' Kg', ''));
    if (!w || isNaN(fm)) return '-';
    return (w - fm).toFixed(2) + ' Kg';
}
