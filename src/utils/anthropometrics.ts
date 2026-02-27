export function calculateAge(birthDateString: string): number | null {
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
