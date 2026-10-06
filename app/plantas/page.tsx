import { getPlantas } from '@/actions/plantas';
import PlantasView from '@/components/plantas/PlantasView';

export default async function PlantasPage() {
  const res = await getPlantas();
  const initialPlantas = res.success && res.data ? res.data : [];

  return <PlantasView initialPlantas={initialPlantas} />;
}