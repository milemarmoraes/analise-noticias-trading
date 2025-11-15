'use client';

import { useRouter } from 'next/navigation';

export default function IndicatorSelect({ currentIndicator }: { currentIndicator: string }) {
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    router.push(`?indicator=${e.target.value}`);
  };

  return (
    <div className="mb-6">
      <label className="block text-sm font-medium mb-2">Selecione o Indicador:</label>
      <select
        className="w-full p-2 border rounded"
        value={currentIndicator}
        onChange={handleChange}
      >
        <option value="NFP">NFP</option>
        <option value="UNEMPLOYMENT">UNEMPLOYMENT</option>
        <option value="PMI_MANUFACTURING">PMI_MANUFACTURING</option>
        <option value="PMI_SERVICES">PMI_SERVICES</option>
        <option value="HOUSING_STARTS">HOUSING_STARTS</option>
        <option value="BUILDING_PERMITS">BUILDING_PERMITS</option>
        <option value="HOUSING_SALES">HOUSING_SALES</option>
        <option value="GDP">GDP</option>
        <option value="FOMC">FOMC</option>
      </select>
    </div>
  );
}