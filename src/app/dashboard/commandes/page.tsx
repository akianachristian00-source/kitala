import { OrdersList } from '@/components/dashboard/orders-list';

export default function OrdersPage() {
  return (
    <section className="grid gap-4">
      <h1 className="font-display text-3xl font-extrabold">Commandes</h1>
      <OrdersList limit={100} />
    </section>
  );
}
