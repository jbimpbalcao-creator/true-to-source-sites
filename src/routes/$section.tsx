import { createFileRoute, notFound, useRouter, type ErrorComponentProps } from '@tanstack/react-router';
import { sections } from '@/lib/restaurant';
import { listRecords } from '@/lib/restaurant.functions';
import { RestaurantPanel } from '@/components/restaurant-panel';
import { Button } from '@/components/ui/button';
export const Route = createFileRoute('/$section')({
 loader: async({params})=>{if(!sections.some(s=>s.slug===params.section))throw notFound();return listRecords();},
 head:({params})=>{const title=(sections.find(s=>s.slug===params.section)?.title??'Página')+' — Espeto Prime';const description='Gestão do restaurante Espeto Prime: '+(sections.find(s=>s.slug===params.section)?.title??'painel')+'.';return {meta:[{title},{name:'description',content:description},{property:'og:title',content:title},{property:'og:description',content:description},{property:'og:type',content:'website'},{name:'twitter:card',content:'summary'}]};},
 component:()=> <RestaurantPanel slug={Route.useParams().section} initialRows={Route.useLoaderData()}/>,
 errorComponent:ErrorPage,
 notFoundComponent:()=> <p>Página não encontrada.</p>,
});
function ErrorPage({reset}:ErrorComponentProps){const router=useRouter();return <main className="brasa-login"><div className="brasa-entry"><h1>Não foi possível carregar</h1><Button onClick={()=>{router.invalidate();reset();}}>Tentar novamente</Button></div></main>;}
